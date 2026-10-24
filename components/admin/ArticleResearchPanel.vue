<script setup lang="ts">
import { articleTemplates } from '~/shared/articles'
const { data: runs, error, refresh } = await useFetch('/api/admin/research')
const focus = ref('')
const starting = ref(false)
const actionError = ref('')
const selectedId = ref('')
const selected = computed(() => runs.value?.find(run => run.id === selectedId.value) || runs.value?.[0])
const active = computed(() => runs.value?.some(run => ['queued', 'researching'].includes(run.status)))
const writing = ref<Record<number, boolean>>({})
const articles = ref<Record<string, string>>({})
const articleStatuses = ref<Record<string, { status: 'queued' | 'writing' | 'ready' | 'failed'; error?: string | null }>>({})
const articleRequests = new Map<string, string>()
let requestId: string | null = null
let poll: ReturnType<typeof setInterval> | undefined
async function refreshArticleStatus(key: string, articleId: string) {
  try {
    const job = await $fetch<{ status: 'queued' | 'writing' | 'ready' | 'failed'; error?: string | null }>(`/api/admin/generation/${articleId}`)
    if (job) articleStatuses.value[key] = { status: job.status, error: job.error }
  } catch { /* A status refresh can retry on the next interval. */ }
}
onMounted(() => {
  poll = setInterval(() => {
    if (document.hidden) return
    if (active.value) void refresh()
    for (const [key, articleId] of Object.entries(articles.value)) {
      if (['queued', 'writing'].includes(articleStatuses.value[key]?.status || '')) void refreshArticleStatus(key, articleId)
    }
  }, 4000)
})
onBeforeUnmount(() => clearInterval(poll))
function formatDate(timestamp: number) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(timestamp) }
async function startResearch() {
  if (starting.value || active.value) return
  starting.value = true
  actionError.value = ''
  requestId ||= crypto.randomUUID()
  try {
    const result = await $fetch('/api/admin/research', { method: 'POST', body: { focus: focus.value, requestId } })
    requestId = null
    selectedId.value = result.researchId
    await refresh()
  } catch (cause: any) { actionError.value = cause.data?.statusMessage || 'Research could not be started. Please try again.' }
  finally { starting.value = false }
}
async function write(index: number) {
  if (!selected.value || writing.value[index]) return
  const researchId = selected.value.id
  const key = `${researchId}:${index}`
  writing.value[index] = true
  actionError.value = ''
  if (!articleRequests.has(key)) articleRequests.set(key, crypto.randomUUID())
  try {
    const result = await $fetch(`/api/admin/research/${researchId}/write`, { method: 'POST', body: { suggestionIndex: index, articleId: articleRequests.get(key) } })
    articles.value[key] = result.articleId
    await refreshArticleStatus(key, result.articleId)
  } catch (cause: any) { actionError.value = cause.data?.statusMessage || 'The article could not be queued. Please try again.' }
  finally { writing.value[index] = false }
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div><h2 class="text-2xl font-semibold tracking-tight text-highlighted">Research ideas</h2><p class="mt-2 max-w-3xl leading-7 text-muted">Find useful questions, then open a generated draft from the results below.</p></div>
    </div>
    <form class="mt-8 w-full py-6" @submit.prevent="startResearch">
      <UFormField label="Research focus" help="Optional. Leave empty to research transfer, budget and fixture decisions for the upcoming gameweek." class="w-full">
        <UTextarea v-model="focus" :rows="2" autoresize :maxlength="300" class="w-full" :disabled="starting || active" />
      </UFormField>
      <div class="mt-4 flex flex-wrap items-center gap-4">
        <UButton type="submit" :label="active ? 'Research running' : 'Research upcoming gameweek'" :icon="active ? 'i-lucide-loader-circle' : 'i-lucide-search'" :loading="starting || !!active" :disabled="!!active" />
        <p v-if="active" role="status" class="flex items-center gap-2 text-sm text-muted"><UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-primary" />Research is running in the background. You can leave this page.</p>
        <p v-else class="text-sm text-muted">Research runs in the background. You can leave this page.</p>
      </div>
    </form>
    <UAlert v-if="error || actionError" title="Research unavailable" :description="actionError || error?.data?.statusMessage || 'Please try again.'" color="error" variant="soft" class="mt-6" />
    <div v-if="!runs?.length && !error" class="py-14">
      <h2 class="text-xl font-semibold text-highlighted">Start with the questions managers are asking</h2>
      <p class="mt-3 max-w-2xl leading-7 text-muted">Research will return cited competitor articles, a comparison of their coverage and article suggestions. Choose several suggestions to start separate writing jobs.</p>
    </div>
    <template v-if="selected">
      <USelect v-if="runs && runs.length > 1" v-model="selectedId" :items="runs.map(run => ({ label: `${formatDate(run.createdAt)} IST · ${run.focus || 'Upcoming gameweek'}`, value: run.id }))" aria-label="Research run" class="mt-6 w-full" />
      <div v-if="['queued', 'researching'].includes(selected.status)" role="status" class="mt-6 flex items-center gap-2 py-3 text-sm text-muted"><UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-primary" /><span>{{ selected.status === 'queued' ? 'Research queued' : 'Searching and comparing articles' }} · results will appear here when ready.</span></div>
      <UAlert v-if="selected.status === 'failed'" title="Research did not complete" :description="selected.error || 'Please try again.'" color="error" variant="soft" class="mt-6" />
      <template v-if="selected.result">
        <div class="mt-8 flex flex-wrap items-baseline justify-between gap-3"><h2 class="text-xl font-semibold tracking-tight text-highlighted">Suggested articles · GW {{ selected.result.gameweek }}</h2><span class="text-sm text-muted">{{ selected.result.season }} · {{ formatDate(selected.createdAt) }} IST</span></div>
        <p class="mt-2 text-sm leading-6 text-muted">Ideas from observed coverage; search volume and ranking difficulty are not measured.</p>
        <ol class="mt-3 divide-y divide-default">
          <li v-for="(suggestion, index) in selected.result.suggestions" :key="index" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4">
            <div class="min-w-0 flex-1">
              <p class="text-xs text-primary">{{ articleTemplates.find(t => t.value === suggestion.template)?.label }}</p>
              <h3 class="mt-1 break-words font-medium text-highlighted">{{ suggestion.title }}</h3>
              <details class="mt-1 text-sm text-muted">
                <summary class="w-fit cursor-pointer text-xs font-medium text-muted">Article angle and sources</summary>
                <p class="mt-2 max-w-3xl leading-6">{{ suggestion.angle }}</p>
                <p class="mt-2 text-xs"><span class="font-medium text-highlighted">Reader question:</span> {{ suggestion.intent }} <span class="mx-1">·</span> <span class="font-medium text-highlighted">Why now:</span> {{ suggestion.whyNow }}</p>
                <p class="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs"><a v-for="sourceId in suggestion.sourceIds" :key="sourceId" :href="selected.result.sources[sourceId]?.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-4">{{ selected.result.sources[sourceId]?.title }}</a></p>
              </details>
            </div>
            <div class="flex shrink-0 items-center gap-3">
              <UBadge v-if="articleStatuses[`${selected.id}:${index}`]" :label="({ queued: 'Queued', writing: 'Writing', ready: 'Draft ready', failed: 'Failed' })[articleStatuses[`${selected.id}:${index}`].status]" :color="articleStatuses[`${selected.id}:${index}`].status === 'failed' ? 'error' : articleStatuses[`${selected.id}:${index}`].status === 'ready' ? 'success' : 'info'" variant="subtle" size="sm" />
              <UIcon v-if="['queued', 'writing'].includes(articleStatuses[`${selected.id}:${index}`]?.status || '')" name="i-lucide-loader-circle" class="size-4 animate-spin text-primary" aria-label="Writing article" />
              <UButton v-if="articles[`${selected.id}:${index}`]" :to="`/admin/articles/${articles[`${selected.id}:${index}`]}`" label="Open article" icon="i-lucide-arrow-right" color="neutral" variant="outline" size="sm" />
              <UButton v-else label="Write article" icon="i-lucide-pen-line" :loading="writing[index]" size="sm" @click="write(index)" />
            </div>
          </li>
        </ol>
        <details class="mt-8">
          <summary class="cursor-pointer text-base font-semibold text-highlighted">Competing coverage</summary>
          <p class="mt-2 text-sm leading-6 text-muted">Benchmarks use search excerpts. Full-page layout, article length and visual design have not been verified.</p>
        <ul class="mt-3 divide-y divide-default">
          <li v-for="benchmark in selected.result.competitors" :key="benchmark.sourceId" class="py-6">
            <a :href="selected.result.sources[benchmark.sourceId]?.url" target="_blank" rel="noopener noreferrer" class="text-lg font-semibold text-highlighted underline decoration-muted underline-offset-4 hover:text-primary">{{ selected.result.sources[benchmark.sourceId]?.title }}</a>
            <p class="mt-3 max-w-4xl leading-7">{{ benchmark.coverage }}</p>
            <dl class="mt-3 grid gap-4 text-sm leading-6 md:grid-cols-2"><div><dt class="font-medium text-highlighted">What it offers</dt><dd class="mt-1 text-muted">{{ benchmark.strength }}</dd></div><div><dt class="font-medium text-highlighted">Gap or unknown</dt><dd class="mt-1 text-muted">{{ benchmark.gap }}</dd></div></dl>
            <details class="mt-4 text-sm text-muted"><summary class="cursor-pointer font-medium text-highlighted">View source excerpt</summary><p class="mt-3 max-w-4xl whitespace-pre-wrap leading-7">{{ selected.result.sources[benchmark.sourceId]?.excerpt }}</p></details>
          </li>
        </ul>
        </details>
      </template>
    </template>
  </section>
</template>
