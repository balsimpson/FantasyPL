import { buildDailyDraft, generateDailyCaptions, publishDailyDraft, uploadDailyImage } from '../../utils/scheduler-daily'
import { renderDailyArtwork } from '../../utils/scheduler-artwork'

/**
 * Daily scheduler cron. Vercel sends `Authorization: Bearer <CRON_SECRET>`.
 * - ?preview=1 renders today's artwork without caption, upload or scheduling.
 * - ?dry=1 builds the draft and both captions without uploading or scheduling.
 * A real run uploads one PNG and reserves the paired Instagram and X post.
 */
export default defineEventHandler(async event => {
  assertMethod(event, 'GET')
  setHeader(event, 'Cache-Control', 'no-store')

  const secret = process.env.CRON_SECRET
  if (!secret) throw createError({ statusCode: 503, statusMessage: 'Daily scheduling is not configured on the server.' })
  if (getHeader(event, 'authorization') !== `Bearer ${secret}`) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const query = getQuery(event)
  const angle = typeof query.angle === 'string' ? query.angle : undefined
  const compare = query.compare === '1'
  const plan = await buildDailyDraft(event, angle, compare)
  if ('skipped' in plan) return { success: true, skipped: true, reason: plan.skipped }

  const png = await renderDailyArtwork(plan.draft)
  if (query.preview === '1') {
    setHeader(event, 'Content-Type', 'image/png')
    return png
  }

  const captions = await generateDailyCaptions(plan.draft)
  if (query.dry === '1') {
    return { success: true, dryRun: true, dateKey: plan.dateKey, angle: plan.angle, draft: plan.draft, captions, bytes: png.length }
  }

  const imageUrl = await uploadDailyImage(png, plan.dateKey)
  const published = await publishDailyDraft(plan.draft, captions, imageUrl, plan.dateKey)
  return {
    success: true,
    dateKey: plan.dateKey,
    angle: plan.angle,
    template: plan.draft.template,
    players: plan.draft.players.map(player => player.fullName),
    imageUrl,
    captions,
    ...published,
  }
})
