import type { ArticleNode } from './articles'

/** A photo block inside an article body. Only free-licence Wikimedia Commons files and owner uploads are allowed. */
export interface ArticleImage {
  src: string
  alt: string
  caption: string
  credit: string
  creditUrl: string
  license: string
  licenseUrl: string
  width: number | null
  height: number | null
  source: 'commons' | 'upload'
}

export interface ArticleImagePlan {
  sectionIndex: number
  searchQuery: string
  alt: string
  caption: string
}

export const MIN_GENERATED_IMAGES = 2
const COMMONS_HOSTS = new Set(['upload.wikimedia.org', 'thumb.wikimedia.org'])
const FREE_LICENSE = /^(cc0|cc by(-sa)?( \d\.\d)?|public domain|pd\b)/i
const FALLBACK_QUERIES = ['Premier League football match', 'football stadium crowd', 'football pitch', 'football fans stadium']
const USER_AGENT = 'FPLInsights/1.0 (https://www.sportsync.in; article image search)'

function cleanText(value: unknown, limit: number) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim().slice(0, limit) : ''
}

function httpsUrl(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return ''
  const raw = value.trim().startsWith('//') ? `https:${value.trim()}` : value.trim()
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' && !url.username && !url.password && raw.length <= 2000 ? url.toString() : ''
  } catch { return '' }
}

export function isAllowedArticleImageSrc(src: string) {
  try {
    const url = new URL(src)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return false
    if (COMMONS_HOSTS.has(url.hostname)) return url.pathname.startsWith('/wikipedia/commons/')
    return /^[a-z0-9-]+(?:\.[a-z0-9-]+)?\.convex\.cloud$/.test(url.hostname) && /^\/api\/storage\/[\w-]+$/.test(url.pathname)
  } catch { return false }
}

export function validateArticleImage(value: unknown): ArticleImage {
  if (!value || typeof value !== 'object') throw new Error('The article image is invalid.')
  const input = value as Record<string, unknown>
  const src = typeof input.src === 'string' ? input.src.trim() : ''
  if (src.length > 2000 || !isAllowedArticleImageSrc(src)) throw new Error('Article images must be uploaded here or come from Wikimedia Commons.')
  const source = input.source === 'upload' ? 'upload' : 'commons'
  if ((source === 'upload') !== src.includes('.convex.cloud/')) throw new Error('The article image source is invalid.')
  const dimension = (n: unknown) => n === null || n === undefined ? null : Number.isSafeInteger(n) && Number(n) > 0 && Number(n) <= 20000 ? Number(n) : (() => { throw new Error('The article image size is invalid.') })()
  for (const [field, limit] of [['alt', 300], ['caption', 300], ['credit', 200], ['license', 80]] as const) {
    if (input[field] !== undefined && (typeof input[field] !== 'string' || (input[field] as string).length > limit)) throw new Error('Check the image description, caption and credit.')
  }
  const image: ArticleImage = {
    src, source,
    alt: String(input.alt ?? '').trim(),
    caption: String(input.caption ?? '').trim(),
    credit: String(input.credit ?? '').trim(),
    creditUrl: httpsUrl(input.creditUrl),
    license: String(input.license ?? '').trim(),
    licenseUrl: httpsUrl(input.licenseUrl),
    width: dimension(input.width),
    height: dimension(input.height),
  }
  if (source === 'commons' && (!image.credit || !image.license)) throw new Error('Wikimedia Commons images need their author and licence credit.')
  return image
}

/** Search Wikimedia Commons for landscape, free-licence photos. Keyless; returns credit and licence details. */
export async function searchCommonsImages(query: string, limit = 8, fetcher: typeof fetch = fetch): Promise<ArticleImage[]> {
  const term = query.replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)
  if (!term) return []
  const params = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', origin: '*',
    generator: 'search', gsrsearch: `${term} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '20',
    prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600',
    iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist|ObjectName',
  })
  const response = await fetcher(`https://commons.wikimedia.org/w/api.php?${params}`, { headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new Error('Wikimedia Commons is unavailable right now.')
  const payload = await response.json() as { query?: { pages?: { title?: string; index?: number; imageinfo?: Record<string, any>[] }[] } }
  const pages = [...(payload.query?.pages || [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  const images: ArticleImage[] = []
  for (const page of pages) {
    const info = page.imageinfo?.[0]
    if (!info || !['image/jpeg', 'image/png', 'image/webp'].includes(info.mime)) continue
    const width = Number(info.thumbwidth || info.width)
    const height = Number(info.thumbheight || info.height)
    // Landscape, reasonably sharp photos only, so the article column stays calm.
    if (!(Number(info.width) >= 1000 && width >= 800 && width >= height * 1.2 && width <= height * 2.6)) continue
    const meta = info.extmetadata || {}
    const license = cleanText(meta.LicenseShortName?.value, 80)
    if (!FREE_LICENSE.test(license)) continue
    const rawSrc = httpsUrl(info.thumburl || info.url)
    const src = rawSrc ? rawSrc.split('?')[0]! : ''
    if (!isAllowedArticleImageSrc(src)) continue
    const credit = cleanText(meta.Artist?.value, 200) || 'Wikimedia Commons contributor'
    const name = cleanText(meta.ObjectName?.value, 200) || cleanText(page.title?.replace(/^File:/, '').replace(/\.[a-z]+$/i, ''), 200)
    try {
      images.push(validateArticleImage({ src, alt: name, caption: '', credit, creditUrl: httpsUrl(info.descriptionurl), license, licenseUrl: httpsUrl(meta.LicenseUrl?.value), width: Math.round(width), height: Math.round(height), source: 'commons' }))
    } catch { /* Skip files with incomplete credit details. */ }
    if (images.length >= limit) break
  }
  return images
}

export function validateImagePlans(value: unknown, sectionCount: number): ArticleImagePlan[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 3).flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const plan = item as Record<string, unknown>
    const sectionIndex = Number(plan.sectionIndex)
    const searchQuery = cleanText(plan.searchQuery, 120)
    if (!Number.isSafeInteger(sectionIndex) || !searchQuery) return []
    return [{ sectionIndex: Math.min(Math.max(sectionIndex, 0), Math.max(sectionCount - 1, 0)), searchQuery, alt: cleanText(plan.alt, 300), caption: cleanText(plan.caption, 300) }]
  })
}

/** Find one distinct photo per plan, falling back to broader football queries, until at least `minimum` are found. */
export async function findPlannedImages(plans: ArticleImagePlan[], sectionCount: number, minimum = MIN_GENERATED_IMAGES, fetcher: typeof fetch = fetch) {
  const used = new Set<string>()
  const placed: { sectionIndex: number; image: ArticleImage }[] = []
  const pick = async (query: string) => {
    try { return (await searchCommonsImages(query, 8, fetcher)).find(image => !used.has(image.src)) || null } catch { return null }
  }
  for (const plan of plans) {
    const shorter = plan.searchQuery.split(' ').slice(0, 3).join(' ')
    const image = await pick(plan.searchQuery) || (shorter !== plan.searchQuery ? await pick(shorter) : null)
    if (!image) continue
    used.add(image.src)
    // Alt text describes the photo actually found (its Commons title), not the photo the model hoped for.
    placed.push({ sectionIndex: plan.sectionIndex, image: { ...image, alt: image.alt || plan.alt, caption: plan.caption } })
  }
  for (const query of FALLBACK_QUERIES) {
    if (placed.length >= minimum) break
    const image = await pick(query)
    if (!image) continue
    used.add(image.src)
    // Spread fallback photos across sections that do not have one yet.
    const taken = new Set(placed.map(item => item.sectionIndex))
    const sectionIndex = [...Array(Math.max(sectionCount, 1)).keys()].find(index => !taken.has(index)) ?? placed.length
    placed.push({ sectionIndex, image })
  }
  return placed
}

/** Insert image blocks at the end of the given H2 sections (0-based). */
export function insertSectionImages(body: ArticleNode, placed: { sectionIndex: number; image: ArticleImage }[]): ArticleNode {
  const content = [...(body.content || [])]
  const headings = content.flatMap((node, index) => node.type === 'heading' && node.attrs?.level === 2 ? [index] : [])
  const inserts = placed.map(({ sectionIndex, image }) => {
    const nextHeading = headings[sectionIndex + 1]
    return { at: headings.length ? (nextHeading ?? content.length) : Math.min(content.length, (sectionIndex + 1) * 2), node: { type: 'image', attrs: { ...image } } as ArticleNode }
  }).sort((a, b) => b.at - a.at)
  for (const insert of inserts) content.splice(insert.at, 0, insert.node)
  return { ...body, content }
}

export const imagePlanSchema = {
  type: 'array', minItems: 2, maxItems: 3,
  description: 'Two or three photos that make the guide easier to scan. Each is a Wikimedia Commons search for a real, photographable football scene (stadium, pitch, fans, bench, tactics board, laptop or phone with a team sheet). Never search for a named player, logo, chip name or abstract idea.',
  items: {
    type: 'object', additionalProperties: false, required: ['sectionIndex', 'searchQuery', 'alt', 'caption'],
    properties: {
      sectionIndex: { type: 'integer', description: '0-based index of the section the photo follows. Use different sections.' },
      searchQuery: { type: 'string', description: '2 to 5 plain words, for example "football substitutes bench".' },
      alt: { type: 'string', description: 'Short description of what the photo should show, for screen readers.' },
      caption: { type: 'string', description: 'One short sentence linking the photo to the section. No statistics or claims about the people pictured.' },
    },
  },
}

export const imagePlanGuidance = 'Images: return 2 or 3 entries in images. Each searches Wikimedia Commons for a real football photo that suits a different section. Use plain, photographable scenes, never named players, crests, chip names or abstract ideas. Captions must not make claims about the people or match pictured.'
