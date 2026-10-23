import type { Ref } from 'vue'
import type { SchedulerPostRecord } from '~/utils/scheduler-history'

export function schedulerClientError(error: unknown) {
  const detail = error as { data?: { data?: { message?: string }; statusMessage?: string } }
  return detail?.data?.data?.message || detail?.data?.statusMessage || 'Post history could not load. Please try again.'
}

export function useSchedulerPostList(search: Ref<string>, status: Ref<string>) {
  type Page = { posts: SchedulerPostRecord[]; cursor: string | null; hasMore: boolean; loading: boolean; error: string; revision: number; request: number }
  const pages = useState<Record<string, Page>>('scheduler-history-pages', () => ({}))
  const provider = useState('scheduler-history-provider', () => ({ syncing: false, error: '', cursor: null as string | null, hasOlder: false }))
  const deleting = ref('')
  const deleteError = ref('')
  const revision = useState('scheduler-history-revision', () => 0)
  const key = computed(() => JSON.stringify([search.value.trim(), status.value]))
  const page = computed(() => pages.value[key.value])
  const posts = computed(() => page.value?.posts ?? [])
  const loading = computed(() => page.value?.loading ?? true)
  const syncing = computed(() => provider.value.syncing)
  const error = computed(() => page.value?.error ?? '')
  const syncError = computed(() => provider.value.error)
  const hasMore = computed(() => page.value?.hasMore ?? false)
  const hasOlder = computed(() => provider.value.hasOlder)

  async function load(more = false) {
    pages.value[key.value] ??= { posts: [], cursor: null, hasMore: false, loading: false, error: '', revision: -1, request: 0 }
    const currentPage = pages.value[key.value]!
    if (more && (currentPage.loading || !currentPage.hasMore)) return
    more = more && currentPage.revision === revision.value
    const current = ++currentPage.request
    const currentRevision = revision.value
    currentPage.loading = true
    currentPage.error = ''
    try {
      const result = await $fetch('/api/scheduler/history', { query: { search: search.value.trim(), status: status.value === 'all' ? '' : status.value, cursor: more ? currentPage.cursor || '' : '' }, retry: 0 })
      if (current !== currentPage.request) return
      const incoming = result.page as SchedulerPostRecord[]
      currentPage.posts = more ? [...currentPage.posts, ...incoming.filter(item => !currentPage.posts.some(existing => existing._id === item._id))] : incoming
      currentPage.cursor = result.continueCursor
      currentPage.hasMore = !result.isDone
      currentPage.revision = currentRevision
    } catch (cause) { if (current === currentPage.request) currentPage.error = schedulerClientError(cause) }
    finally { if (current === currentPage.request) currentPage.loading = false }
  }
  async function sync(older = false) {
    if (syncing.value) return
    provider.value.syncing = true
    provider.value.error = ''
    try {
      const result = await $fetch('/api/scheduler/sync', { method: 'POST', body: { cursor: older ? provider.value.cursor : null }, retry: 0 })
      provider.value.cursor = result.cursor
      provider.value.hasOlder = result.hasMore
      revision.value++
    } catch (cause) { provider.value.error = schedulerClientError(cause) }
    finally {
      await load()
      provider.value.syncing = false
      if (!page.value || (page.value.revision !== revision.value && !page.value.error)) await load()
    }
  }
  async function initialize() {
    if (syncing.value || page.value?.loading) return
    if (!page.value || page.value.revision !== revision.value) await load()
  }
  async function deleteFailed(post: SchedulerPostRecord) {
    if (post.status !== 'failed' || deleting.value) return
    deleting.value = post._id
    deleteError.value = ''
    try {
      await $fetch('/api/scheduler/delete-failed', { method: 'POST', body: { postId: post._id }, retry: 0 })
      for (const cached of Object.values(pages.value)) {
        cached.posts = cached.posts.filter(item => item._id !== post._id)
        cached.request++
        cached.loading = false
      }
      revision.value++
    } catch (cause) { deleteError.value = schedulerClientError(cause) }
    finally { deleting.value = '' }
  }
  function dismissSyncError() { provider.value.error = '' }
  watch([search, status], (_, __, onCleanup) => {
    const timer = setTimeout(() => initialize(), 300)
    onCleanup(() => clearTimeout(timer))
  })
  watch(revision, () => { if (!syncing.value) void load() }, { flush: 'sync' })
  return { posts, loading, syncing, error, syncError, hasMore, hasOlder, load, sync, initialize, revision, deleting, deleteError, deleteFailed, dismissSyncError }
}
