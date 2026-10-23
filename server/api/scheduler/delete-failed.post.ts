import type { Id } from '../../../convex/_generated/dataModel'
import { schedulerApi, schedulerHistoryError, schedulerScope } from '../../utils/scheduler-history'

export default defineEventHandler(async event => {
  const body = await readBody(event)
  if (typeof body?.postId !== 'string' || !body.postId || body.postId.length > 100) throw createError({ statusCode: 400, statusMessage: 'Choose a failed post to delete.' })
  try {
    const { client, secret, channel } = await schedulerScope()
    await client.mutation(schedulerApi.schedulerHistory.deleteFailed, { secret, channelId: channel.id, postId: body.postId as Id<'schedulerPosts'> })
    return { success: true }
  } catch (error) { throw schedulerHistoryError(error) }
})
