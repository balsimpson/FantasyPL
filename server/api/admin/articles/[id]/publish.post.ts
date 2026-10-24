import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'

export default defineEventHandler(async event => {
  const user = await requireAdmin(event)
  requireAdminOrigin(event)
  const articleId = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  if (!/^[\da-f-]{36}$/i.test(articleId) || !body || !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 1) throw createError({ statusCode: 400, statusMessage: 'The publish request is invalid.' })
  const { client, secret, api } = articleDatabase()
  try {
    const article = await client.mutation(api.articles.publish, { secret, articleId, expectedVersion: body.expectedVersion, publishedBy: user.name?.trim() || user.login })
    return { slug: article.publishedSlug, publishedAt: article.publishedAt, publishedVersion: article.publishedVersion }
  } catch (error) { throw articleStorageError(error) }
})
