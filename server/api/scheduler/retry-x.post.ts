import { createHash } from 'node:crypto'
import type { Id } from '../../../convex/_generated/dataModel'
import { requireAdmin, requireAdminOrigin } from '../../utils/admin'
import { schedulerApi, schedulerHistoryError, schedulerScope } from '../../utils/scheduler-history'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event)
  if (typeof body?.postId !== 'string' || !body.postId || body.postId.length > 100 || typeof body.caption !== 'string' || !body.caption.trim() || body.caption.length > 10000) throw createError({ statusCode: 400, statusMessage: 'Write an X caption before retrying.' })
  try {
    const { client, secret, channel } = await schedulerScope('x')
    const postId = body.postId as Id<'schedulerPosts'>
    const post = await client.query(schedulerApi.schedulerHistory.retryCandidate, { secret, channelId: channel.id, postId })
    if (!post) throw createError({ statusCode: 409, statusMessage: 'This X submission cannot be retried. Check Buffer first.' })
    const fingerprint = createHash('sha256').update(JSON.stringify({ caption: body.caption, draft: post.draftJson, image: post.draftJson ? null : post.imageUrl })).digest('hex')
    await client.mutation(schedulerApi.schedulerHistory.retryXSubmission, { secret, channelId: channel.id, postId, caption: body.caption, fingerprint })
    return { success: true }
  } catch (error) { throw schedulerHistoryError(error) }
})
