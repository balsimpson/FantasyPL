import { requireAdmin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const { client, secret, api } = articleDatabase()
  try {
    return await client.query(api.articleResearchIdeas.list, { secret })
  } catch (error) { throw articleStorageError(error) }
})
