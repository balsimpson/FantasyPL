import { requireAdmin, requireAdminOrigin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'
import type { Id } from '../../../../convex/_generated/dataModel'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event)
  if (!body || typeof body.storageId !== 'string' || !/^[\w-]{10,80}$/.test(body.storageId)) throw createError({ statusCode: 400, statusMessage: 'The uploaded image is invalid.' })
  const { client, secret, api } = articleDatabase()
  try { return { url: await client.mutation(api.articleImages.resolveUpload, { secret, storageId: body.storageId as Id<'_storage'> }) } }
  catch (error) {
    const code = (error as { data?: { code?: string; message?: string } }).data
    if (code?.code === 'NOT_FOUND') throw createError({ statusCode: 404, statusMessage: code.message || 'The uploaded image was not found.' })
    throw articleStorageError(error)
  }
})
