import { buildDailyDraft, generateDailyCaptions, publishDailyDraft, uploadDailyImage } from '../../utils/scheduler-daily'
import { renderDailyArtwork } from '../../utils/scheduler-artwork'
import { requireAdmin } from '../../utils/admin'

/**
 * Daily scheduler cron. Vercel sends `Authorization: Bearer <CRON_SECRET>`.
 * - ?preview=1 renders today's artwork without caption, upload or scheduling.
 * - ?dry=1 builds the draft and both captions without uploading or scheduling.
 * Both read-only modes also accept a signed-in admin session.
 * A real run uploads one PNG and reserves the paired Instagram and X post.
 */
export default defineEventHandler(async event => {
  assertMethod(event, 'GET')
  setHeader(event, 'Cache-Control', 'no-store')

  const query = getQuery(event)
  const secret = process.env.CRON_SECRET
  const serviceToken = process.env.SCHEDULER_SERVICE_TOKEN
  if (!secret && !serviceToken) throw createError({ statusCode: 503, statusMessage: 'Daily scheduling is not configured on the server.' })
  const authorization = getHeader(event, 'authorization')
  const authorized = [secret, serviceToken].some(token => Boolean(token) && authorization === `Bearer ${token}`)
  if (!authorized) {
    if (query.dry === '1' || query.preview === '1') await requireAdmin(event)
    else throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const started = Date.now()
  const step = (message: string) => console.log(`[daily-cron] ${message} ${Date.now() - started}ms`)

  step('start')
  const angle = typeof query.angle === 'string' ? query.angle : undefined
  const compare = query.compare === '1'
  const plan = await buildDailyDraft(event, angle, compare)
  if ('skipped' in plan) return { success: true, skipped: true, reason: plan.skipped }
  step(`draft ${plan.angle} ${plan.draft.players.map(player => player.name).join(',')}`)

  const png = await renderDailyArtwork(plan.draft, getRequestURL(event).origin)
  step(`rendered ${png.length} bytes`)
  if (query.preview === '1') {
    setHeader(event, 'Content-Type', 'image/png')
    return png
  }

  const captions = await generateDailyCaptions(plan.draft)
  step(`captions fallback=${captions.fallbackUsed}`)
  if (query.dry === '1') {
    return { success: true, dryRun: true, dateKey: plan.dateKey, angle: plan.angle, draft: plan.draft, captions, bytes: png.length }
  }

  const imageUrl = await uploadDailyImage(png, plan.dateKey)
  step('uploaded')
  const published = await publishDailyDraft(plan.draft, captions, imageUrl, plan.dateKey)
  step('reserved')
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
