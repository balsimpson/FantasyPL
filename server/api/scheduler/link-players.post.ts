import type { Id } from '../../../convex/_generated/dataModel'
import { requireAdmin, requireAdminOrigin } from '../../utils/admin'
import { schedulerApi, schedulerHistoryError, schedulerPlatform, schedulerScope } from '../../utils/scheduler-history'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event)
  if (typeof body?.postId !== 'string' || !Array.isArray(body.players) || !body.players.length || body.players.length > 5 || body.players.some((item: { code?: unknown; name?: unknown }) => !Number.isSafeInteger(item?.code) || Number(item.code) <= 0 || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 120)) throw createError({ statusCode: 400, statusMessage: 'Choose one to five players for this post.' })
  const season = typeof body.season === 'string' && /^\d{4}\/\d{2}$/.test(body.season) ? body.season : null
  const gameweek = body.gameweek == null ? null : Number(body.gameweek)
  if (gameweek !== null && (!Number.isSafeInteger(gameweek) || gameweek < 1 || gameweek > 100)) throw createError({ statusCode: 400, statusMessage: 'Enter a valid gameweek.' })
  try {
    const { client, secret, channel } = await schedulerScope(schedulerPlatform(body.platform))
    await client.mutation(schedulerApi.schedulerHistory.linkPlayers, { secret, channelId: channel.id, postId: body.postId as Id<'schedulerPosts'>, players: body.players, gameweek, season })
    return { success: true }
  } catch (error) { throw schedulerHistoryError(error) }
})
