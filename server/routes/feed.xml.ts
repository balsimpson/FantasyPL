import { articleDatabase, publishedArticleResponse } from '../utils/articles'
import { getPublicSiteOrigin } from '~/utils/site-url'

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&apos;', '"': '&quot;' })[character]!)

export default defineEventHandler(async event => {
  const { public: { SITE_URL } } = useRuntimeConfig(event)
  const origin = getPublicSiteOrigin(SITE_URL)
  const { client, api } = articleDatabase()
  const entries = await client.query(api.articles.listPublished, { limit: 50 })
  const articles = entries.map(publishedArticleResponse)
  setHeader(event, 'content-type', 'application/rss+xml; charset=utf-8')
  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>FPL Insights articles</title>
  <link>${origin}/blog</link>
  <description>Fantasy Premier League analysis, player comparisons, fixture guides and practical answers.</description>
  <language>en-gb</language>
${articles.map(article => `  <item>
    <title>${escapeXml(article.title)}</title>
    <link>${origin}/blog/${encodeURIComponent(article.slug)}</link>
    <guid isPermaLink="true">${origin}/blog/${encodeURIComponent(article.slug)}</guid>
    <description>${escapeXml(article.excerpt)}</description>
    <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
    <author>${escapeXml(article.author)}</author>
  </item>`).join('\n')}
</channel></rss>
`
})
