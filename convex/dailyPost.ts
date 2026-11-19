import { v } from 'convex/values'
import { internalAction } from './_generated/server'

/**
 * Calls the Nuxt daily scheduler endpoint with the shared service token.
 * The endpoint builds the artwork, captions and paired Buffer reservation.
 */
export const trigger = internalAction({
  args: { dry: v.optional(v.boolean()) },
  returns: v.object({ ok: v.boolean(), status: v.number() }),
  handler: async (_ctx, args) => {
    const token = process.env.SCHEDULER_SERVICE_TOKEN
    if (!token) {
      console.error('Daily post: SCHEDULER_SERVICE_TOKEN is missing in the Convex environment.')
      return { ok: false, status: 0 }
    }
    const url = `https://www.sportsync.in/api/cron/daily-post${args.dry ? '?dry=1' : ''}`
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(60_000),
    })
    const body = await response.text()
    console.log(`Daily post ${response.status}`, body.slice(0, 500))
    return { ok: response.ok, status: response.status }
  },
})
