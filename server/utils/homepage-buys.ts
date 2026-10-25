import { buildHomepageBuyIdeas, HOMEPAGE_BUY_VERSION, selectHomepageBuyIdeas } from '../../shared/homepage-buys'
import type { TradeFormByPlayer } from '../../shared/homepage-trades'
import { getHomepageBootstrap } from './homepage-data'
import { getHomepageRecentForm, getHomepageTradeFixtures } from './homepage-trades'

export type HomepageBuySnapshot = { snapshotJson: string; gameweek: number; generatedAt: number; sourceFetchedAt: number }

export async function getCurrentHomepageBuys(record: HomepageBuySnapshot | null) {
  const [bootstrap, fixtures] = await Promise.all([getHomepageBootstrap(), getHomepageTradeFixtures()])
  const gameweek = Number(bootstrap.events.find((event: Record<string, any>) => event.is_next)?.id) || null
  const gameweeks = bootstrap.events.filter((event: Record<string, any>) => gameweek && event.id >= gameweek && !event.finished)
    .map((event: Record<string, any>) => Number(event.id)).sort((a: number, b: number) => a - b).slice(0, 3)
  const completed = bootstrap.events.filter((event: Record<string, any>) => event.finished).map((event: Record<string, any>) => Number(event.id)).sort((a: number, b: number) => a - b)
  if (!gameweek) return { snapshot: { gameweeks, ideas: [] }, generatedAt: null, source: 'rules' }
  let saved: Record<string, any> | null = null
  try { saved = record ? JSON.parse(record.snapshotJson) : null } catch { /* Rebuild from current evidence. */ }
  const current = record && record.gameweek === gameweek && record.sourceFetchedAt <= Date.now() &&
    Date.now() - record.sourceFetchedAt < 36 * 60 * 60 * 1000 && saved?.version === HOMEPAGE_BUY_VERSION &&
    Array.isArray(saved.ideas) && saved.ideas.every((idea: Record<string, any> | null) => idea && Number.isSafeInteger(idea.id) && Number.isSafeInteger(idea.code) &&
      typeof idea.score === 'number' && Number.isFinite(idea.score) && idea.score >= 3 && idea.score <= 4) &&
    saved.recentForm && typeof saved.recentForm === 'object' && !Array.isArray(saved.recentForm) &&
    Array.isArray(saved.completedGameweeks) && JSON.stringify([...saved.completedGameweeks].sort((a, b) => a - b)) === JSON.stringify(completed)
  const form = current ? { recentForm: saved!.recentForm as TradeFormByPlayer, fetchedAt: record!.sourceFetchedAt }
    : await getHomepageRecentForm(gameweek, completed.join('-'))
  const options = buildHomepageBuyIdeas(bootstrap.elements, fixtures, gameweeks, form.recentForm)
  const reviewed = new Map<number, Record<string, any>>(current ? saved!.ideas.map((idea: Record<string, any>) => [Number(idea.id), idea]) : [])
  const ideas = current ? options.flatMap((option) => {
    const savedIdea = reviewed.get(option.id)
    return savedIdea && savedIdea.code === option.code && typeof savedIdea.score === 'number' && savedIdea.score >= 3 && savedIdea.score <= 4
      ? [{ ...option, score: savedIdea.score }] : []
  }) : options
  return { snapshot: { gameweeks, ideas: selectHomepageBuyIdeas(ideas) }, generatedAt: current ? record!.generatedAt : form.fetchedAt,
    source: current ? 'reviewed' : 'rules' }
}
