import { requireAdmin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const { client, secret, api } = articleDatabase()
  try {
    await client.mutation(api.articlePrompts.ensureDefaults, { secret })
    return await client.query(api.articlePrompts.list, { secret })
  } catch (error) { throw articleStorageError(error) }
})
