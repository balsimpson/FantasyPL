import type { Ref } from 'vue'
import type { SchedulerPostRecord } from '~/utils/scheduler-history'

export function schedulerClientError(error: unknown) {
  const detail = error as { data?: { data?: { message?: string }; statusMessage?: string } }
  return detail?.data?.data?.message || detail?.data?.statusMessage || 'Post history could not load. Please try again.'
}

export function useSchedulerPostList(search: Ref<string>, status: Ref<string>, platform: 'instagram' | 'x' = 'instagram') {
  type Page = { posts: SchedulerPostRecord[]; cursor: string | null; hasMore: boolean; loading: boolean; error: string; revision: number; request: number }
  const pages = useState<Record<string, Page>>(`scheduler-history-pages-${platform}`, () => ({}))
  const provider = useState(`scheduler-history-provider-${platform}`, () => ({ syncing: false, error: '', cursor: null as string | null, hasOlder: false, nextRefreshAt: 0, lastFullRefreshAt: 0, pendingOffset: 0 }))
  const deleting = ref('')
  const deleteError = ref('')
  const retrying = ref('')
  const retryError = ref('')
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

  async function load(more = false, keepCount = false) {
    pages.value[key.value] ??= { posts: [], cursor: null, hasMore: false, loading: false, error: '', revision: -1, request: 0 }
    const currentPage = pages.value[key.value]!
    if (more && (currentPage.loading || !currentPage.hasMore)) return
    more = more && currentPage.revision === revision.value
    const current = ++currentPage.request
    const currentRevision = revision.value
    const targetCount = keepCount ? Math.max(20, currentPage.posts.length) : 20
    const query = { platform, search: search.value.trim(), status: status.value === 'all' ? '' : status.value }
    currentPage.loading = true
    currentPage.error = ''
    try {
      const incoming: SchedulerPostRecord[] = []
      let cursor = more ? currentPage.cursor : null
      let isDone = false
      do {
        const previousCursor = cursor
        const result = await $fetch('/api/scheduler/history', { query: { ...query, cursor: cursor || '' }, retry: 0 })
        if (current !== currentPage.request) return
        incoming.push(...result.page as SchedulerPostRecord[])
        cursor = result.continueCursor
        isDone = result.isDone
        if (!isDone && (!cursor || cursor === previousCursor)) throw new Error('Post history pagination did not advance. Please try again.')
      } while (!more && incoming.length < targetCount && !isDone)
      currentPage.posts = more ? [...currentPage.posts, ...incoming.filter(item => !currentPage.posts.some(existing => existing._id === item._id))] : incoming
      currentPage.cursor = cursor
      currentPage.hasMore = !isDone
      currentPage.revision = currentRevision
    } catch (cause) { if (current === currentPage.request) currentPage.error = schedulerClientError(cause) }
    finally { if (current === currentPage.request) currentPage.loading = false }
  }
  async function sync(older = false) {
    if (syncing.value) return
    provider.value.syncing = true
    provider.value.error = ''
    if (!older) provider.value.lastFullRefreshAt = Date.now()
    provider.value.nextRefreshAt = Date.now() + 60_000
    try {
      const result = await $fetch('/api/scheduler/sync', { method: 'POST', body: { platform, cursor: older ? provider.value.cursor : null }, retry: 0 })
      provider.value.cursor = result.cursor
      provider.value.hasOlder = result.hasMore
      revision.value++
    } catch (cause) {
      provider.value.error = schedulerClientError(cause)
      provider.value.nextRefreshAt = Date.now() + 300_000
    }
    finally {
      await load(false, true)
      provider.value.syncing = false
      if (!page.value || (page.value.revision !== revision.value && !page.value.error)) await load(false, true)
    }
  }
  async function initialize() {
    if (syncing.value || page.value?.loading) return
    if (!page.value || page.value.revision !== revision.value) await load(false, true)
    if (document.hidden) return
    if (Date.now() >= (provider.value.nextRefreshAt || 0) && Date.now() - (provider.value.lastFullRefreshAt || 0) >= 300_000) await sync()
    else void refreshPending()
  }
  async function refreshPending() {
    const now = Date.now()
    if (document.hidden || syncing.value || loading.value || deleting.value) return
    if (posts.value.some(post => post.status === 'submitting' && !post.bufferPostId)) await load(false, true)
    if (now < (provider.value.nextRefreshAt || 0)) return
    const candidates = [...posts.value, ...Object.values(pages.value).flatMap(cached => cached.posts)]
    const eligibleIds = [...new Set(candidates.filter(post => post.bufferPostId && (
      post.status === 'submitting' || post.status === 'unknown' || (post.status === 'scheduled' && (post.dueAt === null || post.dueAt <= now))
    )).map(post => post.bufferPostId!))]
    if (!eligibleIds.length) return
    const offset = (provider.value.pendingOffset || 0) % eligibleIds.length
    const postIds = [...eligibleIds.slice(offset), ...eligibleIds.slice(0, offset)].slice(0, 20)
    provider.value.pendingOffset = (offset + postIds.length) % eligibleIds.length
    provider.value.syncing = true
    provider.value.error = ''
    provider.value.nextRefreshAt = now + 60_000
    try {
      await $fetch('/api/scheduler/sync', { method: 'POST', body: { platform, postIds }, retry: 0 })
      revision.value++
      await load(false, true)
    } catch (cause) {
      provider.value.error = schedulerClientError(cause)
      provider.value.nextRefreshAt = Date.now() + 300_000
    } finally {
      provider.value.syncing = false
    }
  }
  async function deleteEntry(post: SchedulerPostRecord) {
    if (deleting.value) return
    deleting.value = post._id
    deleteError.value = ''
    try {
      await $fetch('/api/scheduler/delete-entry', { method: 'POST', body: { platform, postId: post._id }, retry: 0 })
      for (const cached of Object.values(pages.value)) {
        cached.posts = cached.posts.filter(item => item._id !== post._id)
        cached.request++
        cached.loading = false
      }
      revision.value++
    } catch (cause) { deleteError.value = schedulerClientError(cause) }
    finally { deleting.value = '' }
  }
  async function retryX(post: SchedulerPostRecord, caption: string) {
    if (retrying.value) return
    retrying.value = post._id
    retryError.value = ''
    try {
      await $fetch('/api/scheduler/retry-x', { method: 'POST', body: { postId: post._id, caption }, retry: 0 })
      revision.value++
    } catch (cause) { retryError.value = schedulerClientError(cause) }
    finally { retrying.value = '' }
  }
  function dismissSyncError() { provider.value.error = '' }
  watch([search, status], (_, __, onCleanup) => {
    const timer = setTimeout(() => initialize(), 300)
    onCleanup(() => clearTimeout(timer))
  })
  watch(revision, () => { if (!syncing.value) void load(false, true) }, { flush: 'sync' })
  return { posts, loading, syncing, error, syncError, hasMore, hasOlder, load, sync, initialize, refreshPending, revision, deleting, deleteError, deleteEntry, retrying, retryError, retryX, dismissSyncError }
}
