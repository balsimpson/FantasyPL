import { schedulerApi, schedulerHistoryError, schedulerScope } from '../../utils/scheduler-history'
import type { SchedulerPostStatus } from '../../../utils/scheduler-history'

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'no-store')
  const query = getQuery(event)
  const status = typeof query.status === 'string' && ['submitting', 'scheduled', 'published', 'failed', 'unknown', 'draft', 'cancelled'].includes(query.status) ? query.status as SchedulerPostStatus : undefined
  try {
    const { client, secret, channel } = await schedulerScope()
    return await client.query(schedulerApi.schedulerHistory.list, {
      secret, channelId: channel.id, status,
      search: String(query.search || '').slice(0, 200),
      paginationOpts: { numItems: 20, cursor: typeof query.cursor === 'string' && query.cursor ? query.cursor : null },
    })
  } catch (error) { throw schedulerHistoryError(error) }
})
