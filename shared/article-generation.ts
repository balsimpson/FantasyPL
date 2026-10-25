import { articleSlug, emptyArticle, validateArticleDraft, type ArticleDraft, type ArticleNode, type ArticleTemplate } from './articles'
import { validatePlayerSnapshot, type ArticlePlayerSnapshot } from './article-visuals'

type Row = Record<string, any>
export interface ArticleEvidence {
  players: ArticlePlayerSnapshot[]
  season: string
  gameweek: number
  capturedAt: string
  selection: string
}
const numeric = (value: unknown) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null
const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const cleanGeneratedCopy = (value: string) => {
  const metadataStart = value.search(/\b(?:playerIds|visualType|visualPlayerId)\b/i)
  return (metadataStart < 0 ? value : value.slice(0, metadataStart))
    .trim()
    .replace(/[\s,:;{[("'`-]+$/, '')
}

type EmphasisBudget = { bold: number; italic: number }
export interface ArticleLinkTarget { kind: 'article' | 'player'; title: string; url: string }
interface GeneratedInternalLink { anchor: string; targetUrl: string }
function formatGeneratedText(value: string, budget: EmphasisBudget): ArticleNode[] {
  const nodes: ArticleNode[] = []
  const emphasis = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g
  let cursor = 0
  for (const match of value.matchAll(emphasis)) {
    const index = match.index ?? 0
    if (index > cursor) nodes.push({ type: 'text', text: value.slice(cursor, index) })
    const bold = match[1] !== undefined
    const type = bold ? 'bold' : 'italic'
    const text = bold ? match[1] : match[2]
    if (text) {
      const allowed = budget[type] > 0
      if (allowed) budget[type] -= 1
      nodes.push({ type: 'text', text, ...(allowed ? { marks: [{ type }] } : {}) })
    }
    cursor = index + match[0].length
  }
  if (cursor < value.length) nodes.push({ type: 'text', text: value.slice(cursor) })
  return nodes
}

export function buildArticleEvidence(bootstrap: Row, fixtures: Row[], topic: string, template: ArticleTemplate, requestedSeason = '', requestedGameweek: number | null = null): ArticleEvidence {
  if (!Array.isArray(bootstrap.elements) || !Array.isArray(bootstrap.teams) || !Array.isArray(bootstrap.events) || !Array.isArray(fixtures)) throw new Error('Current FPL data is unavailable.')
  const event = bootstrap.events.find((e: Row) => e.is_next) || bootstrap.events.find((e: Row) => e.is_current)
  const firstDeadline = bootstrap.events.find((e: Row) => e.id === 1)?.deadline_time
  const year = new Date(firstDeadline).getUTCFullYear()
  if (!event || !Number.isFinite(year)) throw new Error('The current FPL season or gameweek is unavailable.')
  const season = `${year}/${String((year + 1) % 100).padStart(2, '0')}`
  if (requestedSeason && requestedSeason !== season) throw new Error(`Generation uses the current ${season} season. Update the article season first.`)
  if (requestedGameweek !== null && requestedGameweek !== event.id) throw new Error(`Generation currently supports the upcoming gameweek, GW ${event.id}. Update the article gameweek first.`)
  const topicGameweek = topic.match(/(?:\bGW|gameweek)\s*(\d+)/i)?.[1]
  if (topicGameweek && Number(topicGameweek) !== event.id) throw new Error(`The topic names another gameweek. Current data supports GW ${event.id}.`)
  const capturedAt = new Date().toISOString()
  const gameweeks = [event.id, event.id + 1, event.id + 2].filter(n => n <= 38)
  const normalizedTopic = normalize(topic)
  const price = normalizedTopic.match(/(?:under|below|up to|budget of)\s*£?\s*(\d+(?:\.\d+)?)/)?.[1]
  const position = /midfield/.test(normalizedTopic) ? 3 : /forward|striker/.test(normalizedTopic) ? 4 : /defender/.test(normalizedTopic) ? 2 : /goalkeep|keeper/.test(normalizedTopic) ? 1 : null
  const all = bootstrap.elements.filter((p: Row) => Number.isSafeInteger(p.id) && Number.isSafeInteger(p.code) && numeric(p.now_cost) !== null)
  const named = all.filter((p: Row) => [p.web_name, `${p.first_name} ${p.second_name}`].some(name => name && normalize(name).length >= 3 && new RegExp(`(?:^|[^a-z])${normalize(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-z])`).test(normalizedTopic)))
  const eligible = all.filter((p: Row) => Number(p.minutes) >= 180 && (!position || p.element_type === position) && (!price || Number(p.now_cost) <= Number(price) * 10))
  let candidates = named.length ? named : eligible
  if (template === 'comparison') {
    if (named.length === 1) candidates = [...named, ...eligible.filter((p: Row) => p.id !== named[0].id)]
    else if (!named.length) candidates = eligible
  }
  const score = (p: Row) => template === 'transfers' ? Number(p.transfers_in_event) || 0 : Number(p.form) || 0
  const fixtureScore = (team: number) => {
    const run = fixtures.filter(f => gameweeks.includes(f.event) && (f.team_h === team || f.team_a === team))
    const blanks = gameweeks.filter(week => !run.some(f => f.event === week)).length
    const mean = run.length ? run.reduce((sum, f) => sum + Number(f.team_h === team ? f.team_h_difficulty : f.team_a_difficulty), 0) / run.length : 6
    return { blanks, mean }
  }
  const ranked = [...candidates].sort((a: Row, b: Row) => {
    if (template === 'fixtures') { const left = fixtureScore(a.team); const right = fixtureScore(b.team); const difference = left.blanks - right.blanks || left.mean - right.mean; if (difference) return difference }
    return score(b) - score(a) || Number(b.total_points) - Number(a.total_points) || a.id - b.id
  }).slice(0, template === 'comparison' ? 2 : 10)
  if (!ranked.length) throw new Error('No players match this topic using the current data and minutes filter.')
  if (template === 'comparison' && ranked.length !== 2) throw new Error('The current data and topic filters did not return two players. Remove a price or position limit and try again.')
  const players = ranked.map((p: Row) => {
    const team = bootstrap.teams.find((t: Row) => t.id === p.team)
    const photoCode = /^\d+\.(jpg|png)$/i.test(p.photo ?? '') ? p.photo.replace(/\.(jpg|png)$/i, '') : String(p.code)
    const playerFixtures = fixtures.filter(f => gameweeks.includes(f.event) && (f.team_h === p.team || f.team_a === p.team)).map(f => {
      const home = f.team_h === p.team
      const opponent = bootstrap.teams.find((t: Row) => t.id === (home ? f.team_a : f.team_h))
      return { gameweek: f.event, opponent: opponent?.name || 'Opponent TBC', opponentCode: opponent?.code ?? null, home, difficulty: home ? f.team_h_difficulty : f.team_a_difficulty, kickoff: f.kickoff_time || null }
    })
    return validatePlayerSnapshot({ id: p.id, code: p.code, photoCode, first_name: p.first_name, second_name: p.second_name, web_name: p.web_name, teamName: team?.name || 'Club unavailable', teamCode: team?.code, position: ['', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'][p.element_type] || 'Player', price: Number(p.now_cost) / 10, points: numeric(p.total_points), pointsPerGame: numeric(p.points_per_game), minutes: numeric(p.minutes), form: numeric(p.form), ownership: numeric(p.selected_by_percent), goals: numeric(p.goals_scored), assists: numeric(p.assists), cleanSheets: numeric(p.clean_sheets), transfersIn: numeric(p.transfers_in_event), transfersOut: numeric(p.transfers_out_event), season, gameweek: event.id, capturedAt, gameweeks, fixtures: playerFixtures })
  })
  const comparisonSelection = named.length === 1
    ? 'The named player is paired with the top eligible player by form, then season points.'
    : named.length >= 2
      ? 'Players named in the topic; when more than two are named, the top two by form and season points are selected.'
      : 'Top two eligible players by form, then season points.'
  const selection = template === 'comparison'
    ? `${comparisonSelection}${position ? ' Position filter applied.' : ''}${price ? ` Price no more than £${price}m.` : ''}`
    : named.length ? 'Players named in the topic.' : `${template === 'fixtures' ? 'Fewer blank gameweeks first, then lower mean FDR across listed fixtures, then player form. Double fixtures count separately; blanks are shown outside the mean' : template === 'transfers' ? 'Ranked by gameweek transfers in, then season points' : 'Ranked by FPL form, then season points'}. Minimum 180 season minutes.${position ? ' Position filter applied.' : ''}${price ? ` Price no more than £${price}m.` : ''}`
  return { players, season, gameweek: event.id, capturedAt, selection }
}

export const generatedArticleSchema = {
  type: 'object', additionalProperties: false, required: ['title', 'excerpt', 'sections', 'internalLinks'],
  properties: {
    title: { type: 'string' }, excerpt: { type: 'string' },
    internalLinks: { type: 'array', maxItems: 6, items: { type: 'object', additionalProperties: false, required: ['anchor', 'targetUrl'], properties: { anchor: { type: 'string' }, targetUrl: { type: 'string' } } } },
    sections: { type: 'array', minItems: 3, maxItems: 5, items: {
      type: 'object', additionalProperties: false, required: ['heading', 'paragraphs', 'playerIds', 'visualType', 'visualPlayerId'],
      properties: { heading: { type: 'string' }, paragraphs: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string', description: 'Use **bold** for a short player name or key takeaway, with no more than two bold spans per section. Use *italics* for one brief caveat per section. Use no other Markdown. Keep statistics and club crests in the supplied visual cards.' } }, playerIds: { type: 'array', items: { type: 'integer' } }, visualType: { type: 'string', enum: ['none', 'playerCard', 'fixtureRun'] }, visualPlayerId: { type: ['integer', 'null'] } },
    } },
  },
}

export const generatedEvergreenArticleSchema = {
  type: 'object', additionalProperties: false, required: ['title', 'excerpt', 'sections', 'internalLinks'],
  properties: {
    title: { type: 'string' }, excerpt: { type: 'string' },
    internalLinks: { type: 'array', maxItems: 6, items: { type: 'object', additionalProperties: false, required: ['anchor', 'targetUrl'], properties: { anchor: { type: 'string' }, targetUrl: { type: 'string' } } } },
    sections: { type: 'array', minItems: 3, maxItems: 5, items: {
      type: 'object', additionalProperties: false, required: ['heading', 'paragraphs'],
      properties: { heading: { type: 'string' }, paragraphs: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string', description: 'Use **bold** for emphasis, with no more than two bold spans per section. Use *italics* for one brief caveat per section. Use no other Markdown.' } },
    } },
  },
}
}

function addInternalLinks(content: ArticleNode[], links: GeneratedInternalLink[], allowedTargets: ArticleLinkTarget[]) {
  const allowed = new Set(allowedTargets.map(target => target.url))
  const used = new Set<string>()
  for (const link of links.slice(0, 6)) {
    if (!link || typeof link !== 'object') continue
    const anchor = typeof link.anchor === 'string' ? link.anchor.trim() : ''
    if (!anchor || anchor.length > 100 || typeof link.targetUrl !== 'string' || !allowed.has(link.targetUrl) || used.has(link.targetUrl)) continue
    const findIn = (nodes: ArticleNode[]): boolean => {
      for (let index = 0; index < nodes.length; index++) {
        const node = nodes[index]!
        if (node.type === 'text' && node.text) {
          const start = node.text.toLocaleLowerCase().indexOf(anchor.toLocaleLowerCase())
          if (start < 0) continue
          const end = start + anchor.length
          const replacement: ArticleNode[] = []
          if (start) replacement.push({ ...node, text: node.text.slice(0, start) })
          replacement.push({ ...node, text: node.text.slice(start, end), marks: [...(node.marks || []), { type: 'link', attrs: { href: link.targetUrl } }] })
          if (end < node.text.length) replacement.push({ ...node, text: node.text.slice(end) })
          nodes.splice(index, 1, ...replacement)
          return true
        }
        if (node.content && findIn(node.content)) return true
      }
      return false
    }
    if (findIn(content)) used.add(link.targetUrl)
  }
}

export function generatedEvergreenArticle(value: unknown, allowedTargets: ArticleLinkTarget[] = []): ArticleDraft {
  const result = value as { title?: string; excerpt?: string; sections?: { heading: string; paragraphs: string[] }[]; internalLinks?: GeneratedInternalLink[] }
  if (!result || typeof result.title !== 'string' || typeof result.excerpt !== 'string' || !Array.isArray(result.sections) || result.sections.length < 3 || result.sections.length > 5 || !Array.isArray(result.internalLinks) || result.internalLinks.length > 6) throw new Error('The model returned an incomplete article. The existing draft was preserved.')
  const title = cleanGeneratedCopy(result.title)
  const excerpt = cleanGeneratedCopy(result.excerpt)
  if (title.length < 8 || title.length > 200 || excerpt.length < 20 || excerpt.length > 600) throw new Error('The evergreen article title or summary is incomplete. The existing draft was preserved.')
  const emphasisBudget = { bold: 2, italic: 1 }
  const content: ArticleNode[] = []
  for (const section of result.sections) {
    const heading = cleanGeneratedCopy(section.heading)
    if (!heading || heading.length > 120 || !Array.isArray(section.paragraphs) || !section.paragraphs.length || section.paragraphs.length > 3) throw new Error('The model returned an invalid evergreen section. The existing draft was preserved.')
    content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: heading }] })
    for (const raw of section.paragraphs) {
      const paragraph = cleanGeneratedCopy(raw)
      if (!paragraph || paragraph.length > 4000) throw new Error('The model returned an invalid evergreen paragraph. The existing draft was preserved.')
      content.push({ type: 'paragraph', content: formatGeneratedText(paragraph, emphasisBudget) })
    }
  }
  addInternalLinks(content, result.internalLinks || [], allowedTargets)
  return validateArticleDraft({ ...emptyArticle(), title, slug: articleSlug(title), excerpt, template: 'evergreen', body: { type: 'doc', content } })
}

export function generatedArticle(value: unknown, evidence: ArticleEvidence, template: ArticleTemplate, allowedTargets: ArticleLinkTarget[] = []): ArticleDraft {
  const result = value as { title?: string; excerpt?: string; sections?: { heading: string; paragraphs: string[]; playerIds: number[]; visualType: string; visualPlayerId: number | null }[]; internalLinks?: GeneratedInternalLink[] }
  if (!result || typeof result.title !== 'string' || typeof result.excerpt !== 'string' || !Array.isArray(result.sections) || result.sections.length < 3 || result.sections.length > 5 || !Array.isArray(result.internalLinks) || result.internalLinks.length > 6) throw new Error('The model returned an incomplete article. The existing draft was preserved.')
  const title = cleanGeneratedCopy(result.title)
  const excerpt = cleanGeneratedCopy(result.excerpt)
  if (!title || !excerpt) throw new Error('The model returned an incomplete article. The existing draft was preserved.')
  const content: ArticleNode[] = []
  const used = new Set<string>()
  for (const section of result.sections) {
    if (typeof section.heading !== 'string' || section.heading.length > 180 || !Array.isArray(section.paragraphs) || !section.paragraphs.length || section.paragraphs.length > 3 || section.paragraphs.some(p => typeof p !== 'string' || p.length > 3000) || !Array.isArray(section.playerIds) || section.playerIds.some(id => !evidence.players.some(p => p.id === id))) throw new Error('The article contains invalid sections or player references.')
    const heading = cleanGeneratedCopy(section.heading)
    if (heading) content.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: heading }] })
    const emphasisBudget = { bold: 2, italic: 1 }
    content.push(...section.paragraphs.map(cleanGeneratedCopy).filter(Boolean).map(text => ({ type: 'paragraph', content: formatGeneratedText(text, emphasisBudget) })))
    if (section.visualType === 'none') continue
    const player = evidence.players.find(p => p.id === section.visualPlayerId)
    if (!player || !['playerCard', 'fixtureRun'].includes(section.visualType) || !section.playerIds.includes(player.id)) throw new Error('The article requested a visual without supporting player evidence.')
    const key = `${section.visualType}:${player.id}`
    if (!used.has(key) && used.size < 2) { content.push({ type: section.visualType, attrs: { player } }); used.add(key) }
  }
  // Fill missing visuals only beside sections that actually cite the player.
  function insertForSection(section: NonNullable<typeof result.sections>[number], player: ArticlePlayerSnapshot, type: string) {
    const headingIndex = content.findIndex(node => node.type === 'heading' && node.content?.[0]?.text === section.heading)
    const nextHeading = content.findIndex((node, index) => index > headingIndex && node.type === 'heading')
    content.splice(nextHeading < 0 ? content.length : nextHeading, 0, { type, attrs: { player } })
    used.add(`${type}:${player.id}`)
  }
  if (template === 'comparison') for (const player of evidence.players) {
    if (content.some(node => ['playerCard', 'fixtureRun'].includes(node.type) && (node.attrs?.player as ArticlePlayerSnapshot)?.id === player.id)) continue
    const section = result.sections.find(section => section.playerIds.includes(player.id))
    if (!section) throw new Error('The comparison did not cover both selected players. The existing draft was preserved.')
    insertForSection(section, player, 'playerCard')
  }
  for (const section of result.sections) for (const playerId of section.playerIds) {
    if (used.size >= 2) break
    const player = evidence.players.find(player => player.id === playerId)!
    const type = template === 'fixtures' || used.size === 1 ? 'fixtureRun' : 'playerCard'
    if (!used.has(`${type}:${player.id}`)) insertForSection(section, player, type)
  }
  if (used.size < 2) throw new Error('The article did not include enough evidence-backed visuals. The existing draft was preserved.')
  const cardType = template === 'comparison' ? 'comparisonCard'
    : template === 'transfers' ? 'transferWatch'
      : template === 'budget' ? 'budgetShortlist'
        : template === 'fixtures' ? 'teamFixtureTable' : null
  const visualCount = () => content.filter(node => ['playerCard', 'fixtureRun', 'comparisonCard', 'transferWatch', 'budgetShortlist', 'teamFixtureTable'].includes(node.type)).length
  if (cardType && visualCount() < 4) {
    const players = cardType === 'comparisonCard'
      ? evidence.players.slice(0, 3)
      : cardType === 'teamFixtureTable'
        ? [...new Map(evidence.players.map(player => [player.teamCode, player])).values()].slice(0, 5)
        : evidence.players.slice(0, 5)
    if (players.length >= (cardType === 'comparisonCard' ? 2 : 1)) {
      const section = result.sections.find(item => players.some(player => item.playerIds.includes(player.id))) || result.sections[0]
      if (!section) throw new Error('The article did not include a section for its data card. The existing draft was preserved.')
      const headingIndex = content.findIndex(node => node.type === 'heading' && node.content?.[0]?.text === section.heading)
      const nextHeading = content.findIndex((node, index) => index > headingIndex && node.type === 'heading')
      content.splice(nextHeading < 0 ? content.length : nextHeading, 0, { type: cardType, attrs: { players, criteria: evidence.selection } })
    }
  }
  addInternalLinks(content, result.internalLinks || [], allowedTargets)
  return validateArticleDraft({ ...emptyArticle(), title, slug: articleSlug(title), excerpt, template, season: evidence.season, gameweek: evidence.gameweek, body: { type: 'doc', content } })
}
