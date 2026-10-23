import { v } from 'convex/values'

export const postStatus = v.union(v.literal('submitting'), v.literal('scheduled'), v.literal('published'), v.literal('failed'), v.literal('unknown'), v.literal('draft'), v.literal('cancelled'))
export const nullableString = v.union(v.string(), v.null())
export const nullableNumber = v.union(v.number(), v.null())
export const player = v.object({ code: v.number(), name: v.string() })
export const postFields = {
  channelId: v.string(), bufferPostId: nullableString, requestId: nullableString,
  fingerprint: nullableString, imageUrl: nullableString, caption: v.string(), searchText: v.string(),
  players: v.array(player), gameweek: nullableNumber, season: nullableString, template: nullableString,
  design: nullableString, draftJson: nullableString, status: postStatus,
  dueAt: nullableNumber, sentAt: nullableNumber, externalLink: nullableString,
  error: nullableString, createdAt: v.number(), updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
  source: v.union(v.literal('scheduler'), v.literal('buffer')),
}
export const postDocument = v.object({ _id: v.id('schedulerPosts'), _creationTime: v.number(), ...postFields })
export const activityPlayer = v.object({
  code: v.number(), queued: v.boolean(), postedThisGameweek: v.boolean(),
  lastPostedAt: nullableNumber, lastPostId: v.union(v.id('schedulerPosts'), v.null()),
})
export const providerPost = v.object({
  bufferPostId: v.string(), imageUrl: nullableString, caption: v.string(), status: postStatus,
  dueAt: nullableNumber, sentAt: nullableNumber, externalLink: nullableString, createdAt: v.number(),
})
