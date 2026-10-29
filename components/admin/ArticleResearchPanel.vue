<script setup lang="ts">
import { articleTemplates } from '~/shared/articles'

const emit = defineEmits<{ articleCreated: [] }>()

interface Idea {
  id: string
  researchId: string
  suggestionIndex: number
  title: string
  template: string
  intent: string
  angle: string
  whyNow: string
  visuals: string
  sourceIds: number[]
  sources: { url: string; title: string; excerpt: string }[]
  season: string
  gameweek: number
  createdAt: number
}
interface Queue { readyCount: number; refillStatus: 'idle' | 'working' | 'failed'; error: string | null; ideas: Idea[] }
const { data: queue, error, refresh } = await useFetch<Queue>('/api/admin/research', { default: () => ({ readyCount: 0, refillStatus: 'idle', error: null, ideas: [] }) })
const starting = ref(false)
const actionError = ref('')
const ideasOpen = ref(false)
const ideasOpenKey = 'adminArticleIdeasOpen'
const writing = ref<Record<string, boolean>>({})
const articles = ref<Record<string, string>>({})
const articleStatuses = ref<Record<string, { status: 'queued' | 'writing' | 'ready' | 'failed'; error?: string | null }>>({})
const articleRequests = new Map<string, string>()
const visibleIdeas = computed(() => queue.value?.ideas.slice(0, 5) || [])
let poll: ReturnType<typeof setInterval> | undefined

async function refreshIdeas() {
  if (starting.value) return
  starting.value = true
  actionError.value = ''
  try {
    await $fetch('/api/admin/research', { method: 'POST', body: { refresh: true } })
    await refresh()
  } catch (cause: any) { actionError.value = cause.data?.statusMessage || 'Research could not be started. Please try again.' }
  finally { starting.value = false }
}
function rememberDisclosure(event: Event) {
  const open = (event.currentTarget as HTMLDetailsElement).open
  ideasOpen.value = open
  try { localStorage.setItem(ideasOpenKey, open ? 'open' : 'closed') } catch { /* Keep the current state if storage is unavailable. */ }
}
async function refreshArticleStatus(key: string, articleId: string) {
  try {
    const job = await $fetch<{ status: 'queued' | 'writing' | 'ready' | 'failed'; error?: string | null }>(`/api/admin/generation/${articleId}`)
    if (job) articleStatuses.value[key] = { status: job.status, error: job.error }
  } catch { /* The next status refresh can retry. */ }
}
async function write(idea: Idea) {
  const key = idea.id
  if (writing.value[key]) return
  writing.value[key] = true
  actionError.value = ''
  if (!articleRequests.has(key)) articleRequests.set(key, crypto.randomUUID())
  try {
    const result = await $fetch<{ articleId: string }>(`/api/admin/research/${idea.researchId}/write`, { method: 'POST', body: { suggestionIndex: idea.suggestionIndex, articleId: articleRequests.get(key) } })
    articles.value[key] = result.articleId
    emit('articleCreated')
    await refreshArticleStatus(key, result.articleId)
    await refresh()
  } catch (cause: any) { actionError.value = cause.data?.statusMessage || 'The article could not be queued. Please try again.' }
  finally { writing.value[key] = false }
}
function formatDate(timestamp: number) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(timestamp) }
onMounted(() => {
  try { ideasOpen.value = localStorage.getItem(ideasOpenKey) === 'open' } catch { /* Use the closed default. */ }
  if (!queue.value?.ideas.length || queue.value.readyCount < 10) void requestInitialFill()
  poll = setInterval(() => {
    if (document.hidden) return
    if (queue.value?.readyCount !== 10 || queue.value.refillStatus === 'working') void refresh()
    for (const [key, articleId] of Object.entries(articles.value)) {
      if (['queued', 'writing'].includes(articleStatuses.value[key]?.status || '')) void refreshArticleStatus(key, articleId)
    }
  }, 5000)
})
onBeforeUnmount(() => clearInterval(poll))
async function requestInitialFill() {
  if (starting.value) return
  starting.value = true
  try { await $fetch('/api/admin/research', { method: 'POST' }); await refresh() }
  catch (cause: any) { actionError.value = cause.data?.statusMessage || 'Research could not be started. Please try again.' }
  finally { starting.value = false }
}
</script>

<template>
  <section aria-labelledby="research-ideas-title">
    <details :open="ideasOpen" class="group" @toggle="rememberDisclosure">
      <summary class="flex cursor-pointer list-none items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
        <h2 id="research-ideas-title" class="text-2xl font-semibold tracking-tight text-highlighted">Article ideas</h2>
        <span v-if="visibleIdeas.length" class="text-sm text-muted">{{ visibleIdeas.length }} ready</span>
        <span class="ml-auto text-sm font-medium text-muted">{{ ideasOpen ? 'Hide' : 'Show' }}</span>
        <UIcon name="i-lucide-chevron-down" class="size-4 text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div class="pt-3">
        <div class="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
          <p class="min-w-0 flex-1 leading-7 text-muted">Choose an idea to start a draft. Refresh to research new topics using recent articles and current player data.</p>
          <UButton label="Refresh ideas" icon="i-lucide-refresh-cw" color="neutral" variant="outline" class="shrink-0" :loading="starting || queue?.refillStatus === 'working'" :disabled="queue?.refillStatus === 'working'" @click="refreshIdeas" />
        </div>
        <UAlert v-if="error || actionError" :title="error ? 'Ideas could not be loaded' : 'Research could not be started'" :description="actionError || error?.data?.statusMessage || 'Please try again.'" color="error" variant="soft" class="mt-5" />
        <div v-if="queue?.refillStatus === 'working' || (!visibleIdeas.length && !error)" role="status" class="mt-5 flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-primary" />
          <span>{{ visibleIdeas.length ? 'Preparing more ideas in the background.' : 'Finding useful current and evergreen FPL questions…' }}</span>
        </div>
        <p v-if="queue?.refillStatus === 'failed' && !error" role="status" class="mt-4 text-sm text-error">{{ queue.error || 'The idea queue could not be replenished.' }}</p>
        <ol v-if="visibleIdeas.length" class="mt-5 divide-y divide-default">
          <li v-for="idea in visibleIdeas" :key="idea.id" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 first:pt-0">
            <div class="min-w-0 flex-1">
              <p class="text-xs text-primary">{{ articleTemplates.find(t => t.value === idea.template)?.label }}<template v-if="idea.template !== 'evergreen'"> · GW {{ idea.gameweek }} · {{ idea.season }}</template></p>
              <h3 class="mt-1 break-words font-medium text-highlighted">{{ idea.title }}</h3>
              <details class="mt-1 text-sm text-muted">
                <summary class="w-fit cursor-pointer text-xs font-medium text-muted">Why this idea</summary>
                <p class="mt-2 max-w-3xl leading-6">{{ idea.angle }}</p>
                <p class="mt-2 text-xs"><span class="font-medium text-highlighted">Reader question:</span> {{ idea.intent }} <span class="mx-1">·</span> <span class="font-medium text-highlighted">Why now:</span> {{ idea.whyNow }}</p>
                <p class="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs"><a v-for="sourceId in idea.sourceIds" :key="sourceId" :href="idea.sources[sourceId]?.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-4">{{ idea.sources[sourceId]?.title }}</a></p>
              </details>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <UBadge v-if="articleStatuses[idea.id]" :label="({ queued: 'Queued', writing: 'Writing', ready: 'Draft ready', failed: 'Failed' })[articleStatuses[idea.id].status]" :color="articleStatuses[idea.id].status === 'failed' ? 'error' : articleStatuses[idea.id].status === 'ready' ? 'success' : 'info'" variant="subtle" size="sm" />
              <UIcon v-if="['queued', 'writing'].includes(articleStatuses[idea.id]?.status || '')" name="i-lucide-loader-circle" class="size-4 animate-spin text-primary" aria-label="Writing article" />
              <UButton v-if="articles[idea.id]" :to="`/admin/articles/${articles[idea.id]}`" label="Open article" icon="i-lucide-arrow-right" color="neutral" variant="outline" size="sm" />
              <UButton v-else label="Write article" icon="i-lucide-pen-line" :loading="writing[idea.id]" size="sm" @click="write(idea)" />
            </div>
          </li>
        </ol>
        <p v-else-if="queue?.refillStatus === 'idle' && !error" class="mt-5 text-sm text-muted">No ideas are ready yet. Research will start automatically.</p>
        <p v-if="queue?.readyCount > 5" class="mt-3 text-xs text-muted">{{ queue.readyCount - 5 }} more ideas are held in reserve.</p>
      </div>
    </details>
  </section>
</template>
