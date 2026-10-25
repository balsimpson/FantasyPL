import type { Id } from '../../../../convex/_generated/dataModel'
import { requireAdmin, requireAdminOrigin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  if (!id || typeof body?.name !== 'string' || typeof body?.instructions !== 'string') throw createError({ statusCode: 400, statusMessage: 'The prompt details are invalid.' })
  const { client, secret, api } = articleDatabase()
  try {
    await client.mutation(api.articlePrompts.update, { secret, promptId: id as Id<'articlePrompts'>, name: body.name, instructions: body.instructions })
    return { saved: true }
  } catch (error) { throw articleStorageError(error) }
})
