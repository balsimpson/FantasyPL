import { requireAdmin } from '../../../utils/admin'
import { searchCommonsImages } from '../../../../shared/article-images'

/** Free-licence photo search for the article editor (Wikimedia Commons, keyless). */
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const query = String(getQuery(event).q || '').trim()
  if (!query || query.length > 120) throw createError({ statusCode: 400, statusMessage: 'Enter a short photo search of up to 120 characters.' })
  try { return await searchCommonsImages(query, 12) }
  catch { throw createError({ statusCode: 503, statusMessage: 'Wikimedia Commons is unavailable right now. Try again or upload a photo.' }) }
})
