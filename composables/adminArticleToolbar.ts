export interface AdminArticleToolbar {
  saveLabel: string
  saveDisabled: boolean
  saving: boolean
  generating: boolean
  generatingDisabled: boolean
  editLabel: string
  editIcon: string
  editDisabled: boolean
  publishing: boolean
  publishDisabled: boolean
  publishLabel: string
  onSave: () => void
  onGenerate: () => void
  onToggleEdit: () => void
  onPublish: () => void
  onDetails: () => void
}

export const adminArticleToolbarKey = 'admin-article-toolbar'
