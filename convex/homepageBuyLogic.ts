import { selectHomepageBuyIdeas, type HomepageBuyIdea } from '../shared/homepage-buys'
import type { TradePlayer } from '../shared/homepage-trades'

const dimensions = {
  performance: 'How strong is this player’s recent position-specific performance evidence? Weigh points against expected attacking involvement for outfield players, or clean sheets and saves for goalkeepers. Short samples and conflicting evidence reduce the rating.',
  value: 'How strong is this player’s value at the supplied price compared with the supplied candidates in the same position? Assess recent output and playing time. A cheap price alone is insufficient.',
  fixtures: 'How favourable are this player’s confirmed fixtures across the supplied gameweeks? Retain blank and double gameweeks; missing fixture information must lower the rating. Fixture difficulty is a coarse guide.',
}
const criteria = ['No supporting evidence or a material downside.', 'Weak supporting evidence.', 'Mixed or limited supporting evidence.', 'Good supporting evidence.', 'Strong supporting evidence.']

export async function reviewHomepageBuys(candidates: HomepageBuyIdea[], gameweeks: number[], fixtures: TradePlayer[], key: string) {
  if (!candidates.length) return { ideas: [], model: 'jev-latest' }
  const questions = Object.fromEntries(candidates.flatMap((candidate) => Object.entries(dimensions).map(([dimension, instruction]) => [
    `buy_${candidate.id}_${dimension}`,
    { type: 'score', criteria, instructions: `Evaluate candidate player ${candidate.id} only. ${instruction} Use supplied facts only. Transfers and ownership do not establish quality. Do not invent injuries, lineups, set-piece roles or future points. Official expected points cover the next gameweek only. These are generic buys, with no verified manager squad or bank.` },
  ])))
  const teams = new Set(candidates.map((candidate) => Number(candidate.player.team)))
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST', signal: AbortSignal.timeout(30_000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'jev-latest', state: {
      gameweeks,
      candidates: candidates.map(({ player, recent }) => ({
        player: Object.fromEntries(['id', 'team', 'element_type', 'now_cost', 'ep_next', 'status'].map((field) => [field, player[field] ?? null])), recent,
      })),
      fixtures: fixtures.filter((fixture) => gameweeks.includes(Number(fixture.event)) && (teams.has(Number(fixture.team_h)) || teams.has(Number(fixture.team_a))))
        .map((fixture) => Object.fromEntries(['event', 'team_h', 'team_a', 'team_h_difficulty', 'team_a_difficulty'].map((field) => [field, fixture[field] ?? null]))),
    }, questions }),
  })
  if (!response.ok) throw new Error(`JEV could not review buy ideas (${response.status}).`)
  const result = await response.json() as Record<string, any>
  if (!result.answers || typeof result.answers !== 'object') throw new Error('JEV returned no buy review.')
  // Missing/malformed answers indicate a failed review, not a valid empty shortlist.
  for (const id of Object.keys(questions)) {
    const answer = result.answers[id]
    if (answer?.type !== 'score' || typeof answer.score !== 'number' || !Number.isFinite(answer.score) || answer.score < 0 || answer.score > 4) {
      throw new Error('JEV returned an incomplete buy review.')
    }
  }
  const ideas = candidates.flatMap((candidate) => {
    const score = (dimension: string) => Number(result.answers[`buy_${candidate.id}_${dimension}`].score)
    const performance = score('performance')
    const value = score('value')
    const combined = performance * 0.5 + value * 0.3 + score('fixtures') * 0.2
    return performance >= 3 && value >= 2 && combined >= 3 ? [{ ...candidate, score: Math.round(combined * 100) / 100 }] : []
  })
  return { ideas: selectHomepageBuyIdeas(ideas), model: typeof result.model === 'string' ? result.model : 'jev-latest' }
}
