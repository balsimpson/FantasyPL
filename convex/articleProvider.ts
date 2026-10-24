export async function articleCompletion(messages: { role: 'system' | 'user'; content: string }[], options: { search?: boolean; schema?: Record<string, unknown> } = {}) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('Add OPENROUTER_API_KEY to the Convex environment before starting research or writing.')
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini'
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(120_000),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, max_tokens: 6500, temperature: options.search ? 0.3 : 0.7, messages,
      ...(options.search ? { plugins: [{ id: 'web', engine: 'exa', max_results: 8 }] } : {}),
      ...(options.schema ? { provider: { require_parameters: true }, response_format: { type: 'json_schema', json_schema: { name: 'content_engine', strict: true, schema: options.schema } } } : {}),
    }),
  })
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'OpenRouter denied access. Check the configured API key.' : response.status === 402 ? 'OpenRouter has no available credit for this request.' : response.status === 429 ? 'OpenRouter is busy. Try again later.' : 'OpenRouter could not complete this request. Please try again.')
  const payload = await response.json()
  const choice = payload.choices?.[0]
  if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string') throw new Error('OpenRouter returned an incomplete response. Your saved work is unchanged.')
  return { message: choice.message, model }
}

export function generationError(cause: unknown) {
  return cause instanceof Error && !/fetch|JSON|Unexpected|abort|timeout/i.test(cause.message) ? cause.message.slice(0, 500) : 'This background task could not complete. Your saved work is unchanged. Please try again.'
}
