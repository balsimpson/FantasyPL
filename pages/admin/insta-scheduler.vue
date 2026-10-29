<script setup lang="ts">
import { instagramDesigns, type InstagramDesignId } from '~/utils/instagram-designs'
import '~/assets/css/instagram-artwork.css'
import { type InstagramDraft } from '~/utils/instagram-templates'
import type { SchedulerPostPick as PostPick } from '~/composables/useSchedulerPicks'
import SchedulerPostPreview from '~/components/SchedulerPostPreview.vue'
import SchedulerPickReason from '~/components/SchedulerPickReason.vue'
import SchedulerPostHistory from '~/components/SchedulerPostHistory.vue'
import SchedulerTemplateEditor from '~/components/SchedulerTemplateEditor.vue'
import SchedulerInstagramPost from '~/components/SchedulerInstagramPost.vue'
import { adminSchedulerToolbarKey, type AdminSchedulerToolbar } from '~/composables/adminSchedulerToolbar'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'InstaScheduler' })

const { data, status, error, refresh } = await useAsyncData('instagram-editor-players', async () => {
  const response = await $fetch<any>('/api/players/get-all')
  if (!Array.isArray(response?.players) || !Array.isArray(response?.teams)) throw new Error('Player data is unavailable.')
  return response
})

type BufferJob = { jobId: string; playerId: number; playerName: string; platform: 'instagram' | 'x'; channelId: string; channel: string; state: 'sending' | 'unknown' }

const excludedPlayerCodes = ref<number[]>([])
const view = ref<'create' | 'history'>('create')
const historyPlatform = ref<'instagram' | 'x'>('instagram')
const historySearch = ref('')
const allowRepeat = ref(false)
const picksReady = ref(false)
const picksMounted = ref(false)
const bufferJobs = ref<Record<string, BufferJob>>({})
const schedulingError = ref('')
const queueNotice = ref('')
const activePickId = ref<number | null>(null)
const toast = useToast()
const { players, designId, templateId, selectedPlayers, togglePlayer, draft, draftKey, validationMessage, caption, xCaption, captionLoading, captionError, xCaptionError, resetCaptions, generateCaption } = useInstagramEditor(data, excludedPlayerCodes)
const { drafts: savedCaptions, storageError: captionStorageError, find: findSavedCaption, save: saveCaption, remove: removeSavedCaption } = useSchedulerCaptionDrafts()
const { postPicks, hasMorePicks, showMorePicks: loadMorePicks } = useSchedulerPicks(players, picksReady, computed(() => Object.values(bufferJobs.value).map(job => job.playerId)), excludedPlayerCodes, computed(() => data.value?.currentGameweek ?? null))
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
const adminSchedulerToolbar = inject<Ref<AdminSchedulerToolbar | null>>(adminSchedulerToolbarKey)
const history = useSchedulerHistory(computed(() => activeDraft.value.players), computed(() => activeDraft.value.gameweek), computed(() => activeDraft.value.season ?? null))
const { repeatMessage, ready: historyReady, error: historyError } = history

const activeDesign = computed(() => instagramDesigns.find(item => item.id === activePick.value?.designId) ?? instagramDesigns[0]!)
const filename = computed(() => activeDraft.value.design + '-' + activeDraft.value.template + '-' + activeDraft.value.players.map(player => player.name).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-gw' + (activeDraft.value.gameweek ?? 'unknown') + '.png')
const canExport = computed(() => !validationMessage.value && assetsReady.value && !busy.value)
const hasPlayerJob = (playerId: number | undefined) => Object.values(bufferJobs.value).some(job => job.playerId === playerId)
const playerJobState = (playerId: number) => Object.values(bufferJobs.value).find(job => job.playerId === playerId)?.state
const canScheduleActive = computed(() => Boolean(activePick.value?.caption.trim() && activePick.value?.xCaption.trim()) && !hasPlayerJob(activePick.value?.id) && schedulingConfigured.value && historyReady.value && assetsReady.value && !busy.value && !captionLoading.value && (!repeatMessage.value || allowRepeat.value))
const schedulerToolbarState = computed<AdminSchedulerToolbar>(() => ({
  drafts: savedCaptions.value,
  storageError: captionStorageError.value,
  downloadDisabled: !canExport.value,
  downloadLoading: busy.value && phase.value === 'Creating PNG…',
  historyView: view.value === 'history',
  historyDisabled: busy.value,
  onRemove: removeSavedCaption,
  onDownload: () => { void download(filename.value) },
  onToggleHistory: () => { view.value = view.value === 'history' ? 'create' : 'history' },
}))
watchEffect(() => { if (adminSchedulerToolbar) adminSchedulerToolbar.value = schedulerToolbarState.value })
let changingCaptionContext = false
let activationVersion = 0

function saveActiveCaptions() {
  const pick = activePick.value
  if (!pick || changingCaptionContext) return
  saveCaption({ signature: activeDraftKey.value, playerName: pick.player.name, storyLabel: pick.story.label, gameweek: activeDraft.value.gameweek, season: activeDraft.value.season ?? null, caption: caption.value, xCaption: xCaption.value })
}

function restoreSavedCaptions() {
  const saved = activePick.value ? findSavedCaption(activeDraftKey.value) : undefined
  caption.value = saved?.caption ?? ''
  xCaption.value = saved?.xCaption ?? ''
}

watch(history.excludedCodes, codes => { excludedPlayerCodes.value = codes }, { immediate: true })
watch([history.ready, history.error, picksMounted], ([ready, error, mounted]) => {
  if (!mounted) return
  if (ready || error) picksReady.value = ready
}, { immediate: true })
watch(draftKey, () => { allowRepeat.value = false })
watch(caption, value => {
  if (activePick.value) activePick.value.caption = value
  saveActiveCaptions()
}, { flush: 'sync' })
watch(xCaption, value => {
  if (activePick.value) activePick.value.xCaption = value
  saveActiveCaptions()
}, { flush: 'sync' })
watch(activeDraftKey, () => {
  if (changingCaptionContext) return
  changingCaptionContext = true
  resetCaptions()
  restoreSavedCaptions()
  changingCaptionContext = false
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
    xCaption.value = ''
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
  const version = ++activationVersion
  changingCaptionContext = true
  schedulingError.value = ''
  queueNotice.value = ''
  resetCaptions()
  activePickId.value = pick.id
  if (selectedPlayers.value[0]?.id !== pick.id) togglePlayer(pick.id)
  designId.value = pick.designId
  await nextTick()
  if (version !== activationVersion) return
  restoreSavedCaptions()
  changingCaptionContext = false
}

function changeTemplate(id: InstagramDesignId) {
  if (!activePick.value) return
  activePick.value.designId = id
  designId.value = id
}

function cycleTemplate(direction: -1 | 1) {
  const index = instagramDesigns.findIndex(item => item.id === activeDesign.value.id)
  const next = (index + direction + instagramDesigns.length) % instagramDesigns.length
  changeTemplate(instagramDesigns[next]!.id)
}

async function scheduleActive() {
  const scheduledPick = activePick.value
  if (!scheduledPick || !caption.value.trim() || !xCaption.value.trim()) return
  if (!schedulingConfigured.value) {
    return
  }
  if (!historyReady.value || !assetsReady.value) return
  if (repeatMessage.value && !allowRepeat.value) return
  schedulingError.value = ''
  const result = await schedule(filename.value, caption.value, xCaption.value, allowRepeat.value)
  if (failed.value || !result) return
  let sending = false
  for (const post of result.posts) {
    const platform = post.platform === 'x' ? 'X' : 'Instagram'
    if (post.status === 'submitting' || post.status === 'unknown') {
      bufferJobs.value[post.postId] = { jobId: post.postId, playerId: scheduledPick.id, playerName: scheduledPick.player.name, platform: post.platform, channelId: post.channelId, channel: post.channel, state: post.status === 'unknown' ? 'unknown' : 'sending' }
      if (post.status === 'submitting') sending = true
      if (post.status === 'unknown') toast.add({ title: `Check ${platform} in Buffer`, description: `${scheduledPick.player.name}: Buffer did not confirm the post.`, color: 'warning', icon: 'i-lucide-circle-alert', duration: 8000 })
    } else if (post.status === 'scheduled' || post.status === 'published') {
      const confirmation = bufferConfirmation(scheduledPick.player.name, post.channel, post.dueAt, post.status)
      toast.add({ title: `${platform} already in Buffer`, description: confirmation, color: 'success', icon: 'i-lucide-check', duration: 6000 })
    } else {
      schedulingError.value = `${platform} could not be scheduled. Check its history before trying again.`
    }
  }
  removeScheduledPick(scheduledPick.id)
  if (sending) toast.add({ title: 'Sending to Buffer', description: `${scheduledPick.player.name} · Instagram and X`, color: 'primary', icon: 'i-lucide-send', duration: 4000 })
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
    xCaption.value = ''
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
    const groups = [...new Set(jobs.map(job => job.channelId))].flatMap(channelId => {
      const channelJobs = jobs.filter(job => job.channelId === channelId)
      return Array.from({ length: Math.ceil(channelJobs.length / 8) }, (_, index) => ({ channelId, jobIds: channelJobs.slice(index * 8, index * 8 + 8).map(job => job.jobId) }))
    })
    const results = await Promise.allSettled(groups.map(body => $fetch<{ postId: string; status: string; dueAt: number | null; error: string | null }[]>('/api/scheduler/status', { method: 'POST', body })))
    const statuses = results.flatMap(result => result.status === 'fulfilled' ? result.value : [])
    for (const status of statuses) {
      const job = bufferJobs.value[status.postId]
      if (!job) continue
      const playerId = job.playerId
      const platform = job.platform === 'x' ? 'X' : 'Instagram'
      if (status.status === 'scheduled' || status.status === 'published') {
        const player = players.value.find(item => item.id === playerId)
        if (player && job.platform === 'instagram') excludedPlayerCodes.value = [...new Set([...excludedPlayerCodes.value, player.code])]
        delete bufferJobs.value[status.postId]
        const confirmation = bufferConfirmation(job.playerName, job.channel, status.dueAt, status.status)
        toast.add({ title: status.status === 'published' ? `${platform} post published` : `${platform} added to Buffer`, description: confirmation, color: 'success', icon: 'i-lucide-check', duration: 6500 })
        removeScheduledPick(playerId)
        showQueueNotice(`${platform} ${status.status === 'published' ? 'published' : 'added to Buffer'} · ${confirmation}`)
        useState('scheduler-history-revision', () => 0).value++
      } else if (status.status === 'failed') {
        delete bufferJobs.value[status.postId]
        schedulingError.value = `${platform}: ${status.error || `${job.playerName} could not be added to Buffer.`} Check ${platform} history.`
        toast.add({ title: `${platform} could not be added to Buffer`, description: schedulingError.value, color: 'error', icon: 'i-lucide-circle-alert', duration: 8000 })
        useState('scheduler-history-revision', () => 0).value++
      } else if (status.status === 'unknown') {
        bufferJobs.value[status.postId] = { ...job, state: 'unknown' }
        schedulingError.value = `Buffer could not confirm ${job.playerName} on ${platform}. Check its Buffer queue before trying again.`
        toast.add({ title: `Check ${platform} in Buffer`, description: schedulingError.value, color: 'warning', icon: 'i-lucide-circle-alert', duration: 8000 })
        useState('scheduler-history-revision', () => 0).value++
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
  if (adminSchedulerToolbar) adminSchedulerToolbar.value = null
})

</script>

<template>
    <main class="h-full min-h-0 overflow-hidden bg-default text-default selection:bg-primary/20">
      <div class="flex h-full min-h-0 flex-col">
        <UAlert v-if="error" color="error" title="Player data could not load" description="Load the player list again to start creating a post." class="mx-auto mt-8 w-full max-w-lg" :actions="[{ label: 'Try again', onClick: () => refresh() }]" />
        <div v-else-if="status === 'pending'" role="status" class="flex flex-1 items-center justify-center text-muted">Loading players…</div>

        <SchedulerPostHistory v-else-if="view === 'history'" :key="historyPlatform" v-model:platform="historyPlatform" class="site-content-rail min-h-0 flex-1 overflow-auto pb-4" :players="players" :initial-search="historySearch" />

        <section v-else class="flex min-h-0 flex-1 flex-col">
          <div class="flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto px-3 pt-2 pb-24">
            <div class="flex h-5 w-[min(45vh,78vw)] max-w-[660px] items-center truncate text-xs font-medium text-success" role="status" aria-live="polite">
              <span v-if="queueNotice" class="truncate">{{ queueNotice }}</span>
            </div>
            <div class="flex w-[min(45vh,78vw)] max-w-[660px] items-center justify-center gap-3">
              <UButton icon="i-lucide-chevron-left" color="neutral" variant="ghost" aria-label="Previous template" :disabled="busy || !activePick || hasPlayerJob(activePick?.id)" @click="cycleTemplate(-1)" />
              <span class="min-w-36 text-center text-sm font-medium text-muted">{{ activeDesign.letter }} <span class="text-dimmed">·</span> {{ activeDesign.name }}</span>
              <UButton icon="i-lucide-chevron-right" color="neutral" variant="ghost" aria-label="Next template" :disabled="busy || !activePick || hasPlayerJob(activePick?.id)" @click="cycleTemplate(1)" />
            </div>
            <SchedulerInstagramPost v-if="picksReady && activePick" class="w-[min(45vh,78vw)] max-w-[660px] shrink-0">
              <template #header-actions>
                <div class="flex items-center gap-1">
                  <UTooltip :text="editingLayout ? 'Finish editing' : 'Edit layout'">
                    <UButton :icon="editingLayout ? 'i-lucide-check' : 'i-lucide-pencil'" :label="editingLayout ? 'Done' : 'Edit'" :aria-label="editingLayout ? 'Finish editing' : 'Edit layout'" :aria-pressed="editingLayout" :color="editingLayout ? 'primary' : 'neutral'" :variant="editingLayout ? 'soft' : 'ghost'" size="xs" :disabled="busy || hasPlayerJob(activePick.id)" @click="editingLayout = !editingLayout" />
                  </UTooltip>
                  <UButton icon="i-lucide-ellipsis" color="neutral" variant="ghost" size="xs" aria-label="Post options" />
                </div>
              </template>
              <SchedulerTemplateEditor :key="activePreviewKey" ref="preview" v-model:editing="editingLayout" :draft="activeDraft" :editor="layoutEditor" :disabled="busy || hasPlayerJob(activePick.id)" toolbar-target="#scheduler-post-toolbar">
                <template #actions>
                  <span class="mx-0.5 h-4 w-px shrink-0 bg-white/15" aria-hidden="true" />
                  <UTooltip :text="captionLoading ? 'Generating captions…' : 'Generate Instagram and X captions'">
                    <UButton icon="i-lucide-sparkles" color="neutral" variant="ghost" class="size-9 justify-center rounded-full text-zinc-300 hover:bg-white/10 hover:text-white" :aria-label="captionLoading ? 'Generating captions' : 'Generate Instagram and X captions'" :loading="captionLoading" :disabled="!activePick || captionLoading || busy || hasPlayerJob(activePick?.id)" @click="generateCaption(activeDraft)" />
                  </UTooltip>
                  <UTooltip :text="schedulingConfigured ? 'Schedule to Instagram and X' : schedulingMessage">
                    <UButton icon="i-lucide-send" color="primary" class="ml-1 size-11 justify-center rounded-full ring-2 ring-zinc-900" aria-label="Schedule to Instagram and X" :loading="busy && phase !== 'Creating PNG…'" :disabled="!canScheduleActive" @click="scheduleActive" />
                  </UTooltip>
                </template>
              </SchedulerTemplateEditor>
              <template #caption>
                <p v-if="caption" class="whitespace-pre-wrap break-words text-xs leading-relaxed text-default">
                  <span class="mr-1 font-semibold text-highlighted">fplinsights</span>
                  <span
                    :key="activePickId"
                    role="textbox"
                    aria-label="Post caption, edit inline"
                    aria-multiline="true"
                    :contenteditable="!captionLoading && !busy && !hasPlayerJob(activePick?.id)"
                    spellcheck="true"
                    class="outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    @input="updateCaption"
                  >{{ caption }}</span>
                </p>
                <p v-if="captionError && !captionLoading" class="text-xs leading-5 text-error" role="alert">{{ captionError }}</p>
                <p v-else-if="captionLoading" class="text-xs text-muted" role="status">Generating captions…</p>
                <p v-else-if="!caption" class="text-xs text-muted">Your generated caption will appear here.</p>
              </template>
            </SchedulerInstagramPost>
            <div v-if="picksReady && activePick" class="w-[min(45vh,78vw)] max-w-[660px]">
              <UFormField label="X caption" class="w-full">
                <UTextarea v-model="xCaption" aria-label="X caption" :rows="3" autoresize class="w-full" :ui="{ base: 'w-full' }" :disabled="captionLoading || busy || hasPlayerJob(activePick.id)" />
              </UFormField>
              <p v-if="xCaptionError && !captionLoading" class="mt-1 text-xs text-error" role="alert">{{ xCaptionError }}</p>
              <p v-else class="mt-1 text-xs text-muted">X and Instagram use their own Buffer queue times.</p>
            </div>
            <div v-else class="flex aspect-square w-[min(45vh,78vw)] max-w-[660px] flex-col items-center justify-center gap-3 text-center text-sm text-muted" role="status">
              <template v-if="historyError"><p>Post history could not load. Retry to find players you can post.</p><UButton label="Retry history" color="neutral" variant="soft" @click="history.refresh()" /></template>
              <span v-else>{{ picksReady ? 'No unposted players match the current picks.' : 'Checking queued and posted players…' }}</span>
            </div>

            <UAlert v-if="repeatMessage" color="warning" :title="repeatMessage" class="w-full max-w-[660px]" />
            <UCheckbox v-if="repeatMessage" v-model="allowRepeat" label="Allow this repeat post" :disabled="busy" />
            <p v-if="captionStorageError" class="w-[min(45vh,78vw)] max-w-[660px] text-xs text-error" role="alert">{{ captionStorageError }}</p>
            <p class="min-h-5 w-[min(45vh,78vw)] max-w-[660px] text-xs" :class="failed || schedulingError || !schedulingConfigured ? 'text-error' : 'text-muted'" role="status" aria-live="polite">{{ phase || (failed ? message : schedulingError || (!schedulingConfigured ? schedulingMessage : '')) }}</p>
          </div>

          <footer class="relative z-40 shrink-0 border-t border-default bg-default/95 pb-2 pt-2">
            <div class="site-content-rail flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1">
              <p class="text-xs text-muted">Post ideas · Differentials, transfers, value and form</p>
              <div id="scheduler-post-toolbar" class="flex shrink-0" />
              <UButton label="Show more players" icon="i-lucide-plus" color="neutral" variant="ghost" size="sm" :disabled="!hasMorePicks || busy" @click="showMorePicks" />
            </div>
            <div v-if="picksReady" ref="pickList" class="site-content-rail flex gap-2 overflow-x-auto overscroll-x-contain py-2">
              <article v-for="pick in postPicks" :key="`${pick.id}:${pick.player.photoUrl}:${pick.designId}`" class="relative w-24 shrink-0 sm:w-28 lg:w-32">
                <button type="button" class="relative block w-full overflow-hidden rounded-lg bg-elevated text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" :class="activePickId === pick.id ? 'ring-2 ring-primary' : 'ring-1 ring-default hover:ring-primary/50'" :aria-label="'Preview ' + pick.player.name + ', ' + pick.story.label + ', ' + pick.story.evidence" :title="pick.story.scope ?? pick.story.evidence" :aria-current="activePickId === pick.id ? 'true' : undefined" :disabled="busy" @click="activatePick(pick)">
                  <SchedulerPostPreview :key="`${pick.id}:${pick.player.code}:${pick.player.photoUrl}:${pick.designId}`" :draft="pickDraft(pick)" />
                  <SchedulerPickReason :story="pick.story" />
                </button>
                <span v-if="playerJobState(pick.id) === 'sending'" class="absolute inset-x-1 top-1 rounded bg-black/70 px-1.5 py-1 text-center text-[10px] font-medium text-white" role="status">Sending to Buffer…</span>
                <span v-else-if="playerJobState(pick.id) === 'unknown'" class="absolute inset-x-1 top-1 rounded bg-amber-600 px-1.5 py-1 text-center text-[10px] font-medium text-white">Check Buffer</span>
                <span v-else-if="pick.caption" class="absolute right-1 top-1 size-2.5 rounded-full bg-primary ring-2 ring-white" :aria-label="'Caption ready for ' + pick.player.name" />
                <p class="truncate px-1 pt-1 text-[10px] text-muted">{{ pick.player.name }} · {{ instagramDesigns.find(item => item.id === pick.designId)?.name }}</p>
              </article>
              <div v-if="!postPicks.length && status !== 'pending'" class="py-8 text-sm text-muted">No unposted players match the current picks.</div>
            </div>
          </footer>
        </section>
      </div>
    </main>
</template>
