import { bufferRequest, getBufferInstagramChannel } from '../../utils/buffer'
import { schedulerApi, schedulerHistoryError, schedulerDatabase } from '../../utils/scheduler-history'
import type { SchedulerPostStatus } from '../../../utils/scheduler-history'

interface BufferHistoryPost {
  id: string; text: string; status: string; createdAt: string; dueAt: string | null
  sentAt: string | null; externalLink: string | null
  assets: { source: string; thumbnail: string; mimeType: string }[]
}
const date = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null
function publicUrl(value: string | null | undefined) {
  if (!value) return null
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null }
}

export default defineEventHandler(async event => {
  const body = await readBody(event)
  const after = typeof body?.cursor === 'string' && body.cursor ? body.cursor : null
  try {
    const { client, secret } = schedulerDatabase()
    const channel = await getBufferInstagramChannel()
    const response = await bufferRequest<{ posts: { edges: { node: BufferHistoryPost }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(`query($input: PostsInput!, $after: String) {
      posts(first: 50, after: $after, input: $input) {
        edges { node { id text status createdAt dueAt sentAt externalLink assets { source thumbnail mimeType } } }
        pageInfo { hasNextPage endCursor }
      }
    }`, { after, input: { organizationId: channel.organizationId, filter: { channelIds: [channel.id] }, sort: [{ field: 'createdAt', direction: 'desc' }] } })
    const statusMap: Record<string, SchedulerPostStatus> = { sent: 'published', error: 'failed', scheduled: 'scheduled', sending: 'submitting', draft: 'draft', needs_approval: 'draft' }
    const posts = response.posts.edges.map(({ node }) => ({
      bufferPostId: node.id, caption: node.text,
      imageUrl: publicUrl(node.assets.find(asset => asset.mimeType.startsWith('image/'))?.source || node.assets[0]?.thumbnail),
      status: statusMap[node.status] || 'unknown', createdAt: date(node.createdAt) ?? Date.now(),
      dueAt: date(node.dueAt), sentAt: date(node.sentAt), externalLink: publicUrl(node.externalLink),
    }))
    const imported = await client.mutation(schedulerApi.schedulerHistory.sync, { secret, channelId: channel.id, posts })
    return { imported, hasMore: response.posts.pageInfo.hasNextPage, cursor: response.posts.pageInfo.endCursor }
  } catch (error) { throw schedulerHistoryError(error) }
})
