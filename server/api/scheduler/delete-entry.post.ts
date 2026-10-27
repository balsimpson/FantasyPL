import type { Id } from '../../../convex/_generated/dataModel'
import { requireAdmin, requireAdminOrigin } from '../../utils/admin'
import { schedulerApi, schedulerHistoryError, schedulerScope } from '../../utils/scheduler-history'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event)
  if (typeof body?.postId !== 'string' || !body.postId || body.postId.length > 100) throw createError({ statusCode: 400, statusMessage: 'Choose a post to delete from history.' })
  try {
    const { client, secret, channel } = await schedulerScope()
    await client.mutation(schedulerApi.schedulerHistory.deleteEntry, { secret, channelId: channel.id, postId: body.postId as Id<'schedulerPosts'> })
    return { success: true }
  } catch (error) { throw schedulerHistoryError(error) }
})
