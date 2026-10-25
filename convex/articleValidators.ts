import { v } from 'convex/values'
import { generationSummary } from './articleJobValidators'

export const articleTemplate = v.union(v.literal('transfers'), v.literal('fixtures'), v.literal('budget'), v.literal('comparison'), v.literal('guide'), v.literal('evergreen'))
export const draftFields = {
  title: v.string(), slug: v.string(), excerpt: v.string(), template: articleTemplate,
  season: v.string(), gameweek: v.union(v.number(), v.null()), bodyJson: v.string(),
  sources: v.optional(v.array(v.object({ title: v.string(), url: v.string() }))),
}
export const articleFields = {
  ...draftFields, articleId: v.string(), status: v.union(v.literal('draft'), v.literal('published')), version: v.number(),
  createdAt: v.number(), updatedAt: v.number(), updatedBy: v.string(), lastRequestId: v.string(),
  publishedJson: v.optional(v.string()), publishedSlug: v.optional(v.string()), publishedAt: v.optional(v.number()),
  publishedVersion: v.optional(v.number()), publishedBy: v.optional(v.string()),
}
export const articleDocument = v.object({ ...articleFields, _id: v.id('articles'), _creationTime: v.number() })
export const articleSummary = v.object({
  articleId: v.string(), title: v.string(), slug: v.string(), excerpt: v.string(), template: articleTemplate,
  season: v.string(), gameweek: v.union(v.number(), v.null()), status: v.union(v.literal('draft'), v.literal('published')),
  version: v.number(), createdAt: v.number(), updatedAt: v.number(),
  publishedSlug: v.optional(v.string()), publishedAt: v.optional(v.number()), publishedVersion: v.optional(v.number()),
  generation: v.union(generationSummary, v.null()),
})
