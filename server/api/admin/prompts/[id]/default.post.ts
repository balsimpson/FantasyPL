import type { Id } from '../../../../../convex/_generated/dataModel'
import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const id = getRouterParam(event, 'id') || ''
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Choose a prompt.' })
  const { client, secret, api } = articleDatabase()
  try {
    await client.mutation(api.articlePrompts.setDefault, { secret, promptId: id as Id<'articlePrompts'> })
    return { saved: true }
  } catch (error) { throw articleStorageError(error) }
})
