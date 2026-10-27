import { selectHomepageTradeIdeas, type TradePlayer } from '../shared/homepage-trades'

const BATCH_SIZE = 5
const scoreCriteria = [
  'Poor replacement: the supplied FPL data does not support this move.',
  'Weak or marginal case; meaningful downsides outweigh the available gains.',
  'Mixed or roughly balanced case.',
  'Credible improvement across the supplied performance and fixture evidence.',
  'Strong improvement across the supplied performance and fixture evidence.',
]

export async function reviewHomepageTrades(candidates: TradePlayer[], gameweek: number, gameweeks: number[], key: string) {
  const reviewed: TradePlayer[] = []
  let model: string | undefined
  for (let offset = 0; offset < candidates.length; offset += BATCH_SIZE) {
    const batch = candidates.slice(offset, offset + BATCH_SIZE)
    const questions = Object.fromEntries(batch.map((_, index) => {
      const questionId = `option_${offset + index + 1}`
      return [questionId, {
        type: 'score',
        instructions: `Evaluate only ${questionId}, the matching candidate in the supplied state. Score this same-position FPL swap for Gameweek ${gameweek}. Assess whether the replacement fills a comparable squad role using the supplied recent starts, minutes per match, points per appearance, position-specific expected goal involvement or clean-sheet evidence, next-gameweek estimate, and fixture runs. Outgoing players with 10%+ ownership have priority; the 5-10% group is a reserve. Ownership measures relevance, not a reason to sell. Buying activity is a minor supporting signal only. Each candidate has a deterministic reason and supporting evidence: reject marginal moves or material downsides even if that leaves fewer results. A flagged outgoing can be replaced by an available regular starter. Weigh trade-offs rather than requiring every statistic to improve. State is generic: no verified manager squad, selling price, bank, or club limit is supplied. Fixture runs retain blanks and doubles. Expected points cover the next gameweek only; do not invent multi-gameweek totals, injuries, roles, or lineups. Small samples lower confidence.`,
        criteria: scoreCriteria,
      }]
    }))
    const response = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'jev-latest',
        state: {
          targetGameweek: gameweek,
          comparisonGameweeks: gameweeks,
          dataNote: 'FPL expected points are for the next gameweek only. No multi-gameweek points projection is supplied.',
          candidates: batch.map((candidate, index) => ({ ...candidate, id: `option_${offset + index + 1}` })),
        },
        questions,
      }),
    })
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { detail?: unknown } | null
      const contextExceeded = JSON.stringify(detail?.detail ?? '').includes('max_tokens_exceeded')
      throw new Error(`JEV could not rank the trade ideas (${response.status}${contextExceeded ? ': context limit exceeded' : ''}).`)
    }
    const result = await response.json() as Record<string, any>
    if (!result.answers || typeof result.answers !== 'object') throw new Error('JEV returned no trade rankings.')
    const batchModel = typeof result.model === 'string' ? result.model : 'jev-latest'
    if (model && model !== batchModel) throw new Error('JEV returned different models for the trade review batches.')
    model = batchModel
    for (let index = 0; index < batch.length; index++) {
      const answer = result.answers[`option_${offset + index + 1}`]
      if (answer?.type !== 'score' || typeof answer.score !== 'number' || !Number.isFinite(answer.score) || answer.score < 0 || answer.score > 4) {
        throw new Error('JEV returned an incomplete trade review.')
      }
      if (answer.score < 3) continue
      const confidence = answer.confidence
      reviewed.push({
        ...batch[index],
        score: Math.round(answer.score * 10) / 10,
        confidence: typeof confidence === 'number' && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1 ? Math.round(confidence * 100) : null,
      })
    }
  }
  return { ideas: selectHomepageTradeIdeas(reviewed), model: model ?? 'jev-latest' }
}
