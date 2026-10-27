import { schedulerApi, schedulerHistoryError, schedulerScope } from '../../utils/scheduler-history'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  const query = getQuery(event)
  const codes = typeof query.codes === 'string' && query.codes ? query.codes.split(',').map(Number) : []
  const season = typeof query.season === 'string' && /^\d{4}\/\d{2}$/.test(query.season) ? query.season : null
  const gameweek = query.gameweek ? Number(query.gameweek) : null
  if (codes.length > 5 || codes.some(code => !Number.isSafeInteger(code) || code <= 0) || (gameweek !== null && (!Number.isSafeInteger(gameweek) || gameweek < 1 || gameweek > 100))) throw createError({ statusCode: 400, statusMessage: 'The player or gameweek selection is invalid.' })
  try {
    const { client, secret, channel } = await schedulerScope()
    return await client.query(schedulerApi.schedulerHistory.activity, { secret, channelId: channel.id, codes, gameweek, season })
  } catch (error) { throw schedulerHistoryError(error) }
})
