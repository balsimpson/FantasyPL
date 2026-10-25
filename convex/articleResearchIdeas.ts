import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalMutation, internalQuery, mutation, query } from './_generated/server'
import { researchTitleKey, validateResearch } from '../shared/article-research'

function authorize(secret: string) {
  if (!process.env.CONTENT_SERVICE_TOKEN || secret !== process.env.CONTENT_SERVICE_TOKEN) throw new ConvexError({ code: 'FORBIDDEN', message: 'Article access denied.' })
}

export const list = query({
  args: { secret: v.string() },
  returns: v.object({ readyCount: v.number(), refillStatus: v.union(v.literal('idle'), v.literal('working'), v.literal('failed')), error: v.union(v.string(), v.null()), ideas: v.array(v.object({ id: v.id('articleResearchIdeas'), researchId: v.id('articleResearch'), suggestionIndex: v.number(), title: v.string(), template: v.string(), intent: v.string(), angle: v.string(), whyNow: v.string(), visuals: v.string(), sourceIds: v.array(v.number()), sources: v.array(v.object({ url: v.string(), title: v.string(), excerpt: v.string() })), season: v.string(), gameweek: v.number(), createdAt: v.number() })) }),
  handler: async (ctx, { secret }) => {
    authorize(secret)
    const [ready, recent] = await Promise.all([
      ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).order('desc').take(10),
      ctx.db.query('articleResearch').withIndex('by_createdAt').order('desc').take(1),
    ])
    const ideas = []
    for (const idea of ready) {
      const run = await ctx.db.get(idea.researchId)
      if (!run?.resultJson) continue
      try {
        const parsed = JSON.parse(run.resultJson)
        const research = validateResearch(parsed, parsed.sources, parsed)
        const suggestion = research.suggestions[idea.suggestionIndex]
        if (suggestion) ideas.push({ id: idea._id, researchId: idea.researchId, suggestionIndex: idea.suggestionIndex, ...suggestion, sources: research.sources, season: idea.season, gameweek: idea.gameweek, createdAt: idea.createdAt })
      } catch { /* Invalid historical results are omitted from the queue. */ }
    }
    const latest = recent[0]
    const refillStatus: 'idle' | 'working' | 'failed' = latest && (latest.status === 'queued' || latest.status === 'researching') ? 'working' : latest?.status === 'failed' && ready.length < 10 ? 'failed' : 'idle'
    return { readyCount: ideas.length, refillStatus, error: refillStatus === 'failed' ? latest?.error || 'Research could not complete.' : null, ideas }
  },
})

export const requestFill = mutation({
  args: { secret: v.string(), retry: v.optional(v.boolean()) }, returns: v.null(),
  handler: async (ctx, { secret, retry }) => {
    authorize(secret)
    await ctx.scheduler.runAfter(0, internal.articleResearchIdeas.refreshAndEnsure, { retry: retry === true })
    return null
  },
})

export const context = internalQuery({
  args: {}, returns: v.object({ titles: v.array(v.object({ title: v.string(), excerpt: v.string(), template: v.string(), season: v.string(), gameweek: v.union(v.number(), v.null()), status: v.string() })), readyIdeas: v.array(v.object({ title: v.string(), template: v.string(), angle: v.string(), intent: v.string() })) }),
  handler: async ctx => {
    const [articles, ideas] = await Promise.all([
      ctx.db.query('articles').withIndex('by_updatedAt').order('desc').take(100),
      ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).order('desc').take(10),
    ])
    const readyIdeas = []
    for (const idea of ideas) {
      const run = await ctx.db.get(idea.researchId)
      if (!run?.resultJson) continue
      try {
        const parsed = JSON.parse(run.resultJson)
        const suggestion = validateResearch(parsed, parsed.sources, parsed).suggestions[idea.suggestionIndex]
        if (suggestion) readyIdeas.push({ title: suggestion.title, template: suggestion.template, angle: suggestion.angle, intent: suggestion.intent })
      } catch { /* Ignore invalid historical research. */ }
    }
    return { titles: articles.map(article => ({ title: article.title, excerpt: article.excerpt, template: article.template, season: article.season, gameweek: article.gameweek, status: article.status })), readyIdeas }
  },
})

export const ensurePool = internalMutation({
  args: { retry: v.optional(v.boolean()) }, returns: v.null(),
  handler: async (ctx, { retry }) => {
    const [ready, active, latest] = await Promise.all([
      ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).order('desc').take(10),
      ctx.db.query('articleResearch').withIndex('by_status_and_createdAt', q => q.eq('status', 'queued')).order('desc').take(1),
      ctx.db.query('articleResearch').withIndex('by_createdAt').order('desc').first(),
    ])
    const researching = await ctx.db.query('articleResearch').withIndex('by_status_and_createdAt', q => q.eq('status', 'researching')).order('desc').take(1)
    if (ready.length >= 10 || active.length || researching.length) return null
    const now = Date.now()
    if (latest && now - latest.createdAt < 30_000 && !(retry && latest.status === 'failed')) {
      await ctx.scheduler.runAfter(Math.max(1, latest.createdAt + 30_100 - now), internal.articleResearchIdeas.ensurePool, {})
      return null
    }
    const failed = await ctx.db.query('articleResearch').withIndex('by_status_and_createdAt', q => q.eq('status', 'failed')).order('desc').take(3)
    if (!retry && failed.length >= 3 && failed.every(run => now - run.createdAt < 30 * 60_000)) return null
    const requestId = crypto.randomUUID()
    const researchId = await ctx.db.insert('articleResearch', { focus: '', requestId, requestedBy: 'automatic-queue', status: 'queued', resultJson: null, error: null, createdAt: now, updatedAt: now })
    await ctx.scheduler.runAfter(0, internal.articleResearch.research, { researchId })
    return null
  },
})

export const expireStale = internalMutation({
  args: { season: v.string(), gameweek: v.number() }, returns: v.null(),
  handler: async (ctx, { season, gameweek }) => {
    const ready = await ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).take(100)
    for (const idea of ready) {
      if (idea.season !== season || idea.gameweek !== gameweek) await ctx.db.patch(idea._id, { status: 'expired' })
    }
    return null
  },
})

export const refreshAndEnsure = internalAction({
  args: { retry: v.optional(v.boolean()) }, returns: v.null(),
  handler: async (ctx, { retry }) => {
    try {
      const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', { signal: AbortSignal.timeout(15_000) })
      if (!response.ok) throw new Error('Could not refresh the current gameweek.')
      const bootstrap = await response.json() as { events?: { id: number; is_next?: boolean; is_current?: boolean; deadline_time?: string }[] }
      const events = Array.isArray(bootstrap.events) ? bootstrap.events : []
      const next = events.find(event => event.is_next) || events.find(event => event.is_current)
      const firstDeadline = events.find(event => event.id === 1)?.deadline_time
      if (next && firstDeadline) {
        const year = new Date(firstDeadline).getUTCFullYear()
        const season = `${year}/${String(year + 1).slice(-2)}`
        await ctx.runMutation(internal.articleResearchIdeas.expireStale, { season, gameweek: next.id })
      }
    } catch { /* Preserve existing ideas when current FPL context is unavailable. */ }
    await ctx.runMutation(internal.articleResearchIdeas.ensurePool, { retry })
    return null
  },
})

export const storeReadyIdeas = internalMutation({
  args: { researchId: v.id('articleResearch'), resultJson: v.string() }, returns: v.null(),
  handler: async (ctx, { researchId, resultJson }) => {
    const result = JSON.parse(resultJson)
    const research = validateResearch(result, result.sources, result)
    const [articles, ready] = await Promise.all([
      ctx.db.query('articles').withIndex('by_updatedAt').order('desc').take(100),
      ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).order('desc').take(10),
    ])
    const currentReady = ready.filter(idea => idea.season === research.season && idea.gameweek === research.gameweek)
    const usedKeys = new Set([...articles.map(article => researchTitleKey(article.title)), ...currentReady.map(idea => idea.titleKey)])
    const now = Date.now()
    const run = await ctx.db.get(researchId)
    if (run) {
      const stale = await ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).take(100)
      for (const idea of stale) {
        if (idea.season !== research.season || idea.gameweek !== research.gameweek) await ctx.db.patch(idea._id, { status: 'expired' })
      }
    }
    let stored = 0
    const slots = Math.max(0, 10 - currentReady.length)
    for (const [suggestionIndex, suggestion] of research.suggestions.entries()) {
      const titleKey = researchTitleKey(suggestion.title)
      if (!titleKey || usedKeys.has(titleKey) || stored >= slots) continue
      const duplicate = await ctx.db.query('articleResearchIdeas').withIndex('by_researchId_and_suggestionIndex', q => q.eq('researchId', researchId).eq('suggestionIndex', suggestionIndex)).unique()
      if (duplicate) continue
      await ctx.db.insert('articleResearchIdeas', { researchId, suggestionIndex, status: 'ready', titleKey, season: research.season, gameweek: research.gameweek, articleId: null, usedAt: null, createdAt: now })
      usedKeys.add(titleKey)
      stored++
    }
    await ctx.scheduler.runAfter(30_000, internal.articleResearchIdeas.ensurePool, {})
    return null
  },
})
