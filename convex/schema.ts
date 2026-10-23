import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { nullableNumber, nullableString, postFields, postStatus } from './schedulerValidators'

export default defineSchema({
  schedulerPosts: defineTable(postFields)
    .index('by_channel_and_createdAt', ['channelId', 'createdAt'])
    .index('by_channel_and_status_and_createdAt', ['channelId', 'status', 'createdAt'])
    .index('by_channel_and_bufferPostId', ['channelId', 'bufferPostId'])
    .index('by_channel_and_requestId', ['channelId', 'requestId'])
    .index('by_channel_and_fingerprint', ['channelId', 'fingerprint'])
    .index('by_channel_and_imageUrl', ['channelId', 'imageUrl'])
    .searchIndex('search_history', { searchField: 'searchText', filterFields: ['channelId', 'status'] }),
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
