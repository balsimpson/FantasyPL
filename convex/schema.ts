import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { nullableNumber, nullableString, postFields, postStatus } from './schedulerValidators'
import { articleFields, draftFields } from './articleValidators'
import { generationFields } from './articleJobValidators'
import { researchFields, researchIdeaFields } from './articleResearchValidators'

export default defineSchema({
  managerShareStats: defineTable({ day: v.string(), clicks: v.number(), copies: v.number() })
    .index('by_day', ['day']),
  articleResearch: defineTable(researchFields).index('by_createdAt', ['createdAt']).index('by_requestId', ['requestId']).index('by_status_and_createdAt', ['status', 'createdAt']),
  articleResearchChoices: defineTable({ researchId: v.id('articleResearch'), suggestionIndex: v.number(), articleId: v.string() }).index('by_researchId_and_suggestionIndex', ['researchId', 'suggestionIndex']),
  articleResearchIdeas: defineTable(researchIdeaFields)
    .index('by_status_and_createdAt', ['status', 'createdAt'])
    .index('by_researchId_and_suggestionIndex', ['researchId', 'suggestionIndex'])
    .index('by_titleKey_and_status', ['titleKey', 'status']),
  articleJobs: defineTable(generationFields)
    .index('by_articleId_and_createdAt', ['articleId', 'createdAt'])
    .index('by_requestId', ['requestId'])
    .index('by_requestedBy_and_createdAt', ['requestedBy', 'createdAt']),
  articles: defineTable(articleFields)
    .index('by_articleId', ['articleId'])
    .index('by_slug', ['slug'])
    .index('by_publishedSlug_and_status', ['publishedSlug', 'status'])
    .index('by_status_and_publishedAt', ['status', 'publishedAt'])
    .index('by_updatedAt', ['updatedAt']),
  articleRevisions: defineTable({
    ...draftFields, articleId: v.string(), version: v.number(), savedAt: v.number(), savedBy: v.string(),
  }).index('by_articleId_and_version', ['articleId', 'version']),
  schedulerPosts: defineTable(postFields)
    .index('by_channel_and_createdAt', ['channelId', 'createdAt'])
    .index('by_channel_and_status_and_createdAt', ['channelId', 'status', 'createdAt'])
    .index('by_channel_and_deletedAt_and_createdAt', ['channelId', 'deletedAt', 'createdAt'])
    .index('by_channel_and_status_and_deletedAt_and_createdAt', ['channelId', 'status', 'deletedAt', 'createdAt'])
    .index('by_channel_and_status_and_deletedAt_and_sentAt', ['channelId', 'status', 'deletedAt', 'sentAt'])
    .index('by_channel_and_bufferPostId', ['channelId', 'bufferPostId'])
    .index('by_channel_and_requestId', ['channelId', 'requestId'])
    .index('by_channel_and_fingerprint', ['channelId', 'fingerprint'])
    .index('by_channel_and_imageUrl', ['channelId', 'imageUrl'])
    .searchIndex('search_history', { searchField: 'searchText', filterFields: ['channelId', 'status', 'deletedAt'] }),
  schedulerPostPlayers: defineTable({
    postId: v.id('schedulerPosts'), channelId: v.string(), playerCode: v.number(),
    gameweek: nullableNumber, season: nullableString, status: postStatus, createdAt: v.number(),
    dueAt: nullableNumber, sentAt: nullableNumber,
  })
    .index('by_postId', ['postId'])
    .index('by_channel_and_player_and_status', ['channelId', 'playerCode', 'status', 'createdAt'])
    .index('by_channel_and_season_and_gameweek', ['channelId', 'season', 'gameweek'])
    .index('by_channel_and_status', ['channelId', 'status']),
})
