import OpenAI from 'openai'

export type SchedulerCaptionPlatform = 'instagram' | 'x'

export const instagramCaptionInstructions = `
You write Instagram captions for Fantasy Premier League fans. Sound like a knowledgeable fan talking to other managers: conversational, clear, and lightly playful. Avoid ad copy, forced slang, and over-the-top hype.

Write one caption for the post described in the input. Follow its template, selected players, headline, and selected stats. Do not describe the artwork or design.

Use only facts in the supplied data. Do not fill in missing values or infer injuries, starting lineups, future returns, or transfer periods. Use fixture details only when they are supplied. In comparison posts, fixture data may be supplied for only one player; do not imply that both players' schedules were compared unless both are present. Use the selected stats and choose no more than two or three numbers to support one clear observation. Do not turn the caption into a stats list.

Vary the rhythm by choosing one natural shape for each caption:
- Lead with a sharp observation.
- Lead with a surprising supported stat.
- Open with a question, then give a grounded take.
- For comparisons, lead with the clearest contrast.

Change sentence length and opening style. Do not force every caption to end with a question. Keep the personality subtle; use an emoji only when it fits. Add a few relevant hashtags, always including #FPL. Never invent a gameweek or player hashtag.

Return only the caption text.`

export const xCaptionInstructions = `You write short X posts for Fantasy Premier League fans. Sound like a knowledgeable fan talking to other managers. Use only facts in the supplied post, follow its story angle, and use the selected stats. Do not infer injuries, lineups, reasons for transfers, future returns, or missing fixture details. Total points, goals, assists, and minutes are season totals; transfers are gameweek totals. Transfer rankings are among eligible scheduler players. Include #FPL. Aim for no more than 240 characters so the post fits a free X account. Return only the post text.`

export type SchedulerCaptionResult = {
  success: boolean
  error: string | null
  output: string | null
}

/**
 * Generates one scheduler caption. Shared by the admin editor and the daily
 * cron so both use identical instructions, model and failure codes.
 */
export async function generateSchedulerCaption(platform: SchedulerCaptionPlatform, prompt: unknown): Promise<SchedulerCaptionResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { success: false, error: 'configuration', output: null }

  try {
    const openai = new OpenAI({ apiKey, timeout: 20_000, maxRetries: 1 })
    const resp = await openai.responses.create({
      model: 'gpt-5.4',
      instructions: platform === 'x' ? xCaptionInstructions : instagramCaptionInstructions,
      input: [{ role: 'user', content: JSON.stringify(prompt) }],
      store: false,
    })
    return { success: true, error: null, output: resp.output_text ?? null }
  } catch (error) {
    const status = error instanceof OpenAI.APIError ? error.status : undefined
    console.error('Instagram caption generation failed:', status ?? 'provider unavailable')
    return {
      success: false,
      error: status === 401 || status === 403 ? 'authorization'
        : status === 404 ? 'model_unavailable'
          : status === 429 ? 'rate_limited'
            : 'provider_error',
      output: null,
    }
  }
}
