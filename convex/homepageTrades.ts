import { v } from 'convex/values'
import { internalAction, internalMutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { buildHomepageTradeCandidates } from './homepageTradeLogic'
import { fetchHomepageTradeForm } from '../shared/homepage-trade-form'
import { getHomepageTradeResearchPlayers, HOMEPAGE_TRADE_VERSION } from '../shared/homepage-trades'
import { buildHomepageBuyIdeas, getHomepageBuyResearchPlayers, HOMEPAGE_BUY_VERSION } from '../shared/homepage-buys'
import { reviewHomepageBuys } from './homepageBuyLogic'
import { reviewHomepageTrades } from './homepageTradeReview'

const snapshotKey = 'recommended-trades'
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

    const { ideas, model } = await reviewHomepageTrades(candidates, gameweek, gameweeks, key)

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
