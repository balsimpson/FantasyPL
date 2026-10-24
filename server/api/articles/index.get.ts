import { articleDatabase, publishedArticleResponse, articleStorageError } from '../../utils/articles'

export default defineEventHandler(async event => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  const { client, api } = articleDatabase()
  try {
    const articles = await client.query(api.articles.listPublished, { limit: 100 })
    return articles.map(article => publishedArticleResponse(article))
  } catch (error) { throw articleStorageError(error) }
})
