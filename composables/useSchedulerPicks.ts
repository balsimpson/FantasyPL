import type { ComputedRef, Ref } from 'vue'
import { instagramDesigns, type InstagramDesignId } from '~/utils/instagram-designs'
import type { InstagramPlayer } from '~/utils/instagram-templates'
import { getSchedulerPickPools, takeSchedulerPickBatch, type SchedulerPickCandidate, type SchedulerPickGameweek } from '~/utils/scheduler-picks'

export type SchedulerPostPick = SchedulerPickCandidate & {
  id: number
  player: InstagramPlayer
  designId: InstagramDesignId
  caption: string
  xCaption: string
}

export function useSchedulerPicks(players: ComputedRef<InstagramPlayer[]>, ready: Ref<boolean>, pendingIds: ComputedRef<number[]>, excludedCodes: Ref<number[]>, gameweek: ComputedRef<SchedulerPickGameweek | null>) {
  const postPicks = ref<SchedulerPostPick[]>([])
  const batchSize = 8
  const pools = computed(() => getSchedulerPickPools(players.value, gameweek.value))
  const excludedIds = computed(() => new Set([...pendingIds.value, ...players.value.filter(player => excludedCodes.value.includes(player.code)).map(player => player.id)]))
  const nextBatch = computed(() => takeSchedulerPickBatch(pools.value, new Set([...excludedIds.value, ...postPicks.value.map(pick => pick.id)]), batchSize))
  const hasMorePicks = computed(() => ready.value && nextBatch.value.length > 0)

  function showMorePicks() {
    if (!ready.value) return
    const offset = postPicks.value.length
    postPicks.value.push(...nextBatch.value.map((candidate, index) => ({
      ...candidate, id: candidate.player.id,
      designId: instagramDesigns[(offset + index) % instagramDesigns.length]!.id,
      caption: '', xCaption: '',
    })))
  }

  watch([pools, excludedIds, ready], ([items, excluded, isReady]) => {
    if (!isReady) return
    const candidates = Object.values(items).flat()
    postPicks.value = postPicks.value.filter(pick => !excluded.has(pick.id) && candidates.some(item => item.player.id === pick.id && item.story.id === pick.story.id))
    for (const pick of postPicks.value) {
      const candidate = candidates.find(item => item.player.id === pick.id && item.story.id === pick.story.id)!
      pick.player = candidate.player
      pick.story = candidate.story
      pick.stats = candidate.stats
    }
    if (!postPicks.value.length) showMorePicks()
  }, { immediate: true })

  return { postPicks, hasMorePicks, showMorePicks }
}
