import { requireAdmin, requireAdminOrigin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'
import { isArticleTemplate, type ArticlePromptScope } from '../../../../shared/article-prompts'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  requireAdminOrigin(event)
  const body = await readBody(event)
  const scopes: ArticlePromptScope[] = ['article', 'research-search', 'research-analysis']
  const scope = body?.scope as ArticlePromptScope
  const template = body?.template ?? null
  if (!scopes.includes(scope) || (scope === 'article' ? !isArticleTemplate(template) : template !== null) || typeof body?.name !== 'string' || typeof body?.instructions !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'The prompt details are invalid.' })
  }
  const { client, secret, api } = articleDatabase()
  try {
    const promptId = await client.mutation(api.articlePrompts.create, { secret, scope, template, name: body.name, instructions: body.instructions })
    return { promptId }
  } catch (error) { throw articleStorageError(error) }
})
