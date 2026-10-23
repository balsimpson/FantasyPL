import type { ComputedRef } from 'vue'
import type { InstagramPlayer } from '~/utils/instagram-templates'
import { formatSchedulerDate, type SchedulerPlayerActivity } from '~/utils/scheduler-history'

export function useSchedulerHistory(players: ComputedRef<InstagramPlayer[]>, gameweek: ComputedRef<number | null>, season: ComputedRef<string | null>) {
  const revision = useState('scheduler-history-revision', () => 0)
  const query = computed(() => ({ codes: players.value.map(player => player.code).join(','), gameweek: gameweek.value ?? '', season: season.value ?? '' }))
  const { data, status, error, refresh } = useFetch('/api/scheduler/activity', { query, watch: [revision] })
  const excludedCodes = computed(() => data.value?.excludedCodes ?? [])
  const activity = computed(() => (data.value?.players ?? []) as SchedulerPlayerActivity[])
  const notes = computed(() => Object.fromEntries(activity.value.map(item => [item.code, item.queued ? 'Already queued' : item.postedThisGameweek ? 'Posted this gameweek' : item.lastPostedAt ? `Last posted ${formatSchedulerDate(item.lastPostedAt)}` : ''])))
  const repeats = computed(() => players.value.filter(player => activity.value.some(item => item.code === player.code && (item.queued || item.postedThisGameweek))))
  const repeatMessage = computed(() => repeats.value.map(player => `${player.name}: ${notes.value[player.code].toLowerCase()}`).join('. '))
  return { excludedCodes, notes, repeatMessage, ready: computed(() => status.value === 'success' && !error.value), error, refresh, revision }
}
