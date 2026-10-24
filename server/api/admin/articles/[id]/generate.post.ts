import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'

export default defineEventHandler(async event => {
  const user = await requireAdmin(event)
  requireAdminOrigin(event)
  const articleId = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  if (!/^[\da-f-]{36}$/i.test(articleId) || !body || !/^[\da-f-]{36}$/i.test(body.requestId)) throw createError({ statusCode: 400, statusMessage: 'The generation request is invalid.' })
  const { client, secret, api } = articleDatabase()
  try { return { jobId: await client.mutation(api.articleJobs.enqueue, { secret, articleId, requestId: body.requestId, requestedBy: user.githubId }) } }
  catch (error) { throw articleStorageError(error) }
})
