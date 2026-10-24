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
const deleteOpen = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const articleToDelete = ref<ArticleSummary | null>(null)
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
function askToDelete(article: ArticleSummary) {
  articleToDelete.value = article
  deleteError.value = ''
  deleteOpen.value = true
}
async function deleteArticle() {
  const article = articleToDelete.value
  if (!article || deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    const result = await $fetch<{ deleted: boolean }>(`/api/admin/articles/${article.articleId}`, {
      method: 'DELETE',
      body: { expectedVersion: article.version },
    })
    if (!result.deleted) {
      articles.value = articles.value.filter(item => item.articleId !== article.articleId)
    } else {
      await refresh()
    }
    deleteOpen.value = false
    articleToDelete.value = null
  } catch (cause: any) {
    deleteError.value = cause.data?.statusMessage || 'The article could not be deleted. Please try again.'
  } finally { deleting.value = false }
}
</script>

<template>
  <section>
    <div class="flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-highlighted">Articles</h1>
        <p class="mt-2 text-muted">Pick up a draft or start your next article.</p>
      </div>
      <UTooltip text="New article">
        <UButton to="/admin/articles/new" icon="i-lucide-plus" color="neutral" variant="ghost" aria-label="New article" />
      </UTooltip>
    </div>
    <div id="research" class="mt-10 py-7">
      <ArticleResearchPanel />
    </div>
    <div v-if="status === 'pending'" id="saved-articles" class="py-20 text-center text-muted" role="status">Loading articles…</div>
    <UAlert v-else-if="error" id="saved-articles" title="Articles could not be loaded" :description="error.data?.statusMessage || 'Please try again.'" color="error" variant="soft" class="mt-8" :actions="[{ label: 'Try again', onClick: () => refresh() }]" />
    <div v-else-if="!articles.length" id="saved-articles" class="mt-10 py-16 sm:py-24">
      <UIcon name="i-lucide-file-pen-line" class="size-9 text-primary" />
      <h2 class="mt-5 text-xl font-semibold text-highlighted">Write your first article</h2>
      <p class="mt-2 max-w-md leading-7 text-muted">Start from the research ideas above or create an article directly.</p>
    </div>
    <ul v-else id="saved-articles" class="mt-8 divide-y divide-default">
      <li v-for="article in articles" :key="article.articleId" class="flex items-start gap-3 py-5 sm:items-center sm:px-3">
        <NuxtLink :to="`/admin/articles/${article.articleId}`" class="group flex min-w-0 flex-1 flex-col justify-between gap-3 rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary sm:flex-row sm:items-center sm:gap-4">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>{{ templateLabel(article.template) }}</span>
              <span v-if="article.gameweek">GW {{ article.gameweek }}</span>
              <span v-if="article.season">{{ article.season }}</span>
              <UBadge :label="article.status === 'published' && article.publishedVersion !== undefined && article.publishedVersion < article.version ? 'Draft changes not live' : article.status === 'published' ? 'Published' : 'Draft'" :color="article.status === 'published' && article.publishedVersion === article.version ? 'success' : 'neutral'" variant="subtle" size="sm" />
              <UBadge v-if="article.generation" :label="({ queued: 'Queued', writing: 'Writing', ready: 'Generated draft ready', failed: 'Generation failed' })[article.generation.status]" :color="article.generation.status === 'failed' ? 'error' : article.generation.status === 'ready' ? 'success' : 'info'" variant="subtle" size="sm" />
            </div>
            <h2 class="mt-2 break-words text-lg font-semibold text-highlighted group-hover:text-primary">{{ article.title || 'Untitled article' }}</h2>
            <p v-if="article.excerpt" class="mt-1 max-w-3xl break-words text-sm text-muted">{{ article.excerpt }}</p>
          </div>
          <div class="shrink-0 text-sm text-muted sm:text-right">
            <p>{{ updatedDate(article.updatedAt) }} IST</p>
            <p class="mt-1">Revision {{ article.version }}</p>
            <p v-if="article.publishedAt" class="mt-1">Live since {{ updatedDate(article.publishedAt) }} IST</p>
          </div>
        </NuxtLink>
        <div class="flex shrink-0 items-center gap-0.5">
          <UTooltip text="Edit article">
            <UButton :to="`/admin/articles/${article.articleId}`" icon="i-lucide-pencil" color="neutral" variant="ghost" size="sm" :aria-label="`Edit ${article.title || 'untitled article'}`" />
          </UTooltip>
          <UTooltip text="Delete article">
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm" :aria-label="`Delete ${article.title || 'untitled article'}`" @click="askToDelete(article)" />
          </UTooltip>
        </div>
      </li>
    </ul>
    <p v-if="loadError" role="alert" class="mt-4 text-sm text-error">{{ loadError }}</p>
    <UButton v-if="!done && !error" label="Load more articles" variant="outline" color="neutral" :loading="loadingMore" class="mt-6" @click="loadMore" />
    <UModal
      v-model:open="deleteOpen"
      title="Delete this article?"
      :description="articleToDelete ? `“${articleToDelete.title || 'Untitled article'}” and its saved revisions will be deleted.` : ''"
    >
      <UAlert v-if="deleteError" color="error" title="Article not deleted" :description="deleteError" class="mt-4" />
      <template #footer>
        <UButton label="Cancel" color="neutral" variant="outline" :disabled="deleting" @click="deleteOpen = false" />
        <UButton label="Delete article" color="error" :loading="deleting" @click="deleteArticle" />
      </template>
    </UModal>
  </section>
</template>
