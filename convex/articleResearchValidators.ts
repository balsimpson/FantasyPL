import { v } from 'convex/values'
export const researchFields = {
  focus: v.string(), requestId: v.string(), requestedBy: v.string(),
  status: v.union(v.literal('queued'), v.literal('researching'), v.literal('ready'), v.literal('failed')),
  resultJson: v.union(v.string(), v.null()), error: v.union(v.string(), v.null()), createdAt: v.number(), updatedAt: v.number(),
}
