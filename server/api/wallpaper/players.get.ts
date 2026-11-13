import { getCachedFplBootstrap } from '../../utils/fpl-bootstrap'
import { getFplFixtureSchedule } from '../../utils/manager-fixtures'

// Only the fields the wallpaper picker and artwork need; the full bootstrap is much larger.
const playerFields = [
  'id', 'code', 'photo', 'web_name', 'first_name', 'second_name', 'team', 'team_code', 'element_type', 'status', 'birth_date',
  'now_cost', 'form', 'total_points', 'event_points', 'selected_by_percent', 'goals_scored', 'assists', 'minutes', 'points_per_game',
  'transfers_in_event', 'transfers_out_event', 'clean_sheets', 'saves', 'bonus',
]

export default defineCachedEventHandler(async () => {
  const [{ data, fetchedAt }, fixtures] = await Promise.all([
    getCachedFplBootstrap(),
    // Fixtures only feed optional preview widgets, so an outage leaves them hidden.
    getFplFixtureSchedule().catch(() => [] as Awaited<ReturnType<typeof getFplFixtureSchedule>>),
  ])
  const events: Record<string, any>[] = Array.isArray(data.events) ? data.events : []
  const firstDeadline = events[0]?.deadline_time ? new Date(events[0].deadline_time) : null
  const startYear = firstDeadline && !Number.isNaN(firstDeadline.getTime()) ? firstDeadline.getUTCFullYear() : null
  const next = events.find(event => event.is_next)

  const upcoming = fixtures
    .filter(fixture => !fixture.started && fixture.event != null && fixture.kickoff_time)
    .sort((a, b) => Date.parse(a.kickoff_time) - Date.parse(b.kickoff_time))
  const nextFixtures: { team: number; opponent: number; home: boolean; kickoff: string | null; event: number | null }[] = []
  for (const fixture of upcoming) {
    if (!nextFixtures.some(item => item.team === fixture.team_h)) nextFixtures.push({ team: fixture.team_h, opponent: fixture.team_a, home: true, kickoff: fixture.kickoff_time, event: fixture.event })
    if (!nextFixtures.some(item => item.team === fixture.team_a)) nextFixtures.push({ team: fixture.team_a, opponent: fixture.team_h, home: false, kickoff: fixture.kickoff_time, event: fixture.event })
  }

  return {
    players: (data.elements as Record<string, any>[])
      .filter(player => [1, 2, 3, 4].includes(player.element_type))
      .map(player => Object.fromEntries(playerFields.map(field => [field, player[field] ?? null]))),
    teams: (data.teams as Record<string, any>[]).map(team => ({ id: team.id, code: team.code, name: team.name, short_name: team.short_name })),
    currentGameweek: events.find(event => event.is_current)?.id ?? null,
    nextGameweek: next?.id ?? null,
    deadline: next?.deadline_time ?? null,
    season: startYear ? `${String(startYear).slice(2)}/${String(startYear + 1).slice(2)}` : null,
    nextFixtures,
    fetchedAt,
  }
}, { name: 'wallpaper-players-v1', maxAge: 600, swr: true })
