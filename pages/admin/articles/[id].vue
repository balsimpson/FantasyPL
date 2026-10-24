<script setup lang="ts">
import { articleSlug, articleTemplates, articleText, templateBody } from '~/shared/articles'
definePageMeta({ layout: 'admin', middleware: 'admin', key: route => route.params.id as string })
const route = useRoute()
const { draft, articleId, version, status, publishedVersion, savedAt, saving, saveError, loadError, loading, conflict, dirty, wordCount, load, save } = useArticleEditor(String(route.params.id))
const generation = useArticleGeneration(articleId)
const applyOpen = ref(false)
const appliedJob = ref('')
const preview = ref(false)
const discardOpen = ref(false)
const nextRoute = ref('')
const publishing = ref(false)
const publishError = ref('')
const publishedUrl = ref('')
const { user } = useUserSession()
await load()
useHead({ title: computed(() => draft.value.title || 'New article') })
const saveLabel = computed(() => saving.value ? 'Saving…' : dirty.value ? 'Unsaved changes' : savedAt.value ? 'All changes saved' : 'Not saved yet')
const articleStatusLabel = computed(() => status.value === 'published' && publishedVersion.value < version.value ? 'Draft changes not live' : status.value === 'published' ? 'Published' : 'Draft')
const savedTime = computed(() => savedAt.value ? new Intl.DateTimeFormat('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(savedAt.value) : '')
const canApplyTemplate = computed(() => !articleText(draft.value.body).trim())
function applyTemplate() { if (canApplyTemplate.value) draft.value.body = templateBody(draft.value.template) }
let leavingAfterSave = false
async function saveDraft() {
  if (await save() && !dirty.value && route.params.id === 'new') {
    leavingAfterSave = true
    await navigateTo(`/admin/articles/${articleId.value}`, { replace: true })
  }
}
async function publishArticle() {
  if (publishing.value || saving.value || conflict.value || loadError.value) return
  publishError.value = ''
  publishedUrl.value = ''
  try {
    if (dirty.value || version.value === 0) {
      if (!await save() || dirty.value) return
    }
    publishing.value = true
    const result = await $fetch<{ slug: string }>(`/api/admin/articles/${articleId.value}/publish`, { method: 'POST', body: { expectedVersion: version.value } })
    await load()
    publishedUrl.value = `/blog/${result.slug}`
  } catch (cause: any) {
    publishError.value = cause.data?.statusMessage || cause.message || 'The article could not be published. Your draft is safe.'
  } finally { publishing.value = false }
}
async function generateDraft() {
  if (dirty.value || version.value === 0) { if (!await save() || dirty.value) return }
  if (await generation.start() && route.params.id === 'new') {
    leavingAfterSave = true
    await navigateTo(`/admin/articles/${articleId.value}`, { replace: true })
  }
}
function useGeneratedDraft() {
  if (!generation.job.value?.result) return
  draft.value = structuredClone(toRaw(generation.job.value.result))
  appliedJob.value = generation.job.value.jobId
  applyOpen.value = false
}
watch(() => generation.job.value, job => {
  if (job?.status === 'ready' && job.result && appliedJob.value !== job.jobId && !dirty.value && wordCount.value === 0 && draft.value.title === job.result.title) useGeneratedDraft()
})
function confirmLeave(to: { fullPath: string }) {
  if (leavingAfterSave || (!dirty.value && !saving.value)) return
  nextRoute.value = to.fullPath
  discardOpen.value = true
  return false
}
onBeforeRouteLeave(confirmLeave)
onBeforeRouteUpdate(confirmLeave)
async function discardAndLeave() {
  leavingAfterSave = true
  discardOpen.value = false
  await navigateTo(nextRoute.value)
}
function saveShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') { event.preventDefault(); void saveDraft() }
}
onMounted(() => window.addEventListener('keydown', saveShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', saveShortcut))
</script>

<template>
  <div>
    <h1 class="sr-only">Article editor</h1>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <UButton to="/admin/articles" label="Articles" icon="i-lucide-arrow-left" color="neutral" variant="ghost" class="-ml-2" />
      <div class="flex flex-wrap items-center gap-3">
        <span role="status" aria-live="polite" class="text-sm text-muted">{{ saveLabel }}</span>
        <UTooltip text="Generate draft">
          <UButton icon="i-lucide-sparkles" color="neutral" variant="ghost" aria-label="Generate draft" :loading="generation.starting.value" :disabled="loading || !!loadError || saving || generation.active.value || draft.title.trim().length < 8" @click="generateDraft" />
        </UTooltip>
        <UTooltip :text="preview ? 'Back to editor' : 'Preview article'">
          <UButton :icon="preview ? 'i-lucide-pencil' : 'i-lucide-eye'" color="neutral" variant="ghost" :aria-label="preview ? 'Back to editor' : 'Preview article'" :disabled="loading || !!loadError" @click="preview = !preview" />
        </UTooltip>
        <UTooltip text="Save draft">
          <UButton icon="i-lucide-save" color="neutral" variant="ghost" aria-label="Save draft" :loading="saving" :disabled="loading || !!loadError || conflict || (!dirty && version > 0)" @click="saveDraft" />
        </UTooltip>
        <UButton :label="status === 'published' ? 'Update published article' : 'Publish article'" icon="i-lucide-globe-2" :loading="publishing" :disabled="loading || !!loadError || conflict || saving" @click="publishArticle" />
        <UTooltip v-if="generation.job.value?.status === 'ready' && appliedJob !== generation.job.value.jobId && (dirty || wordCount > 0)" text="Use generated draft">
          <UButton icon="i-lucide-file-input" color="info" variant="soft" aria-label="Use generated draft" @click="applyOpen = true" />
        </UTooltip>
      </div>
    </div>
    <div v-if="loading" class="py-20 text-muted" role="status">Loading article…</div>
    <UAlert v-else-if="loadError" title="Article could not be opened" :description="loadError" color="error" variant="soft" class="mt-8" :actions="[{ label: 'Try again', onClick: load }]" />
    <template v-else>
      <UAlert v-if="saveError" title="Draft not saved" :description="saveError" color="error" variant="soft" class="mt-6" />
      <UAlert v-if="publishError" title="Article not published" :description="publishError" color="error" variant="soft" class="mt-6" />
      <UAlert v-if="publishedUrl" title="Article published" description="Your saved public version is live." color="success" variant="soft" class="mt-6" :actions="[{ label: 'Open article', to: publishedUrl, target: '_blank' }]" />
      <UAlert v-if="generation.error.value" title="Generation unavailable" :description="generation.error.value" color="error" variant="soft" class="mt-6" />
      <div v-if="generation.active.value" role="status" class="mt-5 flex items-center gap-2 text-sm text-muted"><UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-primary" /><span>{{ generation.job.value?.status === 'queued' ? 'Article queued. You can leave this page.' : 'Writing your article in the background…' }}</span></div>
      <UAlert v-if="generation.job.value?.status === 'failed'" title="Article generation failed" :description="generation.job.value.error || 'Your existing draft is unchanged. Please try again.'" color="error" variant="soft" class="mt-6" />
      <UButton v-if="conflict" :to="`/admin/articles/${articleId}`" target="_blank" label="Open saved version in a new tab" color="neutral" variant="outline" class="mt-3" />
      <div class="mt-8 grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1fr)_17rem] xl:gap-12">
        <section class="min-w-0" :aria-label="preview ? 'Article preview' : 'Article editor'">
          <template v-if="preview">
            <UBadge label="Private preview" color="neutral" variant="subtle" />
            <h1 class="mt-5 break-words text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">{{ draft.title || 'Untitled article' }}</h1>
            <p v-if="draft.excerpt" class="mt-4 break-words text-lg leading-8 text-muted">{{ draft.excerpt }}</p>
            <p class="my-6 text-sm text-muted">{{ user?.name }}<template v-if="draft.gameweek"> · Gameweek {{ draft.gameweek }}</template><template v-if="draft.season"> · {{ draft.season }}</template></p>
          </template>
          <template v-else>
            <UFormField label="Article title" name="title" class="w-full">
              <UTextarea v-model="draft.title" aria-label="Article title" :rows="2" autoresize :maxrows="5" :maxlength="200" variant="none" class="w-full" :ui="{ base: 'w-full rounded-none px-0 py-2 text-3xl font-semibold leading-tight tracking-tight text-highlighted sm:text-4xl md:text-4xl bg-transparent focus-visible:ring-0' }" />
            </UFormField>
            <UFormField label="Summary" name="excerpt" class="mt-5 w-full" help="A short introduction for the article list and search description.">
              <UTextarea v-model="draft.excerpt" :rows="2" autoresize :maxlength="600" class="w-full" />
            </UFormField>
            <h2 class="mt-8 mb-3 text-sm font-medium text-highlighted">Article body</h2>
          </template>
          <ClientOnly>
            <AdminArticleBodyEditor v-model="draft.body" :preview="preview" :article-id="articleId" />
            <template #fallback><div class="min-h-96 py-6 text-muted">Loading editor…</div></template>
          </ClientOnly>
          <div class="flex flex-wrap justify-between gap-2 border-t border-default pt-4 text-xs text-muted">
            <span>{{ wordCount }} {{ wordCount === 1 ? 'word' : 'words' }}</span>
            <span v-if="savedAt">Saved at {{ savedTime }} IST · Revision {{ version }}</span>
          </div>
        </section>
        <aside class="min-w-0 border-t border-default pt-6 xl:border-t-0 xl:pt-0" aria-label="Article details">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-highlighted">Article details</h2>
            <UBadge :label="articleStatusLabel" :color="articleStatusLabel === 'Published' ? 'success' : 'neutral'" variant="subtle" />
          </div>
          <UFormField label="Template" class="mt-6 w-full">
            <USelect v-model="draft.template" :items="articleTemplates.map(({ label, value }) => ({ label, value }))" class="w-full" :disabled="preview" />
          </UFormField>
          <UButton v-if="canApplyTemplate && !preview" label="Add section headings" icon="i-lucide-list-plus" color="neutral" variant="outline" block class="mt-3" @click="applyTemplate" />
          <UFormField label="Season" help="Use YYYY/YY, or leave empty for an evergreen guide." class="mt-6 w-full">
            <UInput v-model="draft.season" :maxlength="7" class="w-full" :disabled="preview" />
          </UFormField>
          <UFormField label="Gameweek" class="mt-5 w-full">
            <UInput :model-value="draft.gameweek ?? ''" type="number" :min="1" :max="38" :step="1" class="w-full" :disabled="preview" @update:model-value="draft.gameweek = $event === '' ? null : Number($event)" />
          </UFormField>
          <UButton v-if="draft.gameweek && !preview" label="Clear gameweek" variant="link" color="neutral" size="xs" class="mt-1 px-0" @click="draft.gameweek = null" />
          <UFormField label="URL slug" help="This becomes the public article address when you publish." class="mt-6 w-full">
            <UInput v-model="draft.slug" :maxlength="160" class="w-full" :disabled="preview" />
          </UFormField>
          <UButton v-if="draft.title && !preview" label="Use article title" color="neutral" variant="link" size="xs" class="mt-1 px-0" @click="draft.slug = articleSlug(draft.title)" />
          <div class="mt-7 border-t border-default pt-5">
            <div class="flex items-center justify-between gap-3"><h3 class="text-sm font-medium text-highlighted">Sources</h3><UButton label="Add source" icon="i-lucide-plus" size="xs" color="neutral" variant="outline" :disabled="preview || draft.sources.length >= 20" @click="draft.sources.push({ title: '', url: '' })" /></div>
            <p class="mt-2 text-xs leading-5 text-muted">Add the sources that support the article. At least one is required to publish.</p>
            <div v-for="(source, index) in draft.sources" :key="index" class="mt-4 space-y-2">
              <UFormField :label="`Source ${index + 1} title`" class="w-full"><UInput v-model="source.title" maxlength="200" class="w-full" :disabled="preview" /></UFormField>
              <div class="flex items-end gap-2"><UFormField label="Source URL" class="min-w-0 flex-1"><UInput v-model="source.url" type="url" maxlength="2000" class="w-full" :disabled="preview" /></UFormField><UButton label="Remove" icon="i-lucide-trash-2" color="neutral" variant="ghost" size="sm" :disabled="preview" @click="draft.sources.splice(index, 1)" /></div>
            </div>
          </div>
          <p class="mt-8 border-t border-default pt-5 text-sm leading-6 text-muted">Saving keeps your article private. Publishing creates a public version; later edits stay in the draft until you publish again.</p>
        </aside>
      </div>
    </template>
    <UModal v-model:open="discardOpen" title="Leave this draft?" description="Your unsaved changes will be lost. Save the draft before leaving to keep them.">
      <template #footer>
        <UButton label="Keep editing" color="neutral" variant="outline" @click="discardOpen = false" />
        <UButton label="Leave without saving" color="error" :disabled="saving" @click="discardAndLeave" />
      </template>
    </UModal>
    <UModal v-model:open="applyOpen" title="Use the generated draft?" description="This replaces the text in the editor. Save the current draft first if you want to keep it.">
      <template #footer>
        <UButton label="Keep current draft" color="neutral" variant="outline" @click="applyOpen = false" />
        <UButton label="Use generated draft" @click="useGeneratedDraft" />
      </template>
    </UModal>
  </div>
</template>
