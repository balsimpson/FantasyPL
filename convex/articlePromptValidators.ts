import { v } from 'convex/values'

export const promptScope = v.union(v.literal('research-search'), v.literal('research-analysis'), v.literal('article'))

export const articlePromptFields = {
  scope: promptScope,
  template: v.union(v.string(), v.null()),
  name: v.string(),
  instructions: v.string(),
  isDefault: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
}

export const articlePromptDocument = v.object({ ...articlePromptFields, _id: v.id('articlePrompts'), _creationTime: v.number() })
