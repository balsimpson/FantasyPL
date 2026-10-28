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

export function bufferError(message: string, uncertain = false) {
  return createError({ statusCode: 502, statusMessage: 'Buffer scheduling error', data: { message, uncertain } })
}

export async function bufferRequest<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const key = useRuntimeConfig().BUFFER_API_KEY
  if (!key) throw bufferError('Buffer scheduling is not configured. Add BUFFER_API_KEY on the server.')

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
    if (status === 429) throw bufferError('Buffer has reached its request limit. Please try again later.')
    throw bufferError('Buffer did not confirm the request. Check your Buffer queue before trying again.', true)
  }

  if (result.errors?.length) throw bufferError(result.errors.map(error => error.message).join(' '))
  if (!result.data) throw bufferError('Buffer returned no result. Check your Buffer queue before trying again.', true)
  return result.data
}

export async function getBufferChannel(platform: 'instagram' | 'x'): Promise<BufferChannel> {
  const fields = 'id organizationId name service isDisconnected isLocked isQueuePaused'
  const configuredId = platform === 'instagram' ? useRuntimeConfig().BUFFER_CHANNEL_ID : useRuntimeConfig().BUFFER_X_CHANNEL_ID
  const service = platform === 'instagram' ? 'instagram' : 'twitter'
  const name = platform === 'instagram' ? 'Instagram' : 'X'
  const setting = platform === 'instagram' ? 'BUFFER_CHANNEL_ID' : 'BUFFER_X_CHANNEL_ID'
  let channel: BufferChannel | undefined

  if (configuredId) {
    const result = await bufferRequest<{ channel: BufferChannel }>(
      `query($input: ChannelInput!) { channel(input: $input) { ${fields} } }`,
      { input: { id: configuredId } },
    )
    channel = result.channel
  } else {
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
    const channels = organizations.flat().filter(item => item.service === service)
    if (channels.length > 1) throw bufferError(`More than one ${name} channel is connected. Set ${setting} on the server to choose one.`)
    channel = channels[0]
  }

  if (!channel || channel.service !== service) throw bufferError(`Connect your ${name} account in Buffer before scheduling.`)
  if (channel.isDisconnected) throw bufferError(`Your ${name} connection has expired. Reconnect it in Buffer.`)
  if (channel.isLocked) throw bufferError(`Your ${name} channel is locked in Buffer. Unlock it before scheduling.`)
  if (channel.isQueuePaused) throw bufferError(`Your ${name} queue is paused in Buffer. Resume it before scheduling.`)
  return channel
}

export const getBufferInstagramChannel = () => getBufferChannel('instagram')
export const getBufferXChannel = () => getBufferChannel('x')
