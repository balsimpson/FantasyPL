import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalMutation, mutation, query } from './_generated/server'
import { articleCompletion, generationError } from './articleProvider'
import { buildArticleEvidence } from '../shared/article-generation'
import { researchSchema, researchSources, validateResearch } from '../shared/article-research'
import { emptyArticle } from '../shared/articles'
import { researchFields } from './articleResearchValidators'
import { defaultPromptRecords } from '../shared/article-prompts'

function authorize(secret: string) {
  if (!process.env.CONTENT_SERVICE_TOKEN || secret !== process.env.CONTENT_SERVICE_TOKEN) throw new ConvexError({ code: 'FORBIDDEN', message: 'Article access denied.' })
}
const document = v.object({ ...researchFields, _id: v.id('articleResearch'), _creationTime: v.number() })

export const list = query({
  args: { secret: v.string() }, returns: v.array(document),
  handler: async (ctx, { secret }) => { authorize(secret); return ctx.db.query('articleResearch').withIndex('by_createdAt').order('desc').take(10) },
})

export const latestPromptLearnings = query({
  args: { secret: v.string() },
  returns: v.object({ capturedAt: v.union(v.string(), v.null()), learnings: v.array(v.object({ title: v.string(), instruction: v.string(), scope: v.union(v.literal('research-search'), v.literal('research-analysis'), v.literal('article')), template: v.union(v.string(), v.null()), sources: v.array(v.object({ title: v.string(), url: v.string() })) })) }),
  handler: async (ctx, { secret }) => {
    authorize(secret)
    const runs = await ctx.db.query('articleResearch').withIndex('by_status_and_createdAt', q => q.eq('status', 'ready')).order('desc').take(10)
    for (const run of runs) {
      if (!run.resultJson) continue
      try {
        const parsed = JSON.parse(run.resultJson)
        const result = validateResearch(parsed, parsed.sources, parsed)
        const learnings = (result.promptLearnings || []).map(item => ({
          title: item.title,
          instruction: item.instruction,
          scope: item.scope,
          template: item.template,
          sources: item.sourceIds.flatMap(sourceId => {
            const source = result.sources[sourceId]
            return source ? [{ title: source.title, url: source.url }] : []
          }),
        }))
        if (learnings.length) return { capturedAt: result.capturedAt, learnings }
      } catch { /* Ignore old or invalid research output. */ }
    }
    return { capturedAt: null, learnings: [] }
  },
})
export const start = mutation({
  args: { secret: v.string(), requestId: v.string(), focus: v.string(), requestedBy: v.string() }, returns: v.id('articleResearch'),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (args.focus.length > 300 || args.requestId.length !== 36 || !args.requestedBy || args.requestedBy.length > 80) throw new ConvexError({ code: 'INVALID', message: 'The research request is invalid.' })
    const repeated = await ctx.db.query('articleResearch').withIndex('by_requestId', q => q.eq('requestId', args.requestId)).unique()
    if (repeated) return repeated._id
    const last = await ctx.db.query('articleResearch').withIndex('by_createdAt').order('desc').first()
    if (last && ['queued', 'researching'].includes(last.status)) return last._id
    if (last && Date.now() - last.createdAt < 30_000) throw new ConvexError({ code: 'INVALID', message: 'Wait a moment before starting another research run.' })
    const now = Date.now()
    const researchId = await ctx.db.insert('articleResearch', { focus: args.focus.trim(), requestId: args.requestId, requestedBy: args.requestedBy, status: 'queued', resultJson: null, error: null, createdAt: now, updatedAt: now })
    await ctx.scheduler.runAfter(0, internal.articleResearch.research, { researchId })
    return researchId
  },
})
export const begin = internalMutation({
  args: { researchId: v.id('articleResearch') }, returns: v.union(document, v.null()),
  handler: async (ctx, { researchId }) => {
    const run = await ctx.db.get(researchId)
    if (!run || run.status !== 'queued') return null
    await ctx.db.patch(researchId, { status: 'researching', updatedAt: Date.now() })
    return run
  },
})
export const finish = internalMutation({
  args: { researchId: v.id('articleResearch'), resultJson: v.union(v.string(), v.null()), error: v.union(v.string(), v.null()) }, returns: v.null(),
  handler: async (ctx, { researchId, resultJson, error }) => {
    const run = await ctx.db.get(researchId)
    if (run?.status === 'researching') await ctx.db.patch(researchId, { status: error ? 'failed' : 'ready', resultJson, error, updatedAt: Date.now() })
    return null
  },
})

export const capturePrompts = internalMutation({
  args: { researchId: v.id('articleResearch'), searchPrompt: v.string(), analysisPrompt: v.string() }, returns: v.null(),
  handler: async (ctx, { researchId, searchPrompt, analysisPrompt }) => {
    const run = await ctx.db.get(researchId)
    if (run?.status === 'researching') await ctx.db.patch(researchId, { searchPrompt, analysisPrompt, updatedAt: Date.now() })
    return null
  },
})
export const research = internalAction({
  args: { researchId: v.id('articleResearch') }, returns: v.null(),
  handler: async (ctx, { researchId }) => {
    const run = await ctx.runMutation(internal.articleResearch.begin, { researchId })
    if (!run) return null
    let resultJson: string | null = null
    let error: string | null = null
    try {
      const prompts = await ctx.runQuery(internal.articlePrompts.researchDefaults, {})
      const searchPrompt = `${prompts.search}\n\nAlso find source articles for both the upcoming gameweek and evergreen FPL guides about stable concepts or recurring manager tasks. Return varied evidence for both kinds of topics.`
      const analysisPrompt = `${prompts.analysis}\n\nRequired mix: return 10 to 12 ideas, including 3 to 5 Evergreen guide ideas and at least 5 current gameweek ideas. Evergreen guides must not depend on current prices, live stats, or a specific gameweek. Mark their visual approach as none. Do not turn changing FPL rules or unverified facts into evergreen claims. Also return up to 5 promptLearnings. Each learning must be a short reusable instruction grounded in cited source patterns, name a target scope (research-search, research-analysis or article), include an article template when its scope is article, and cite sourceIds. Do not make performance claims without evidence. Return an empty array when there is no useful supported learning.`
      await ctx.runMutation(internal.articleResearch.capturePrompts, { researchId, searchPrompt, analysisPrompt })
      if (!process.env.OPENROUTER_API_KEY) throw new Error('Add OPENROUTER_API_KEY to the Convex environment before starting research.')
      const responses = await Promise.all(['bootstrap-static', 'fixtures'].map(path => fetch(`https://fantasy.premierleague.com/api/${path}/`, { signal: AbortSignal.timeout(15_000) })))
      if (responses.some(r => !r.ok)) throw new Error('Current FPL gameweek data could not be loaded.')
      const [bootstrap, fixtures] = await Promise.all(responses.map(r => r.json()))
      const context = buildArticleEvidence(bootstrap, fixtures, 'Upcoming gameweek transfer decisions', 'transfers')
      const editorialContext = await ctx.runQuery(internal.articleResearchIdeas.context, {})
      const search = await articleCompletion([{ role: 'system', content: searchPrompt }, { role: 'user', content: JSON.stringify({ date: context.capturedAt, gameweek: context.gameweek, season: context.season, focus: run.focus || 'Current transfer, budget and fixture decisions plus evergreen FPL guides for casual managers.' }) }], { search: true })
      const sources = researchSources(search.message.annotations)
      const analysis = await articleCompletion([{ role: 'system', content: analysisPrompt }, { role: 'user', content: JSON.stringify({ focus: run.focus || 'Find a balanced set of current decisions and durable manager questions.', gameweek: context.gameweek, season: context.season, sources, availablePlayerEvidence: context.players, existingArticles: editorialContext.titles, readyIdeas: editorialContext.readyIdeas }) }], { schema: researchSchema })
      resultJson = JSON.stringify(validateResearch(JSON.parse(analysis.message.content), sources, { gameweek: context.gameweek, season: context.season, capturedAt: context.capturedAt }, true))
    } catch (cause) { error = generationError(cause) }
    await ctx.runMutation(internal.articleResearch.finish, { researchId, resultJson, error })
    if (resultJson) await ctx.runMutation(internal.articleResearchIdeas.storeReadyIdeas, { researchId, resultJson })
    else await ctx.scheduler.runAfter(30_000, internal.articleResearchIdeas.ensurePool, {})
    return null
  },
})

export const writeSuggestion = mutation({
  args: { secret: v.string(), researchId: v.id('articleResearch'), suggestionIndex: v.number(), articleId: v.string(), requestedBy: v.string() }, returns: v.string(),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (!Number.isSafeInteger(args.suggestionIndex) || args.suggestionIndex < 0 || !/^[\da-f-]{36}$/i.test(args.articleId) || !args.requestedBy || args.requestedBy.length > 80) throw new ConvexError({ code: 'INVALID', message: 'The selected suggestion is invalid.' })
    const existing = await ctx.db.query('articleResearchChoices').withIndex('by_researchId_and_suggestionIndex', q => q.eq('researchId', args.researchId).eq('suggestionIndex', args.suggestionIndex)).unique()
    if (existing) return existing.articleId
    const run = await ctx.db.get(args.researchId)
    if (!run || run.status !== 'ready' || !run.resultJson) throw new ConvexError({ code: 'INVALID', message: 'Research is not ready yet.' })
    const result = JSON.parse(run.resultJson)
    const research = validateResearch(result, result.sources, result)
    const suggestion = research.suggestions[args.suggestionIndex]
    if (!suggestion) throw new ConvexError({ code: 'INVALID', message: 'That suggestion could not be found.' })
    const idea = await ctx.db.query('articleResearchIdeas').withIndex('by_researchId_and_suggestionIndex', q => q.eq('researchId', args.researchId).eq('suggestionIndex', args.suggestionIndex)).unique()
    if (!idea || idea.status !== 'ready') throw new ConvexError({ code: 'INVALID', message: 'This idea is no longer available.' })
    const now = Date.now()
    const evergreen = suggestion.template === 'evergreen'
    const { body, ...metadata } = { ...emptyArticle(), title: suggestion.title, template: suggestion.template, season: evergreen ? '' : research.season, gameweek: evergreen ? null : research.gameweek }
    const draft = { ...metadata, bodyJson: JSON.stringify(body) }
    await ctx.db.insert('articles', { ...draft, articleId: args.articleId, status: 'draft', version: 1, createdAt: now, updatedAt: now, updatedBy: args.requestedBy, lastRequestId: args.articleId })
    await ctx.db.insert('articleRevisions', { ...draft, articleId: args.articleId, version: 1, savedAt: now, savedBy: args.requestedBy })
    const promptRows = await ctx.db.query('articlePrompts').withIndex('by_scope_and_template', q => q.eq('scope', 'article').eq('template', suggestion.template)).take(50)
    const prompt = promptRows.find(item => item.isDefault) || defaultPromptRecords().find(item => item.scope === 'article' && item.template === suggestion.template)!
    const jobId = await ctx.db.insert('articleJobs', { articleId: args.articleId, requestId: args.articleId, requestedBy: args.requestedBy, status: 'queued', topic: `${suggestion.title}\nEditorial angle: ${suggestion.angle}\nReader question: ${suggestion.intent}\nVisual approach: ${suggestion.visuals}`, template: suggestion.template, season: evergreen ? '' : research.season, gameweek: evergreen ? null : research.gameweek, promptId: promptRows.find(item => item.isDefault)?._id, promptName: prompt.name, promptInstructions: prompt.instructions, resultJson: null, error: null, model: null, createdAt: now, updatedAt: now })
    await ctx.db.insert('articleResearchChoices', { researchId: args.researchId, suggestionIndex: args.suggestionIndex, articleId: args.articleId })
    await ctx.db.patch(idea._id, { status: 'used', articleId: args.articleId, usedAt: now })
    await ctx.scheduler.runAfter(0, internal.articleJobs.writeArticle, { jobId })
    await ctx.scheduler.runAfter(0, internal.articleResearchIdeas.refreshAndEnsure, { retry: false })
    return args.articleId
  },
})
