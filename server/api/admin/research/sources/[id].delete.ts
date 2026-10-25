import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'
import type { Id } from '../../../../../convex/_generated/dataModel'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const { client, secret, api } = articleDatabase()
  try { await client.mutation(api.articleResearch.removeSource, { secret, sourceId: getRouterParam(event, 'id') as Id<'articleResearchSources'> }) }
  catch (error) { throw articleStorageError(error) }
  return { removed: true }
})
