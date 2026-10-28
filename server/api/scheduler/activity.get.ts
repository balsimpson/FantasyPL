import { schedulerApi, schedulerHistoryError, schedulerPlatform, schedulerScope } from '../../utils/scheduler-history'
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
    const platforms = query.platform === 'both' ? ['instagram', 'x'] as const : [schedulerPlatform(query.platform)]
    const results = await Promise.all(platforms.map(async platform => {
      const { client, secret, channel } = await schedulerScope(platform)
      return client.query(schedulerApi.schedulerHistory.activity, { secret, channelId: channel.id, codes, gameweek, season })
    }))
    const rows = results.flatMap(result => result.players)
    return {
      excludedCodes: [...new Set(results.flatMap(result => result.excludedCodes))],
      players: [...new Set(rows.map(row => row.code))].map(code => {
        const matches = rows.filter(row => row.code === code)
        const latest = matches.reduce((a, b) => (b.lastPostedAt ?? 0) > (a.lastPostedAt ?? 0) ? b : a)
        return { code, queued: matches.some(row => row.queued), postedThisGameweek: matches.some(row => row.postedThisGameweek), lastPostedAt: latest.lastPostedAt, lastPostId: latest.lastPostId }
      }),
    }
  } catch (error) { throw schedulerHistoryError(error) }
})
