import { requireAdmin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const articleId = getRouterParam(event, 'id') || ''
  if (!/^[\da-f-]{36}$/i.test(articleId)) throw createError({ statusCode: 404, statusMessage: 'Article not found.' })
  const { client, secret, api } = articleDatabase()
  const versionValue = getQuery(event).version
  try {
    if (versionValue !== undefined) {
      const version = Number(versionValue)
      if (!Number.isSafeInteger(version) || version < 1) throw createError({ statusCode: 400, statusMessage: 'The article version is invalid.' })
      const revision = await client.query(api.articles.getRevision, { secret, articleId, version })
      if (!revision) throw createError({ statusCode: 404, statusMessage: 'Article version not found.' })
      const { bodyJson, ...metadata } = revision
      return { ...metadata, body: JSON.parse(bodyJson) }
    }

    return await client.query(api.articles.listRevisions, { secret, articleId })
  } catch (error) { throw articleStorageError(error) }
})
