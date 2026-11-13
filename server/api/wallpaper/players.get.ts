import { getCachedFplBootstrap } from '../../utils/fpl-bootstrap'

// Only the fields the wallpaper picker and artwork need; the full bootstrap is much larger.
const playerFields = [
  'id', 'code', 'photo', 'web_name', 'first_name', 'second_name', 'team', 'team_code', 'element_type', 'status', 'birth_date',
  'now_cost', 'form', 'total_points', 'event_points', 'selected_by_percent', 'goals_scored', 'assists', 'minutes', 'points_per_game',
  'transfers_in_event', 'transfers_out_event', 'clean_sheets', 'saves', 'bonus',
]

export default defineCachedEventHandler(async () => {
  const { data, fetchedAt } = await getCachedFplBootstrap()
  const events: Record<string, any>[] = Array.isArray(data.events) ? data.events : []
  const firstDeadline = events[0]?.deadline_time ? new Date(events[0].deadline_time) : null
  const startYear = firstDeadline && !Number.isNaN(firstDeadline.getTime()) ? firstDeadline.getUTCFullYear() : null

  return {
    players: (data.elements as Record<string, any>[])
      .filter(player => [1, 2, 3, 4].includes(player.element_type))
      .map(player => Object.fromEntries(playerFields.map(field => [field, player[field] ?? null]))),
    teams: (data.teams as Record<string, any>[]).map(team => ({ id: team.id, code: team.code, name: team.name, short_name: team.short_name })),
    currentGameweek: events.find(event => event.is_current)?.id ?? null,
    season: startYear ? `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}` : null,
    fetchedAt,
  }
}, { name: 'wallpaper-players-v1', maxAge: 600, swr: true })
