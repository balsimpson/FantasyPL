import { shareAnalyticsDatabase, shareRecord } from '../utils/share-analytics'

export default defineEventHandler(async event => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  if (getHeader(event, 'origin') !== getRequestURL(event).origin) {
    throw createError({ statusCode: 403, statusMessage: 'Share from this site.' })
  }
  const body = await readValidatedBody(event, (value: unknown) => {
    if (!value || typeof value !== 'object' || !('event' in value)) return false
    return value.event === 'click' || value.event === 'copy'
  }) as { event: 'click' | 'copy' }
  const { client, secret } = shareAnalyticsDatabase()
  try {
    await client.mutation(shareRecord, { secret, event: body.event })
    return { recorded: true }
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Share statistics are unavailable.' })
  }
})
