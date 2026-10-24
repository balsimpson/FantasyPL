import { getHomepageBootstrap } from '../../utils/homepage-data'
import type { ArticleLivePlayerData, ArticleLivePlayerResponse } from '~/shared/article-visuals'

const positionNames: Record<number, string> = { 1: 'Goalkeeper', 2: 'Defender', 3: 'Midfielder', 4: 'Forward' }
const numeric = (value: unknown) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null

export default defineEventHandler(async (event): Promise<ArticleLivePlayerResponse> => {
  const rawIds = getQuery(event).ids
  if (typeof rawIds !== 'string' || rawIds.length > 240) throw createError({ statusCode: 400, statusMessage: 'Player IDs are invalid.' })
  const tokens = rawIds.split(',')
  if (!tokens.length || tokens.length > 20 || tokens.some(token => !/^\d{1,10}$/.test(token))) throw createError({ statusCode: 400, statusMessage: 'Request up to 20 valid player IDs.' })
  const ids = [...new Set(tokens.map(Number))]
  if (ids.some(id => !Number.isSafeInteger(id) || id <= 0)) throw createError({ statusCode: 400, statusMessage: 'Player IDs are invalid.' })

  const data = await getHomepageBootstrap()
  const eventWeek = data.events.find((item: Record<string, any>) => item.is_next) || data.events.find((item: Record<string, any>) => item.is_current)
  const players: ArticleLivePlayerData[] = ids.flatMap(id => {
    const player = data.elements.find((item: Record<string, any>) => item.id === id)
    if (!player) return []
    const team = data.teams.find((item: Record<string, any>) => item.id === player.team)
    const live: ArticleLivePlayerData = {
      id: player.id,
      code: player.code,
      photoCode: String(player.code),
      first_name: player.first_name,
      second_name: player.second_name,
      web_name: player.web_name,
      teamName: team?.name || 'Club unavailable',
      teamCode: team?.code || 0,
      position: positionNames[player.element_type] || 'Player',
      price: (numeric(player.now_cost) ?? 0) / 10,
      points: numeric(player.total_points),
      pointsPerGame: numeric(player.points_per_game),
      minutes: numeric(player.minutes),
      form: numeric(player.form),
      ownership: numeric(player.selected_by_percent),
      goals: numeric(player.goals_scored),
      assists: numeric(player.assists),
      cleanSheets: numeric(player.clean_sheets),
      transfersIn: numeric(player.transfers_in_event),
      transfersOut: numeric(player.transfers_out_event),
      gameweek: eventWeek?.id ?? null,
    }
    return live.teamCode > 0 && live.price > 0 ? [live] : []
  })
  const teams = data.teams.flatMap((team: Record<string, any>) => Number.isSafeInteger(team.code) && team.code > 0 && typeof team.name === 'string' ? [{ code: team.code, name: team.name }] : [])
  return { capturedAt: data.fetchedAt, players, teams }
})
