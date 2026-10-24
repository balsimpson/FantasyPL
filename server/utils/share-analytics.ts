import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'

type ShareEvent = 'click' | 'copy'
type ShareSummary = {
  fromDay: string; toDay: string; clicks: number; copies: number
  days: { day: string; clicks: number; copies: number }[]
}

export const shareRecord = makeFunctionReference<'mutation', { secret: string; event: ShareEvent }, null>('managerShares:record')
export const shareSummary = makeFunctionReference<'query', { secret: string }, ShareSummary>('managerShares:summary')

export function shareAnalyticsDatabase() {
  const config = useRuntimeConfig()
  const url = config.contentConvexUrl || config.CONVEX_URL
  if (!url || !config.contentServiceToken) {
    throw createError({ statusCode: 503, statusMessage: 'Share statistics are not configured.' })
  }
  return { client: new ConvexHttpClient(url), secret: config.contentServiceToken }
}
