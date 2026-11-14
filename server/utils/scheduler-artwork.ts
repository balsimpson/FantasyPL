import satori from 'satori'
import { Resvg, initWasm } from '@resvg/resvg-wasm'
import { formatInstagramStat, instagramStatLabel, type InstagramDraft } from '../../utils/instagram-templates'
import { getInstagramClubTheme } from '../../utils/instagram-designs'

const BG = '#070B09'
const INK = '#F4F7F4'
const MUTED = 'rgba(244, 247, 244, 0.6)'
const FAINT = 'rgba(244, 247, 244, 0.38)'
const ACCENT = '#00DC82'

type Style = Record<string, string | number>
type VNode = { type: string; props: Record<string, unknown> }
type Fonts = { anton: ArrayBuffer; oswaldMedium: ArrayBuffer; oswaldBold: ArrayBuffer }

let fontPromise: Promise<Fonts> | null = null
let resvgPromise: Promise<void> | null = null
const imageCache = new Map<string, string | null>()

function box(style: Style, children?: unknown): VNode {
  return { type: 'div', props: { style: { display: 'flex', ...style }, ...(children === undefined ? {} : { children }) } }
}

function line(style: Style, value: string): VNode {
  return { type: 'div', props: { style: { display: 'flex', ...style }, children: value } }
}

function withAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map(part => part + part).join('') : value
  const red = Number.parseInt(full.slice(0, 2), 16)
  const green = Number.parseInt(full.slice(2, 4), 16)
  const blue = Number.parseInt(full.slice(4, 6), 16)
  if (![red, green, blue].every(Number.isFinite)) return `rgba(0, 220, 130, ${alpha})`
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

async function loadFonts(): Promise<Fonts> {
  if (!fontPromise) {
    fontPromise = (async () => {
      const storage = useStorage('assets:server')
      const [anton, oswaldMedium, oswaldBold] = await Promise.all([
        storage.getItemRaw('fonts/Anton-Regular.ttf'),
        storage.getItemRaw('fonts/Oswald-Medium.ttf'),
        storage.getItemRaw('fonts/Oswald-Bold.ttf'),
      ])
      if (!anton || !oswaldMedium || !oswaldBold) throw createError({ statusCode: 500, statusMessage: 'Daily artwork fonts are missing.' })
      return { anton, oswaldMedium, oswaldBold }
    })()
  }
  return fontPromise
}

async function ensureResvg() {
  if (!resvgPromise) {
    resvgPromise = (async () => {
      const wasm = await useStorage('assets:server').getItemRaw('resvg.wasm')
      if (!wasm) throw createError({ statusCode: 500, statusMessage: 'Daily artwork renderer is missing.' })
      await initWasm(new Uint8Array(wasm))
    })()
  }
  return resvgPromise
}

function sourceUrl(value: string) {
  try {
    const url = new URL(value, 'https://www.sportsync.in')
    return url.searchParams.get('url') || value
  } catch { return value }
}

async function imageData(value: string): Promise<string | null> {
  if (imageCache.has(value)) return imageCache.get(value) ?? null
  const source = sourceUrl(value)
  const headers = {
    Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.premierleague.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  }
  try {
    let response = await fetch(source, { headers, redirect: 'follow', signal: AbortSignal.timeout(8_000) })
    if (!response.ok) {
      const code = source.match(/\/photos\/players\/250x250\/p(\d+)\.png$/)?.[1]
      if (!code) throw new Error('Image request failed')
      response = await fetch(`https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`, { headers, signal: AbortSignal.timeout(8_000) })
    }
    if (!response.ok) throw new Error('Image request failed')
    const type = (response.headers.get('content-type') || 'image/png').split(';')[0]
    if (!type.startsWith('image/')) throw new Error('Image request returned no image')
    const buffer = Buffer.from(await response.arrayBuffer())
    if (!buffer.length || buffer.length > 4_000_000) throw new Error('Image is unusable')
    const data = `data:${type};base64,${buffer.toString('base64')}`
    imageCache.set(value, data)
    return data
  } catch {
    imageCache.set(value, null)
    return null
  }
}

async function fadedPhoto(value: string, size: number): Promise<string | null> {
  const photo = await imageData(value)
  if (!photo) return null
  const key = `${value}|${size}`
  const cached = imageCache.get(key)
  if (cached !== undefined) return cached
  try {
    await ensureResvg()
    const fade = Math.round(size * 0.45)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="${(1 - fade / size).toFixed(3)}" stop-color="#ffffff" stop-opacity="1"/>
          <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
        <mask id="cut"><rect width="${size}" height="${size}" fill="url(#fade)"/></mask>
      </defs>
      <image href="${photo}" width="${size}" height="${size}" preserveAspectRatio="xMidYMax meet" mask="url(#cut)"/>
    </svg>`
    const png = new Resvg(svg, { fitTo: { mode: 'original' }, font: { loadSystemFonts: false } }).render().asPng()
    const data = `data:image/png;base64,${Buffer.from(png).toString('base64')}`
    imageCache.set(key, data)
    return data
  } catch {
    imageCache.set(key, photo)
    return photo
  }
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map(part => part[0] || '').join('').toUpperCase() || 'FPL'
}

function nameSize(name: string, max: number, min: number) {
  if (name.length <= 11) return max
  if (name.length <= 15) return Math.round(max * 0.88)
  if (name.length <= 20) return Math.round(max * 0.74)
  return min
}

function header(gameweek: number | null) {
  return box({ position: 'absolute', top: 46, left: 56, right: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
    line({ fontFamily: 'Oswald', fontSize: 25, letterSpacing: 5, color: MUTED }, 'FPL INSIGHTS'),
    box({ flexDirection: 'row', alignItems: 'center', borderRadius: 999, border: `1px solid ${withAlpha(ACCENT, 0.35)}`, backgroundColor: withAlpha(ACCENT, 0.1), padding: '8px 20px' }, [
      line({ fontSize: 21, letterSpacing: 2, color: ACCENT }, gameweek ? `GW ${gameweek}` : 'FPL'),
    ]),
  ])
}

function storyChip(label: string, style: Style = {}) {
  return box({ flexDirection: 'row', alignItems: 'center', ...style }, [
    box({ width: 30, height: 4, borderRadius: 2, backgroundColor: ACCENT, marginRight: 12 }),
    line({ fontSize: 23, letterSpacing: 3.5, color: ACCENT }, label.toUpperCase()),
  ])
}

function footer() {
  return box({ position: 'absolute', left: 56, right: 56, bottom: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, [
    line({ fontSize: 19, letterSpacing: 2, color: FAINT }, 'SPORTSYNC.IN'),
    line({ fontSize: 19, letterSpacing: 2, color: FAINT }, 'PREMIER LEAGUE DATA'),
  ])
}

function background(primary: string) {
  return [
    box({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(circle at 80% 32%, ${withAlpha(primary, 0.28)} 0%, rgba(7, 11, 9, 0) 58%)` }),
    box({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `radial-gradient(circle at 18% 92%, ${withAlpha(ACCENT, 0.1)} 0%, rgba(7, 11, 9, 0) 46%)` }),
    box({ position: 'absolute', left: 56, right: 56, top: 108, height: 1, backgroundColor: 'rgba(244, 247, 244, 0.12)' }),
  ]
}

function portrait(player: InstagramDraft['players'][number], photo: string | null, size: number, themePrimary: string): VNode {
  if (photo) {
    return {
      type: 'img',
      props: {
        src: photo,
        width: size,
        height: size,
        style: { width: size, height: size },
      },
    }
  }
  const circle = size * 0.6
  return box({ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 24 }, [
    box({ width: circle, height: circle, borderRadius: circle, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(themePrimary, 0.28), border: `2px solid ${withAlpha(themePrimary, 0.5)}` }, [
      line({ fontFamily: 'Anton', fontSize: Math.round(circle * 0.34), color: INK }, initials(player.fullName)),
    ]),
  ])
}

function spotlight(draft: InstagramDraft, photo: string | null) {
  const player = draft.players[0]!
  const theme = getInstagramClubTheme(player.clubCode, draft.palette)
  const stats = draft.stats.slice(0, 4)
  const size = nameSize(player.fullName, 118, 82)

  return box({ width: 1080, height: 1080, position: 'relative', flexDirection: 'column', backgroundColor: BG, color: INK, fontFamily: 'Oswald', overflow: 'hidden' }, [
    ...background(theme.primary),
    header(draft.gameweek),
    box({ position: 'absolute', left: 56, top: 150, width: 620, flexDirection: 'column' }, [
      storyChip(draft.story?.label || 'Player spotlight', { marginBottom: 22 }),
      line({ fontFamily: 'Anton', fontSize: size, lineHeight: 0.97, letterSpacing: -1, color: INK }, player.fullName.toUpperCase()),
      line({ fontSize: 26, color: MUTED, marginTop: 16 }, `${player.club} · ${player.position}`),
    ]),
    box({ position: 'absolute', left: 56, bottom: 108, width: 640, flexDirection: 'column' }, [
      box({ width: 640, height: 1, backgroundColor: 'rgba(244, 247, 244, 0.14)', marginBottom: 26 }),
      box({ flexDirection: 'row', flexWrap: 'wrap', width: 640 }, stats.map(key => box({ width: 300, flexDirection: 'column', marginBottom: 22, marginRight: 20 }, [
        line({ fontSize: 18, letterSpacing: 2, color: FAINT }, instagramStatLabel(key).toUpperCase()),
        line({ fontFamily: 'Anton', fontSize: 54, lineHeight: 1.05, color: INK, marginTop: 4 }, formatInstagramStat(player, key)),
      ]))),
    ]),
    box({ position: 'absolute', top: 350, right: 8, width: 540, height: 540 }, [
      portrait(player, photo, 540, theme.primary),
    ]),
    footer(),
  ])
}

function comparison(draft: InstagramDraft, photos: (string | null)[]) {
  const theme = getInstagramClubTheme(draft.players[0]!.clubCode, draft.palette)
  const stats = draft.stats.slice(0, 3)

  const column = (player: InstagramDraft['players'][number], photo: string | null, side: 'left' | 'right') => box({
    position: 'absolute', top: 196, [side]: 56, width: 452, height: 730, flexDirection: 'column', justifyContent: 'space-between',
  }, [
    box({ flexDirection: 'column' }, [
      line({ fontFamily: 'Anton', fontSize: nameSize(player.fullName, 64, 46), lineHeight: 0.98, letterSpacing: -0.5, color: INK }, player.fullName.toUpperCase()),
      line({ fontSize: 21, color: MUTED, marginTop: 10 }, `${player.club} · ${player.position}`),
      box({ flexDirection: 'row', marginTop: 22 }, stats.map(key => box({ width: 150, flexDirection: 'column' }, [
        line({ fontSize: 14, letterSpacing: 1, color: FAINT }, instagramStatLabel(key).toUpperCase()),
        line({ fontFamily: 'Anton', fontSize: 32, color: INK, marginTop: 4 }, formatInstagramStat(player, key)),
      ]))),
    ]),
    box({ width: 452, height: 452, alignItems: side === 'left' ? 'flex-start' : 'flex-end', justifyContent: 'flex-end' }, [
      portrait(player, photo, 452, theme.primary),
    ]),
  ])

  return box({ width: 1080, height: 1080, position: 'relative', flexDirection: 'column', backgroundColor: BG, color: INK, fontFamily: 'Oswald', overflow: 'hidden' }, [
    ...background(theme.primary),
    header(draft.gameweek),
    storyChip(draft.story?.label || 'Player comparison', { position: 'absolute', left: 56, top: 148 }),
    column(draft.players[0]!, photos[0] ?? null, 'left'),
    column(draft.players[1]!, photos[1] ?? null, 'right'),
    box({ position: 'absolute', left: 498, top: 640, width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: BG, border: `2px solid ${withAlpha(ACCENT, 0.6)}` }, [
      line({ fontFamily: 'Anton', fontSize: 30, color: ACCENT }, 'VS'),
    ]),
    footer(),
  ])
}

/**
 * Renders the daily scheduler artwork to a 1080 x 1080 PNG on the server.
 * Uses the same satori + resvg pipeline as the existing share images, so the
 * cron never needs a browser.
 */
export async function renderDailyArtwork(draft: InstagramDraft): Promise<Uint8Array> {
  const [{ anton, oswaldMedium, oswaldBold }, photos] = await Promise.all([
    loadFonts(),
    Promise.all(draft.players.map(player => fadedPhoto(player.photoUrl, draft.players.length > 1 ? 452 : 540))),
  ])
  const tree = draft.players.length > 1 ? comparison(draft, photos) : spotlight(draft, photos[0] ?? null)
  const svg = await satori(tree as never, {
    width: 1080,
    height: 1080,
    embedFont: true,
    fonts: [
      { name: 'Anton', data: anton, weight: 400, style: 'normal' },
      { name: 'Oswald', data: oswaldMedium, weight: 400, style: 'normal' },
      { name: 'Oswald', data: oswaldMedium, weight: 500, style: 'normal' },
      { name: 'Oswald', data: oswaldBold, weight: 700, style: 'normal' },
    ],
  })
  await ensureResvg()
  const resvg = new Resvg(svg, { fitTo: { mode: 'original' }, background: BG, font: { loadSystemFonts: false, defaultFontFamily: 'Oswald' } })
  return resvg.render().asPng()
}
