import { requireAdmin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'
import { validateArticleDraft } from '../../../../shared/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const articleId = getRouterParam(event, 'id') || ''
  if (!/^[\da-f-]{36}$/i.test(articleId)) throw createError({ statusCode: 400, statusMessage: 'The article ID is invalid.' })
  const { client, secret, api } = articleDatabase()
  try {
    const job = await client.query(api.articleJobs.latest, { secret, articleId })
    return job ? { jobId: job._id, status: job.status, error: job.error, model: job.model, updatedAt: job.updatedAt, result: job.resultJson ? validateArticleDraft(JSON.parse(job.resultJson)) : null } : null
  } catch (error) { throw articleStorageError(error) }
})
