import type { ComputedRef } from 'vue'
import { copyLayout, parseSchedulerLayouts, schedulerLayoutStorageKey, type SchedulerLayout } from '~/utils/scheduler-layout'

interface LayoutStorageOptions {
  storageKey?: string
  parse?: (raw: string | null) => Record<string, SchedulerLayout>
  savedNotice?: string
}

// Defaults keep the scheduler's storage key, parser and messages unchanged.
export function useSchedulerLayouts(key: ComputedRef<string>, options: LayoutStorageOptions = {}) {
  const storageKey = options.storageKey ?? schedulerLayoutStorageKey
  const parse = options.parse ?? parseSchedulerLayouts
  const savedNotice = options.savedNotice ?? 'Layout saved in this browser.'
  const layouts = ref<Record<string, SchedulerLayout>>({})
  const saved = ref<Record<string, SchedulerLayout>>({})
  const undoStacks = ref<Record<string, SchedulerLayout[]>>({})
  const redoStacks = ref<Record<string, SchedulerLayout[]>>({})
  const storageError = ref('')
  const notice = ref('')
  const layout = computed(() => layouts.value[key.value] ?? {})
  const dirty = computed(() => JSON.stringify(layout.value) !== JSON.stringify(saved.value[key.value] ?? {}))
  const canUndo = computed(() => Boolean(undoStacks.value[key.value]?.length))
  const canRedo = computed(() => Boolean(redoStacks.value[key.value]?.length))
  let gesture: { key: string; before: SchedulerLayout } | undefined

  onMounted(() => {
    try {
      const stored = parse(localStorage.getItem(storageKey))
      saved.value = stored
      layouts.value = structuredClone(stored)
    } catch {
      storageError.value = 'Saved layouts could not load. You can still edit; try Save layout again.'
    }
  })
  watch(key, () => { notice.value = '' })
  function remember(before: SchedulerLayout, target = key.value) {
    undoStacks.value[target] = [...(undoStacks.value[target] ?? []), copyLayout(before)].slice(-50)
    redoStacks.value[target] = []
    notice.value = ''
  }
  function begin() { gesture = { key: key.value, before: copyLayout(layout.value) } }
  function update(next: SchedulerLayout) { layouts.value[key.value] = copyLayout(next); notice.value = '' }
  function end(cancel = false) {
    if (!gesture) return
    const { key: target, before } = gesture
    gesture = undefined
    if (cancel) layouts.value[target] = before
    else if (JSON.stringify(before) !== JSON.stringify(layouts.value[target] ?? {})) remember(before, target)
  }
  function change(next: SchedulerLayout) {
    if (JSON.stringify(next) === JSON.stringify(layout.value)) return
    remember(layout.value)
    update(next)
  }
  function undo() {
    const previous = undoStacks.value[key.value]?.pop()
    if (!previous) return
    redoStacks.value[key.value] = [...(redoStacks.value[key.value] ?? []), copyLayout(layout.value)]
    update(previous)
  }
  function redo() {
    const next = redoStacks.value[key.value]?.pop()
    if (!next) return
    undoStacks.value[key.value] = [...(undoStacks.value[key.value] ?? []), copyLayout(layout.value)]
    update(next)
  }
  function save() {
    try {
      // Merge at save time so another tab's saved designs are retained.
      let stored: Record<string, SchedulerLayout>
      try { stored = parse(localStorage.getItem(storageKey)) }
      catch { stored = {} }
      stored[key.value] = copyLayout(layout.value)
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, layouts: stored }))
      saved.value[key.value] = copyLayout(layout.value)
      storageError.value = ''
      notice.value = savedNotice
    } catch {
      storageError.value = 'The layout could not save. Check browser storage permissions and try again.'
    }
  }
  return { layouts, layout, dirty, canUndo, canRedo, storageError, notice, begin, update, end, change, undo, redo, save }
}
