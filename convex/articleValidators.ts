import { v } from 'convex/values'
import { generationSummary } from './articleJobValidators'

export const articleTemplate = v.union(v.literal('transfers'), v.literal('fixtures'), v.literal('budget'), v.literal('comparison'), v.literal('guide'))
export const draftFields = {
  title: v.string(), slug: v.string(), excerpt: v.string(), template: articleTemplate,
  season: v.string(), gameweek: v.union(v.number(), v.null()), bodyJson: v.string(),
}
export const articleFields = {
  ...draftFields, articleId: v.string(), status: v.literal('draft'), version: v.number(),
  createdAt: v.number(), updatedAt: v.number(), updatedBy: v.string(), lastRequestId: v.string(),
}
export const articleDocument = v.object({ ...articleFields, _id: v.id('articles'), _creationTime: v.number() })
export const articleSummary = v.object({
  articleId: v.string(), title: v.string(), slug: v.string(), excerpt: v.string(), template: articleTemplate,
  season: v.string(), gameweek: v.union(v.number(), v.null()), status: v.literal('draft'),
  version: v.number(), createdAt: v.number(), updatedAt: v.number(),
  generation: v.union(generationSummary, v.null()),
})
