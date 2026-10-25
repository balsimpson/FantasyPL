import { buildHomepageTradeOptions, type TradeFormByPlayer } from '../shared/homepage-trades'
type Player = Record<string, any>
type Fixture = Record<string, any>
type Team = Record<string, any>

const asNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const playerFields = [
  'id', 'code', 'first_name', 'second_name', 'web_name', 'team', 'element_type', 'now_cost',
  'selected_by_percent', 'transfers_in_event', 'form', 'total_points', 'points_per_game', 'ep_next', 'minutes', 'starts', 'status', 'chance_of_playing_next_round',
]

function summarizePlayer(player: Player) {
  return Object.fromEntries(playerFields.map((field) => [field, player[field] ?? null]))
}

export function buildHomepageTradeCandidates(
  players: Player[],
  teams: Team[],
  fixtures: Fixture[],
  events: Player[],
  candidateLimit = 30,
  recentForm: TradeFormByPlayer = {},
) {
  const nextEvent = events.find((event) => event.is_next)
  const nextGameweek = asNumber(nextEvent?.id)
  if (nextGameweek === null) return { gameweek: null, gameweeks: [], candidates: [] }

  const gameweeks = events
    .filter((event) => asNumber(event.id) !== null && Number(event.id) >= nextGameweek && !event.finished)
    .sort((a, b) => Number(a.id) - Number(b.id))
    .slice(0, 5)
    .map((event) => Number(event.id))
  const gameweekSet = new Set(gameweeks)
  const teamById = new Map(teams.map((team) => [Number(team.id), team]))
  const fixtureRuns = new Map<number, Array<Record<string, any>>>()
  for (const team of teams) {
    const teamId = asNumber(team.id)
    if (teamId !== null) fixtureRuns.set(teamId, gameweeks.map((gameweek) => ({ gameweek, matches: [] })))
  }

  for (const fixture of fixtures) {
    const gameweek = asNumber(fixture.event)
    const homeId = asNumber(fixture.team_h)
    const awayId = asNumber(fixture.team_a)
    if (gameweek === null || !gameweekSet.has(gameweek) || homeId === null || awayId === null) continue
    for (const [teamId, opponentId, venue, difficultyField] of [
      [homeId, awayId, 'H', 'team_h_difficulty'],
      [awayId, homeId, 'A', 'team_a_difficulty'],
    ] as const) {
      const opponent = teamById.get(opponentId)
      const difficulty = asNumber(fixture[difficultyField])
      const run: Array<Record<string, any>> = fixtureRuns.get(teamId) ?? gameweeks.map((weekId) => ({ gameweek: weekId, matches: [] }))
      const week: Record<string, any> = run.find((item) => item.gameweek === gameweek) ?? { gameweek, matches: [] }
      if (!run.includes(week)) run.push(week)
      week.matches.push({
        id: Number(fixture.id),
        opponent: opponent?.name ?? opponent?.short_name ?? 'Opponent TBC',
        opponentCode: opponent?.code ?? null,
        venue,
        difficulty: difficulty !== null && difficulty >= 1 && difficulty <= 5 ? difficulty : null,
        kickoff: fixture.kickoff_time ?? null,
      })
      fixtureRuns.set(teamId, run)

    }
  }

  for (const run of fixtureRuns.values()) {
    run.sort((a, b) => a.gameweek - b.gameweek)
    for (const week of run) week.matches.sort((a: any, b: any) => String(a.kickoff ?? '9999').localeCompare(String(b.kickoff ?? '9999')))
  }
  const outgoingCounts = new Map<number, number>()
  const candidates = buildHomepageTradeOptions(players, fixtures, gameweeks, recentForm)
    .filter((option) => {
      const id = Number(option.outgoing.id)
      const count = outgoingCounts.get(id) ?? 0
      if (count >= 2) return false
      outgoingCounts.set(id, count + 1)
      return true
    }).slice(0, candidateLimit).map((option) => ({
      ...option,
      outgoing: summarizePlayer(option.outgoing),
      incoming: summarizePlayer(option.incoming),
      fixtures: (fixtureRuns.get(Number(option.incoming.team)) ?? []).slice(0, 3),
      incomingFixtures: fixtureRuns.get(Number(option.incoming.team)) ?? [],
      outgoingFixtures: fixtureRuns.get(Number(option.outgoing.team)) ?? [],
    }))

  return { gameweek: nextGameweek, gameweeks, candidates }
}
