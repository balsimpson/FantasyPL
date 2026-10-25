import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'
import type { Id } from '../../../../../convex/_generated/dataModel'

export default defineEventHandler(async event => {
  const user = await requireAdmin(event)
  requireAdminOrigin(event)
  const articleId = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  if (!/^[\da-f-]{36}$/i.test(articleId) || !body || !/^[\da-f-]{36}$/i.test(body.requestId) || (body.promptId !== undefined && (typeof body.promptId !== 'string' || !/^[\da-f-]{36}$/i.test(body.promptId)))) throw createError({ statusCode: 400, statusMessage: 'The generation request is invalid.' })
  const { client, secret, api } = articleDatabase()
  try { return { jobId: await client.mutation(api.articleJobs.enqueue, { secret, articleId, requestId: body.requestId, requestedBy: user.githubId, promptId: body.promptId as Id<'articlePrompts'> | undefined }) } }
  catch (error) { throw articleStorageError(error) }
})
