<script setup lang="ts">
import { instagramDesigns, type InstagramDesignId } from '~/utils/instagram-designs'
import '~/assets/css/instagram-artwork.css'
import { type InstagramDraft, type InstagramPlayer } from '~/utils/instagram-templates'
import SchedulerPostPreview from '~/components/SchedulerPostPreview.vue'
import SchedulerPostHistory from '~/components/SchedulerPostHistory.vue'

definePageMeta({ layout: false })
useHead({ title: 'Instagram scheduler' })

const { data, status, error, refresh } = await useAsyncData('instagram-editor-players', async () => {
  const response = await $fetch<any>('/api/players/get-all')
  if (!Array.isArray(response?.players) || !Array.isArray(response?.teams)) throw new Error('Player data is unavailable.')
  return response
})

type PostPick = {
  id: number
  player: InstagramPlayer
  designId: InstagramDesignId
  caption: string
}
type BufferJob = { jobId: string; playerName: string; channelId: string; channel: string; state: 'sending' | 'unknown' }

const excludedPlayerCodes = ref<number[]>([])
const view = ref<'create' | 'history'>('create')
const historySearch = ref('')
const allowRepeat = ref(false)
const postPicks = ref<PostPick[]>([])
const bufferJobs = ref<Record<number, BufferJob>>({})
const schedulingError = ref('')
const queueNotice = ref('')
const activePickId = ref<number | null>(null)
const activePick = computed(() => postPicks.value.find(pick => pick.id === activePickId.value))
const toast = useToast()
const { players, designId, templateId, selectedPlayers, candidates, togglePlayer, draft, draftKey, validationMessage, caption, captionLoading, captionError, generateCaption } = useInstagramEditor(data, excludedPlayerCodes)
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
watch(draftKey, () => { allowRepeat.value = false })
watch(caption, value => {
  if (activePick.value) activePick.value.caption = value
}, { flush: 'sync' })

watch(candidates, items => {
  if (postPicks.value.length || !items.length) return
  postPicks.value = items.slice(0, 8).map((player: InstagramPlayer, index) => ({
    id: player.id,
    player,
    designId: instagramDesigns[index % instagramDesigns.length]!.id,
    caption: '',
  }))
  const first = postPicks.value[0]
  if (!first) return
  activePickId.value = first.id
  if (selectedPlayers.value[0]?.id !== first.id) togglePlayer(first.id)
  designId.value = first.designId
}, { immediate: true })

watch(players, currentPlayers => {
  if (!currentPlayers.length || !postPicks.value.length) return
  const playersById = new Map(currentPlayers.map(player => [player.id, player]))
  for (const pick of postPicks.value) {
    const currentPlayer = playersById.get(pick.id)
    if (currentPlayer) pick.player = currentPlayer
  }
})

function pickDraft(pick: PostPick): InstagramDraft {
  return {
    ...draft.value,
    design: pick.designId,
    template: 'spotlight',
    headline: pick.player.fullName,
    players: [pick.player],
    fixtures: [],
  }
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
    const confirmation = bufferConfirmation(scheduledPick.player.name, result.post.channel, result.post.dueAt, result.post.status)
    toast.add({ title: result.post.status === 'published' ? 'Already published' : 'Already in Buffer', description: confirmation, color: 'success', icon: 'i-lucide-check', duration: 6000 })
    removeScheduledPick(scheduledPick.id)
    showQueueNotice(`${result.post.status === 'published' ? 'Already published' : 'Already in Buffer'} · ${confirmation}`)
    return
  }
  if (result.queued && result.jobId) {
    bufferJobs.value[scheduledPick.id] = { jobId: result.jobId, playerName: scheduledPick.player.name, channelId: result.post.channelId, channel: result.post.channel, state: 'sending' }
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
        <header class="flex shrink-0 items-center justify-between px-4 py-3 sm:px-6">
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

        <SchedulerPostHistory v-else-if="view === 'history'" class="min-h-0 flex-1 overflow-auto px-4 pb-4 sm:px-6" :players="players" :initial-search="historySearch" />

        <section v-else class="flex min-h-0 flex-1 flex-col">
          <div class="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 overflow-y-auto px-3 py-2">
            <div class="flex h-5 w-[min(45vh,78vw)] max-w-[660px] items-center truncate text-xs font-medium text-success" role="status" aria-live="polite">
              <span v-if="queueNotice" class="truncate">{{ queueNotice }}</span>
            </div>
            <article v-if="activePick" class="w-[min(45vh,78vw)] max-w-[660px] overflow-hidden rounded-xl border border-default bg-default shadow-sm">
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
              <SchedulerPostPreview :key="activePreviewKey" ref="preview" :draft="activeDraft" />
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
            <div v-else class="flex aspect-square w-[min(45vh,78vw)] max-w-[660px] items-center justify-center text-sm text-muted">No post picks are available.</div>

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
            <div class="flex w-[min(45vh,78vw)] max-w-[660px] items-center justify-between gap-3">
              <UButton icon="i-lucide-sparkles" color="primary" variant="soft" size="md" :label="captionLoading ? 'Generating…' : 'Generate caption'" :loading="captionLoading" :disabled="!activePick || captionLoading || busy || Boolean(bufferJobs[activePick?.id ?? -1])" @click="generateCaption" />
              <UButton icon="i-lucide-send" color="primary" size="md" label="Schedule to Buffer" :loading="busy && phase !== 'Creating PNG…'" :disabled="!canScheduleActive" @click="scheduleActive" />
            </div>
            <p class="h-5 w-[min(45vh,78vw)] max-w-[660px] truncate text-xs" :class="failed || schedulingError ? 'text-error' : 'text-muted'" role="status" aria-live="polite">{{ phase || (failed ? message : schedulingError) }}</p>
          </div>

          <footer class="shrink-0 border-t border-default bg-default/95 px-3 pb-2 pt-2 sm:px-5">
            <div class="mx-auto flex max-w-6xl gap-2 overflow-x-auto overscroll-x-contain px-2 py-2">
              <article v-for="pick in postPicks" :key="`${pick.id}:${pick.player.photoUrl}:${pick.designId}`" class="relative w-24 shrink-0 sm:w-28 lg:w-32">
                <button type="button" class="block w-full overflow-hidden rounded-lg bg-elevated text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" :class="activePickId === pick.id ? 'ring-2 ring-primary' : 'ring-1 ring-default hover:ring-primary/50'" :aria-label="'Preview ' + pick.player.name + ', ' + instagramDesigns.find(item => item.id === pick.designId)?.name + ' template'" :aria-current="activePickId === pick.id ? 'true' : undefined" :disabled="busy" @click="activatePick(pick)">
                  <SchedulerPostPreview :key="`${pick.id}:${pick.player.code}:${pick.player.photoUrl}:${pick.designId}`" :draft="pickDraft(pick)" />
                </button>
                <span v-if="bufferJobs[pick.id]?.state === 'sending'" class="absolute inset-x-1 top-1 rounded bg-black/70 px-1.5 py-1 text-center text-[10px] font-medium text-white" role="status">Sending to Buffer…</span>
                <span v-else-if="bufferJobs[pick.id]?.state === 'unknown'" class="absolute inset-x-1 top-1 rounded bg-amber-600 px-1.5 py-1 text-center text-[10px] font-medium text-white">Check Buffer</span>
                <span v-else-if="pick.caption" class="absolute right-1 top-1 size-2.5 rounded-full bg-primary ring-2 ring-white" :aria-label="'Caption ready for ' + pick.player.name" />
                <p class="truncate px-1 pt-1 text-[10px] text-muted">{{ pick.player.name }} · {{ instagramDesigns.find(item => item.id === pick.designId)?.name }}</p>
              </article>
              <div v-if="!postPicks.length && status !== 'pending'" class="py-8 text-sm text-muted">No post picks are available.</div>
            </div>
          </footer>
        </section>
      </div>
    </main>
  </UApp>
</template>
