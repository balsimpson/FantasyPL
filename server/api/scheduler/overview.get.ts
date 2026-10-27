import { schedulerApi, schedulerHistoryError, schedulerScope } from '../../utils/scheduler-history'
import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    const { client, secret, channel } = await schedulerScope()
    return await client.query(schedulerApi.schedulerHistory.overview, { secret, channelId: channel.id })
  } catch (error) { throw schedulerHistoryError(error) }
})
