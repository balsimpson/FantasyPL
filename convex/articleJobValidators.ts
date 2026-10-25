import { v } from 'convex/values'

export const generationStatus = v.union(v.literal('queued'), v.literal('writing'), v.literal('ready'), v.literal('failed'))
export const generationSummary = v.object({ jobId: v.id('articleJobs'), status: generationStatus, error: v.union(v.string(), v.null()), updatedAt: v.number() })
export const generationFields = {
  articleId: v.string(), requestId: v.string(), requestedBy: v.string(), status: generationStatus,
  topic: v.string(), template: v.string(), season: v.string(), gameweek: v.union(v.number(), v.null()),
  promptId: v.optional(v.id('articlePrompts')), promptName: v.optional(v.string()), promptInstructions: v.optional(v.string()),
  resultJson: v.union(v.string(), v.null()), error: v.union(v.string(), v.null()), model: v.union(v.string(), v.null()),
  createdAt: v.number(), updatedAt: v.number(),
}
export const generationDocument = v.object({ ...generationFields, _id: v.id('articleJobs'), _creationTime: v.number() })
