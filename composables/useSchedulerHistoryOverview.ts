import type { SchedulerHistoryOverview } from '~/utils/scheduler-history'
import { schedulerClientError } from '~/composables/useSchedulerPostList'

export function useSchedulerHistoryOverview(platform: 'instagram' | 'x' = 'instagram') {
  const state = useState(`scheduler-history-overview-${platform}`, () => ({ data: null as SchedulerHistoryOverview | null, revision: -1, loading: false, error: '', request: 0 }))
  const revision = useState('scheduler-history-revision', () => 0)
  async function load(force = false) {
    if (!force && (state.value.loading || (state.value.revision === revision.value && state.value.data && Date.now() - state.value.data.asOf < 300_000))) return
    const request = ++state.value.request
    const currentRevision = revision.value
    state.value.loading = true
    state.value.error = ''
    try {
      const data = await $fetch<SchedulerHistoryOverview>('/api/scheduler/overview', { query: { platform }, retry: 0 })
      if (request !== state.value.request) return
      state.value.data = data
      state.value.revision = currentRevision
    } catch (cause) { if (request === state.value.request) state.value.error = schedulerClientError(cause) }
    finally { if (request === state.value.request) state.value.loading = false }
  }
  watch(revision, () => { void load(true) })
  return { overview: computed(() => state.value.data), loading: computed(() => state.value.loading), error: computed(() => state.value.error), load }
}
