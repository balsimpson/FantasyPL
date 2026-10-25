import { getHomepageTradeResearchPlayers, tradeNumber, type TradeFormByPlayer, type TradePlayer, type TradeRecentForm } from './homepage-trades'

export function summarizeHomepageTradeForm(history: TradePlayer[], completedGameweeks: number[]): TradeRecentForm | null {
  const matches = history.filter((match) => completedGameweeks.includes(Number(match.round)))
    .sort((a, b) => String(a.kickoff_time).localeCompare(String(b.kickoff_time)))
  if (!matches.length || matches.some((match) => ['minutes', 'starts', 'total_points'].some((key) => tradeNumber(match[key]) === null))) return null
  const sum = (key: string) => matches.reduce((total, match) => total + Number(match[key]), 0)
  const minutes = sum('minutes')
  const appearances = matches.filter((match) => Number(match.minutes) > 0).length
  const rate = (key: string) => minutes > 0 && matches.every((match) => tradeNumber(match[key]) !== null) ? sum(key) * 90 / minutes : null
  return {
    matches: matches.length, appearances, starts: sum('starts'), minutes,
    minutesPerMatch: minutes / matches.length,
    latestMinutes: matches.slice(-2).reduce((total, match) => total + Number(match.minutes), 0),
    pointsPerAppearance: appearances ? sum('total_points') / appearances : null,
    attackingReturnsPer90: rate('expected_goal_involvements'),
    cleanSheetRate: appearances && matches.every((match) => tradeNumber(match.clean_sheets) !== null) ? sum('clean_sheets') / appearances : null,
    savesPer90: rate('saves'),
  }
}

export async function fetchHomepageTradeForm(players: TradePlayer[], events: TradePlayer[], researchPlayers?: TradePlayer[]): Promise<TradeFormByPlayer> {
  // Use completed gameweeks only, retaining zero-minute records and double-gameweek matches.
  const completed = events.filter((event) => event.finished).map((event) => Number(event.id)).sort((a, b) => b - a).slice(0, 6)
  if (!completed.length) return {}
  const research = researchPlayers ?? getHomepageTradeResearchPlayers(players)
  const result: TradeFormByPlayer = {}
  let cursor = 0
  await Promise.all(Array.from({ length: Math.min(6, research.length) }, async () => {
    while (cursor < research.length) {
      const player = research[cursor++]!
      try {
        const response = await fetch(`https://fantasy.premierleague.com/api/element-summary/${Number(player.id)}/`, { signal: AbortSignal.timeout(8_000) })
        if (!response.ok) continue
        const data = await response.json() as { history?: TradePlayer[] }
        const form = Array.isArray(data.history) ? summarizeHomepageTradeForm(data.history, completed) : null
        if (form) result[String(player.id)] = form
      } catch {
        // Missing history excludes that player; it must not become invented recent form.
      }
    }
  }))
  if (research.length && !Object.keys(result).length) throw new Error('Recent FPL match data is temporarily unavailable.')
  return result
}
