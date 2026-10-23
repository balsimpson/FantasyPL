export type SchedulerPostStatus = 'submitting' | 'scheduled' | 'published' | 'failed' | 'unknown' | 'draft' | 'cancelled'
export interface SchedulerPostRecord {
  _id: string
  imageUrl: string | null
  caption: string
  players: { code: number; name: string }[]
  gameweek: number | null
  season: string | null
  template: string | null
  design: string | null
  status: SchedulerPostStatus
  dueAt: number | null
  sentAt: number | null
  externalLink: string | null
  bufferPostId: string | null
  error: string | null
  createdAt: number
  source: 'scheduler' | 'buffer'
}
export interface SchedulerPlayerActivity {
  code: number
  queued: boolean
  postedThisGameweek: boolean
  lastPostedAt: number | null
  lastPostId: string | null
}
export const schedulerStatusLabels: Record<SchedulerPostStatus, string> = {
  submitting: 'Sending', scheduled: 'Scheduled', published: 'Published', failed: 'Failed',
  unknown: 'Check Buffer', draft: 'Draft', cancelled: 'Cancelled',
}
export function formatSchedulerDate(value: number | null) {
  return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(value) : ''
}
