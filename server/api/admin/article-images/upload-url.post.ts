import { requireAdmin, requireAdminOrigin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const { client, secret, api } = articleDatabase()
  try { return { uploadUrl: await client.mutation(api.articleImages.generateUploadUrl, { secret }) } }
  catch (error) { throw articleStorageError(error) }
})
