import { requireAdmin, requireAdminOrigin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  const user = await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event)
  if (!body || typeof body.focus !== 'string' || body.focus.length > 300 || !/^[\da-f-]{36}$/i.test(body.requestId)) throw createError({ statusCode: 400, statusMessage: 'The research request is invalid.' })
  const { client, secret, api } = articleDatabase()
  try { return { researchId: await client.mutation(api.articleResearch.start, { secret, focus: body.focus, requestId: body.requestId, requestedBy: user.githubId }) } }
  catch (error) { throw articleStorageError(error) }
})
