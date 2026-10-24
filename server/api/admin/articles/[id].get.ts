import { requireAdmin } from '../../../utils/admin'
import { articleDatabase, articleResponse, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const articleId = getRouterParam(event, 'id') || ''
  if (!/^[\da-f-]{36}$/i.test(articleId)) throw createError({ statusCode: 404, statusMessage: 'Article not found.' })
  const { client, secret, api } = articleDatabase()
  let article
  try { article = await client.query(api.articles.get, { secret, articleId }) }
  catch (error) { throw articleStorageError(error) }
  if (!article) throw createError({ statusCode: 404, statusMessage: 'Article not found.' })
  return articleResponse(article)
})
