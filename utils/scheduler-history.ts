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
export interface SchedulerHistoryOverview {
  published7Days: number
  published30Days: number
  scheduled: number
  failed: number
  undatedPublished: boolean
  asOf: number
}
export const schedulerStatusLabels: Record<SchedulerPostStatus, string> = {
  submitting: 'Sending', scheduled: 'Scheduled', published: 'Published', failed: 'Failed',
  unknown: 'Check Buffer', draft: 'Draft', cancelled: 'Cancelled',
}
export function formatSchedulerDate(value: number | null) {
  return value ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(value) : ''
}

export function formatSchedulerPostTiming(post: SchedulerPostRecord, now = Date.now()) {
  const published = post.status === 'published'
  const scheduled = post.status === 'scheduled'
  const value = published ? post.sentAt : scheduled ? post.dueAt : post.createdAt
  const status = schedulerStatusLabels[post.status]
  if (value === null || !Number.isFinite(value)) return { label: `${status} · ${scheduled ? 'Time pending' : 'Time unavailable'}`, datetime: undefined, title: status }
  const timeZone = 'Asia/Kolkata'
  const calendar = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
  const day = (date: number) => {
    const parts = Object.fromEntries(calendar.formatToParts(date).map(part => [part.type, part.value]))
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / 86_400_000
  }
  const difference = day(value) - day(now)
  const sameYear = calendar.formatToParts(value).find(part => part.type === 'year')?.value === calendar.formatToParts(now).find(part => part.type === 'year')?.value
  const date = difference === 0 ? 'today' : difference === -1 ? 'yesterday' : difference === 1 ? 'tomorrow' : new Intl.DateTimeFormat('en-GB', { timeZone, day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' as const }) }).format(value)
  const time = new Intl.DateTimeFormat('en-GB', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).format(value)
  const prefix = published || scheduled ? status : `${status} · Created`
  return { label: `${prefix} ${date} at ${time}`, datetime: new Date(value).toISOString(), title: `${prefix} ${formatSchedulerDate(value)} IST` }
}
