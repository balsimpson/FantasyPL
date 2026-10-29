import type { SchedulerCaptionDraft } from './useSchedulerCaptionDrafts'

export interface AdminSchedulerToolbar {
  drafts: SchedulerCaptionDraft[]
  storageError: string
  downloadDisabled: boolean
  downloadLoading: boolean
  historyView: boolean
  historyDisabled: boolean
  onRemove: (signature: string) => void
  onDownload: () => void
  onToggleHistory: () => void
}

export const adminSchedulerToolbarKey = 'admin-scheduler-toolbar'
