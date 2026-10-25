import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'
import type { Id } from '../../../../../convex/_generated/dataModel'

export default defineEventHandler(async event => {
  const user = await requireAdmin(event)
  requireAdminOrigin(event)
  const researchId = getRouterParam(event, 'id')
  const body = await readBody(event)
  if (!researchId || researchId.length > 100 || !body || !Number.isInteger(body.suggestionIndex) || body.suggestionIndex < 0 || body.suggestionIndex > 11 || !/^[\da-f-]{36}$/i.test(body.articleId)) throw createError({ statusCode: 400, statusMessage: 'The selected suggestion is invalid.' })
  const { client, secret, api } = articleDatabase()
  try { return { articleId: await client.mutation(api.articleResearch.writeSuggestion, { secret, researchId: researchId as Id<'articleResearch'>, suggestionIndex: body.suggestionIndex, articleId: body.articleId, requestedBy: user.githubId }) } }
  catch (error) { throw articleStorageError(error) }
})
