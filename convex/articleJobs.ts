import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalMutation, internalQuery, mutation, query } from './_generated/server'
import { generationDocument } from './articleJobValidators'
import { buildArticleEvidence, generatedArticle, generatedArticleSchema } from '../shared/article-generation'
import { defaultPromptRecords, isArticleTemplate } from '../shared/article-prompts'
import type { ArticleTemplate } from '../shared/articles'

function authorize(secret: string) {
  if (!process.env.CONTENT_SERVICE_TOKEN || secret !== process.env.CONTENT_SERVICE_TOKEN) throw new ConvexError({ code: 'FORBIDDEN', message: 'Article access denied.' })
}

export const enqueue = mutation({
  args: { secret: v.string(), articleId: v.string(), requestId: v.string(), requestedBy: v.string(), promptId: v.optional(v.id('articlePrompts')) },
  returns: v.id('articleJobs'),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (args.requestId.length !== 36 || !args.requestedBy || args.requestedBy.length > 80) throw new ConvexError({ code: 'INVALID', message: 'The generation request is invalid.' })
    const repeated = await ctx.db.query('articleJobs').withIndex('by_requestId', q => q.eq('requestId', args.requestId)).unique()
    if (repeated) return repeated._id
    const article = await ctx.db.query('articles').withIndex('by_articleId', q => q.eq('articleId', args.articleId)).unique()
    if (!article || article.title.trim().length < 8) throw new ConvexError({ code: 'INVALID', message: 'Write a clear article topic in the title before generating.' })
    const latest = await ctx.db.query('articleJobs').withIndex('by_articleId_and_createdAt', q => q.eq('articleId', args.articleId)).order('desc').first()
    if (latest && ['queued', 'writing'].includes(latest.status)) return latest._id
    const recent = await ctx.db.query('articleJobs').withIndex('by_requestedBy_and_createdAt', q => q.eq('requestedBy', args.requestedBy).gte('createdAt', Date.now() - 60_000)).take(6)
    if (recent.length >= 6) throw new ConvexError({ code: 'INVALID', message: 'Six articles were started in the last minute. Wait a moment before starting another.' })
    if (!isArticleTemplate(article.template)) throw new ConvexError({ code: 'INVALID', message: 'Choose a valid article format.' })
    const promptRows = await ctx.db.query('articlePrompts').withIndex('by_scope_and_template', q => q.eq('scope', 'article').eq('template', article.template)).take(50)
    const selectedPrompt = args.promptId ? promptRows.find(prompt => prompt._id === args.promptId) : promptRows.find(prompt => prompt.isDefault)
    if (args.promptId && !selectedPrompt) throw new ConvexError({ code: 'INVALID', message: 'That prompt is not available for this article format.' })
    const fallbackPrompt = defaultPromptRecords().find(prompt => prompt.scope === 'article' && prompt.template === article.template)!
    const prompt = selectedPrompt || fallbackPrompt
    const now = Date.now()
    const jobId = await ctx.db.insert('articleJobs', { articleId: args.articleId, requestId: args.requestId, requestedBy: args.requestedBy, topic: article.title.trim(), template: article.template, season: article.season, gameweek: article.gameweek, promptId: selectedPrompt?._id, promptName: prompt.name, promptInstructions: prompt.instructions, status: 'queued', resultJson: null, error: null, model: null, createdAt: now, updatedAt: now })
    await ctx.scheduler.runAfter(0, internal.articleJobs.writeArticle, { jobId })
    return jobId
  },
})

export const latest = query({
  args: { secret: v.string(), articleId: v.string() },
  returns: v.union(generationDocument, v.null()),
  handler: async (ctx, args) => {
    authorize(args.secret)
    return ctx.db.query('articleJobs').withIndex('by_articleId_and_createdAt', q => q.eq('articleId', args.articleId)).order('desc').first()
  },
})

export const begin = internalMutation({
  args: { jobId: v.id('articleJobs') }, returns: v.union(generationDocument, v.null()),
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId)
    if (!job || job.status !== 'queued') return null
    await ctx.db.patch(jobId, { status: 'writing', updatedAt: Date.now() })
    return job
  },
})

export const finish = internalMutation({
  args: { jobId: v.id('articleJobs'), resultJson: v.union(v.string(), v.null()), error: v.union(v.string(), v.null()), model: v.union(v.string(), v.null()) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId)
    if (!job || job.status !== 'writing') return null
    await ctx.db.patch(args.jobId, { status: args.error ? 'failed' : 'ready', resultJson: args.resultJson, error: args.error, model: args.model, updatedAt: Date.now() })
    return null
  },
})

export const writeArticle = internalAction({
  args: { jobId: v.id('articleJobs') }, returns: v.null(),
  handler: async (ctx, { jobId }) => {
    const job = await ctx.runMutation(internal.articleJobs.begin, { jobId })
    if (!job) return null
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini'
    let resultJson: string | null = null
    let error: string | null = null
    try {
      if (!process.env.OPENROUTER_API_KEY) throw new Error('Add OPENROUTER_API_KEY to the Convex environment before generating articles.')
      const responses = await Promise.all(['bootstrap-static', 'fixtures'].map(path => fetch(`https://fantasy.premierleague.com/api/${path}/`, { signal: AbortSignal.timeout(15_000) })))
      if (responses.some(response => !response.ok)) throw new Error('Current FPL data could not be loaded. The existing draft was preserved.')
      const [bootstrap, fixtures] = await Promise.all(responses.map(response => response.json()))
      const evidence = buildArticleEvidence(bootstrap, fixtures, job.topic, job.template as ArticleTemplate, job.season, job.gameweek)
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(120_000),
        headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 6000, temperature: 0.7, provider: { require_parameters: true }, messages: [{ role: 'system', content: job.promptInstructions || defaultPromptRecords().find(prompt => prompt.scope === 'article' && prompt.template === job.template)?.instructions || '' }, { role: 'user', content: JSON.stringify({ topic: job.topic, template: job.template, evidence }) }], response_format: { type: 'json_schema', json_schema: { name: 'fpl_article', strict: true, schema: generatedArticleSchema } } }),
      })
      if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'OpenRouter denied access. Check the configured API key.' : response.status === 402 ? 'OpenRouter has no available credit for this request.' : response.status === 429 ? 'OpenRouter is busy. Try generating again later.' : 'OpenRouter could not generate the article. The existing draft was preserved.')
      const completion = await response.json()
      const choice = completion.choices?.[0]
      if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string') throw new Error('OpenRouter returned an incomplete article. The existing draft was preserved.')
      resultJson = JSON.stringify(generatedArticle(JSON.parse(choice.message.content), evidence, job.template as ArticleTemplate))
    } catch (cause) {
      // Provider bodies and credentials never enter saved job errors.
      error = cause instanceof Error && !/fetch|JSON|Unexpected|abort|timeout/i.test(cause.message) ? cause.message.slice(0, 500) : 'Generation could not complete. The existing draft was preserved. Please try again.'
    }
    await ctx.runMutation(internal.articleJobs.finish, { jobId, resultJson, error, model })
    return null
  },
})
