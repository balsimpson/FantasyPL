import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event).catch(() => null)
  if (!body || typeof body.name !== 'string' || typeof body.url !== 'string') throw createError({ statusCode: 400, statusMessage: 'Enter a source name and website.' })
  const { client, secret, api } = articleDatabase()
  try { return await client.mutation(api.articleResearch.addSource, { secret, name: body.name, url: body.url }) }
  catch (error) { throw articleStorageError(error) }
})
