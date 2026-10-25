import { fetchHomepageTradeForm } from '../../shared/homepage-trade-form'
import { buildHomepageTradeOptions, getHomepageTradeResearchPlayers, HOMEPAGE_TRADE_VERSION, selectHomepageTradeIdeas, type TradeFormByPlayer } from '../../shared/homepage-trades'
import { getHomepageBuyResearchPlayers } from '../../shared/homepage-buys'
import { getHomepageBootstrap } from './homepage-data'

export const getHomepageTradeFixtures = defineCachedFunction(async () => {
  const fixtures = await $fetch<Record<string, any>[]>('https://fantasy.premierleague.com/api/fixtures/', { timeout: 10_000, retry: 0 })
  if (!Array.isArray(fixtures)) throw createError({ statusCode: 502, statusMessage: 'Upcoming fixtures are temporarily unavailable.' })
  return fixtures
}, { name: 'homepage-trade-fixtures-v2', maxAge: 600, swr: false })

export const getHomepageRecentForm = defineCachedFunction(async (gameweek: number, _completed: string) => {
  const [bootstrap, fixtures] = await Promise.all([getHomepageBootstrap(), getHomepageTradeFixtures()])
  const gameweeks = bootstrap.events.filter((event: Record<string, any>) => event.id >= gameweek && !event.finished)
    .sort((a: Record<string, any>, b: Record<string, any>) => a.id - b.id).slice(0, 3).map((event: Record<string, any>) => Number(event.id))
  const research = [...new Map([...getHomepageTradeResearchPlayers(bootstrap.elements), ...getHomepageBuyResearchPlayers(bootstrap.elements, fixtures, gameweeks)]
    .map((player) => [Number(player.id), player])).values()]
  return { recentForm: await fetchHomepageTradeForm(bootstrap.elements, bootstrap.events, research), fetchedAt: Date.now() }
}, { name: 'homepage-trade-form-v3', getKey: (gameweek, completed) => `${gameweek}-${completed}`, maxAge: 21_600, swr: false })

export async function getCurrentHomepageTrades(record: { snapshotJson: string; generatedAt: number; gameweek: number; sourceFetchedAt: number } | null) {
  const [bootstrap, fixtures] = await Promise.all([getHomepageBootstrap(), getHomepageTradeFixtures()])
  const gameweek = Number(bootstrap.events.find((event: Record<string, any>) => event.is_next)?.id) || null
  const gameweeks = bootstrap.events.filter((event: Record<string, any>) => gameweek && Number(event.id) >= gameweek && !event.finished)
    .map((event: Record<string, any>) => Number(event.id)).sort((a: number, b: number) => a - b).slice(0, 5)
  const completed = bootstrap.events.filter((event: Record<string, any>) => event.finished).map((event: Record<string, any>) => Number(event.id)).sort((a: number, b: number) => a - b)
  if (!gameweek) return { snapshot: { version: HOMEPAGE_TRADE_VERSION, gameweeks: [], ideas: [] }, generatedAt: null, sourceFetchedAt: null }

  let saved: Record<string, any> | null = null
  try { saved = record ? JSON.parse(record.snapshotJson) : null } catch { /* Older or invalid snapshots use current rule-based evidence. */ }
  const currentSnapshot = record && record.gameweek === gameweek && record.sourceFetchedAt <= Date.now() &&
    Date.now() - record.sourceFetchedAt < 36 * 60 * 60 * 1000 && saved?.version === HOMEPAGE_TRADE_VERSION &&
    JSON.stringify(saved.completedGameweeks?.slice().sort((a: number, b: number) => a - b)) === JSON.stringify(completed) &&
    Array.isArray(saved.ideas) && saved.recentForm && typeof saved.recentForm === 'object'
  const form = currentSnapshot
    ? { recentForm: saved!.recentForm as TradeFormByPlayer, fetchedAt: record!.sourceFetchedAt }
    : await getHomepageRecentForm(gameweek, completed.join('-'))
  const options = buildHomepageTradeOptions(bootstrap.elements, fixtures, gameweeks, form.recentForm)
  // Recheck saved pairs against today's availability, prices, ownership, and performance.
  // Do not fill JEV-rejected slots with unreviewed fallback ideas.
  const scores = new Map<string, Record<string, any>>(currentSnapshot ? saved!.ideas.map((idea: Record<string, any>) => [String(idea.id), idea]) : [])
  const candidates = currentSnapshot ? options.flatMap((option) => {
    const score = scores.get(String(option.id))
    return score && typeof score.score === 'number' && score.score >= 3 && score.score <= 4
      ? [{ ...option, score: score.score, confidence: score.confidence }] : []
  }) : options
  const ideas = selectHomepageTradeIdeas(candidates)
  return {
    snapshot: { version: HOMEPAGE_TRADE_VERSION, gameweeks, ideas },
    generatedAt: currentSnapshot ? record!.generatedAt : form.fetchedAt,
    sourceFetchedAt: form.fetchedAt,
  }
}
