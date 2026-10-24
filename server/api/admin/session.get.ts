import { requireAdmin } from '../../utils/admin'

export default defineEventHandler(async event => {
  const user = await requireAdmin(event)
  return { user }
})
