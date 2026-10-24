import { requireAdmin, requireAdminOrigin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const articleId = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  if (!/^[\da-f-]{36}$/i.test(articleId) || !body || !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 1) {
    throw createError({ statusCode: 400, statusMessage: 'The delete request is invalid.' })
  }
  const { client, secret, api } = articleDatabase()
  try {
    return { deleted: await client.mutation(api.articles.remove, { secret, articleId, expectedVersion: body.expectedVersion }) }
  } catch (error) { throw articleStorageError(error) }
})
