import { v } from 'convex/values'
export const researchFields = {
  focus: v.string(), requestId: v.string(), requestedBy: v.string(),
  status: v.union(v.literal('queued'), v.literal('researching'), v.literal('ready'), v.literal('failed')),
  resultJson: v.union(v.string(), v.null()), error: v.union(v.string(), v.null()), createdAt: v.number(), updatedAt: v.number(),
}

export const researchIdeaFields = {
  researchId: v.id('articleResearch'), suggestionIndex: v.number(),
  status: v.union(v.literal('ready'), v.literal('used'), v.literal('expired')),
  titleKey: v.string(), season: v.string(), gameweek: v.number(),
  articleId: v.union(v.string(), v.null()), usedAt: v.union(v.number(), v.null()), createdAt: v.number(),
}
