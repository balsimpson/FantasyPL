import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { getCurrentHomepageBuys, type HomepageBuySnapshot } from '../utils/homepage-buys'

const getSnapshot = makeFunctionReference<'query', Record<string, never>, HomepageBuySnapshot | null>('homepageTrades:getBuysSnapshot')

export default defineCachedEventHandler(async () => {
  const url = useRuntimeConfig().CONVEX_URL
  let record: HomepageBuySnapshot | null = null
  if (url) {
    try { record = await new ConvexHttpClient(url).query(getSnapshot, {}) }
    catch { /* Current FPL evidence remains available if the daily review is unavailable. */ }
  }
  try { return await getCurrentHomepageBuys(record) }
  catch { throw createError({ statusCode: 502, statusMessage: 'Recent buy recommendation data is temporarily unavailable.' }) }
}, { maxAge: 60, swr: false })
