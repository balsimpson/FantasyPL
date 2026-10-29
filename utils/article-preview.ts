import type { ArticleNode, ArticleTemplate } from '~/shared/articles'
import type { ArticlePlayerSnapshot } from '~/shared/article-visuals'

export const getArticlePreviewPath = (slug: string) =>
  `/__og-image__/image/blog/${encodeURIComponent(slug)}/og.png`

export interface ArticlePreviewPlayer {
  name: string
  photoCode: string
  teamCode: number
}

export function getArticlePreviewPlayers(body: ArticleNode, template: ArticleTemplate): ArticlePreviewPlayer[] {
  const nodes: ArticleNode[] = []
  const collect = (node: ArticleNode) => {
    nodes.push(node)
    for (const child of node.content || []) collect(child)
  }
  collect(body)

  // Comparisons should feature the players in the saved comparison, even when
  // an individual player's card appears earlier in the article.
  const comparison = template === 'comparison' ? nodes.find(node => node.type === 'comparisonCard') : undefined
  const candidates = comparison ? [comparison, ...nodes.filter(node => node !== comparison)] : nodes
  const players: ArticlePreviewPlayer[] = []
  const seen = new Set<number>()

  for (const node of candidates) {
    const snapshots = node.type === 'playerCard' || node.type === 'fixtureRun'
      ? [node.attrs?.player]
      : ['comparisonCard', 'transferWatch', 'budgetShortlist', 'teamFixtureTable'].includes(node.type) && Array.isArray(node.attrs?.players)
        ? node.attrs.players
        : []

    for (const value of snapshots) {
      const player = value as Partial<ArticlePlayerSnapshot> | undefined
      const photoCode = String(player?.photoCode || player?.code || '')
      if (!player || !Number.isSafeInteger(player.code) || !player.code || player.code < 1 || !Number.isSafeInteger(player.teamCode) || !player.teamCode || player.teamCode < 1 || !/^\d{1,12}$/.test(photoCode) || seen.has(player.code)) continue
      const name = `${player.first_name || ''} ${player.second_name || ''}`.trim() || player.web_name || ''
      if (!name) continue
      players.push({ name, photoCode, teamCode: player.teamCode })
      seen.add(player.code)
      if (players.length >= (template === 'comparison' ? 2 : 1)) return players
    }
  }
  return players
}

export function getArticlePreviewPhotoPath(photoCode: string) {
  if (!/^\d{1,12}$/.test(photoCode)) return '/fallback.png'
  const source = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${photoCode}.png`
  return `/api/image-proxy/article-preview-player-${photoCode}?url=${encodeURIComponent(source)}`
}
