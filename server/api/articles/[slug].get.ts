import { articleDatabase, publishedArticleResponse, articleStorageError } from '../../utils/articles'

export default defineEventHandler(async event => {
  const slug = getRouterParam(event, 'slug') || ''
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw createError({ statusCode: 404, statusMessage: 'Article not found.' })
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  const { client, api } = articleDatabase()
  try {
    const article = await client.query(api.articles.getPublishedBySlug, { slug })
    if (!article) throw createError({ statusCode: 404, statusMessage: 'Article not found.' })
    return publishedArticleResponse(article)
  } catch (error) { throw articleStorageError(error) }
})
