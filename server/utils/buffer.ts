type BufferResponse<T> = {
  data?: T
  errors?: { message: string }[]
}

type BufferChannel = {
  id: string
  organizationId: string
  name: string
  service: string
  isDisconnected: boolean
  isLocked: boolean
  isQueuePaused: boolean
}

// Buffer's free plan allows 150 requests per 15 minutes. After a 429, stay quiet for the whole window.
const RATE_LIMIT_COOLDOWN_MS = 15 * 60_000
// Channel lookups cost requests and rarely change, so keep them for an hour; keep "not connected" for five minutes.
const CHANNEL_CACHE_MS = 60 * 60_000
const MISSING_CHANNEL_CACHE_MS = 5 * 60_000
type ChannelPlatform = 'instagram' | 'x'
let rateLimitedUntil = 0
const channelCache = new Map<ChannelPlatform, { channels: BufferChannel[]; expiresAt: number }>()
const channelLookups = new Map<ChannelPlatform, Promise<BufferChannel[]>>()

export function bufferError(message: string, uncertain = false) {
  return createError({ statusCode: 502, statusMessage: 'Buffer scheduling error', data: { message, uncertain } })
}

export async function bufferRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const key = useRuntimeConfig().BUFFER_API_KEY
  if (!key) throw bufferError('Buffer scheduling is not configured. Add BUFFER_API_KEY on the server.')
  if (Date.now() < rateLimitedUntil) throw bufferError('Buffer has reached its request limit. Please try again later.')

  let result: BufferResponse<T>
  try {
    result = await $fetch<BufferResponse<T>>('https://api.buffer.com', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: { query, variables },
      retry: 0,
      timeout: 8_000,
    })
  } catch (error: unknown) {
    const status = (error as { statusCode?: number })?.statusCode
    if (status === 401 || status === 403) throw bufferError('Buffer denied access. Check the API key and its permissions.')
    if (status === 429) {
      rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS
      throw bufferError('Buffer has reached its request limit. Please try again later.')
    }
    throw bufferError('Buffer did not confirm the request. Check your Buffer queue before trying again.', true)
  }

  if (result.errors?.length) throw bufferError(result.errors.map(error => error.message).join(' '))
  if (!result.data) throw bufferError('Buffer returned no result. Check your Buffer queue before trying again.', true)
  return result.data
}

async function bufferChannels(platform: ChannelPlatform): Promise<BufferChannel[]> {
  const cached = channelCache.get(platform)
  if (cached && cached.expiresAt > Date.now()) return cached.channels
  const pending = channelLookups.get(platform)
  if (pending) return pending
  const lookup = lookupBufferChannels(platform)
    .then(channels => {
      channelCache.set(platform, { channels, expiresAt: Date.now() + (channels.length ? CHANNEL_CACHE_MS : MISSING_CHANNEL_CACHE_MS) })
      return channels
    })
    .finally(() => channelLookups.delete(platform))
  channelLookups.set(platform, lookup)
  return lookup
}

async function lookupBufferChannels(platform: ChannelPlatform): Promise<BufferChannel[]> {
  const fields = 'id organizationId name service isDisconnected isLocked isQueuePaused'
  const configuredId = platform === 'instagram' ? useRuntimeConfig().BUFFER_CHANNEL_ID : useRuntimeConfig().BUFFER_X_CHANNEL_ID
  const service = platform === 'instagram' ? 'instagram' : 'twitter'

  if (configuredId) {
    const result = await bufferRequest<{ channel: BufferChannel | null }>(
      `query($input: ChannelInput!) { channel(input: $input) { ${fields} } }`,
      { input: { id: configuredId } },
    )
    const channel = result.channel
    return channel && channel.service === service ? [channel] : []
  }

  const result = await bufferRequest<{ account: { organizations: { id: string }[] } }>(
    'query { account { organizations { id } } }',
  )
  const organizations = await Promise.all(result.account.organizations.map(async organization => {
    const response = await bufferRequest<{ channels: BufferChannel[] }>(
      `query($input: ChannelsInput!) { channels(input: $input) { ${fields} } }`,
      { input: { organizationId: organization.id } },
    )
    return response.channels
  }))
  return organizations.flat().filter(item => item.service === service)
}

export async function getBufferChannel(platform: 'instagram' | 'x'): Promise<BufferChannel> {
  const name = platform === 'instagram' ? 'Instagram' : 'X'
  const setting = platform === 'instagram' ? 'BUFFER_CHANNEL_ID' : 'BUFFER_X_CHANNEL_ID'
  const channels = await bufferChannels(platform)
  if (channels.length > 1) throw bufferError(`More than one ${name} channel is connected. Set ${setting} on the server to choose one.`)
  const channel = channels[0]
  if (!channel) throw bufferError(`Connect your ${name} account in Buffer before scheduling.`)
  if (channel.isDisconnected) throw bufferError(`Your ${name} connection has expired. Reconnect it in Buffer.`)
  if (channel.isLocked) throw bufferError(`Your ${name} channel is locked in Buffer. Unlock it before scheduling.`)
  if (channel.isQueuePaused) throw bufferError(`Your ${name} queue is paused in Buffer. Resume it before scheduling.`)
  return channel
}

export const getBufferInstagramChannel = () => getBufferChannel('instagram')
export const getBufferXChannel = () => getBufferChannel('x')
