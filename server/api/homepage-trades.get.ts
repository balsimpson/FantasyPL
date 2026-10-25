import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { getCurrentHomepageTrades } from '../utils/homepage-trades'

type HomepageTradeSnapshot = {
  snapshotJson: string
  generatedAt: number
  gameweek: number
  model: string
  sourceFetchedAt: number
}

const getHomepageTradeSnapshot = makeFunctionReference<
  'query',
  Record<string, never>,
  HomepageTradeSnapshot | null
>('homepageTrades:getSnapshot')

export default defineCachedEventHandler(async () => {
  const url = useRuntimeConfig().CONVEX_URL
  let record: HomepageTradeSnapshot | null = null
  if (url) {
    try {
      record = await new ConvexHttpClient(url).query(getHomepageTradeSnapshot, {})
    } catch {
      // A missing daily snapshot does not prevent evidence-based local suggestions.
    }
  }
  try {
    return await getCurrentHomepageTrades(record)
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Recent trade comparison data is temporarily unavailable.' })
  }
}, { maxAge: 60, swr: false })
