import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'
import type { Id } from '../../../../../convex/_generated/dataModel'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event).catch(() => null)
  if (!body || !['up', 'down'].includes(body.direction)) throw createError({ statusCode: 400, statusMessage: 'Choose a valid source order.' })
  const { client, secret, api } = articleDatabase()
  try { await client.mutation(api.articleResearch.moveSource, { secret, sourceId: getRouterParam(event, 'id') as Id<'articleResearchSources'>, direction: body.direction }) }
  catch (error) { throw articleStorageError(error) }
  return { updated: true }
})
