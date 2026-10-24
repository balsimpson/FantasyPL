<script setup lang="ts">
import { articleTemplates, type ArticleSummary } from '~/shared/articles'
definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Articles' })
const { data, status, error, refresh } = await useFetch('/api/admin/articles')
const articles = ref<ArticleSummary[]>([])
const cursor = ref<string | null>(null)
const done = ref(true)
const loadingMore = ref(false)
const loadError = ref('')
let poll: ReturnType<typeof setInterval> | undefined
onMounted(() => { poll = setInterval(() => { if (!document.hidden && articles.value.some(article => ['queued', 'writing'].includes(article.generation?.status || ''))) void refresh() }, 5000) })
onBeforeUnmount(() => clearInterval(poll))
watch(data, result => {
  if (!result) return
  articles.value = result.page
  cursor.value = result.continueCursor
  done.value = result.isDone
}, { immediate: true })
function templateLabel(value: string) { return articleTemplates.find(item => item.value === value)?.label }
function updatedDate(timestamp: number) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(timestamp)
}
async function loadMore() {
  loadingMore.value = true
  loadError.value = ''
  try {
    const result = await $fetch('/api/admin/articles', { query: { cursor: cursor.value! } })
    articles.value.push(...result.page.filter(item => !articles.value.some(existing => existing.articleId === item.articleId)))
    cursor.value = result.continueCursor
    done.value = result.isDone
  } catch { loadError.value = 'More articles could not be loaded. Please try again.' }
  finally { loadingMore.value = false }
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-highlighted">Articles</h1>
        <p class="mt-2 text-muted">Pick up a draft or start your next article.</p>
      </div>
      <UButton to="/admin/articles/new" label="New article" icon="i-lucide-plus" size="lg" />
    </div>
    <div v-if="status === 'pending'" class="py-20 text-center text-muted" role="status">Loading articles…</div>
    <UAlert v-else-if="error" title="Articles could not be loaded" :description="error.data?.statusMessage || 'Please try again.'" color="error" variant="soft" class="mt-8" :actions="[{ label: 'Try again', onClick: () => refresh() }]" />
    <div v-else-if="!articles.length" class="mt-10 border-y border-default py-16 sm:py-24">
      <UIcon name="i-lucide-file-pen-line" class="size-9 text-primary" />
      <h2 class="mt-5 text-xl font-semibold text-highlighted">Write your first article</h2>
      <p class="mt-2 max-w-md leading-7 text-muted">Choose a format, write your analysis and save a draft. Nothing is published from this workspace yet.</p>
      <UButton to="/admin/articles/new" label="Create an article" variant="outline" class="mt-6" />
    </div>
    <ul v-else class="mt-8 divide-y divide-default border-y border-default">
      <li v-for="article in articles" :key="article.articleId">
        <NuxtLink :to="`/admin/articles/${article.articleId}`" class="group flex flex-col justify-between gap-4 rounded-sm py-6 transition-colors hover:bg-elevated/40 focus-visible:outline-2 focus-visible:outline-primary sm:flex-row sm:items-center sm:px-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>{{ templateLabel(article.template) }}</span>
              <span v-if="article.gameweek">GW {{ article.gameweek }}</span>
              <span v-if="article.season">{{ article.season }}</span>
              <UBadge label="Draft" color="neutral" variant="subtle" size="sm" />
              <UBadge v-if="article.generation" :label="({ queued: 'Queued', writing: 'Writing', ready: 'Generated draft ready', failed: 'Generation failed' })[article.generation.status]" :color="article.generation.status === 'failed' ? 'error' : article.generation.status === 'ready' ? 'success' : 'info'" variant="subtle" size="sm" />
            </div>
            <h2 class="mt-2 break-words text-lg font-semibold text-highlighted group-hover:text-primary">{{ article.title || 'Untitled article' }}</h2>
            <p v-if="article.excerpt" class="mt-1 max-w-3xl break-words text-sm text-muted">{{ article.excerpt }}</p>
          </div>
          <div class="shrink-0 text-sm text-muted sm:text-right">
            <p>{{ updatedDate(article.updatedAt) }} IST</p>
            <p class="mt-1">Revision {{ article.version }}</p>
          </div>
        </NuxtLink>
      </li>
    </ul>
    <p v-if="loadError" role="alert" class="mt-4 text-sm text-error">{{ loadError }}</p>
    <UButton v-if="!done && !error" label="Load more articles" variant="outline" color="neutral" :loading="loadingMore" class="mt-6" @click="loadMore" />
  </section>
</template>
