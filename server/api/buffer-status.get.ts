import { getBufferInstagramChannel } from '../utils/buffer'
import { requireAdmin } from '../utils/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  try {
    const channel = await getBufferInstagramChannel()
    return { configured: true, message: `Buffer connected · @${channel.name.replace(/^@/, '')}` }
  } catch (error: unknown) {
    const detail = error as { data?: { message?: string } }
    return { configured: false, message: detail?.data?.message || 'The Buffer connection could not be checked. Reload to try again.' }
  }
})
