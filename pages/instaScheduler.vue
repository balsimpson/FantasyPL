<script setup lang="ts">
import { instagramDesigns, type InstagramDesignId } from '~/utils/instagram-designs'
import '~/assets/css/instagram-artwork.css'
import { type InstagramDraft } from '~/utils/instagram-templates'
import type { SchedulerPostPick as PostPick } from '~/composables/useSchedulerPicks'
import SchedulerPostPreview from '~/components/SchedulerPostPreview.vue'
import SchedulerPickReason from '~/components/SchedulerPickReason.vue'
import SchedulerPostHistory from '~/components/SchedulerPostHistory.vue'
import SchedulerTemplateEditor from '~/components/SchedulerTemplateEditor.vue'

definePageMeta({ layout: false })
useHead({ title: 'Instagram scheduler' })

const { data, status, error, refresh } = await useAsyncData('instagram-editor-players', async () => {
  const response = await $fetch<any>('/api/players/get-all')
  if (!Array.isArray(response?.players) || !Array.isArray(response?.teams)) throw new Error('Player data is unavailable.')
  return response
})

type BufferJob = { jobId: string; playerName: string; channelId: string; channel: string; state: 'sending' | 'unknown' }

const excludedPlayerCodes = ref<number[]>([])
const view = ref<'create' | 'history'>('create')
const historySearch = ref('')
const allowRepeat = ref(false)
const picksReady = ref(false)
const picksMounted = ref(false)
const bufferJobs = ref<Record<number, BufferJob>>({})
const schedulingError = ref('')
const queueNotice = ref('')
const activePickId = ref<number | null>(null)
const toast = useToast()
const { players, designId, templateId, selectedPlayers, togglePlayer, draft, draftKey, validationMessage, caption, captionLoading, captionError, generateCaption } = useInstagramEditor(data, excludedPlayerCodes)
const { postPicks, hasMorePicks, showMorePicks: loadMorePicks } = useSchedulerPicks(players, picksReady, computed(() => Object.keys(bufferJobs.value).map(Number)), excludedPlayerCodes, computed(() => data.value?.currentGameweek ?? null))
const pickList = useTemplateRef<HTMLElement>('pickList')
const activePick = computed(() => postPicks.value.find(pick => pick.id === activePickId.value))
const layoutKey = computed(() => `${activePick.value?.designId ?? designId.value}:spotlight`)
const layoutEditor = useSchedulerLayouts(layoutKey)
const editingLayout = ref(false)
const preview = useTemplateRef('preview')
const activeDraft = computed<InstagramDraft>(() => activePick.value ? pickDraft(activePick.value) : draft.value)
const activeDraftKey = computed(() => JSON.stringify(activeDraft.value))
const activePreviewKey = computed(() => [activePick.value?.id ?? 'empty', activeDraft.value.design, ...activeDraft.value.players.map(player => `${player.id}:${player.photoUrl}`)].join(':'))
const { assetsReady, busy, phase, message, failed, schedulingConfigured, schedulingMessage, download, schedule } = useInstagramExport(() => preview.value?.getElement(), activeDraftKey, activeDraft)
const history = useSchedulerHistory(computed(() => activeDraft.value.players), computed(() => activeDraft.value.gameweek), computed(() => activeDraft.value.season ?? null))
const { repeatMessage, ready: historyReady, error: historyError } = history

const activeDesign = computed(() => instagramDesigns.find(item => item.id === activePick.value?.designId) ?? instagramDesigns[0]!)
const filename = computed(() => activeDraft.value.design + '-' + activeDraft.value.template + '-' + activeDraft.value.players.map(player => player.name).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-gw' + (activeDraft.value.gameweek ?? 'unknown') + '.png')
const canExport = computed(() => !validationMessage.value && assetsReady.value && !busy.value)
const canScheduleActive = computed(() => Boolean(activePick.value?.caption.trim()) && !bufferJobs.value[activePick.value?.id ?? -1] && schedulingConfigured.value && historyReady.value && assetsReady.value && !busy.value && !captionLoading.value && (!repeatMessage.value || allowRepeat.value))

watch(history.excludedCodes, codes => { excludedPlayerCodes.value = codes }, { immediate: true })
watch([history.ready, history.error, picksMounted], ([ready, error, mounted]) => {
  if (!mounted) return
  if (ready || error) picksReady.value = ready
}, { immediate: true })
watch(draftKey, () => { allowRepeat.value = false })
watch(caption, value => {
  if (activePick.value) activePick.value.caption = value
}, { flush: 'sync' })

watch(postPicks, () => {
  if (activePick.value) return
  const first = postPicks.value[0]
  if (first) {
    void activatePick(first)
  } else {
    const selectedId = selectedPlayers.value[0]?.id
    activePickId.value = null
    if (selectedId) togglePlayer(selectedId)
    caption.value = ''
  }
}, { deep: false, immediate: true })

function pickDraft(pick: PostPick): InstagramDraft {
  return {
    ...draft.value,
    design: pick.designId,
    layout: layoutEditor.layouts.value[`${pick.designId}:spotlight`] ?? {},
    template: 'spotlight',
    headline: pick.player.fullName,
    story: pick.story,
    stats: pick.stats,
    players: [pick.player],
    fixtures: [],
  }
}

async function showMorePicks() {
  const nextIndex = postPicks.value.length
  loadMorePicks()
  await nextTick()
  const nextPick = pickList.value?.children[nextIndex] as HTMLElement | undefined
  nextPick?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
}

async function activatePick(pick: PostPick) {
  if (activePick.value?.id === pick.id) return
  schedulingError.value = ''
  queueNotice.value = ''
  const restoreCaption = pick.caption
  if (activePick.value) activePick.value.caption = caption.value
  activePickId.value = pick.id
  if (selectedPlayers.value[0]?.id !== pick.id) togglePlayer(pick.id)
  designId.value = pick.designId
  await nextTick()
  caption.value = restoreCaption
}

function changeTemplate(id: InstagramDesignId) {
  if (!activePick.value) return
  activePick.value.designId = id
  activePick.value.caption = ''
  designId.value = id
  caption.value = ''
}

function cycleTemplate(direction: -1 | 1) {
  const index = instagramDesigns.findIndex(item => item.id === activeDesign.value.id)
  const next = (index + direction + instagramDesigns.length) % instagramDesigns.length
  changeTemplate(instagramDesigns[next]!.id)
}

async function scheduleActive() {
  const scheduledPick = activePick.value
  if (!scheduledPick || !caption.value.trim()) return
  if (!schedulingConfigured.value) {
    return
  }
  if (!historyReady.value || !assetsReady.value) return
  if (repeatMessage.value && !allowRepeat.value) return
  schedulingError.value = ''
  const result = await schedule(filename.value, caption.value, allowRepeat.value)
  if (failed.value || !result) return
  if (result.alreadyScheduled) {
    excludedPlayerCodes.value = [...new Set([...excludedPlayerCodes.value, scheduledPick.player.code])]
    history.revision.value++
    const confirmation = bufferConfirmation(scheduledPick.player.name, result.post.channel, result.post.dueAt, result.post.status)
    toast.add({ title: result.post.status === 'published' ? 'Already published' : 'Already in Buffer', description: confirmation, color: 'success', icon: 'i-lucide-check', duration: 6000 })
    removeScheduledPick(scheduledPick.id)
    showQueueNotice(`${result.post.status === 'published' ? 'Already published' : 'Already in Buffer'} · ${confirmation}`)
    return
  }
  if (result.queued && result.jobId) {
    bufferJobs.value[scheduledPick.id] = { jobId: result.jobId, playerName: scheduledPick.player.name, channelId: result.post.channelId, channel: result.post.channel, state: 'sending' }
    removeScheduledPick(scheduledPick.id)
    toast.add({ title: 'Sending to Buffer', description: `${scheduledPick.player.name} · @${result.post.channel.replace(/^@/, '')}`, color: 'primary', icon: 'i-lucide-send', duration: 4000 })
  }
}

function bufferConfirmation(playerName: string, channel: string, dueAt: number | string | null, status: string) {
  const destination = `@${channel.replace(/^@/, '')}`
  if (status === 'published') return `${playerName} · ${destination} · Published`
  const time = dueAt ? new Date(typeof dueAt === 'number' ? dueAt : Date.parse(dueAt)).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''
  return `${playerName} · ${destination} · ${time ? `Scheduled ${time}` : 'Queued'}`
}

let queueNoticeTimer: ReturnType<typeof setTimeout> | undefined
function showQueueNotice(message: string) {
  if (queueNoticeTimer) clearTimeout(queueNoticeTimer)
  queueNotice.value = message
  queueNoticeTimer = setTimeout(() => { queueNotice.value = '' }, 6500)
}

function removeScheduledPick(playerId: number) {
  const index = postPicks.value.findIndex(pick => pick.id === playerId)
  if (index < 0) return
  const wasActive = activePickId.value === playerId
  postPicks.value.splice(index, 1)
  if (!wasActive) return
  const nextPick = postPicks.value[Math.min(index, postPicks.value.length - 1)]
  if (nextPick) {
    void activatePick(nextPick)
  } else {
    activePickId.value = null
    if (selectedPlayers.value[0]?.id === playerId) togglePlayer(playerId)
    caption.value = ''
  }
}

function updateCaption(event: Event) {
  caption.value = (event.currentTarget as HTMLElement).innerText.replace(/\n+$/, '')
}

let pollTimer: ReturnType<typeof setInterval> | undefined
let pollInFlight = false
async function pollBufferJobs() {
  const jobs = Object.values(bufferJobs.value).filter(job => job.state === 'sending')
  if (!jobs.length || pollInFlight) return
  pollInFlight = true
  try {
    const statuses = await $fetch<{ postId: string; status: string; dueAt: number | null; error: string | null }[]>('/api/scheduler/status', {
      method: 'POST', body: { channelId: jobs[0]!.channelId, jobIds: jobs.map(job => job.jobId) },
    })
    for (const status of statuses) {
      const entry = Object.entries(bufferJobs.value).find(([, job]) => job.jobId === status.postId)
      if (!entry) continue
      const playerId = Number(entry[0])
      const job = entry[1]
      if (status.status === 'scheduled' || status.status === 'published') {
        const player = players.value.find(item => item.id === playerId)
        if (player) excludedPlayerCodes.value = [...new Set([...excludedPlayerCodes.value, player.code])]
        delete bufferJobs.value[playerId]
        const confirmation = bufferConfirmation(job.playerName, job.channel, status.dueAt, status.status)
        toast.add({ title: status.status === 'published' ? 'Post published' : 'Added to Buffer', description: confirmation, color: 'success', icon: 'i-lucide-check', duration: 6500 })
        removeScheduledPick(playerId)
        showQueueNotice(`${status.status === 'published' ? 'Published' : 'Added to Buffer'} · ${confirmation}`)
        useState('scheduler-history-revision', () => 0).value++
      } else if (status.status === 'failed') {
        delete bufferJobs.value[playerId]
        schedulingError.value = status.error || `${job.playerName} could not be added to Buffer.`
        toast.add({ title: 'Could not add to Buffer', description: schedulingError.value, color: 'error', icon: 'i-lucide-circle-alert', duration: 8000 })
      } else if (status.status === 'unknown') {
        bufferJobs.value[playerId] = { ...job, state: 'unknown' }
        schedulingError.value = `Buffer could not confirm ${job.playerName}. Check History before trying again.`
        toast.add({ title: 'Check Buffer', description: schedulingError.value, color: 'warning', icon: 'i-lucide-circle-alert', duration: 8000 })
      }
    }
  } catch {
    // Keep checking; the durable Convex job continues if this page is closed.
  } finally {
    pollInFlight = false
  }
}

onMounted(() => {
  picksMounted.value = true
  pollTimer = setInterval(() => { void pollBufferJobs() }, 1800)
})
onScopeDispose(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (queueNoticeTimer) clearTimeout(queueNoticeTimer)
})

</script>

<template>
  <UApp>
    <main class="h-dvh overflow-hidden bg-default text-default selection:bg-primary/20">
      <div class="flex h-full flex-col">
        <header class="site-content-rail flex shrink-0 items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <UButton to="/" icon="i-lucide-arrow-left" color="neutral" variant="ghost" aria-label="Back to FPL Insights" />
            <h1 class="text-sm font-semibold text-highlighted sm:text-base">Post picks <span class="font-normal text-muted">· GW{{ draft.gameweek ?? '—' }}</span></h1>
          </div>
          <div class="flex items-center gap-1">
            <UButton icon="i-lucide-download" color="neutral" variant="ghost" size="sm" aria-label="Download PNG" :disabled="!canExport" :loading="busy && phase === 'Creating PNG…'" @click="download(filename)" />
            <UButton :icon="view === 'history' ? 'i-lucide-arrow-left' : 'i-lucide-history'" color="neutral" variant="ghost" :label="view === 'history' ? 'Back to picks' : 'History'" :disabled="busy" @click="view = view === 'history' ? 'create' : 'history'" />
          </div>
        </header>

        <UAlert v-if="error" color="error" title="Player data could not load" description="Load the player list again to start creating a post." class="mx-auto mt-8 w-full max-w-lg" :actions="[{ label: 'Try again', onClick: () => refresh() }]" />
        <div v-else-if="status === 'pending'" role="status" class="flex flex-1 items-center justify-center text-muted">Loading players…</div>

        <SchedulerPostHistory v-else-if="view === 'history'" class="site-content-rail min-h-0 flex-1 overflow-auto pb-4" :players="players" :initial-search="historySearch" />

        <section v-else class="flex min-h-0 flex-1 flex-col">
          <div class="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-3 pt-2 pb-24">
            <div class="flex h-5 w-[min(45vh,78vw)] max-w-[660px] items-center truncate text-xs font-medium text-success" role="status" aria-live="polite">
              <span v-if="queueNotice" class="truncate">{{ queueNotice }}</span>
            </div>
            <article v-if="picksReady && activePick" class="w-[min(45vh,78vw)] max-w-[660px] overflow-hidden rounded-xl border border-default bg-default shadow-sm">
              <header class="flex items-center justify-between px-3 py-2.5">
                <div class="flex min-w-0 items-center gap-2.5">
                  <div class="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 p-[2px]">
                    <div class="grid size-full place-items-center rounded-full bg-default text-[9px] font-bold text-highlighted">FPL</div>
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-xs font-semibold text-highlighted">fplinsights</p>
                    <p class="text-[10px] text-muted">Original audio</p>
                  </div>
                </div>
                <UButton icon="i-lucide-ellipsis" color="neutral" variant="ghost" size="xs" aria-label="Post options" />
              </header>
              <SchedulerTemplateEditor :key="activePreviewKey" ref="preview" v-model:editing="editingLayout" :draft="activeDraft" :editor="layoutEditor" :disabled="busy || Boolean(bufferJobs[activePick.id])" toolbar-target="#scheduler-post-toolbar">
                <template #actions>
                  <span class="mx-0.5 h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />
                  <UTooltip :text="captionLoading ? 'Generating caption…' : 'Generate caption'">
                    <UButton icon="i-lucide-sparkles" color="neutral" variant="ghost" class="size-9 justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white" :aria-label="captionLoading ? 'Generating caption' : 'Generate caption'" :loading="captionLoading" :disabled="!activePick || captionLoading || busy || Boolean(bufferJobs[activePick?.id ?? -1])" @click="generateCaption(activeDraft)" />
                  </UTooltip>
                  <UTooltip text="Schedule to Buffer">
                    <UButton icon="i-lucide-send" color="primary" class="ml-1 size-11 justify-center rounded-full ring-2 ring-zinc-900" aria-label="Schedule to Buffer" :loading="busy && phase !== 'Creating PNG…'" :disabled="!canScheduleActive" @click="scheduleActive" />
                  </UTooltip>
                </template>
              </SchedulerTemplateEditor>
              <div class="flex items-center gap-3 px-3 py-2">
                <UIcon name="i-lucide-heart" class="size-5 text-highlighted" aria-hidden="true" />
                <UIcon name="i-lucide-message-circle" class="size-5 text-highlighted" aria-hidden="true" />
                <UIcon name="i-lucide-send" class="size-5 text-highlighted" aria-hidden="true" />
                <UIcon name="i-lucide-bookmark" class="ml-auto size-5 text-highlighted" aria-hidden="true" />
              </div>
              <div class="px-3 pb-3">
                <div class="grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" :class="caption ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'" :aria-hidden="!caption">
                  <div class="min-h-0 overflow-hidden">
                    <p class="whitespace-pre-wrap break-words text-xs leading-relaxed text-default">
                      <span class="font-semibold text-highlighted">fplinsights</span>
                      <span
                        v-if="caption"
                        :key="activePickId"
                        role="textbox"
                        aria-label="Post caption, edit inline"
                        aria-multiline="true"
                        :contenteditable="!captionLoading && !busy && !bufferJobs[activePick?.id ?? -1]"
                        spellcheck="true"
                        class="outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        @input="updateCaption"
                      >{{ caption }}</span>
                    </p>
                  </div>
                </div>
                <p v-if="!caption && !captionLoading" class="text-xs text-muted">Your generated caption will appear here.</p>
              </div>
            </article>
            <div v-else class="flex aspect-square w-[min(45vh,78vw)] max-w-[660px] flex-col items-center justify-center gap-3 text-center text-sm text-muted" role="status">
              <template v-if="historyError"><p>Post history could not load. Retry to find players you can post.</p><UButton label="Retry history" color="neutral" variant="soft" @click="history.refresh()" /></template>
              <span v-else>{{ picksReady ? 'No unposted players match the current picks.' : 'Checking queued and posted players…' }}</span>
            </div>

            <div class="flex w-[min(45vh,78vw)] max-w-[660px] items-center justify-center gap-3">
              <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" aria-label="Previous template" :disabled="busy || !activePick || Boolean(bufferJobs[activePick?.id ?? -1])" @click="cycleTemplate(-1)" />
              <span class="min-w-36 text-center text-sm font-medium text-muted">{{ activeDesign.letter }} <span class="text-dimmed">·</span> {{ activeDesign.name }}</span>
              <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" aria-label="Next template" :disabled="busy || !activePick || Boolean(bufferJobs[activePick?.id ?? -1])" @click="cycleTemplate(1)" />
            </div>

            <div class="h-5 w-[min(45vh,78vw)] max-w-[660px] truncate text-xs text-error" role="status">
              <span v-if="captionError" role="alert">{{ captionError }}</span>
            </div>
            <UAlert v-if="repeatMessage" color="warning" :title="repeatMessage" class="w-full max-w-[660px]" />
            <UCheckbox v-if="repeatMessage" v-model="allowRepeat" label="Allow this repeat post" :disabled="busy" />
            <p class="h-5 w-[min(45vh,78vw)] max-w-[660px] truncate text-xs" :class="failed || schedulingError ? 'text-error' : 'text-muted'" role="status" aria-live="polite">{{ phase || (failed ? message : schedulingError) }}</p>
          </div>

          <footer class="relative z-40 shrink-0 border-t border-default bg-default/95 pb-2 pt-2">
            <div id="scheduler-post-toolbar" class="pointer-events-none absolute inset-x-0 bottom-full flex justify-center px-2 pb-4" />
            <div class="site-content-rail flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1">
              <p class="text-xs text-muted">Post ideas · Differentials, transfers, value and form</p>
              <UButton label="Show more players" icon="i-lucide-plus" color="neutral" variant="ghost" size="sm" :disabled="!hasMorePicks || busy" @click="showMorePicks" />
            </div>
            <div v-if="picksReady" ref="pickList" class="site-content-rail flex gap-2 overflow-x-auto overscroll-x-contain py-2">
              <article v-for="pick in postPicks" :key="`${pick.id}:${pick.player.photoUrl}:${pick.designId}`" class="relative w-24 shrink-0 sm:w-28 lg:w-32">
                <button type="button" class="relative block w-full overflow-hidden rounded-lg bg-elevated text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" :class="activePickId === pick.id ? 'ring-2 ring-primary' : 'ring-1 ring-default hover:ring-primary/50'" :aria-label="'Preview ' + pick.player.name + ', ' + pick.story.label + ', ' + pick.story.evidence" :title="pick.story.scope ?? pick.story.evidence" :aria-current="activePickId === pick.id ? 'true' : undefined" :disabled="busy" @click="activatePick(pick)">
                  <SchedulerPostPreview :key="`${pick.id}:${pick.player.code}:${pick.player.photoUrl}:${pick.designId}`" :draft="pickDraft(pick)" />
                  <SchedulerPickReason :story="pick.story" />
                </button>
                <span v-if="bufferJobs[pick.id]?.state === 'sending'" class="absolute inset-x-1 top-1 rounded bg-black/70 px-1.5 py-1 text-center text-[10px] font-medium text-white" role="status">Sending to Buffer…</span>
                <span v-else-if="bufferJobs[pick.id]?.state === 'unknown'" class="absolute inset-x-1 top-1 rounded bg-amber-600 px-1.5 py-1 text-center text-[10px] font-medium text-white">Check Buffer</span>
                <span v-else-if="pick.caption" class="absolute right-1 top-1 size-2.5 rounded-full bg-primary ring-2 ring-white" :aria-label="'Caption ready for ' + pick.player.name" />
                <p class="truncate px-1 pt-1 text-[10px] text-muted">{{ pick.player.name }} · {{ instagramDesigns.find(item => item.id === pick.designId)?.name }}</p>
              </article>
              <div v-if="!postPicks.length && status !== 'pending'" class="py-8 text-sm text-muted">No unposted players match the current picks.</div>
            </div>
          </footer>
        </section>
      </div>
    </main>
  </UApp>
</template>
