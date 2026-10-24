import { articleTemplates, type ArticleTemplate } from './articles'

export interface ResearchSource { url: string; title: string; excerpt: string }
export interface ResearchResult {
  sources: ResearchSource[]
  competitors: { sourceId: number; coverage: string; strength: string; gap: string }[]
  suggestions: { title: string; template: ArticleTemplate; intent: string; angle: string; whyNow: string; sourceIds: number[]; visuals: string }[]
  gameweek: number
  season: string
  capturedAt: string
}
const text = { type: 'string' }
export const researchSchema = {
  type: 'object', additionalProperties: false, required: ['competitors', 'suggestions'], properties: {
    competitors: { type: 'array', minItems: 3, maxItems: 8, items: { type: 'object', additionalProperties: false, required: ['sourceId', 'coverage', 'strength', 'gap'], properties: { sourceId: { type: 'integer' }, coverage: text, strength: text, gap: text } } },
    suggestions: { type: 'array', minItems: 3, maxItems: 6, items: { type: 'object', additionalProperties: false, required: ['title', 'template', 'intent', 'angle', 'whyNow', 'sourceIds', 'visuals'], properties: { title: text, template: { type: 'string', enum: articleTemplates.map(t => t.value) }, intent: text, angle: text, whyNow: text, sourceIds: { type: 'array', minItems: 1, items: { type: 'integer' } }, visuals: text } } },
  },
}

export function researchSources(annotations: unknown): ResearchSource[] {
  if (!Array.isArray(annotations)) throw new Error('Search returned no source citations. No recommendations were created.')
  const sources: ResearchSource[] = []
  for (const item of annotations) {
    const citation = item?.type === 'url_citation' ? item.url_citation : null
    if (!citation || typeof citation.url !== 'string' || typeof citation.title !== 'string' || typeof citation.content !== 'string' || citation.content.length < 100) continue
    try {
      const url = new URL(citation.url)
      if (url.protocol !== 'https:' || url.username || url.password || sources.some(source => source.url === url.href)) continue
      sources.push({ url: url.href, title: citation.title.slice(0, 250), excerpt: citation.content.slice(0, 6000) })
    } catch { continue }
    if (sources.length === 8) break
  }
  if (sources.length < 3 || new Set(sources.map(s => new URL(s.url).hostname.replace(/^www\./, ''))).size < 2) throw new Error('Search did not return enough cited articles from different publishers to benchmark. Please try a narrower research focus.')
  return sources
}

export function validateResearch(value: unknown, sources: ResearchSource[], context: { gameweek: number; season: string; capturedAt: string }): ResearchResult {
  const result = value as ResearchResult
  const validText = (value: unknown, max = 1200) => typeof value === 'string' && value.trim().length > 0 && value.length <= max
  const validId = (id: number) => Number.isInteger(id) && id >= 0 && id < sources.length
  if (!result || !Array.isArray(result.competitors) || result.competitors.length < 3 || result.competitors.length > 8 || !Array.isArray(result.suggestions) || result.suggestions.length < 3 || result.suggestions.length > 6) throw new Error('Research returned incomplete benchmarks or suggestions.')
  if (result.competitors.some(c => !validId(c.sourceId) || ![c.coverage, c.strength, c.gap].every(t => validText(t)))) throw new Error('A benchmark did not match a cited source.')
  if (result.suggestions.some(s => !validText(s.title, 200) || !articleTemplates.some(t => t.value === s.template) || ![s.intent, s.angle, s.whyNow, s.visuals].every(t => validText(t)) || !Array.isArray(s.sourceIds) || !s.sourceIds.length || s.sourceIds.some(id => !validId(id)))) throw new Error('A suggestion did not match its research sources.')
  return { sources, ...context, competitors: result.competitors.map(c => ({ sourceId: c.sourceId, coverage: c.coverage, strength: c.strength, gap: c.gap })), suggestions: result.suggestions.map(s => ({ title: s.title, template: s.template, intent: s.intent, angle: s.angle, whyNow: s.whyNow, sourceIds: s.sourceIds, visuals: s.visuals })) }
}
