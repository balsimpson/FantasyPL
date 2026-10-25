import { requireAdmin } from '../../../utils/admin'
import { articleDatabase, articleStorageError } from '../../../utils/articles'
import { getBootstrapStatic } from '~~/composables/usePremiereLeague'
import { getPlayerRoute } from '~/composables/usePlayerRoute'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const { client, api } = articleDatabase()
  let articles: { title: string; slug: string }[] = []
  try {
    const rows = await client.query(api.articles.listPublished, { limit: 100 })
    articles = rows.flatMap(row => {
      try {
        const article = JSON.parse(row.publishedJson) as { title?: string; slug?: string }
        return article.title && article.slug ? [{ title: article.title, slug: article.slug }] : []
      } catch { return [] }
    })
  } catch (error) { throw articleStorageError(error) }

  let players: { title: string; url: string }[] = []
  try {
    const data = await getBootstrapStatic()
    players = (data?.elements || []).flatMap((player: any) => {
      const title = `${player.first_name || ''} ${player.second_name || ''}`.trim() || player.web_name
      return player.id && title ? [{ title, url: getPlayerRoute(player) }] : []
    })
  } catch { /* Article links stay available when live FPL data is unavailable. */ }

  return [
    ...articles.map(article => ({ kind: 'article' as const, title: article.title, url: `/blog/${encodeURIComponent(article.slug)}` })),
    ...players.map(player => ({ kind: 'player' as const, title: player.title, url: player.url })),
  ]
})
