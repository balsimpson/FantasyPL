import { paginationOptsValidator, paginationResultValidator } from 'convex/server'
import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { articleDocument, articleSummary, draftFields } from './articleValidators'
import { validateArticleDraft } from '../shared/articles'

function authorize(secret: string) {
  if (!process.env.CONTENT_SERVICE_TOKEN || secret !== process.env.CONTENT_SERVICE_TOKEN) throw new ConvexError({ code: 'FORBIDDEN', message: 'Article access denied.' })
}

export const list = query({
  args: { secret: v.string(), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(articleSummary),
  handler: async (ctx, args) => {
    authorize(args.secret)
    const result = await ctx.db.query('articles').withIndex('by_updatedAt').order('desc').paginate(args.paginationOpts)
    const page = await Promise.all(result.page.map(async ({ bodyJson, _id, _creationTime, updatedBy, lastRequestId, ...summary }) => {
      const job = await ctx.db.query('articleJobs').withIndex('by_articleId_and_createdAt', q => q.eq('articleId', summary.articleId)).order('desc').first()
      return { ...summary, generation: job ? { jobId: job._id, status: job.status, error: job.error, updatedAt: job.updatedAt } : null }
    }))
    return { ...result, page }
  },
})

export const get = query({
  args: { secret: v.string(), articleId: v.string() },
  returns: v.union(articleDocument, v.null()),
  handler: async (ctx, args) => {
    authorize(args.secret)
    return ctx.db.query('articles').withIndex('by_articleId', q => q.eq('articleId', args.articleId)).unique()
  },
})

export const save = mutation({
  args: { secret: v.string(), articleId: v.string(), requestId: v.string(), expectedVersion: v.number(), savedBy: v.string(), draft: v.object(draftFields) },
  returns: articleDocument,
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (!/^[\da-f-]{36}$/i.test(args.articleId) || !/^[\da-f-]{36}$/i.test(args.requestId) || !Number.isSafeInteger(args.expectedVersion) || args.expectedVersion < 0 || !args.savedBy || args.savedBy.length > 80) throw new ConvexError({ code: 'INVALID', message: 'The save request is invalid.' })
    let validated
    try {
      if (args.draft.bodyJson.length > 200_000) throw new Error('This article is too long to save.')
      validated = validateArticleDraft({ ...args.draft, body: JSON.parse(args.draft.bodyJson) })
    } catch (error) { throw new ConvexError({ code: 'INVALID', message: error instanceof Error ? error.message : 'The article is invalid.' }) }
    const existing = await ctx.db.query('articles').withIndex('by_articleId', q => q.eq('articleId', args.articleId)).unique()
    if (existing?.lastRequestId === args.requestId) return existing
    if ((existing?.version ?? 0) !== args.expectedVersion) throw new ConvexError({ code: 'CONFLICT', message: 'This article was saved in another tab. Your changes are still here. Open the saved version in a new tab before replacing your text.' })
    const { body, ...metadata } = validated
    const draft = { ...metadata, bodyJson: JSON.stringify(body) }
    const now = Date.now()
    const version = (existing?.version ?? 0) + 1
    const record = { ...draft, articleId: args.articleId, status: 'draft' as const, version, createdAt: existing?.createdAt ?? now, updatedAt: now, updatedBy: args.savedBy, lastRequestId: args.requestId }
    const id = existing?._id ?? await ctx.db.insert('articles', record)
    if (existing) await ctx.db.patch(id, record)
    await ctx.db.insert('articleRevisions', { ...draft, articleId: args.articleId, version, savedAt: now, savedBy: args.savedBy })
    return (await ctx.db.get(id))!
  },
})
