import { ConvexHttpClient } from 'convex/browser'
import { anyApi } from 'convex/server'
import type { api as generatedApi } from '../../convex/_generated/api'
import type { SavedArticle } from '../../shared/articles'

const api = anyApi as typeof generatedApi

export function articleDatabase() {
  const config = useRuntimeConfig()
  const url = config.contentConvexUrl || config.CONVEX_URL
  if (!url || !config.contentServiceToken) throw createError({ statusCode: 503, statusMessage: 'Article storage is not configured. Your draft has not been saved.' })
  return { client: new ConvexHttpClient(url), secret: config.contentServiceToken, api }
}

export function articleResponse(record: { bodyJson: string; articleId: string; title: string; slug: string; excerpt: string; template: SavedArticle['template']; season: string; gameweek: number | null; version: number; createdAt: number; updatedAt: number; status: 'draft' }): SavedArticle {
  return { articleId: record.articleId, title: record.title, slug: record.slug, excerpt: record.excerpt, template: record.template, season: record.season, gameweek: record.gameweek, body: JSON.parse(record.bodyJson), version: record.version, createdAt: record.createdAt, updatedAt: record.updatedAt, status: record.status }
}

export function articleStorageError(error: unknown) {
  const detail = error as { data?: { code?: string; message?: string }; statusCode?: number }
  if (detail.statusCode && detail.statusCode < 500) return error
  const code = detail.data?.code
  if (code === 'CONFLICT') return createError({ statusCode: 409, statusMessage: detail.data!.message })
  if (code === 'INVALID') return createError({ statusCode: 400, statusMessage: detail.data!.message })
  return createError({ statusCode: 503, statusMessage: 'Article storage is unavailable. Keep this page open and try saving again.' })
}
