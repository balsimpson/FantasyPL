import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const articleId = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  if (!/^[\da-f-]{36}$/i.test(articleId) || !body || typeof body.selectedText !== 'string' || typeof body.instruction !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Select text and enter an edit instruction.' })
  }
  if (!body.selectedText.trim() || body.selectedText.length > 3000 || !body.instruction.trim() || body.instruction.length > 500) {
    throw createError({ statusCode: 400, statusMessage: 'Select up to 3,000 characters and enter an instruction of up to 500 characters.' })
  }
  const { client, secret, api } = articleDatabase()
  try {
    const replacementText = await client.action(api.articleEdits.editSelection, { secret, selectedText: body.selectedText, instruction: body.instruction })
    return { replacementText }
  } catch (error) { throw articleStorageError(error) }
})
