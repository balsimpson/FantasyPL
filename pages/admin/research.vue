<script setup lang="ts">
import { articleTemplates } from '~/shared/articles'
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Content research' })
const { data: runs, error, refresh } = await useFetch('/api/admin/research')
const focus = ref('')
const starting = ref(false)
const actionError = ref('')
const selectedId = ref('')
const selected = computed(() => runs.value?.find(run => run.id === selectedId.value) || runs.value?.[0])
const active = computed(() => runs.value?.some(run => ['queued', 'researching'].includes(run.status)))
const writing = ref<Record<number, boolean>>({})
const articles = ref<Record<string, string>>({})
const articleRequests = new Map<string, string>()
let requestId: string | null = null
let poll: ReturnType<typeof setInterval> | undefined
onMounted(() => { poll = setInterval(() => { if (active.value && !document.hidden) void refresh() }, 5000) })
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
  } catch (cause: any) { actionError.value = cause.data?.statusMessage || 'The article could not be queued. Please try again.' }
  finally { writing.value[index] = false }
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div><h1 class="text-3xl font-semibold tracking-tight text-highlighted">Research the next article</h1><p class="mt-2 max-w-3xl leading-7 text-muted">Find competing coverage, compare what it offers and choose a useful angle for the next gameweek.</p></div>
      <UButton to="/admin/articles" label="View articles" icon="i-lucide-arrow-right" color="neutral" variant="outline" />
    </div>
    <form class="mt-8 w-full border-y border-default py-6" @submit.prevent="startResearch">
      <UFormField label="Research focus" help="Optional. Leave empty to research transfer, budget and fixture decisions for the upcoming gameweek." class="w-full">
        <UTextarea v-model="focus" :rows="2" autoresize :maxlength="300" class="w-full" :disabled="starting || active" />
      </UFormField>
      <div class="mt-4 flex flex-wrap items-center gap-4">
        <UButton type="submit" label="Research upcoming gameweek" icon="i-lucide-search" :loading="starting" :disabled="!!active" />
        <p class="text-sm text-muted">Runs in the background with OpenRouter web search.</p>
      </div>
    </form>
    <UAlert v-if="error || actionError" title="Research unavailable" :description="actionError || error?.data?.statusMessage || 'Please try again.'" color="error" variant="soft" class="mt-6" />
    <div v-if="!runs?.length && !error" class="py-14">
      <h2 class="text-xl font-semibold text-highlighted">Start with the questions managers are asking</h2>
      <p class="mt-3 max-w-2xl leading-7 text-muted">Research will return cited competitor articles, a comparison of their coverage and article suggestions. Choose several suggestions to start separate writing jobs.</p>
    </div>
    <template v-if="selected">
      <USelect v-if="runs && runs.length > 1" v-model="selectedId" :items="runs.map(run => ({ label: `${formatDate(run.createdAt)} IST · ${run.focus || 'Upcoming gameweek'}`, value: run.id }))" aria-label="Research run" class="mt-6 w-full" />
      <UAlert v-if="['queued', 'researching'].includes(selected.status)" :title="selected.status === 'queued' ? 'Research queued' : 'Searching and comparing articles'" description="You can leave this page. Convex will save the research and suggestions when the task finishes." color="info" variant="soft" class="mt-6" />
      <UAlert v-if="selected.status === 'failed'" title="Research did not complete" :description="selected.error || 'Please try again.'" color="error" variant="soft" class="mt-6" />
      <template v-if="selected.result">
        <div class="mt-10 flex flex-wrap items-baseline justify-between gap-3"><h2 class="text-2xl font-semibold tracking-tight text-highlighted">Suggestions for GW {{ selected.result.gameweek }}</h2><span class="text-sm text-muted">{{ selected.result.season }} · {{ formatDate(selected.createdAt) }} IST</span></div>
        <p class="mt-3 text-sm leading-6 text-muted">These opportunities are based on observed search coverage. Search volume and ranking difficulty have not been measured.</p>
        <ol class="mt-4 divide-y divide-default">
          <li v-for="(suggestion, index) in selected.result.suggestions" :key="index" class="py-7">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="max-w-3xl"><p class="text-sm text-primary">{{ articleTemplates.find(t => t.value === suggestion.template)?.label }}</p><h3 class="mt-2 text-xl font-semibold text-highlighted">{{ suggestion.title }}</h3></div>
              <UButton v-if="articles[`${selected.id}:${index}`]" :to="`/admin/articles/${articles[`${selected.id}:${index}`]}`" label="Open article" icon="i-lucide-arrow-right" color="neutral" variant="outline" />
              <UButton v-else label="Write article" icon="i-lucide-pen-line" :loading="writing[index]" @click="write(index)" />
            </div>
            <p class="mt-3 max-w-4xl leading-7">{{ suggestion.angle }}</p>
            <dl class="mt-4 grid gap-4 text-sm leading-6 md:grid-cols-3">
              <div><dt class="font-medium text-highlighted">Reader question</dt><dd class="mt-1 text-muted">{{ suggestion.intent }}</dd></div>
              <div><dt class="font-medium text-highlighted">Why this gameweek</dt><dd class="mt-1 text-muted">{{ suggestion.whyNow }}</dd></div>
              <div><dt class="font-medium text-highlighted">Visual approach</dt><dd class="mt-1 text-muted">{{ suggestion.visuals }}</dd></div>
            </dl>
            <p class="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm"><a v-for="sourceId in suggestion.sourceIds" :key="sourceId" :href="selected.result.sources[sourceId]?.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-4">{{ selected.result.sources[sourceId]?.title }}</a></p>
          </li>
        </ol>
        <h2 class="mt-10 text-2xl font-semibold tracking-tight text-highlighted">Competing coverage</h2>
        <p class="mt-3 text-sm leading-6 text-muted">Benchmarks use search excerpts. Full-page layout, article length and visual design have not been verified.</p>
        <ul class="mt-4 divide-y divide-default">
          <li v-for="benchmark in selected.result.competitors" :key="benchmark.sourceId" class="py-6">
            <a :href="selected.result.sources[benchmark.sourceId]?.url" target="_blank" rel="noopener noreferrer" class="text-lg font-semibold text-highlighted underline decoration-muted underline-offset-4 hover:text-primary">{{ selected.result.sources[benchmark.sourceId]?.title }}</a>
            <p class="mt-3 max-w-4xl leading-7">{{ benchmark.coverage }}</p>
            <dl class="mt-3 grid gap-4 text-sm leading-6 md:grid-cols-2"><div><dt class="font-medium text-highlighted">What it offers</dt><dd class="mt-1 text-muted">{{ benchmark.strength }}</dd></div><div><dt class="font-medium text-highlighted">Gap or unknown</dt><dd class="mt-1 text-muted">{{ benchmark.gap }}</dd></div></dl>
            <details class="mt-4 text-sm text-muted"><summary class="cursor-pointer font-medium text-highlighted">View source excerpt</summary><p class="mt-3 max-w-4xl whitespace-pre-wrap leading-7">{{ selected.result.sources[benchmark.sourceId]?.excerpt }}</p></details>
          </li>
        </ul>
      </template>
    </template>
  </section>
</template>
