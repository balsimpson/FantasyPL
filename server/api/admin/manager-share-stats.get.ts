import { requireAdmin } from '../../utils/admin'
import { shareAnalyticsDatabase, shareSummary } from '../../utils/share-analytics'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const { client, secret } = shareAnalyticsDatabase()
  try { return await client.query(shareSummary, { secret }) }
  catch { throw createError({ statusCode: 503, statusMessage: 'Share statistics are unavailable.' }) }
})
