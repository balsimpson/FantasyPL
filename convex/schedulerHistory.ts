import { paginationOptsValidator, paginationResultValidator } from 'convex/server'
import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalMutation, internalQuery, mutation, query, type QueryCtx, type MutationCtx } from './_generated/server'
import type { Doc } from './_generated/dataModel'
import { activityPlayer, nullableNumber, nullableString, player, postDocument, postStatus, providerPost } from './schedulerValidators'

function authorize(secret: string) {
  if (!process.env.SCHEDULER_SERVICE_TOKEN || secret !== process.env.SCHEDULER_SERVICE_TOKEN) throw new ConvexError('Scheduler access denied.')
}
const queuedStatuses = ['submitting', 'scheduled', 'unknown'] as const
const activeStatuses = new Set(['submitting', 'scheduled', 'unknown', 'published'])

async function getActivity(ctx: QueryCtx | MutationCtx, channelId: string, codes: number[], gameweek: number | null, season: string | null) {
  const week = gameweek === null || season === null ? [] : await ctx.db.query('schedulerPostPlayers').withIndex('by_channel_and_season_and_gameweek', q => q.eq('channelId', channelId).eq('season', season).eq('gameweek', gameweek)).take(2000)
  const queues = await Promise.all(queuedStatuses.map(status => ctx.db.query('schedulerPostPlayers').withIndex('by_channel_and_status', q => q.eq('channelId', channelId).eq('status', status)).take(2000)))
  if (week.length === 2000 || queues.some(rows => rows.length === 2000)) throw new ConvexError('There are too many posts to check safely. Narrow the history before scheduling.')
  const queued = queues.flat()
  const published = week.filter(row => row.status === 'published')
  const excludedCodes = [...new Set([...queued, ...published].map(row => row.playerCode))]
  const requested = [...new Set([...excludedCodes, ...codes])]
  const players = await Promise.all(requested.map(async code => {
    const latest = codes.includes(code) ? await ctx.db.query('schedulerPostPlayers').withIndex('by_channel_and_player_and_status', q => q.eq('channelId', channelId).eq('playerCode', code).eq('status', 'published')).order('desc').first() : null
    return { code, queued: queued.some(row => row.playerCode === code), postedThisGameweek: published.some(row => row.playerCode === code), lastPostedAt: latest?.sentAt ?? latest?.createdAt ?? null, lastPostId: latest?.postId ?? null }
  }))
  return { players, excludedCodes }
}

async function updatePlayerRows(ctx: MutationCtx, post: Doc<'schedulerPosts'>) {
  const existing = await ctx.db.query('schedulerPostPlayers').withIndex('by_postId', q => q.eq('postId', post._id)).take(6)
  for (const row of existing) await ctx.db.delete(row._id)
  for (const item of post.players) await ctx.db.insert('schedulerPostPlayers', {
    postId: post._id, channelId: post.channelId, playerCode: item.code, gameweek: post.gameweek, season: post.season,
    status: post.status, createdAt: post.createdAt, dueAt: post.dueAt, sentAt: post.sentAt,
  })
}

export const activity = query({
  args: { secret: v.string(), channelId: v.string(), codes: v.array(v.number()), gameweek: nullableNumber, season: nullableString },
  returns: v.object({ players: v.array(activityPlayer), excludedCodes: v.array(v.number()) }),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (args.codes.length > 5) throw new ConvexError('Choose no more than five players.')
    return getActivity(ctx, args.channelId, args.codes, args.gameweek, args.season)
  },
})

export const list = query({
  args: { secret: v.string(), channelId: v.string(), status: v.optional(postStatus), search: v.string(), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(postDocument),
  handler: async (ctx, args) => {
    authorize(args.secret)
    const search = args.search.trim()
    if (search) {
      const rows = await ctx.db.query('schedulerPosts').withSearchIndex('search_history', q => {
        const scoped = q.search('searchText', search).eq('channelId', args.channelId)
        return args.status ? scoped.eq('status', args.status) : scoped
      }).paginate(args.paginationOpts)
      return rows
    }
    return args.status
      ? ctx.db.query('schedulerPosts').withIndex('by_channel_and_status_and_createdAt', q => q.eq('channelId', args.channelId).eq('status', args.status!)).order('desc').paginate(args.paginationOpts)
      : ctx.db.query('schedulerPosts').withIndex('by_channel_and_createdAt', q => q.eq('channelId', args.channelId)).order('desc').paginate(args.paginationOpts)
  },
})

export const submissionStatuses = query({
  args: { secret: v.string(), channelId: v.string(), postIds: v.array(v.id('schedulerPosts')) },
  returns: v.array(v.object({ postId: v.id('schedulerPosts'), status: postStatus, dueAt: nullableNumber, error: nullableString })),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (args.postIds.length > 8) throw new ConvexError('Check no more than eight posts at once.')
    const posts = await Promise.all(args.postIds.map(postId => ctx.db.get(postId)))
    return posts.flatMap(post => post && post.channelId === args.channelId
      ? [{ postId: post._id, status: post.status, dueAt: post.dueAt, error: post.error }]
      : [])
  },
})

export const reserve = mutation({
  args: {
    secret: v.string(), channelId: v.string(), requestId: v.string(), fingerprint: v.string(),
    imageUrl: v.string(), caption: v.string(), players: v.array(player), gameweek: nullableNumber, season: nullableString,
    template: nullableString, design: nullableString, draftJson: nullableString, allowRepeat: v.boolean(),
  },
  returns: v.object({ reserved: v.boolean(), postId: v.id('schedulerPosts'), bufferPostId: nullableString, dueAt: nullableNumber, status: postStatus }),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (args.players.length > 5 || new Set(args.players.map(item => item.code)).size !== args.players.length) throw new ConvexError('Choose no more than five different players.')
    if ((args.draftJson?.length ?? 0) > 50000 || args.caption.length > 10000) throw new ConvexError('The post is too large to save.')
    const sameRequest = await ctx.db.query('schedulerPosts').withIndex('by_channel_and_requestId', q => q.eq('channelId', args.channelId).eq('requestId', args.requestId)).unique()
    const identical = await ctx.db.query('schedulerPosts').withIndex('by_channel_and_fingerprint', q => q.eq('channelId', args.channelId).eq('fingerprint', args.fingerprint)).order('desc').take(20)
    const existing = sameRequest || identical.find(post => activeStatuses.has(post.status))
    if (existing) return { reserved: false, postId: existing._id, bufferPostId: existing.bufferPostId, dueAt: existing.dueAt, status: existing.status }
    const activity = await getActivity(ctx, args.channelId, args.players.map(item => item.code), args.gameweek, args.season)
    if (!args.allowRepeat && activity.players.some(item => args.players.some(selected => selected.code === item.code) && (item.queued || item.postedThisGameweek))) throw new ConvexError('A selected player is already queued or was posted this gameweek. Review the warning and allow the repeat to continue.')
    const { secret, allowRepeat, ...record } = args
    const now = Date.now()
    const postId = await ctx.db.insert('schedulerPosts', { ...record, searchText: `${args.players.map(item => item.name).join(' ')} ${args.caption}`, bufferPostId: null, status: 'submitting', dueAt: null, sentAt: null, externalLink: null, error: null, createdAt: now, updatedAt: now, source: args.players.length ? 'scheduler' : 'buffer' })
    const post = (await ctx.db.get(postId))!
    await updatePlayerRows(ctx, post)
    await ctx.scheduler.runAfter(0, internal.schedulerHistory.submitToBuffer, { postId })
    return { reserved: true, postId, bufferPostId: null, dueAt: null, status: 'submitting' as const }
  },
})

export const submissionData = internalQuery({
  args: { postId: v.id('schedulerPosts') },
  returns: v.union(postDocument, v.null()),
  handler: async (ctx, { postId }) => ctx.db.get(postId),
})

export const finishSubmission = internalMutation({
  args: { postId: v.id('schedulerPosts'), status: v.union(v.literal('scheduled'), v.literal('published'), v.literal('failed'), v.literal('unknown')), bufferPostId: nullableString, dueAt: nullableNumber, error: nullableString },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId)
    if (!post || post.status !== 'submitting') return null
    await ctx.db.patch(post._id, { status: args.status, bufferPostId: args.bufferPostId, dueAt: args.dueAt, error: args.error, updatedAt: Date.now() })
    await updatePlayerRows(ctx, (await ctx.db.get(post._id))!)
    return null
  },
})

export const submitToBuffer = internalAction({
  args: { postId: v.id('schedulerPosts') },
  returns: v.null(),
  handler: async (ctx, { postId }) => {
    const post = await ctx.runQuery(internal.schedulerHistory.submissionData, { postId })
    if (!post || post.status !== 'submitting') return null
    const key = process.env.BUFFER_API_KEY
    if (!key) {
      await ctx.runMutation(internal.schedulerHistory.finishSubmission, { postId, status: 'failed', bufferPostId: null, dueAt: null, error: 'Buffer scheduling is not configured in Convex.' })
      return null
    }
    if (!post.imageUrl) {
      await ctx.runMutation(internal.schedulerHistory.finishSubmission, { postId, status: 'failed', bufferPostId: null, dueAt: null, error: 'The uploaded post image is missing.' })
      return null
    }

    let response: Response
    try {
      response = await fetch('https://api.buffer.com', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `mutation($input: CreatePostInput!) {
          createPost(input: $input) {
            ... on PostActionSuccess { post { id dueAt status } }
            ... on MutationError { message }
          }
        }`, variables: { input: { text: post.caption, channelId: post.channelId, schedulingType: 'automatic', mode: 'addToQueue', assets: [{ image: { url: post.imageUrl } }], metadata: { instagram: { type: 'post', shouldShareToFeed: true } } } } }),
        signal: AbortSignal.timeout(12_000),
      })
    } catch {
      await ctx.runMutation(internal.schedulerHistory.finishSubmission, { postId, status: 'unknown', bufferPostId: null, dueAt: null, error: 'Buffer did not confirm the request. Check the Buffer queue before trying again.' })
      return null
    }

    if (!response.ok) {
      const uncertain = response.status >= 500
      await ctx.runMutation(internal.schedulerHistory.finishSubmission, { postId, status: uncertain ? 'unknown' : 'failed', bufferPostId: null, dueAt: null, error: uncertain ? 'Buffer did not confirm the request. Check the Buffer queue before trying again.' : response.status === 401 || response.status === 403 ? 'Buffer denied access. Check the API key and its permissions.' : response.status === 429 ? 'Buffer has reached its request limit. Try again later.' : 'Buffer could not accept the post.' })
      return null
    }

    let payload: { data?: { createPost?: { post?: { id?: string; dueAt?: string | null; status?: string }; message?: string } }; errors?: { message: string }[] }
    try {
      payload = await response.json()
    } catch {
      await ctx.runMutation(internal.schedulerHistory.finishSubmission, { postId, status: 'unknown', bufferPostId: null, dueAt: null, error: 'Buffer returned an unreadable response. Check the Buffer queue before trying again.' })
      return null
    }
    const result = payload.data?.createPost
    if (payload.errors?.length) {
      await ctx.runMutation(internal.schedulerHistory.finishSubmission, { postId, status: 'unknown', bufferPostId: null, dueAt: null, error: 'Buffer returned an uncertain result. Check the Buffer queue before trying again.' })
      return null
    }
    if (!result?.post?.id && result?.message) {
      await ctx.runMutation(internal.schedulerHistory.finishSubmission, { postId, status: 'failed', bufferPostId: null, dueAt: null, error: result?.message || payload.errors?.map(error => error.message).join(' ') || 'Buffer did not accept the post.' })
      return null
    }
    if (!result?.post?.id) {
      await ctx.runMutation(internal.schedulerHistory.finishSubmission, { postId, status: 'unknown', bufferPostId: null, dueAt: null, error: 'Buffer returned an uncertain result. Check the Buffer queue before trying again.' })
      return null
    }
    await ctx.runMutation(internal.schedulerHistory.finishSubmission, {
      postId, status: result.post.status === 'sent' ? 'published' : 'scheduled', bufferPostId: result.post.id,
      dueAt: result.post.dueAt ? Date.parse(result.post.dueAt) : null, error: null,
    })
    return null
  },
})

export const finish = mutation({
  args: { secret: v.string(), postId: v.id('schedulerPosts'), status: postStatus, bufferPostId: nullableString, dueAt: nullableNumber, sentAt: nullableNumber, externalLink: nullableString, error: nullableString },
  returns: v.null(),
  handler: async (ctx, args) => {
    authorize(args.secret)
    const post = await ctx.db.get(args.postId)
    if (!post) throw new ConvexError('The history record was not found.')
    const { secret, postId, ...patch } = args
    await ctx.db.patch(postId, { ...patch, updatedAt: Date.now() })
    await updatePlayerRows(ctx, (await ctx.db.get(postId))!)
    return null
  },
})

export const sync = mutation({
  args: { secret: v.string(), channelId: v.string(), posts: v.array(providerPost) },
  returns: v.number(),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (args.posts.length > 50) throw new ConvexError('Refresh no more than fifty posts at once.')
    for (const incoming of args.posts) {
      let existing = await ctx.db.query('schedulerPosts').withIndex('by_channel_and_bufferPostId', q => q.eq('channelId', args.channelId).eq('bufferPostId', incoming.bufferPostId)).unique()
      if (!existing && incoming.imageUrl) {
        const candidates = await ctx.db.query('schedulerPosts').withIndex('by_channel_and_imageUrl', q => q.eq('channelId', args.channelId).eq('imageUrl', incoming.imageUrl)).take(20)
        existing = candidates.find(post => !post.bufferPostId && post.caption === incoming.caption) ?? null
      }
      const patch = { ...incoming, searchText: `${existing?.players.map(item => item.name).join(' ') ?? ''} ${incoming.caption}`, updatedAt: Date.now() }
      if (existing) {
        await ctx.db.patch(existing._id, { ...patch, error: incoming.status === 'failed' ? existing.error : null })
        await updatePlayerRows(ctx, (await ctx.db.get(existing._id))!)
      } else {
        await ctx.db.insert('schedulerPosts', { ...patch, channelId: args.channelId, requestId: null, fingerprint: null, players: [], gameweek: null, season: null, template: null, design: null, draftJson: null, error: null, source: 'buffer' })
      }
    }
    return args.posts.length
  },
})

export const linkPlayers = mutation({
  args: { secret: v.string(), channelId: v.string(), postId: v.id('schedulerPosts'), players: v.array(player), gameweek: nullableNumber, season: nullableString },
  returns: v.null(),
  handler: async (ctx, args) => {
    authorize(args.secret)
    if (!args.players.length || args.players.length > 5 || new Set(args.players.map(item => item.code)).size !== args.players.length) throw new ConvexError('Choose one to five different players.')
    const post = await ctx.db.get(args.postId)
    if (!post || post.channelId !== args.channelId) throw new ConvexError('The history record was not found.')
    if (post.source !== 'buffer') throw new ConvexError('Player details are already saved with this post.')
    await ctx.db.patch(post._id, { players: args.players, season: args.season, searchText: `${args.players.map(item => item.name).join(' ')} ${post.caption}`, gameweek: args.gameweek, updatedAt: Date.now() })
    await updatePlayerRows(ctx, (await ctx.db.get(post._id))!)
    return null
  },
})
