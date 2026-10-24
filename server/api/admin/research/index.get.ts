import { requireAdmin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'
import type { ResearchResult } from '../../../../shared/article-research'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const { client, secret, api } = articleDatabase()
  try {
    const runs = await client.query(api.articleResearch.list, { secret })
    return runs.map(run => ({ id: run._id, focus: run.focus, status: run.status, error: run.error, createdAt: run.createdAt, result: run.resultJson ? JSON.parse(run.resultJson) as ResearchResult : null }))
  } catch (error) { throw articleStorageError(error) }
})
