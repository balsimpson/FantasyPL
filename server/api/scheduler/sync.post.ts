import { bufferRequest, getBufferInstagramChannel } from '../../utils/buffer'
import { schedulerApi, schedulerHistoryError, schedulerDatabase, schedulerScope } from '../../utils/scheduler-history'
import { requireAdmin } from '../../utils/admin'
import type { SchedulerPostStatus } from '../../../utils/scheduler-history'

interface BufferHistoryPost {
  id: string; channelId: string; text: string; status: string; createdAt: string; dueAt: string | null
  sentAt: string | null; externalLink: string | null
  assets: { source: string; thumbnail: string; mimeType: string }[]
}
const date = (value: string | null) => value && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null
function publicUrl(value: string | null | undefined) {
  if (!value) return null
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null }
}

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const body = await readBody(event)
  const after = typeof body?.cursor === 'string' && body.cursor ? body.cursor : null
  const postIds: string[] | undefined = body?.postIds
  if (postIds !== undefined && (!Array.isArray(postIds) || postIds.length > 20 || postIds.some(id => typeof id !== 'string' || !id.trim() || id.length > 200))) {
    throw createError({ statusCode: 400, statusMessage: 'Check no more than twenty valid Buffer posts at once.' })
  }
  try {
    if (postIds) {
      const ids = [...new Set(postIds)]
      if (!ids.length) return { imported: 0, hasMore: false, cursor: null }
      const { client, secret, channel } = await schedulerScope()
      const variables = Object.fromEntries(ids.map((id, index) => [`p${index}`, { id }]))
      const declarations = ids.map((_, index) => `$p${index}: PostInput!`).join(', ')
      const selections = ids.map((_, index) => `p${index}: post(input: $p${index}) { id channelId text status createdAt dueAt sentAt externalLink assets { source thumbnail mimeType } }`).join('\n')
      const response = await bufferRequest<Record<string, BufferHistoryPost | null>>(`query(${declarations}) { ${selections} }`, variables)
      const nodes = ids.flatMap((id, index) => {
        const post = response[`p${index}`]
        if (!post) return []
        if (post.id !== id || post.channelId !== channel.id) throw createError({ statusCode: 403, statusMessage: 'The Buffer post does not belong to this channel.' })
        return [post]
      })
      const imported = nodes.length ? await client.mutation(schedulerApi.schedulerHistory.sync, { secret, channelId: channel.id, posts: nodes.map(normalizePost) }) : 0
      return { imported, hasMore: false, cursor: null }
    }
    const { client, secret } = schedulerDatabase()
    const channel = await getBufferInstagramChannel()
    const response = await bufferRequest<{ posts: { edges: { node: BufferHistoryPost }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(`query($input: PostsInput!, $after: String) {
      posts(first: 50, after: $after, input: $input) {
        edges { node { id text status createdAt dueAt sentAt externalLink assets { source thumbnail mimeType } } }
        pageInfo { hasNextPage endCursor }
      }
    }`, { after, input: { organizationId: channel.organizationId, filter: { channelIds: [channel.id] }, sort: [{ field: 'createdAt', direction: 'desc' }] } })
    const posts = response.posts.edges.map(({ node }) => normalizePost(node))
    const imported = await client.mutation(schedulerApi.schedulerHistory.sync, { secret, channelId: channel.id, posts })
    return { imported, hasMore: response.posts.pageInfo.hasNextPage, cursor: response.posts.pageInfo.endCursor }
  } catch (error) { throw schedulerHistoryError(error) }
})

function normalizePost(node: BufferHistoryPost) {
  const statusMap: Record<string, SchedulerPostStatus> = { sent: 'published', error: 'failed', scheduled: 'scheduled', sending: 'submitting', draft: 'draft', needs_approval: 'draft' }
  return {
    bufferPostId: node.id, caption: node.text,
    imageUrl: publicUrl(node.assets.find(asset => asset.mimeType.startsWith('image/'))?.source || node.assets[0]?.thumbnail),
    status: statusMap[node.status] || 'unknown', createdAt: date(node.createdAt) ?? Date.now(),
    dueAt: date(node.dueAt), sentAt: date(node.sentAt), externalLink: publicUrl(node.externalLink),
  }
}
