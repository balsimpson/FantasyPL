import { requireAdmin, requireAdminOrigin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const { client, secret, api } = articleDatabase()
  const body = await readBody(event).catch(() => null)
  try { await client.mutation(api.articleResearchIdeas.requestFill, { secret, retry: body?.retry === true }); return { requested: true } }
  catch (error) { throw articleStorageError(error) }
})
