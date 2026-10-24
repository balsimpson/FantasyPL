import { validatePlayerSnapshot } from './article-visuals'

export const articleTemplates = [
  { value: 'transfers', label: 'Transfer trends', sections: ['The transfer picture', 'Form, minutes and fixtures', 'What to consider'] },
  { value: 'fixtures', label: 'Fixture analysis', sections: ['The fixture run', 'Teams to consider', 'Blanks, doubles and risks'] },
  { value: 'budget', label: 'Budget shortlist', sections: ['The shortlist', 'How the players compare', 'Who fits your team?'] },
  { value: 'comparison', label: 'Player comparison', sections: ['The decision', 'Stats and upcoming fixtures', 'The verdict'] },
  { value: 'guide', label: 'Explainer', sections: ['The answer', 'How it works', 'What to do next'] },
] as const

export type ArticleTemplate = typeof articleTemplates[number]['value']
export interface ArticleNode {
  type: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  content?: ArticleNode[]
}
export interface ArticleDraft {
  title: string
  slug: string
  excerpt: string
  template: ArticleTemplate
  season: string
  gameweek: number | null
  body: ArticleNode
}
export interface SavedArticle extends ArticleDraft {
  articleId: string
  version: number
  updatedAt: number
  createdAt: number
  status: 'draft'
}
export type ArticleSummary = Omit<SavedArticle, 'body'> & { generation?: { jobId: string; status: 'queued' | 'writing' | 'ready' | 'failed'; error: string | null; updatedAt: number } | null }

export function emptyArticle(): ArticleDraft {
  return { title: '', slug: '', excerpt: '', template: 'guide', season: '', gameweek: null, body: { type: 'doc', content: [{ type: 'paragraph' }] } }
}

export function articleSlug(title: string) {
  return title.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 160).replace(/-$/, '')
}

export function articleText(node: ArticleNode): string {
  return node.text ?? (node.content || []).map(articleText).join(' ')
}

export function templateBody(template: ArticleTemplate): ArticleNode {
  const selected = articleTemplates.find(item => item.value === template)!
  return { type: 'doc', content: selected.sections.flatMap(text => [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] },
    { type: 'paragraph' },
  ]) }
}

// Only this editor's supported nodes and attributes enter storage or preview.
export function validateArticleDraft(value: unknown): ArticleDraft {
  if (!value || typeof value !== 'object') throw new Error('The article is invalid.')
  const input = value as Record<string, unknown>
  for (const [field, limit] of [['title', 200], ['slug', 160], ['excerpt', 600], ['season', 7]] as const) {
    if (typeof input[field] !== 'string' || input[field].length > limit) throw new Error(`Check the article ${field}.`)
  }
  if (input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug as string)) throw new Error('Use lowercase letters, numbers and hyphens in the URL slug.')
  if (input.season && !/^\d{4}\/\d{2}$/.test(input.season as string)) throw new Error('Use a season such as 2026/27.')
  if (input.gameweek !== null && (!Number.isSafeInteger(input.gameweek) || Number(input.gameweek) < 1 || Number(input.gameweek) > 38)) throw new Error('Gameweek must be between 1 and 38, or empty.')
  if (!articleTemplates.some(item => item.value === input.template)) throw new Error('Choose an article template.')
  if (JSON.stringify(input.body ?? null).length > 200_000) throw new Error('This article is too long to save. Shorten it and try again.')
  let count = 0
  const blockTypes = new Set(['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem', 'horizontalRule', 'hardBreak', 'text', 'playerCard', 'fixtureRun'])
  function node(value: unknown, depth: number): ArticleNode {
    if (++count > 8000 || depth > 20 || !value || typeof value !== 'object') throw new Error('The article structure is invalid.')
    const item = value as ArticleNode
    if (typeof item.type !== 'string' || (depth === 0 ? item.type !== 'doc' : !blockTypes.has(item.type))) throw new Error('The article contains unsupported content.')
    const clean: ArticleNode = { type: item.type }
    if (['playerCard', 'fixtureRun'].includes(item.type)) {
      if (item.content !== undefined || item.marks !== undefined) throw new Error('Visual blocks cannot contain text or formatting.')
      clean.attrs = { player: validatePlayerSnapshot(item.attrs?.player) }
      return clean
    }
    if (item.type === 'text') {
      if (typeof item.text !== 'string' || !item.text.length) throw new Error('The article contains invalid text.')
      clean.text = item.text
    }
    if (item.type === 'heading') {
      if (![2, 3].includes(Number(item.attrs?.level))) throw new Error('Use heading levels 2 or 3 in the article body.')
      clean.attrs = { level: Number(item.attrs?.level) }
    }
    if (item.type === 'orderedList') clean.attrs = { start: Number.isSafeInteger(item.attrs?.start) && Number(item.attrs?.start) > 0 ? item.attrs!.start : 1 }
    if (item.marks !== undefined) {
      if (!Array.isArray(item.marks) || item.marks.length > 8 || item.type !== 'text') throw new Error('The article formatting is invalid.')
      clean.marks = item.marks.map(mark => {
        if (!['bold', 'italic', 'strike', 'underline', 'link'].includes(mark.type)) throw new Error('The article contains unsupported formatting.')
        if (mark.type !== 'link') return { type: mark.type }
        const href = mark.attrs?.href
        if (typeof href !== 'string' || href.length > 2000 || !/^https?:\/\//i.test(href)) throw new Error('Article links must use a full HTTP or HTTPS URL.')
        try { const url = new URL(href); if (url.username || url.password) throw new Error() } catch { throw new Error('The article contains an invalid link.') }
        return { type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } }
      })
    }
    if (item.content !== undefined) {
      if (!Array.isArray(item.content) || ['text', 'hardBreak', 'horizontalRule'].includes(item.type)) throw new Error('The article structure is invalid.')
      clean.content = item.content.map(child => node(child, depth + 1))
    }
    const children = clean.content || []
    const inline = new Set(['text', 'hardBreak'])
    if (['paragraph', 'heading'].includes(item.type) && children.some(child => !inline.has(child.type))) throw new Error('Text blocks must contain text or line breaks.')
    if (['bulletList', 'orderedList'].includes(item.type) && (!children.length || children.some(child => child.type !== 'listItem'))) throw new Error('Lists must contain list items.')
    if (item.type === 'listItem' && (children[0]?.type !== 'paragraph' || children.some(child => inline.has(child.type) || child.type === 'listItem'))) throw new Error('Each list item must start with a paragraph.')
    if (['doc', 'blockquote'].includes(item.type) && children.some(child => inline.has(child.type) || child.type === 'listItem')) throw new Error('The article contains an invalid block.')
    return clean
  }
  const body = node(input.body, 0)
  if (!body.content?.length) body.content = [{ type: 'paragraph' }]
  return { title: input.title as string, slug: input.slug as string, excerpt: input.excerpt as string, template: input.template as ArticleTemplate, season: input.season as string, gameweek: input.gameweek as number | null, body }
}
