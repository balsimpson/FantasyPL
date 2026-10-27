import { validateArticleDraft, type ArticleDraft, type ArticleNode } from './articles'
import type { ArticlePlayerSnapshot } from './article-visuals'

const EVIDENCE_MAX_AGE_MS = 48 * 60 * 60 * 1000
const CLOCK_SKEW_MS = 5 * 60 * 1000
const VISUAL_TYPES = new Set(['playerCard', 'fixtureRun', 'comparisonCard', 'transferWatch', 'budgetShortlist', 'teamFixtureTable'])

function evidenceFrom(node: ArticleNode): ArticlePlayerSnapshot[] {
  const evidence: ArticlePlayerSnapshot[] = []
  if (VISUAL_TYPES.has(node.type)) {
    if (node.attrs?.player) evidence.push(node.attrs.player as ArticlePlayerSnapshot)
    if (Array.isArray(node.attrs?.players)) evidence.push(...node.attrs.players as ArticlePlayerSnapshot[])
  }
  for (const child of node.content || []) evidence.push(...evidenceFrom(child))
  return evidence
}

function isUnchangedPublishedEvidence(draft: ArticleDraft, evidence: ArticlePlayerSnapshot[], publishedJson?: string) {
  if (!publishedJson) return false
  try {
    const published = validateArticleDraft(JSON.parse(publishedJson))
    if (published.template !== draft.template || published.season !== draft.season || published.gameweek !== draft.gameweek) return false
    const current = evidence.map(player => JSON.stringify(player)).sort()
    const previous = evidenceFrom(published.body).map(player => JSON.stringify(player)).sort()
    return current.length > 0 && JSON.stringify(current) === JSON.stringify(previous)
  } catch {
    return false
  }
}

/** Validate stored evidence when publishing; preserve unchanged, dated evidence on corrections. */
export function validateArticlePublishEvidence(draft: ArticleDraft, publishedJson: string | undefined, now: number) {
  const evidence = evidenceFrom(draft.body)
  const requiresEvidence = !['guide', 'evergreen'].includes(draft.template)
  if (requiresEvidence && !evidence.length) throw new Error('Add at least one saved FPL evidence visual so the article can show when its data was captured.')

  if (requiresEvidence) {
    const unchanged = isUnchangedPublishedEvidence(draft, evidence, publishedJson)
    for (const player of evidence) {
      if (player.season !== draft.season || (draft.gameweek !== null && player.gameweek !== draft.gameweek)) {
        throw new Error('The FPL evidence must match the article season and gameweek.')
      }
      const captured = Date.parse(player.capturedAt)
      if (!Number.isFinite(captured) || captured > now + CLOCK_SKEW_MS) throw new Error('Check the FPL evidence capture time.')
      if (!unchanged && captured < now - EVIDENCE_MAX_AGE_MS) throw new Error('FPL evidence is over 48 hours old. Generate and review a fresh draft before publishing.')
    }
  }

  return evidence.reduce<string | undefined>((oldest, player) =>
    !oldest || Date.parse(player.capturedAt) < Date.parse(oldest) ? player.capturedAt : oldest, undefined)
}
