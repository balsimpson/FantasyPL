import { v } from 'convex/values'
import { internalAction, internalMutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { buildHomepageTradeCandidates } from './homepageTradeLogic'
import { fetchHomepageTradeForm } from '../shared/homepage-trade-form'
import { getHomepageTradeResearchPlayers, HOMEPAGE_TRADE_VERSION, selectHomepageTradeIdeas } from '../shared/homepage-trades'
import { buildHomepageBuyIdeas, getHomepageBuyResearchPlayers, HOMEPAGE_BUY_VERSION } from '../shared/homepage-buys'
import { reviewHomepageBuys } from './homepageBuyLogic'

const snapshotKey = 'recommended-trades'
const scoreCriteria = [
  'Poor replacement: the supplied FPL data does not support this move.',
  'Weak or marginal case; meaningful downsides outweigh the available gains.',
  'Mixed or roughly balanced case.',
  'Credible improvement across the supplied performance and fixture evidence.',
  'Strong improvement across the supplied performance and fixture evidence.',
]

const snapshotReturns = v.union(v.null(), v.object({
  snapshotJson: v.string(), generatedAt: v.number(), gameweek: v.number(), model: v.string(), sourceFetchedAt: v.number(),
}))

export const getBuysSnapshot = query({
  args: {},
  returns: snapshotReturns,
  handler: async (ctx) => {
    const row = await ctx.db.query('homepageTradeSnapshots').withIndex('by_key', (q) => q.eq('key', 'recommended-buys')).unique()
    if (!row) return null
    return { snapshotJson: row.snapshotJson, generatedAt: row.generatedAt, gameweek: row.gameweek, model: row.model, sourceFetchedAt: row.sourceFetchedAt }
  },
})

export const getSnapshot = query({
  args: {},
  returns: v.union(v.null(), v.object({
    snapshotJson: v.string(),
    generatedAt: v.number(),
    gameweek: v.number(),
    model: v.string(),
    sourceFetchedAt: v.number(),
  })),
  handler: async (ctx) => {
    const row = await ctx.db.query('homepageTradeSnapshots')
      .withIndex('by_key', (q) => q.eq('key', snapshotKey))
      .unique()
    if (!row) return null
    return {
      snapshotJson: row.snapshotJson,
      generatedAt: row.generatedAt,
      gameweek: row.gameweek,
      model: row.model,
      sourceFetchedAt: row.sourceFetchedAt,
    }
  },
})

export const saveSnapshot = internalMutation({
  args: {
    key: v.union(v.literal(snapshotKey), v.literal('recommended-buys')),
    snapshotJson: v.string(),
    generatedAt: v.number(),
    gameweek: v.number(),
    model: v.string(),
    sourceFetchedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('homepageTradeSnapshots')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique()
    if (existing) await ctx.db.patch(existing._id, args)
    else await ctx.db.insert('homepageTradeSnapshots', args)
    return null
  },
})

export const refresh = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const key = process.env.JEV_API_KEY
    if (!key) throw new Error('JEV_API_KEY is not set in the Convex environment.')

    const [bootstrapResponse, fixturesResponse] = await Promise.all([
      fetch('https://fantasy.premierleague.com/api/bootstrap-static/', { signal: AbortSignal.timeout(15_000) }),
      fetch('https://fantasy.premierleague.com/api/fixtures/', { signal: AbortSignal.timeout(15_000) }),
    ])
    if (!bootstrapResponse.ok || !fixturesResponse.ok) throw new Error('The FPL feed could not be refreshed.')
    const [bootstrap, fixtures] = await Promise.all([bootstrapResponse.json(), fixturesResponse.json()]) as [Record<string, any>, Record<string, any>[]]
    if (!Array.isArray(bootstrap.elements) || !Array.isArray(bootstrap.teams) || !Array.isArray(bootstrap.events) || !Array.isArray(fixtures)) {
      throw new Error('The FPL feed returned incomplete data.')
    }

    const buyGameweek = bootstrap.events.find((event: Record<string, any>) => event.is_next)?.id
    if (!Number.isSafeInteger(buyGameweek)) throw new Error('The FPL feed has no next gameweek.')
    const buyGameweeks = bootstrap.events.filter((event: Record<string, any>) => event.id >= buyGameweek && !event.finished)
      .sort((a: Record<string, any>, b: Record<string, any>) => a.id - b.id).slice(0, 3).map((event: Record<string, any>) => Number(event.id))
    const researchPlayers = [...new Map([
      ...getHomepageTradeResearchPlayers(bootstrap.elements),
      ...getHomepageBuyResearchPlayers(bootstrap.elements, fixtures, buyGameweeks),
    ].map((player) => [Number(player.id), player])).values()]
    const recentForm = await fetchHomepageTradeForm(bootstrap.elements, bootstrap.events, researchPlayers)
    const sourceFetchedAt = Date.now()
    // One history fetch serves both reviews. A failed buy review leaves its last snapshot intact.
    let buyReviewError: unknown = null
    try {
      const candidates = buildHomepageBuyIdeas(bootstrap.elements, fixtures, buyGameweeks, recentForm)
      const reviewed = await reviewHomepageBuys(candidates, buyGameweeks, fixtures, key)
      const snapshotJson = JSON.stringify({ version: HOMEPAGE_BUY_VERSION, gameweeks: buyGameweeks, ideas: reviewed.ideas, recentForm,
        completedGameweeks: bootstrap.events.filter((event: Record<string, any>) => event.finished).map((event: Record<string, any>) => Number(event.id)) })
      if (new TextEncoder().encode(snapshotJson).length > 900_000) throw new Error('The buy snapshot is too large to store.')
      await ctx.runMutation(internal.homepageTrades.saveSnapshot, {
        key: 'recommended-buys', snapshotJson, generatedAt: Date.now(), gameweek: buyGameweek, model: reviewed.model, sourceFetchedAt,
      })
    } catch (error) {
      buyReviewError = error
    }
    const { gameweek, gameweeks, candidates } = buildHomepageTradeCandidates(
      bootstrap.elements,
      bootstrap.teams,
      fixtures,
      bootstrap.events,
      30,
      recentForm,
    )
    if (gameweek === null) throw new Error('The FPL feed has no next gameweek.')

    let ideas: Record<string, any>[] = []
    let model = 'jev-latest'
    if (candidates.length) {
      const questions = Object.fromEntries(candidates.map((candidate, index) => {
        const questionId = `option_${index + 1}`
        return [questionId, {
          type: 'score',
          instructions: `Score this same-position FPL swap for Gameweek ${gameweek}. Assess whether the replacement fills a comparable squad role using the supplied recent starts, minutes per match, points per appearance, position-specific expected goal involvement or clean-sheet evidence, next-gameweek estimate, and fixture runs. Outgoing players with 10%+ ownership have priority; the 5-10% group is a reserve. Ownership measures relevance, not a reason to sell. Buying activity is a minor supporting signal only. Each candidate has a deterministic reason and supporting evidence: reject marginal moves or material downsides even if that leaves fewer results. A flagged outgoing can be replaced by an available regular starter. Weigh trade-offs rather than requiring every statistic to improve. State is generic: no verified manager squad, selling price, bank, or club limit is supplied. Fixture runs retain blanks and doubles. Expected points cover the next gameweek only; do not invent multi-gameweek totals, injuries, roles, or lineups. Small samples lower confidence.`,
          criteria: scoreCriteria,
        }]
      }))
      const response = await fetch('https://api.typesafe.ai/v1/systemone', {
        method: 'POST',
        signal: AbortSignal.timeout(30_000),
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          state: {
            targetGameweek: gameweek,
            comparisonGameweeks: gameweeks,
            dataNote: 'FPL expected points are for the next gameweek only. No multi-gameweek points projection is supplied.',
            candidates: candidates.map((candidate, index) => ({ ...candidate, id: `option_${index + 1}` })),
          },
          questions,
        }),
      })
      if (!response.ok) throw new Error(`JEV could not rank the trade ideas (${response.status}).`)
      const result = await response.json() as Record<string, any>
      if (!result.answers || typeof result.answers !== 'object') throw new Error('JEV returned no trade rankings.')

      ideas = candidates.flatMap((candidate, index) => {
        const answer = result.answers[`option_${index + 1}`]
        const score = Number(answer?.score)
        const confidence = Number(answer?.confidence)
        if (answer?.type !== 'score' || answer.score === null || answer.score === undefined || !Number.isFinite(score) || score < 3 || score > 4) return []
        return [{
          ...candidate,
          score: Math.round(score * 10) / 10,
          confidence: Number.isFinite(confidence) && confidence >= 0 && confidence <= 1 ? Math.round(confidence * 100) : null,
        }]
      })
      ideas = selectHomepageTradeIdeas(ideas)
      model = typeof result.model === 'string' ? result.model : model
    }

    const generatedAt = Date.now()
    const snapshotJson = JSON.stringify({ version: HOMEPAGE_TRADE_VERSION, gameweeks, ideas, recentForm, completedGameweeks: bootstrap.events.filter((event: Record<string, any>) => event.finished).map((event: Record<string, any>) => Number(event.id)) })
    if (new TextEncoder().encode(snapshotJson).length > 900_000) throw new Error('The trade snapshot is too large to store.')
    await ctx.runMutation(internal.homepageTrades.saveSnapshot, {
      key: snapshotKey,
      snapshotJson,
      generatedAt,
      gameweek,
      model,
      sourceFetchedAt,
    })
    if (buyReviewError) throw buyReviewError
    return null
  },
})
