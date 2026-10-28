import { createHash, randomUUID } from 'node:crypto'
import { requireAdmin, requireAdminOrigin } from '../utils/admin'
import { getBufferInstagramChannel, getBufferXChannel } from '../utils/buffer'
import { schedulerApi, schedulerDatabase, schedulerHistoryError } from '../utils/scheduler-history'

export default defineEventHandler(async event => {
  assertMethod(event, 'POST')
  await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event)
  if (typeof body?.caption !== 'string' || !body.caption.trim() || body.caption.length > 10000) throw createError({ statusCode: 400, statusMessage: 'Write a caption before scheduling.' })
  const paired = body?.xCaption !== undefined
  if (paired && (typeof body.xCaption !== 'string' || !body.xCaption.trim() || body.xCaption.length > 10000)) throw createError({ statusCode: 400, statusMessage: 'Write an X caption before scheduling.' })
  let imageUrl: URL
  try {
    imageUrl = new URL(body.image_url)
    if (imageUrl.protocol !== 'https:' || imageUrl.username || imageUrl.password) throw new Error('Invalid image URL')
  } catch { throw createError({ statusCode: 400, statusMessage: 'A public HTTPS image URL is required.' }) }

  const draft = body.draft
  const players: { code: number; name: string }[] = []
  let gameweek: number | null = null
  let season: string | null = null
  let template: string | null = null
  let design: string | null = null
  let draftJson: string | null = null
  if (draft != null) {
    if (!Array.isArray(draft.players) || !draft.players.length || draft.players.length > 5) throw createError({ statusCode: 400, statusMessage: 'Choose one to five players for the post.' })
    for (const item of draft.players) {
      const name = item?.fullName || item?.name
      if (!Number.isSafeInteger(item?.code) || item.code <= 0 || typeof name !== 'string' || !name.trim() || name.length > 120) throw createError({ statusCode: 400, statusMessage: 'The selected player data is invalid.' })
      players.push({ code: item.code, name })
    }
    if (new Set(players.map(item => item.code)).size !== players.length) throw createError({ statusCode: 400, statusMessage: 'Choose different players for the post.' })
    season = typeof draft.season === 'string' && /^\d{4}\/\d{2}$/.test(draft.season) ? draft.season : null
    gameweek = draft.gameweek ?? null
    if (gameweek !== null && (!Number.isSafeInteger(gameweek) || gameweek < 1 || gameweek > 100)) throw createError({ statusCode: 400, statusMessage: 'The gameweek is invalid.' })
    if (!['spotlight', 'comparison', 'shortlist', 'fixtures', 'transfers'].includes(draft.template) || typeof draft.design !== 'string' || !draft.design || draft.design.length > 40) throw createError({ statusCode: 400, statusMessage: 'The post format is invalid.' })
    template = draft.template
    design = draft.design
    draftJson = JSON.stringify(draft)
    if (draftJson.length > 50000) throw createError({ statusCode: 400, statusMessage: 'The post is too large to save.' })
  }
  const [channel, xChannel] = await Promise.all([getBufferInstagramChannel(), paired ? getBufferXChannel() : Promise.resolve(null)])
  const { client, secret } = schedulerDatabase()
  const requestId = typeof body.requestId === 'string' && body.requestId.length <= 100 ? body.requestId : randomUUID()
  const fingerprint = (caption: string) => createHash('sha256').update(JSON.stringify({ caption, draft: draftJson, image: draftJson ? null : imageUrl.href })).digest('hex')
  if (paired && xChannel) {
    try {
      const reservations = await client.mutation(schedulerApi.schedulerHistory.reservePair, {
        secret, instagramChannelId: channel.id, xChannelId: xChannel.id, requestId,
        instagramFingerprint: fingerprint(body.caption), xFingerprint: fingerprint(body.xCaption),
        caption: body.caption, xCaption: body.xCaption, imageUrl: imageUrl.href, players, gameweek, season, template, design, draftJson,
        allowRepeat: body.allowRepeat === true,
      })
      return { success: true, posts: [
        { ...reservations.instagram, platform: 'instagram' as const, channelId: channel.id, channel: channel.name },
        { ...reservations.x, platform: 'x' as const, channelId: xChannel.id, channel: xChannel.name },
      ] }
    } catch (error) { throw schedulerHistoryError(error) }
  }
  let reservation
  try {
    reservation = await client.mutation(schedulerApi.schedulerHistory.reserve, {
      secret, channelId: channel.id,
      requestId,
      fingerprint: fingerprint(body.caption),
      caption: body.caption, imageUrl: imageUrl.href, players, gameweek, season, template, design, draftJson,
      allowRepeat: body.allowRepeat === true,
    })
  } catch (error) { throw schedulerHistoryError(error) }
  if (!reservation.reserved) {
    if (reservation.status === 'submitting') return { success: true, queued: true, jobId: reservation.postId, post: { dueAt: null, channelId: channel.id, channel: channel.name } }
    if (reservation.bufferPostId && ['scheduled', 'published'].includes(reservation.status)) return { success: true, alreadyScheduled: true, historyWarning: null, post: { id: reservation.bufferPostId, dueAt: reservation.dueAt ? new Date(reservation.dueAt).toISOString() : null, status: reservation.status, channel: channel.name } }
    throw createError({ statusCode: 409, statusMessage: 'This post is already recorded. Check History and the Buffer queue before trying again.' })
  }
  return { success: true, queued: true, jobId: reservation.postId, post: { dueAt: null, channelId: channel.id, channel: channel.name } }
})
