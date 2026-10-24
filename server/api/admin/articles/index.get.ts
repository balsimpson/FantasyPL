import { requireAdmin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const cursor = getQuery(event).cursor
  if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 4000)) throw createError({ statusCode: 400, statusMessage: 'The article list cursor is invalid.' })
  const { client, secret, api } = articleDatabase()
  try { return await client.query(api.articles.list, { secret, paginationOpts: { numItems: 30, cursor: cursor as string || null } }) }
  catch (error) { throw articleStorageError(error) }
})
