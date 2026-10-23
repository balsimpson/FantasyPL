import { schedulerApi, schedulerDatabase, schedulerHistoryError } from '../../utils/scheduler-history'

export default defineEventHandler(async event => {
  assertMethod(event, 'POST')
  setHeader(event, 'Cache-Control', 'no-store')
  const body = await readBody(event)
  if (typeof body?.channelId !== 'string' || body.channelId.length > 120 || !Array.isArray(body?.jobIds) || body.jobIds.length > 8 || body.jobIds.some((id: unknown) => typeof id !== 'string' || id.length > 100)) {
    throw createError({ statusCode: 400, statusMessage: 'The background post list is invalid.' })
  }
  try {
    const { client, secret } = schedulerDatabase()
    return await client.query(schedulerApi.schedulerHistory.submissionStatuses, { secret, channelId: body.channelId, postIds: body.jobIds })
  } catch (error) { throw schedulerHistoryError(error) }
})
