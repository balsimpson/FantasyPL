import { requireAdmin, requireAdminOrigin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event)
  if (typeof body?.instructions !== 'string' || !body.instructions.trim() || body.instructions.length > 30_000) {
    throw createError({ statusCode: 400, statusMessage: 'Add prompt instructions before asking for suggestions.' })
  }
  const { client, secret, api } = articleDatabase()
  try {
    return await client.action(api.articlePrompts.suggestDetails, { secret, instructions: body.instructions })
  } catch (error) { throw articleStorageError(error) }
})
