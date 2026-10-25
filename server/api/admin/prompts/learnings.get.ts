import { requireAdmin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const { client, secret, api } = articleDatabase()
  try {
    return await client.query(api.articleResearch.latestPromptLearnings, { secret })
  } catch (error) { throw articleStorageError(error) }
})
