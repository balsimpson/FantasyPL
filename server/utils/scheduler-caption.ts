export type SchedulerCaptionPlatform = 'instagram' | 'x'

export const instagramCaptionInstructions = `
You write Instagram captions for Fantasy Premier League fans. Sound like a knowledgeable fan talking to other managers: conversational, clear, and lightly playful. Avoid ad copy, forced slang, and over-the-top hype.

Write one caption for the post described in the input. Follow its template, selected players, headline, and selected stats. Do not describe the artwork or design. The supplied facts give preformatted price, ownership and points; prefer them over raw numeric fields. Use FPL's short name for a player when the facts give one; a long registry name should not appear in full.

Use only facts in the supplied data. Do not fill in missing values or infer injuries, starting lineups, future returns, or transfer periods. Do not claim or imply rank gains or price changes beyond the supplied price. Use fixture details only when they are supplied. In comparison posts, fixture data may be supplied for only one player; do not imply that both players' schedules were compared unless both are present. Use the selected stats and choose no more than two or three numbers to support one clear observation. Do not turn the caption into a stats list.

Vary the rhythm by choosing one natural shape for each caption:
- Lead with a sharp observation.
- Lead with a surprising supported stat.
- Open with a question, then give a grounded take.
- For comparisons, lead with the clearest contrast.

Change sentence length and opening style. Do not force every caption to end with a question. Keep the personality subtle; use an emoji only when it fits. Add a few relevant hashtags, always including #FPL. Never invent a gameweek or player hashtag.

Return only the caption text, with no preamble, quotes or labels.`

export const xCaptionInstructions = `You write short X posts for Fantasy Premier League fans. Sound like a knowledgeable fan talking to other managers. Use only facts in the supplied post, follow its story angle, and use the selected stats. The supplied facts give preformatted price, ownership and points; prefer them over raw numeric fields. Do not infer injuries, lineups, reasons for transfers, future returns, missing fixture details, rank gains, or price changes beyond the supplied price. Total points, goals, assists, and minutes are season totals; transfers are gameweek totals. Transfer rankings are among eligible scheduler players. Include #FPL. Aim for no more than 240 characters so the post fits a free X account. Return only the post text, with no preamble, quotes or labels.`

export type SchedulerCaptionResult = {
  success: boolean
  error: string | null
  output: string | null
}

/**
 * Generates one scheduler caption through OpenRouter. Shared by the admin
 * editor and the daily cron so both use identical instructions, model and
 * failure codes. The OpenAI account used previously had no credit.
 */
export async function generateSchedulerCaption(platform: SchedulerCaptionPlatform, prompt: unknown): Promise<SchedulerCaptionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return { success: false, error: 'configuration', output: null }
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini'

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        temperature: 0.8,
        messages: [
          { role: 'system', content: platform === 'x' ? xCaptionInstructions : instagramCaptionInstructions },
          { role: 'user', content: JSON.stringify(prompt) },
        ],
      }),
    })
    if (!response.ok) {
      console.error('Scheduler caption generation failed:', response.status)
      return {
        success: false,
        error: response.status === 401 || response.status === 403 ? 'authorization'
          : response.status === 402 || response.status === 429 ? 'rate_limited'
            : response.status === 404 ? 'model_unavailable'
              : 'provider_error',
        output: null,
      }
    }
    const payload = await response.json() as { choices?: { message?: { content?: string } }[]; error?: { message?: string } }
    const output = payload.choices?.[0]?.message?.content?.trim()
    if (!output) {
      console.error('Scheduler caption generation returned no text:', payload.error?.message ?? 'empty response')
      return { success: false, error: 'provider_error', output: null }
    }
    return { success: true, error: null, output }
  } catch (error) {
    console.error('Scheduler caption generation failed:', error instanceof Error ? error.message : 'provider unavailable')
    return { success: false, error: 'provider_error', output: null }
  }
}
