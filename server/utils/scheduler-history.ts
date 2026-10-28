import { ConvexHttpClient } from 'convex/browser'
import { anyApi } from 'convex/server'
import type { api } from '../../convex/_generated/api'
import { getBufferInstagramChannel, getBufferXChannel } from './buffer'
export const schedulerApi = anyApi as unknown as typeof api

export function schedulerDatabase() {
  const config = useRuntimeConfig()
  if (!config.CONVEX_URL || !config.SCHEDULER_SERVICE_TOKEN) throw createError({ statusCode: 503, statusMessage: 'Post history is not configured on the server.' })
  return { client: new ConvexHttpClient(config.CONVEX_URL), secret: config.SCHEDULER_SERVICE_TOKEN }
}

export function schedulerPlatform(value: unknown): 'instagram' | 'x' {
  if (value === undefined || value === null || value === '' || value === 'instagram') return 'instagram'
  if (value === 'x') return 'x'
  throw createError({ statusCode: 400, statusMessage: 'Choose Instagram or X.' })
}

export async function schedulerScope(platform: 'instagram' | 'x' = 'instagram') {
  const database = schedulerDatabase()
  const configuredId = platform === 'instagram' ? useRuntimeConfig().BUFFER_CHANNEL_ID : useRuntimeConfig().BUFFER_X_CHANNEL_ID
  const channel = typeof configuredId === 'string' && configuredId ? { id: configuredId } : await (platform === 'instagram' ? getBufferInstagramChannel() : getBufferXChannel())
  return { ...database, channel }
}

export function schedulerHistoryError(error: unknown) {
  const detail = error as { data?: unknown; statusCode?: number; statusMessage?: string }
  if (detail?.statusCode && detail.statusCode < 500) return error
  const data = detail?.data
  const message = typeof data === 'string' ? data : data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' ? data.message : detail.statusMessage || 'Post history is unavailable. Please try again.'
  return createError({ statusCode: 503, statusMessage: 'Post history unavailable', data: { message } })
}
