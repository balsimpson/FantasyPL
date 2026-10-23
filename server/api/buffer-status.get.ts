import { getBufferInstagramChannel } from '../utils/buffer'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    const channel = await getBufferInstagramChannel()
    return { configured: true, message: `Buffer connected · @${channel.name.replace(/^@/, '')}` }
  } catch (error: unknown) {
    const detail = error as { data?: { message?: string } }
    return { configured: false, message: detail?.data?.message || 'The Buffer connection could not be checked. Reload to try again.' }
  }
})
