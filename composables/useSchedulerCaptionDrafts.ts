export interface SchedulerCaptionDraft {
  signature: string
  playerName: string
  storyLabel: string
  gameweek: number | null
  season: string | null
  caption: string
  xCaption: string
  savedAt: number
}

const storageKey = 'fpl-scheduler-caption-drafts-v1'

export function parseSchedulerCaptionDrafts(raw: string | null): SchedulerCaptionDraft[] {
  if (!raw) return []
  const value: unknown = JSON.parse(raw)
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('drafts' in value) || !Array.isArray(value.drafts)) throw new Error('Invalid saved captions')
  return value.drafts.filter((item: unknown): item is SchedulerCaptionDraft => {
    if (!item || typeof item !== 'object') return false
    const draft = item as Partial<SchedulerCaptionDraft>
    return typeof draft.signature === 'string' && typeof draft.playerName === 'string' && typeof draft.storyLabel === 'string'
      && (draft.gameweek === null || typeof draft.gameweek === 'number') && (draft.season === null || typeof draft.season === 'string')
      && typeof draft.caption === 'string' && typeof draft.xCaption === 'string' && typeof draft.savedAt === 'number' && Number.isFinite(draft.savedAt)
  })
}

function mergeDrafts(...groups: SchedulerCaptionDraft[][]) {
  const merged = new Map<string, SchedulerCaptionDraft>()
  for (const draft of groups.flat()) {
    const previous = merged.get(draft.signature)
    if (!previous || draft.savedAt >= previous.savedAt) merged.set(draft.signature, draft)
  }
  return [...merged.values()].sort((a, b) => b.savedAt - a.savedAt)
}

export function useSchedulerCaptionDrafts() {
  const drafts = ref<SchedulerCaptionDraft[]>([])
  const storageError = ref('')

  onMounted(() => {
    try { drafts.value = parseSchedulerCaptionDrafts(localStorage.getItem(storageKey)) }
    catch { storageError.value = 'Saved captions could not load. Keep this page open and copy your captions before leaving.' }
  })

  function find(signature: string) {
    return drafts.value.find(draft => draft.signature === signature)
  }

  function save(draft: Omit<SchedulerCaptionDraft, 'savedAt'>) {
    if (!import.meta.client || (!draft.caption && !draft.xCaption)) return
    const entry = { ...draft, savedAt: Date.now() }
    drafts.value = mergeDrafts(drafts.value, [entry])
    try {
      const stored = parseSchedulerCaptionDrafts(localStorage.getItem(storageKey))
      drafts.value = mergeDrafts(stored, drafts.value)
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, drafts: drafts.value }))
      storageError.value = ''
    } catch {
      storageError.value = 'Captions could not be saved on this device. Keep this page open and copy them before leaving.'
    }
  }

  function remove(signature: string) {
    drafts.value = drafts.value.filter(draft => draft.signature !== signature)
    try {
      const stored = parseSchedulerCaptionDrafts(localStorage.getItem(storageKey)).filter(draft => draft.signature !== signature)
      drafts.value = mergeDrafts(stored, drafts.value)
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, drafts: drafts.value }))
      storageError.value = ''
    } catch {
      storageError.value = 'Saved captions could not be updated on this device.'
    }
  }

  return { drafts, storageError, find, save, remove }
}
