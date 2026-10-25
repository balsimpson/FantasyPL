export type TradePlayer = Record<string, any>
export type TradeRecentForm = {
  matches: number
  appearances: number
  starts: number
  minutes: number
  minutesPerMatch: number
  latestMinutes: number
  pointsPerAppearance: number | null
  attackingReturnsPer90: number | null
  cleanSheetRate: number | null
  savesPer90: number | null
}
export type TradeFormByPlayer = Record<string, TradeRecentForm>
export const HOMEPAGE_TRADE_VERSION = 2
export const MIN_TRADE_OUTGOING_OWNERSHIP_PERCENT = 5
export const PREFERRED_TRADE_OUTGOING_OWNERSHIP_PERCENT = 10

export const tradeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}
const stat = (player: TradePlayer, key: string) => tradeNumber(player[key]) ?? 0
const validPlayer = (player: TradePlayer) => ['id', 'team', 'element_type', 'now_cost'].every((key) =>
  Number.isSafeInteger(tradeNumber(player[key])) && Number(player[key]) > 0) && Number(player.element_type) <= 4
const availableIncoming = (player: TradePlayer) => validPlayer(player) && player.status === 'a' &&
  player.can_select !== false && player.can_transact !== false &&
  (tradeNumber(player.chance_of_playing_next_round) ?? 100) === 100 &&
  tradeNumber(player.ep_next) !== null && Number(player.ep_next) > 0
const ownershipTier = (player: TradePlayer) => stat(player, 'selected_by_percent') >= PREFERRED_TRADE_OUTGOING_OWNERSHIP_PERCENT ? 0 : 1

// Bound history research to 40 likely-owned players and eight buy options per position.
export function getHomepageTradeResearchPlayers(players: TradePlayer[]) {
  const outgoing = players.filter((player) => validPlayer(player) &&
    stat(player, 'selected_by_percent') >= MIN_TRADE_OUTGOING_OWNERSHIP_PERCENT)
    .sort((a, b) => stat(b, 'selected_by_percent') - stat(a, 'selected_by_percent')).slice(0, 40)
  const incoming = [1, 2, 3, 4].flatMap((position) => players.filter((player) => availableIncoming(player) &&
    Number(player.element_type) === position && stat(player, 'minutes') >= 180 && stat(player, 'starts') >= 2 &&
    outgoing.some((owned) => Number(owned.element_type) === position && Math.abs(Number(owned.now_cost) - Number(player.now_cost)) <= 5))
    .sort((a, b) => stat(b, 'ep_next') - stat(a, 'ep_next') || stat(b, 'form') - stat(a, 'form') || Number(a.id) - Number(b.id))
    .slice(0, 8))
  return [...new Map([...outgoing, ...incoming].map((player) => [Number(player.id), player])).values()]
}

export function compareHomepageTrades(a: TradePlayer, b: TradePlayer) {
  return ownershipTier(a.outgoing) - ownershipTier(b.outgoing) ||
    (b.score ?? b.evidenceScore) - (a.score ?? a.evidenceScore) ||
    b.evidenceScore - a.evidenceScore || stat(b.outgoing, 'selected_by_percent') - stat(a.outgoing, 'selected_by_percent') ||
    Number(a.outgoing.id) - Number(b.outgoing.id) || Number(a.incoming.id) - Number(b.incoming.id)
}

export function selectHomepageTradeIdeas(options: TradePlayer[], limit = 20) {
  const outgoing = new Set<number>()
  const incoming = new Set<number>()
  return [...options].sort(compareHomepageTrades).filter((option) => {
    const sell = Number(option.outgoing.id)
    const buy = Number(option.incoming.id)
    if (outgoing.has(sell) || incoming.has(buy)) return false
    outgoing.add(sell)
    incoming.add(buy)
    return true
  }).slice(0, limit)
}

export function buildHomepageTradeOptions(
  players: TradePlayer[], fixtures: TradePlayer[], gameweeks: number[], recentForm: TradeFormByPlayer,
) {
  if (!gameweeks.length) return []
  const difficulties = new Map<number, number[]>()
  for (const fixture of fixtures) {
    if (!gameweeks.includes(Number(fixture.event))) continue
    for (const [team, key] of [[fixture.team_h, 'team_h_difficulty'], [fixture.team_a, 'team_a_difficulty']] as const) {
      const value = tradeNumber(fixture[key])
      if (value === null || value < 1 || value > 5) continue
      difficulties.set(Number(team), [...(difficulties.get(Number(team)) ?? []), value])
    }
  }
  const difficulty = (team: number) => {
    const values = difficulties.get(team)
    return values?.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
  }
  const researched = getHomepageTradeResearchPlayers(players)
  const outgoingPlayers = researched.filter((player) => stat(player, 'selected_by_percent') >= MIN_TRADE_OUTGOING_OWNERSHIP_PERCENT)
  const incomingPlayers = researched.filter((player) => {
    const form = recentForm[String(player.id)]
    return availableIncoming(player) && form && form.matches >= 3 && form.appearances >= 3 &&
      form.starts / form.matches >= 0.65 && form.minutesPerMatch >= 60 && form.latestMinutes >= 120
  })
  const options: TradePlayer[] = []
  for (const outgoing of outgoingPlayers) {
    const outgoingRecent = recentForm[String(outgoing.id)]
    if (!outgoingRecent || outgoingRecent.matches < 3 || tradeNumber(outgoing.ep_next) === null) continue
    for (const incoming of incomingPlayers) {
      if (Number(outgoing.id) === Number(incoming.id) || Number(outgoing.element_type) !== Number(incoming.element_type)) continue
      const priceChange = (Number(incoming.now_cost) - Number(outgoing.now_cost)) / 10
      if (Math.abs(priceChange) > 0.5) continue
      const incomingRecent = recentForm[String(incoming.id)]!
      const expectedPointsGain = Number(incoming.ep_next) - Number(outgoing.ep_next)
      const recentPointsGain = outgoingRecent.pointsPerAppearance === null || incomingRecent.pointsPerAppearance === null
        ? null : incomingRecent.pointsPerAppearance - outgoingRecent.pointsPerAppearance
      const recentOutputGain = recentPointsGain ?? 0
      const minutesGain = incomingRecent.minutesPerMatch - outgoingRecent.minutesPerMatch
      const availabilityIssue = ['i', 's', 'u', 'n', 'd'].includes(outgoing.status)
      // Healthy regular starters need a replacement with comparable minutes and output.
      if (expectedPointsGain < -0.5 || (!availabilityIssue &&
        (minutesGain < -15 || recentOutputGain < -1.5 || stat(incoming, 'points_per_game') < stat(outgoing, 'points_per_game') - 1.5))) continue
      const outgoingDifficulty = difficulty(Number(outgoing.team))
      const incomingDifficulty = difficulty(Number(incoming.team))
      const fixtureAdvantage = outgoingDifficulty === null || incomingDifficulty === null ? null : outgoingDifficulty - incomingDifficulty
      const position = Number(incoming.element_type)
      const attackingGain = incomingRecent.attackingReturnsPer90 === null || outgoingRecent.attackingReturnsPer90 === null
        ? null : incomingRecent.attackingReturnsPer90 - outgoingRecent.attackingReturnsPer90
      const cleanSheetGain = incomingRecent.cleanSheetRate === null || outgoingRecent.cleanSheetRate === null
        ? null : incomingRecent.cleanSheetRate - outgoingRecent.cleanSheetRate
      const positionSupport = position <= 2
        ? (cleanSheetGain !== null && cleanSheetGain >= 0.15) || (position === 2 && attackingGain !== null && attackingGain >= 0.15)
        : attackingGain !== null && attackingGain >= 0.15
      const availabilityReasons: Record<string, string> = {
        i: 'is injured.',
        d: 'is a doubt for the next game.',
        s: 'is suspended.',
        u: 'is unavailable.',
        n: 'is unavailable.',
      }
      const reasons: string[] = []
      if (availabilityIssue) reasons.push(`${outgoing.web_name} ${availabilityReasons[outgoing.status]}`)
      if (minutesGain >= 15 && outgoingRecent.minutesPerMatch < 60) reasons.push(`${incoming.web_name} has played more minutes per match than ${outgoing.web_name}.`)
      if (fixtureAdvantage !== null && fixtureAdvantage >= 0.6 && recentOutputGain >= -0.75) reasons.push(`${incoming.web_name} has easier fixtures over the next ${gameweeks.length} gameweeks.`)
      if (recentOutputGain >= 1 && (expectedPointsGain >= 0 || positionSupport)) reasons.push(`${incoming.web_name} has scored more points per appearance recently.`)
      if (expectedPointsGain >= 1 && recentOutputGain >= -0.75) reasons.push(`FPL expects ${incoming.web_name} to score ${expectedPointsGain.toFixed(1)} more points in GW ${gameweeks[0]}.`)
      if (priceChange <= -0.3 && expectedPointsGain >= -0.3 && recentOutputGain >= -0.5 && minutesGain >= -5) reasons.push(`${incoming.web_name} costs £${Math.abs(priceChange).toFixed(1)}m less, with similar recent points and minutes.`)
      if (!reasons.length) continue
      // Buying activity is a small tie-break, never a substitute for performance evidence.
      const buyingSignal = Math.min(0.15, Math.log10(1 + Math.max(0, stat(incoming, 'transfers_in_event'))) / 40)
      const evidenceScore = Math.max(-1, Math.min(3, expectedPointsGain)) * 0.5 +
        Math.max(-1.5, Math.min(3, recentOutputGain)) * 0.5 +
        Math.max(-1, Math.min(1.5, fixtureAdvantage ?? 0)) * 0.6 +
        Math.max(-0.5, Math.min(1, minutesGain / 30)) * 0.5 +
        (availabilityIssue ? 1 : 0) + (positionSupport ? 0.25 : 0) + buyingSignal
      options.push({
        id: `${outgoing.id}-${incoming.id}`, outgoing, incoming, outgoingRecent, incomingRecent,
        expectedPointsGain, recentPointsGain, minutesGain,
        formGain: stat(incoming, 'form') - stat(outgoing, 'form'),
        pointsPerGameGain: stat(incoming, 'points_per_game') - stat(outgoing, 'points_per_game'),
        priceChange, outgoingDifficulty, incomingDifficulty, fixtureAdvantage, evidenceScore,
        reason: reasons[0], reasons,
        sampleNote: Math.min(outgoingRecent.matches, incomingRecent.matches) < 4 ? `Only ${Math.min(outgoingRecent.matches, incomingRecent.matches)} recent matches to compare.` : null,
      })
    }
  }
  return options.sort(compareHomepageTrades)
}
