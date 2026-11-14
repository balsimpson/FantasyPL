import { generateSchedulerCaption } from '../utils/scheduler-caption'
import { requireAdmin, requireAdminOrigin } from '../utils/admin'

export default defineEventHandler(async (event) => {
  assertMethod(event, 'POST')
  await requireAdmin(event)
  requireAdminOrigin(event)
  const { prompt, platform } = await readBody(event)
  return await generateSchedulerCaption(platform === 'x' ? 'x' : 'instagram', prompt)
})
