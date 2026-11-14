import { requireAdmin, requireAdminOrigin } from '../../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../../utils/articles'
import { validateArticleDraft, type ArticleDraft } from '../../../../../shared/articles'

/** Apply one whole-article instruction from the editor's chat composer. Nothing is saved here; the editor saves the result. */
export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const articleId = getRouterParam(event, 'id') || ''
  const body = await readBody(event)
  if (!/^[\da-f-]{36}$/i.test(articleId) || !body || typeof body.instruction !== 'string' || !body.instruction.trim() || body.instruction.length > 1000) {
    throw createError({ statusCode: 400, statusMessage: 'Enter an instruction of up to 1,000 characters.' })
  }
  let draft: ArticleDraft
  try { draft = validateArticleDraft(body.draft) }
  catch (cause) { throw createError({ statusCode: 400, statusMessage: cause instanceof Error ? cause.message : 'The article is invalid.' }) }
  const { client, secret, api } = articleDatabase()
  try {
    const result = await client.action(api.articleEdits.reviseArticle, { secret, instruction: body.instruction.trim(), draftJson: JSON.stringify(draft) })
    return { draft: validateArticleDraft(JSON.parse(result.draftJson)), summary: result.summary }
  } catch (error) { throw articleStorageError(error) }
})
