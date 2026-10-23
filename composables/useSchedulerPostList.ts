import type { Ref } from 'vue'
import type { SchedulerPostRecord } from '~/utils/scheduler-history'

export function schedulerClientError(error: unknown) {
  const detail = error as { data?: { data?: { message?: string }; statusMessage?: string } }
  return detail?.data?.data?.message || detail?.data?.statusMessage || 'Post history could not load. Please try again.'
}

export function useSchedulerPostList(search: Ref<string>, status: Ref<string>) {
  const posts = ref<SchedulerPostRecord[]>([])
  const loading = ref(false)
  const syncing = ref(false)
  const error = ref('')
  const syncError = ref('')
  const cursor = ref<string | null>(null)
  const hasMore = ref(false)
  const providerCursor = ref<string | null>(null)
  const hasOlder = ref(false)
  const revision = useState('scheduler-history-revision', () => 0)
  let request = 0

  async function load(more = false) {
    const current = ++request
    loading.value = true
    error.value = ''
    if (!more) { cursor.value = null; hasMore.value = false }
    try {
      const result = await $fetch('/api/scheduler/history', { query: { search: search.value, status: status.value === 'all' ? '' : status.value, cursor: more ? cursor.value || '' : '' }, retry: 0 })
      if (current !== request) return
      const incoming = result.page as SchedulerPostRecord[]
      posts.value = more ? [...posts.value, ...incoming.filter(item => !posts.value.some(existing => existing._id === item._id))] : incoming
      cursor.value = result.continueCursor
      hasMore.value = !result.isDone
    } catch (cause) { if (current === request) error.value = schedulerClientError(cause) }
    finally { if (current === request) loading.value = false }
  }
  async function sync(older = false) {
    if (syncing.value) return
    syncing.value = true
    syncError.value = ''
    try {
      const result = await $fetch('/api/scheduler/sync', { method: 'POST', body: { cursor: older ? providerCursor.value : null }, retry: 0 })
      providerCursor.value = result.cursor
      hasOlder.value = result.hasMore
      revision.value++
    } catch (cause) { syncError.value = schedulerClientError(cause) }
    finally { syncing.value = false; await load() }
  }
  watch([search, status], (_, __, onCleanup) => {
    request++
    const timer = setTimeout(() => load(), 300)
    onCleanup(() => clearTimeout(timer))
  })
  return { posts, loading, syncing, error, syncError, hasMore, hasOlder, load, sync, revision }
}
