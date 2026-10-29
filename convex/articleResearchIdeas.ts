import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalMutation, internalQuery, mutation, query } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { researchTitleKey, validateResearch } from '../shared/article-research'

function authorize(secret: string) {
  if (!process.env.CONTENT_SERVICE_TOKEN || secret !== process.env.CONTENT_SERVICE_TOKEN) throw new ConvexError({ code: 'FORBIDDEN', message: 'Article access denied.' })
}

async function isEvergreenIdea(ctx: any, idea: any) {
  const run = await ctx.db.get(idea.researchId)
  if (!run?.resultJson) return false
  try {
    const result = JSON.parse(run.resultJson)
    return validateResearch(result, result.sources, result).suggestions[idea.suggestionIndex]?.template === 'evergreen'
  } catch { return false }
}

function articleHistory(article: Doc<'articles'>) {
  const draft = { title: article.title, excerpt: article.excerpt, template: article.template, season: article.season, gameweek: article.gameweek, status: article.status === 'published' ? 'draft' : article.status }
  if (!article.publishedJson) return [draft]
  try {
    const published = JSON.parse(article.publishedJson)
    if (typeof published.title !== 'string' || typeof published.excerpt !== 'string' || typeof published.template !== 'string' || typeof published.season !== 'string' || !(published.gameweek === null || typeof published.gameweek === 'number')) return [draft]
    const live = { title: published.title, excerpt: published.excerpt, template: published.template, season: published.season, gameweek: published.gameweek as number | null, status: 'published' }
    return article.publishedVersion === article.version ? [live] : [live, draft]
  } catch { return [draft] }
}

const ideaContext = v.object({ title: v.string(), template: v.string(), angle: v.string(), intent: v.string(), status: v.string(), season: v.string(), gameweek: v.number() })

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
    const refillStatus: 'idle' | 'working' | 'failed' = latest && (latest.status === 'queued' || latest.status === 'researching') ? 'working' : latest?.status === 'failed' && (ready.length < 10 || latest.requestedBy === 'manual-refresh') ? 'failed' : 'idle'
    return { readyCount: ideas.length, refillStatus, error: refillStatus === 'failed' ? latest?.error || 'Research could not complete.' : null, ideas }
  },
})

export const requestFill = mutation({
  args: { secret: v.string(), retry: v.optional(v.boolean()), refresh: v.optional(v.boolean()) }, returns: v.null(),
  handler: async (ctx, { secret, retry, refresh }) => {
    authorize(secret)
    if (refresh) {
      const [queued, researching, latest] = await Promise.all([
        ctx.db.query('articleResearch').withIndex('by_status_and_createdAt', q => q.eq('status', 'queued')).order('desc').first(),
        ctx.db.query('articleResearch').withIndex('by_status_and_createdAt', q => q.eq('status', 'researching')).order('desc').first(),
        ctx.db.query('articleResearch').withIndex('by_createdAt').order('desc').first(),
      ])
      if (queued || researching) return null
      const now = Date.now()
      if (latest && now - latest.createdAt < 30_000 && latest.status !== 'failed') throw new ConvexError({ code: 'INVALID', message: 'Wait a moment before refreshing ideas again.' })
      const researchId = await ctx.db.insert('articleResearch', { focus: '', requestId: crypto.randomUUID(), requestedBy: 'manual-refresh', status: 'queued', resultJson: null, error: null, createdAt: now, updatedAt: now })
      await ctx.scheduler.runAfter(0, internal.articleResearch.research, { researchId })
      return null
    }
    await ctx.scheduler.runAfter(0, internal.articleResearchIdeas.refreshAndEnsure, { retry: retry === true })
    return null
  },
})

export const context = internalQuery({
  args: {}, returns: v.object({ titles: v.array(v.object({ title: v.string(), excerpt: v.string(), template: v.string(), season: v.string(), gameweek: v.union(v.number(), v.null()), status: v.string() })), readyIdeas: v.array(ideaContext), previousIdeas: v.array(ideaContext) }),
  handler: async ctx => {
    const [articles, ready, used, expired] = await Promise.all([
      ctx.db.query('articles').withIndex('by_updatedAt').order('desc').take(100),
      ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).order('desc').take(10),
      ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'used')).order('desc').take(100),
      ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'expired')).order('desc').take(100),
    ])
    const previous = [...used, ...expired].sort((a, b) => b.createdAt - a.createdAt || b._creationTime - a._creationTime).slice(0, 100)
    const ideas = [...ready, ...previous]
    const runs = new Map<string, ReturnType<typeof validateResearch> | null>()
    const readyIdeas: { title: string; template: string; angle: string; intent: string; status: string; season: string; gameweek: number }[] = []
    const previousIdeas: typeof readyIdeas = []
    for (const idea of ideas) {
      if (!runs.has(idea.researchId)) {
        const run = await ctx.db.get(idea.researchId)
        try {
          const parsed = JSON.parse(run?.resultJson || 'null')
          runs.set(idea.researchId, parsed ? validateResearch(parsed, parsed.sources, parsed) : null)
        } catch { runs.set(idea.researchId, null) }
      }
      const suggestion = runs.get(idea.researchId)?.suggestions[idea.suggestionIndex]
      if (!suggestion) continue
      const item = { title: suggestion.title, template: suggestion.template, angle: suggestion.angle, intent: suggestion.intent, status: idea.status, season: idea.season, gameweek: idea.gameweek }
      if (idea.status === 'ready') readyIdeas.push(item)
      else previousIdeas.push(item)
    }
    return { titles: articles.flatMap(articleHistory), readyIdeas, previousIdeas }
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
      if ((idea.season !== season || idea.gameweek !== gameweek) && !(await isEvergreenIdea(ctx, idea))) await ctx.db.patch(idea._id, { status: 'expired' })
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
    const run = await ctx.db.get(researchId)
    if (!run || run.status !== 'researching') return null
    const [articles, ready] = await Promise.all([
      ctx.db.query('articles').withIndex('by_updatedAt').order('desc').take(100),
      ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).order('desc').take(10),
    ])
    const evergreenFlags = await Promise.all(ready.map(idea => isEvergreenIdea(ctx, idea)))
    const currentReady = ready.filter((idea, index) => evergreenFlags[index] || idea.season === research.season && idea.gameweek === research.gameweek)
    const usedKeys = new Set([...articles.flatMap(articleHistory).map(article => researchTitleKey(article.title)), ...currentReady.map(idea => idea.titleKey)])
    const now = Date.now()
    const manualRefresh = run.requestedBy === 'manual-refresh'
    const slots = manualRefresh ? 10 : Math.max(0, 10 - currentReady.length)
    const orderedSuggestions = research.suggestions.map((suggestion, suggestionIndex) => ({ suggestion, suggestionIndex }))
      .sort((a, b) => Number(b.suggestion.template === 'evergreen') - Number(a.suggestion.template === 'evergreen'))
    const selected: { suggestionIndex: number; titleKey: string }[] = []
    for (const { suggestion, suggestionIndex } of orderedSuggestions) {
      const titleKey = researchTitleKey(suggestion.title)
      if (!titleKey || usedKeys.has(titleKey) || selected.length >= slots) continue
      const duplicate = await ctx.db.query('articleResearchIdeas').withIndex('by_researchId_and_suggestionIndex', q => q.eq('researchId', researchId).eq('suggestionIndex', suggestionIndex)).unique()
      if (duplicate) continue
      const previous = await Promise.all((['ready', 'used', 'expired'] as const).map(status => ctx.db.query('articleResearchIdeas').withIndex('by_titleKey_and_status', q => q.eq('titleKey', titleKey).eq('status', status)).first()))
      if (previous.some(Boolean)) continue
      selected.push({ suggestionIndex, titleKey })
      usedKeys.add(titleKey)
    }
    if (manualRefresh && !selected.length) throw new Error('Research did not find any new ideas. Your current ideas are still available.')
    const stale = await ctx.db.query('articleResearchIdeas').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).take(100)
    for (const idea of stale) {
      if ((idea.season !== research.season || idea.gameweek !== research.gameweek) && !(await isEvergreenIdea(ctx, idea))) await ctx.db.patch(idea._id, { status: 'expired' })
    }
    const replaceCount = Math.max(0, currentReady.length + selected.length - 10)
    if (replaceCount) for (const idea of currentReady.slice(-replaceCount)) await ctx.db.patch(idea._id, { status: 'expired' })
    for (const { suggestionIndex, titleKey } of selected) {
      await ctx.db.insert('articleResearchIdeas', { researchId, suggestionIndex, status: 'ready', titleKey, season: research.season, gameweek: research.gameweek, articleId: null, usedAt: null, createdAt: now })
    }
    await ctx.db.patch(researchId, { status: 'ready', resultJson, error: null, updatedAt: now })
    await ctx.scheduler.runAfter(30_000, internal.articleResearchIdeas.ensurePool, {})
    return null
  },
})
