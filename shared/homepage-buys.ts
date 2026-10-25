import { tradeNumber, type TradeFormByPlayer, type TradePlayer, type TradeRecentForm } from './homepage-trades'

export const HOMEPAGE_BUY_VERSION = 1
export type HomepageBuyIdea = {
  id: number
  code: number
  player: TradePlayer
  recent: TradeRecentForm
  label: string
  reason: string
  caution: string | null
  evidenceScore: number
  score?: number
}
const stat = (player: TradePlayer, key: string) => tradeNumber(player[key]) ?? 0
const regularRecent = (recent: TradeRecentForm | undefined): recent is TradeRecentForm => Boolean(recent &&
  recent.matches >= 3 && recent.appearances >= 3 && recent.starts / recent.matches >= 0.65 && recent.minutesPerMatch >= 60 && recent.latestMinutes >= 120)
export const availableBuy = (player: TradePlayer) =>
  ['id', 'code', 'team', 'element_type', 'now_cost'].every((key) => Number.isSafeInteger(tradeNumber(player[key])) && stat(player, key) > 0) &&
  stat(player, 'element_type') <= 4 && player.status === 'a' && player.can_select !== false && player.can_transact !== false &&
  (tradeNumber(player.chance_of_playing_next_round) ?? 100) === 100 && stat(player, 'ep_next') > 0

// Each route into the research pool is independent of transfers and ownership.
export function getHomepageBuyResearchPlayers(players: TradePlayer[], fixtures: TradePlayer[], gameweeks: number[]) {
  const fixtureScore = (team: number) => fixtures.reduce((sum, fixture) => {
    if (!gameweeks.includes(Number(fixture.event))) return sum
    const difficulty = Number(fixture.team_h) === team ? tradeNumber(fixture.team_h_difficulty)
      : Number(fixture.team_a) === team ? tradeNumber(fixture.team_a_difficulty) : null
    return sum + (difficulty !== null && difficulty >= 1 && difficulty <= 5 ? 6 - difficulty : 0)
  }, 0)
  return [1, 2, 3, 4].flatMap((position) => {
    const eligible = players.filter((player) => availableBuy(player) && Number(player.element_type) === position && stat(player, 'minutes') >= 180 && stat(player, 'starts') >= 2)
    const signals = [
      (p: TradePlayer) => stat(p, 'ep_next'),
      (p: TradePlayer) => stat(p, 'points_per_game') / stat(p, 'now_cost'),
      (p: TradePlayer) => position <= 2 ? stat(p, 'clean_sheets') / Math.max(1, stat(p, 'starts')) + stat(p, 'saves_per_90') / 10
        : stat(p, 'expected_goals_per_90') + stat(p, 'expected_assists_per_90'),
      (p: TradePlayer) => fixtureScore(Number(p.team)) + stat(p, 'points_per_game') / 10,
    ]
    const routes = signals.map((signal) => [...eligible].sort((a, b) => signal(b) - signal(a) || Number(a.id) - Number(b.id)))
    const selected = new Map<number, TradePlayer>()
    for (let index = 0; index < eligible.length && selected.size < 12; index++) {
      for (const route of routes) {
        const player = route[index]
        if (player && selected.size < 12) selected.set(Number(player.id), player)
      }
    }
    return [...selected.values()]
  })
}

export function buildHomepageBuyIdeas(players: TradePlayer[], fixtures: TradePlayer[], gameweeks: number[], recentForm: TradeFormByPlayer): HomepageBuyIdea[] {
  if (!gameweeks.length) return []
  const candidates = getHomepageBuyResearchPlayers(players, fixtures, gameweeks)
  return candidates.flatMap((player) => {
    const recent = recentForm[String(player.id)]
    if (!regularRecent(recent)) return []
    const position = Number(player.element_type)
    const attacking = recent.attackingReturnsPer90
    const defensive = recent.cleanSheetRate
    const points = recent.pointsPerAppearance
    const threat = attacking !== null && attacking >= (position === 2 ? 0.2 : 0.4) && position !== 1
    const defence = position <= 2 && defensive !== null && defensive >= 0.33
    const output = points !== null && points >= 4
    if (!threat && !defence && !output) return []

    const run = gameweeks.map((gameweek) => fixtures.flatMap((fixture) => {
      if (Number(fixture.event) !== gameweek) return []
      const difficulty = Number(fixture.team_h) === Number(player.team) ? tradeNumber(fixture.team_h_difficulty)
        : Number(fixture.team_a) === Number(player.team) ? tradeNumber(fixture.team_a_difficulty) : null
      return difficulty !== null && difficulty >= 1 && difficulty <= 5 ? [difficulty] : []
    }))
    // A blank must not improve an average fixture rating or qualify as a good run.
    const easyMatches = run.flat().filter((difficulty) => difficulty <= 2).length
    const goodRun = run.every((week) => week.length > 0) && easyMatches >= 2
    const peers = candidates.filter((peer) => Number(peer.element_type) === position && Math.abs(Number(peer.now_cost) - Number(player.now_cost)) <= 10 && regularRecent(recentForm[String(peer.id)]))
    const value = (points ?? 0) / (Number(player.now_cost) / 10)
    const betterValue = peers.filter((peer) => (recentForm[String(peer.id)]?.pointsPerAppearance ?? 0) / (Number(peer.now_cost) / 10) > value).length
    const strongValue = points !== null && peers.length >= 4 && betterValue < Math.ceil(peers.length / 4) && output
    const label = goodRun ? 'Favourable fixtures' : strongValue ? 'Good value' : threat ? 'Attacking threat' : defence ? 'Defensive form' : 'Consistent points'
    const reason = goodRun ? `${easyMatches} matches rated 1 or 2 for difficulty across the next ${gameweeks.length} gameweeks.`
      : strongValue ? `${points!.toFixed(1)} points per appearance recently at £${(Number(player.now_cost) / 10).toFixed(1)}m.`
      : threat ? `${attacking!.toFixed(2)} expected goals and assists per 90 over the recent match window.`
      : defence ? `${Math.round(defensive! * 100)}% clean-sheet rate across ${recent.appearances} recent appearances.`
      : `${points!.toFixed(1)} points per appearance across ${recent.appearances} recent appearances.`
    const caution = recent.matches < 5 ? `Only ${recent.matches} recent matches to compare.`
      : run.some((week) => !week.length) ? 'At least one upcoming gameweek has no confirmed fixture.'
      : recent.minutesPerMatch < 75 ? `Averaged ${Math.round(recent.minutesPerMatch)} minutes per match recently.` : null
    return [{ id: Number(player.id), code: Number(player.code), player, recent, label, reason, caution,
      evidenceScore: Math.min(2, (points ?? 0) / 3) + Math.min(1, (attacking ?? 0)) +
        (defence ? 0.5 : 0) + (goodRun ? 0.6 : 0) + (strongValue ? 0.4 : 0) + Math.min(0.5, stat(player, 'ep_next') / 12) }]
  }).sort((a, b) => b.evidenceScore - a.evidenceScore || a.id - b.id)
}

// Spread strong picks across positions, price bands and reasons without filling weak slots.
export function selectHomepageBuyIdeas(ideas: HomepageBuyIdea[], limit = 20) {
  const remaining = [...new Map(ideas.map((idea) => [idea.id, idea])).values()]
  const selected: HomepageBuyIdea[] = []
  const band = (idea: HomepageBuyIdea) => Number(idea.player.now_cost) <= [0, 50, 55, 65, 70][Number(idea.player.element_type)]! ? 'budget' : 'premium'
  while (remaining.length && selected.length < limit) {
    const score = (idea: HomepageBuyIdea) => (idea.score ?? idea.evidenceScore) +
      (selected.some((pick) => pick.player.element_type === idea.player.element_type) ? 0 : 0.6) +
      (selected.some((pick) => band(pick) === band(idea)) ? 0 : 0.3) +
      (selected.some((pick) => pick.label === idea.label) ? 0 : 0.2)
    remaining.sort((a, b) => score(b) - score(a) || b.evidenceScore - a.evidenceScore || a.id - b.id)
    const index = remaining.findIndex((idea) => selected.filter((pick) => pick.player.team === idea.player.team).length < 2)
    if (index < 0) break
    selected.push(remaining.splice(index, 1)[0]!)
  }
  return selected
}
