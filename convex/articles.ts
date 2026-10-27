import { paginationOptsValidator, paginationResultValidator } from 'convex/server'
import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { articleDocument, articleSummary, draftFields } from './articleValidators'
import { articleText, validateArticleDraft } from '../shared/articles'
import { validateArticlePublishEvidence } from '../shared/article-publish'
import { researchTitleKey } from '../shared/article-research'

function authorize(secret: string) {
  if (!process.env.CONTENT_SERVICE_TOKEN || secret !== process.env.CONTENT_SERVICE_TOKEN) throw new ConvexError({ code: 'FORBIDDEN', message: 'Article access denied.' })
}

export const list = query({
  args: { secret: v.string(), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(articleSummary),
  handler: async (ctx, args) => {
    authorize(args.secret)
    const result = await ctx.db.query('articles').withIndex('by_updatedAt').order('desc').paginate(args.paginationOpts)
    const page = await Promise.all(result.page.map(async article => {
      const job = await ctx.db.query('articleJobs').withIndex('by_articleId_and_createdAt', q => q.eq('articleId', article.articleId)).order('desc').first()
      return {
        articleId: article.articleId, title: article.title, slug: article.slug, excerpt: article.excerpt,
        template: article.template, season: article.season, gameweek: article.gameweek, status: article.status,
        version: article.version, createdAt: article.createdAt, updatedAt: article.updatedAt,
        ...(article.publishedSlug ? { publishedSlug: article.publishedSlug } : {}),
        ...(article.publishedAt ? { publishedAt: article.publishedAt } : {}),
        ...(article.publishedVersion ? { publishedVersion: article.publishedVersion } : {}),
        generation: job ? { jobId: job._id, status: job.status, error: job.error, updatedAt: job.updatedAt } : null,
      }
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

export const listRevisions = query({
  args: { secret: v.string(), articleId: v.string() },
  returns: v.array(v.object({ version: v.number(), savedAt: v.number(), title: v.string() })),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (!/^[\da-f-]{36}$/i.test(args.articleId)) throw new ConvexError({ code: 'INVALID', message: 'The article request is invalid.' })
    const revisions = await ctx.db.query('articleRevisions')
      .withIndex('by_articleId_and_version', q => q.eq('articleId', args.articleId))
      .order('desc')
      .take(100)
    return revisions.map(({ version, savedAt, title }) => ({ version, savedAt, title }))
  },
})

export const getRevision = query({
  args: { secret: v.string(), articleId: v.string(), version: v.number() },
  returns: v.union(v.object({ ...draftFields, articleId: v.string(), version: v.number(), savedAt: v.number() }), v.null()),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (!/^[\da-f-]{36}$/i.test(args.articleId) || !Number.isSafeInteger(args.version) || args.version < 1) throw new ConvexError({ code: 'INVALID', message: 'The article revision request is invalid.' })
    const revision = await ctx.db.query('articleRevisions')
      .withIndex('by_articleId_and_version', q => q.eq('articleId', args.articleId).eq('version', args.version))
      .unique()
    if (!revision) return null
    const { articleId, version, savedAt, title, slug, excerpt, template, season, gameweek, bodyJson, sources } = revision
    return { articleId, version, savedAt, title, slug, excerpt, template, season, gameweek, bodyJson, sources }
  },
})

export const getPublishedBySlug = query({
  args: { slug: v.string() },
  returns: v.union(v.object({ publishedJson: v.string(), publishedAt: v.number() }), v.null()),
  handler: async (ctx, args) => {
    const article = await ctx.db.query('articles')
      .withIndex('by_publishedSlug_and_status', q => q.eq('publishedSlug', args.slug).eq('status', 'published'))
      .first()
    return article?.publishedJson && article.publishedAt ? { publishedJson: article.publishedJson, publishedAt: article.publishedAt } : null
  },
})

export const listPublished = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.object({ publishedJson: v.string(), publishedAt: v.number() })),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(100, Math.floor(args.limit ?? 50)))
    const articles = await ctx.db.query('articles')
      .withIndex('by_status_and_publishedAt', q => q.eq('status', 'published'))
      .order('desc')
      .take(limit)
    return articles.flatMap(article => article.publishedJson && article.publishedAt
      ? [{ publishedJson: article.publishedJson, publishedAt: article.publishedAt }]
      : [])
  },
})

export const internalPublishedLinkTargets = internalQuery({
  args: { articleId: v.string() },
  returns: v.array(v.object({ title: v.string(), slug: v.string() })),
  handler: async (ctx, args) => {
    const articles = await ctx.db.query('articles')
      .withIndex('by_status_and_publishedAt', q => q.eq('status', 'published'))
      .order('desc')
      .take(50)
    return articles.flatMap(article => {
      if (article.articleId === args.articleId || !article.publishedJson) return []
      try {
        const published = JSON.parse(article.publishedJson) as { title?: string; slug?: string }
        return published.title && published.slug ? [{ title: published.title, slug: published.slug }] : []
      } catch { return [] }
    })
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
    const record = { ...draft, articleId: args.articleId, status: existing?.status ?? 'draft' as const, version, createdAt: existing?.createdAt ?? now, updatedAt: now, updatedBy: args.savedBy, lastRequestId: args.requestId,
      ...(existing?.publishedJson ? { publishedJson: existing.publishedJson } : {}),
      ...(existing?.publishedSlug ? { publishedSlug: existing.publishedSlug } : {}),
      ...(existing?.publishedAt ? { publishedAt: existing.publishedAt } : {}),
      ...(existing?.publishedVersion ? { publishedVersion: existing.publishedVersion } : {}),
      ...(existing?.publishedBy ? { publishedBy: existing.publishedBy } : {}),
    }
    const id = existing?._id ?? await ctx.db.insert('articles', record)
    if (existing) await ctx.db.patch(id, record)
    await ctx.db.insert('articleRevisions', { ...draft, articleId: args.articleId, version, savedAt: now, savedBy: args.savedBy })
    const matchingIdeas = await ctx.db.query('articleResearchIdeas').withIndex('by_titleKey_and_status', q => q.eq('titleKey', researchTitleKey(validated.title)).eq('status', 'ready')).take(10)
    for (const idea of matchingIdeas) await ctx.db.patch(idea._id, { status: 'used', articleId: args.articleId, usedAt: now })
    if (matchingIdeas.length || !existing) await ctx.scheduler.runAfter(0, internal.articleResearchIdeas.refreshAndEnsure, { retry: false })
    return (await ctx.db.get(id))!
  },
})

export const publish = mutation({
  args: { secret: v.string(), articleId: v.string(), expectedVersion: v.number(), publishedBy: v.string() },
  returns: articleDocument,
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (!/^[\da-f-]{36}$/i.test(args.articleId) || !Number.isSafeInteger(args.expectedVersion) || args.expectedVersion < 1 || !args.publishedBy || args.publishedBy.length > 80) throw new ConvexError({ code: 'INVALID', message: 'The publish request is invalid.' })
    const article = await ctx.db.query('articles').withIndex('by_articleId', q => q.eq('articleId', args.articleId)).unique()
    if (!article) throw new ConvexError({ code: 'NOT_FOUND', message: 'Article not found.' })
    if (article.version !== args.expectedVersion) throw new ConvexError({ code: 'CONFLICT', message: 'This draft changed. Reload it before publishing.' })
    if (article.status === 'published' && article.publishedVersion === article.version && article.publishedSlug === article.slug && article.publishedJson) return article
    let draft
    try {
      draft = validateArticleDraft({ ...article, body: JSON.parse(article.bodyJson) })
      if (draft.title.trim().length < 8) throw new Error('Add an article title with at least 8 characters.')
      if (draft.excerpt.trim().length < 20) throw new Error('Add a short summary before publishing.')
      if (!draft.slug) throw new Error('Add a URL slug before publishing.')
      if (draft.sources.some(source => (source.title.trim() || source.url.trim()) && (!source.title.trim() || !source.url.trim()))) throw new Error('Complete or remove each source entry before publishing.')
      const requiresFplEvidence = !['guide', 'evergreen'].includes(draft.template)
      if (!draft.season && requiresFplEvidence) throw new Error('Add the season for this article.')
      const paragraphText = (draft.body.content || []).filter(node => node.type === 'paragraph').map(articleText).join(' ').trim()
      if (paragraphText.length < 40) throw new Error('Add at least 40 characters of article text before publishing.')
    } catch (error) {
      throw new ConvexError({ code: 'INVALID', message: error instanceof Error ? error.message : 'The article is invalid.' })
    }
    const collision = await ctx.db.query('articles').withIndex('by_publishedSlug_and_status', q => q.eq('publishedSlug', draft.slug).eq('status', 'published')).first()
    if (collision && collision.articleId !== article.articleId) throw new ConvexError({ code: 'INVALID', message: 'Another published article already uses this URL slug.' })
    const now = Date.now()
    const sources = draft.sources.filter(source => source.title.trim() && source.url.trim())
    let capturedAt: string | undefined
    try {
      capturedAt = validateArticlePublishEvidence(draft, article.publishedJson, now)
    } catch (error) {
      throw new ConvexError({ code: 'INVALID', message: error instanceof Error ? error.message : 'The article evidence is invalid.' })
    }
    const publishedJson = JSON.stringify({
      title: draft.title.trim(), slug: draft.slug, excerpt: draft.excerpt.trim(), template: draft.template,
      season: draft.season, gameweek: draft.gameweek, body: draft.body, sources, author: args.publishedBy,
      ...(capturedAt ? { dataCapturedAt: capturedAt } : {}),
      publishedAt: now, updatedAt: now,
    })
    await ctx.db.patch(article._id, { status: 'published', publishedJson, publishedSlug: draft.slug, publishedAt: now, publishedVersion: article.version, publishedBy: args.publishedBy, updatedAt: now })
    return (await ctx.db.get(article._id))!
  },
})

export const remove = mutation({
  args: { secret: v.string(), articleId: v.string(), expectedVersion: v.number() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (!/^[\da-f-]{36}$/i.test(args.articleId) || !Number.isSafeInteger(args.expectedVersion) || args.expectedVersion < 1) throw new ConvexError({ code: 'INVALID', message: 'The delete request is invalid.' })
    const article = await ctx.db.query('articles').withIndex('by_articleId', q => q.eq('articleId', args.articleId)).unique()
    if (!article) return false
    if (article.version !== args.expectedVersion) throw new ConvexError({ code: 'CONFLICT', message: 'This article changed. Reload the list before deleting it.' })
    await ctx.db.delete(article._id)
    await ctx.scheduler.runAfter(0, internal.articles.cleanupRemoved, { articleId: args.articleId })
    return true
  },
})

export const cleanupRemoved = internalMutation({
  args: { articleId: v.string() },
  returns: v.null(),
  handler: async (ctx, { articleId }) => {
    const [revisions, jobs] = await Promise.all([
      ctx.db.query('articleRevisions').withIndex('by_articleId_and_version', q => q.eq('articleId', articleId)).take(250),
      ctx.db.query('articleJobs').withIndex('by_articleId_and_createdAt', q => q.eq('articleId', articleId)).take(250),
    ])
    await Promise.all([
      ...revisions.map(revision => ctx.db.delete(revision._id)),
      ...jobs.map(job => ctx.db.delete(job._id)),
    ])
    if (revisions.length === 250 || jobs.length === 250) {
      await ctx.scheduler.runAfter(0, internal.articles.cleanupRemoved, { articleId })
    }
    return null
  },
})
