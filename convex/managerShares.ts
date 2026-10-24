import { ConvexError, v } from 'convex/values'
import { mutation, query } from './_generated/server'

function authorize(secret: string) {
  if (!process.env.CONTENT_SERVICE_TOKEN || secret !== process.env.CONTENT_SERVICE_TOKEN) {
    throw new ConvexError({ code: 'FORBIDDEN', message: 'Share statistics access denied.' })
  }
}

export const record = mutation({
  args: { secret: v.string(), event: v.union(v.literal('click'), v.literal('copy')) },
  returns: v.null(),
  handler: async (ctx, args) => {
    authorize(args.secret)
    const day = new Date().toISOString().slice(0, 10)
    const existing = await ctx.db.query('managerShareStats').withIndex('by_day', q => q.eq('day', day)).unique()
    const clicks = (existing?.clicks ?? 0) + (args.event === 'click' ? 1 : 0)
    const copies = (existing?.copies ?? 0) + (args.event === 'copy' ? 1 : 0)
    if (existing) await ctx.db.patch(existing._id, { clicks, copies })
    else await ctx.db.insert('managerShareStats', { day, clicks, copies })
    return null
  },
})

export const summary = query({
  args: { secret: v.string() },
  returns: v.object({
    fromDay: v.string(), toDay: v.string(), clicks: v.number(), copies: v.number(),
    days: v.array(v.object({ day: v.string(), clicks: v.number(), copies: v.number() })),
  }),
  handler: async (ctx, args) => {
    authorize(args.secret)
    const today = new Date()
    const toDay = today.toISOString().slice(0, 10)
    today.setUTCDate(today.getUTCDate() - 29)
    const fromDay = today.toISOString().slice(0, 10)
    const rows = await ctx.db.query('managerShareStats')
      .withIndex('by_day', q => q.gte('day', fromDay).lte('day', toDay)).order('desc').take(30)
    const days = rows.map(({ day, clicks, copies }) => ({ day, clicks, copies }))
    return {
      fromDay, toDay, days,
      clicks: days.reduce((sum, day) => sum + day.clicks, 0),
      copies: days.reduce((sum, day) => sum + day.copies, 0),
    }
  },
})
