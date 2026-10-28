import { getBufferInstagramChannel, getBufferXChannel } from '../utils/buffer'
import { requireAdmin } from '../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    const channel = await getBufferInstagramChannel()
    try {
      const xChannel = await getBufferXChannel()
      return { configured: true, xConfigured: true, message: `Buffer connected · Instagram @${channel.name.replace(/^@/, '')} · X @${xChannel.name.replace(/^@/, '')}` }
    } catch (error: unknown) {
      const detail = error as { data?: { message?: string } }
      return { configured: true, xConfigured: false, message: detail?.data?.message || 'The X connection could not be checked. Reload to try again.' }
    }
  } catch (error: unknown) {
    const detail = error as { data?: { message?: string } }
    return { configured: false, xConfigured: false, message: detail?.data?.message || 'The Buffer connection could not be checked. Reload to try again.' }
  }
})
