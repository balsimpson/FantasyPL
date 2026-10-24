import { requireAdmin, requireAdminOrigin } from '../../../utils/admin'
import { articleDatabase, articleResponse, articleStorageError } from '../../../utils/articles'
import { validateArticleDraft } from '../../../../shared/articles'

export default defineEventHandler(async event => {
  const user = await requireAdmin(event)
  requireAdminOrigin(event)
  const articleId = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  if (!/^[\da-f-]{36}$/i.test(articleId) || !body || !/^[\da-f-]{36}$/i.test(body.requestId) || !Number.isSafeInteger(body.expectedVersion) || body.expectedVersion < 0) throw createError({ statusCode: 400, statusMessage: 'The save request is invalid.' })
  let draft
  try { draft = validateArticleDraft(body.draft) }
  catch (error) { throw createError({ statusCode: 400, statusMessage: error instanceof Error ? error.message : 'The article is invalid.' }) }
  const { body: content, ...metadata } = draft
  const { client, secret, api } = articleDatabase()
  try {
    const article = await client.mutation(api.articles.save, { secret, articleId, requestId: body.requestId, expectedVersion: body.expectedVersion, savedBy: user.githubId, draft: { ...metadata, bodyJson: JSON.stringify(content) } })
    return articleResponse(article)
  } catch (error) { throw articleStorageError(error) }
})
