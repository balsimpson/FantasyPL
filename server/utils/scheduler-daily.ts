import { createHash } from 'node:crypto'
import { getCachedFplBootstrap } from './fpl-bootstrap'
import { schedulerApi, schedulerScope, schedulerDatabase } from './scheduler-history'
import { generateSchedulerCaption, type SchedulerCaptionPlatform } from './scheduler-caption'
import { normalizeInstagramPlayer, type InstagramDraft, type InstagramStatKey } from '../../utils/instagram-templates'
import { getSchedulerPickPools, type SchedulerPickAngle, type SchedulerPickCandidate } from '../../utils/scheduler-picks'

// One angle per day keeps the feed varied; a comparison lands every third day.
const DAILY_ROTATION: SchedulerPickAngle[] = ['differential', 'bought', 'form', 'sold', 'budget', 'standout']
const COMPARISON_EVERY = 3

export type DailyDraft = {
  dateKey: string
  angle: SchedulerPickAngle
  draft: InstagramDraft
}

export type DailyCaptions = {
  instagram: string
  x: string
  fallbackUsed: boolean
}

function istDateKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

function seasonFor(gameweek: { deadline_time?: string } | null) {
  const deadline = new Date(gameweek?.deadline_time || '')
  if (!Number.isFinite(deadline.getTime())) return null
  const year = deadline.getUTCFullYear() - (deadline.getUTCMonth() < 6 ? 1 : 0)
  return `${year}/${String(year + 1).slice(-2)}`
}

function dayNumber(dateKey: string) {
  const parsed = Date.parse(`${dateKey}T00:00:00+05:30`)
  return Number.isFinite(parsed) ? Math.floor(parsed / 86_400_000) : Math.floor(Date.now() / 86_400_000)
}

async function excludedPlayerCodes(gameweek: number | null, season: string | null) {
  const [{ client, secret, channel: instagram }, { channel: x }] = await Promise.all([
    schedulerScope('instagram'),
    schedulerScope('x'),
  ])
  const results = await Promise.all([
    client.query(schedulerApi.schedulerHistory.activity, { secret, channelId: instagram.id, codes: [], gameweek, season }),
    client.query(schedulerApi.schedulerHistory.activity, { secret, channelId: x.id, codes: [], gameweek, season }),
  ])
  return new Set(results.flatMap(result => result.excludedCodes))
}

function pickCandidates(pools: ReturnType<typeof getSchedulerPickPools>, angle: SchedulerPickAngle, excluded: Set<number>, count: number) {
  return pools[angle].filter(candidate => !excluded.has(candidate.player.code)).slice(0, count)
}

/**
 * Chooses today's eligible players from the current FPL snapshot, excluding any
 * player already queued or published on either channel. Returns a skip reason
 * instead of inventing a post when no story has a fresh candidate.
 */
export async function buildDailyDraft(event: Parameters<typeof getCachedFplBootstrap>[0], angleOverride?: string, compareOverride?: boolean): Promise<DailyDraft | { skipped: string }> {
  const { data } = await getCachedFplBootstrap(event)
  const players = (data.elements ?? []).map((element: Record<string, unknown>) => normalizeInstagramPlayer(element, data.teams ?? []))
  const current = (data.events ?? []).find((item: Record<string, unknown>) => item.is_current)
    ?? (data.events ?? []).find((item: Record<string, unknown>) => item.is_next)
    ?? null
  const gameweek = current ? { id: Number(current.id), finished: current.finished === true, data_checked: current.data_checked === true } : null
  const season = seasonFor(current as { deadline_time?: string } | null)
  const pools = getSchedulerPickPools(players, gameweek)
  const excluded = await excludedPlayerCodes(gameweek?.id ?? null, season)

  const dateKey = istDateKey()
  const start = dayNumber(dateKey) % DAILY_ROTATION.length
  const wantsComparison = compareOverride ?? dayNumber(dateKey) % COMPARISON_EVERY === 2
  const requested = typeof angleOverride === 'string' && DAILY_ROTATION.includes(angleOverride as SchedulerPickAngle)
    ? [angleOverride as SchedulerPickAngle, ...DAILY_ROTATION.filter(angle => angle !== angleOverride)]
    : Array.from({ length: DAILY_ROTATION.length }, (_, index) => DAILY_ROTATION[(start + index) % DAILY_ROTATION.length]!)

  let selected: SchedulerPickCandidate[] = []
  let angle: SchedulerPickAngle | null = null
  for (const wanted of wantsComparison ? [2, 1] : [1]) {
    for (const candidateAngle of requested) {
      const candidates = pickCandidates(pools, candidateAngle, excluded, wanted)
      if (candidates.length >= wanted) {
        selected = candidates
        angle = candidateAngle
        break
      }
    }
    if (selected.length) break
  }
  if (!angle || !selected.length) return { skipped: 'No eligible story has a player outside the posted history today.' }

  const count = selected.length
  const commonStats = count > 1
    ? selected[0]!.stats.filter((key: InstagramStatKey) => selected[1]!.stats.includes(key))
    : selected[0]!.stats
  const stats = (commonStats.length ? commonStats : selected[0]!.stats).slice(0, count > 1 ? 3 : 4)
  const story = count > 1
    ? { ...selected[0]!.story, evidence: selected.map(candidate => `${candidate.player.name}: ${candidate.story.evidence}`).join(' · '), scope: undefined }
    : selected[0]!.story
  const draft: InstagramDraft = {
    design: 'daily',
    palette: 'club',
    template: count > 1 ? 'comparison' : 'spotlight',
    headline: count > 1 ? `${selected[0]!.player.name} vs ${selected[1]!.player.name}` : selected[0]!.player.fullName,
    players: selected.map(candidate => candidate.player),
    season,
    stats,
    gameweek: gameweek?.id ?? null,
    fixtures: [],
    story,
  }
  return { dateKey, angle, draft }
}

const captionTask = (platform: SchedulerCaptionPlatform) => `Write one ${platform === 'x' ? 'X' : 'Instagram'} caption for this FPL post. Follow the supplied story captionFocus and lead with its evidence when present. Use only supplied facts and the selected stats. Transfer rankings are among eligible scheduler players, not all FPL players. Do not infer injuries, starting lineups, reasons for transfers, future returns or transfer periods. Total points, goals, assists and minutes are season totals; transfers are gameweek totals, never 24-hour totals. Include #FPL. Return caption text only.`

function fallbackCaption(platform: SchedulerCaptionPlatform, draft: InstagramDraft) {
  const facts = draft.players.map(player => {
    const parts = [player.fullName]
    if (player.stats.now_cost != null) parts.push(`£${(player.stats.now_cost / 10).toFixed(1)}m`)
    if (player.stats.selected_by_percent != null) parts.push(`${player.stats.selected_by_percent.toFixed(1)}% owned`)
    if (player.stats.form != null) parts.push(`form ${player.stats.form.toFixed(1)}`)
    return parts.join(', ')
  }).join(' vs ')
  const lead = draft.story ? `${draft.story.label}: ${draft.story.evidence}.` : ''
  if (platform === 'x') {
    const value = `${lead} ${facts}. #FPL`.replace(/\s+/g, ' ').trim()
    return value.length <= 270 ? value : `${value.slice(0, 267).replace(/\s+\S*$/, '')}…`
  }
  return `${lead}\n\n${facts}.\n\n#FPL #FantasyPremierLeague`
}

/**
 * Writes both captions from the same draft. A provider outage falls back to a
 * factual caption so the daily slot is not silently skipped.
 */
export async function generateDailyCaptions(draft: InstagramDraft): Promise<DailyCaptions> {
  const prompt = { task: captionTask('instagram'), ...draft }
  const [instagram, x] = await Promise.all([
    generateSchedulerCaption('instagram', prompt),
    generateSchedulerCaption('x', { task: captionTask('x'), ...draft }),
  ])
  const usable = (result: Awaited<ReturnType<typeof generateSchedulerCaption>>) => result.success && typeof result.output === 'string' && result.output.trim() ? result.output.trim() : null
  const instagramText = usable(instagram)
  const xText = usable(x)
  return {
    instagram: instagramText ?? fallbackCaption('instagram', draft),
    x: xText ?? fallbackCaption('x', draft),
    fallbackUsed: !instagramText || !xText,
  }
}

async function uploadImage(png: Uint8Array, dateKey: string) {
  const config = useRuntimeConfig()
  const url = config.public.CLOUDINARY_UPLOAD_URL
  if (!url) throw createError({ statusCode: 503, statusMessage: 'Image upload is not configured on the server.' })
  const form = new FormData()
  form.append('file', new Blob([png], { type: 'image/png' }), `fpl-daily-${dateKey}.png`)
  form.append('upload_preset', String(config.public.CLOUDINARY_UPLOAD_PRESET || 'fpl-preset'))
  const response = await fetch(url, { method: 'POST', body: form, signal: AbortSignal.timeout(25_000) })
  const result = await response.json().catch(() => null) as { secure_url?: string } | null
  if (!response.ok || typeof result?.secure_url !== 'string' || !result.secure_url.startsWith('https://')) {
    throw createError({ statusCode: 502, statusMessage: 'The daily artwork could not be uploaded. Nothing was scheduled.' })
  }
  return result.secure_url
}

export async function uploadDailyImage(png: Uint8Array, dateKey: string) {
  return await uploadImage(png, dateKey)
}

/**
 * Reserves the paired Instagram and X post. Convex submits both to Buffer's
 * queue; `requestId` makes a repeated cron run on the same day a no-op.
 */
export async function publishDailyDraft(draft: InstagramDraft, captions: DailyCaptions, imageUrl: string, dateKey: string) {
  const [{ channel: instagram }, { channel: x }] = await Promise.all([
    schedulerScope('instagram'),
    schedulerScope('x'),
  ])
  const { client, secret } = schedulerDatabase()
  const draftJson = JSON.stringify(draft)
  const fingerprint = (caption: string) => createHash('sha256').update(JSON.stringify({ caption, draft: draftJson, image: null })).digest('hex')
  const requestId = `daily-${dateKey}`

  try {
    const reservations = await client.mutation(schedulerApi.schedulerHistory.reservePair, {
      secret,
      instagramChannelId: instagram.id,
      xChannelId: x.id,
      requestId,
      instagramFingerprint: fingerprint(captions.instagram),
      xFingerprint: fingerprint(captions.x),
      caption: captions.instagram,
      xCaption: captions.x,
      imageUrl,
      players: draft.players.map(player => ({ code: player.code, name: player.fullName })),
      gameweek: draft.gameweek,
      season: draft.season,
      template: draft.template,
      design: draft.design,
      draftJson,
      allowRepeat: false,
    })
    return { requestId, reservations }
  } catch (error) {
    const detail = error as { data?: { message?: string }; message?: string }
    throw createError({ statusCode: 502, statusMessage: detail?.data?.message || detail?.message || 'The daily post could not be reserved.' })
  }
}
