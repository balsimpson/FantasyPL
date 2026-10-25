<script setup lang="ts">
import { articleSlug, articleTemplates, articleText, templateBody, type ArticleDraft } from '~/shared/articles'
import type { AdminArticleToolbar } from '~/composables/adminArticleToolbar'
definePageMeta({ layout: 'admin', middleware: 'admin', key: route => route.params.id as string })
const route = useRoute()
const { draft, articleId, version, status, publishedVersion, savedAt, saving, saveError, loadError, loading, conflict, dirty, wordCount, load, save } = useArticleEditor(String(route.params.id))
const generation = useArticleGeneration(articleId)
const revisions = ref<{ version: number; savedAt: number; title: string }[]>([])
const selectedRevision = ref('')
const viewedRevision = ref<ArticleDraft | null>(null)
const revisionError = ref('')
const appliedJob = ref('')
const preview = ref(true)
const discardOpen = ref(false)
const nextRoute = ref('')
const publishing = ref(false)
const publishError = ref('')
const publishedUrl = ref('')
const detailsOpen = ref(false)
const detailsSide = ref<'right' | 'bottom'>('bottom')
const toast = useToast()
const articleToolbar = inject<Ref<AdminArticleToolbar | null>>('admin-article-toolbar')
let detailsMediaQuery: MediaQueryList | null = null
let updateDetailsSide: (() => void) | null = null
const previewDraft = computed(() => viewedRevision.value || draft.value)
const previewWordCount = computed(() => articleText(previewDraft.value.body).trim().split(/\s+/).filter(Boolean).length)
const revisionItems = computed(() => {
  const items = new Map<number, { version: number; savedAt: number; title: string }>()
  for (const revision of revisions.value) items.set(revision.version, revision)
  if (version.value > 0 && !items.has(version.value)) items.set(version.value, { version: version.value, savedAt: savedAt.value || 0, title: draft.value.title })
  const result = [...items.values()].sort((a, b) => b.version - a.version).map(revision => ({
    label: `v${revision.version} · ${revision.title || 'Untitled article'} · ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(revision.savedAt)}`,
    value: String(revision.version),
  }))
  const generated = generation.job.value?.status === 'ready' ? generation.job.value.result : null
  if (generated && JSON.stringify(generated) !== JSON.stringify(draft.value)) {
    result.unshift({ label: 'Generated draft', value: 'generated' })
  }
  return result
})
const { user } = useUserSession()
await load()
if (!loadError.value && articleId.value) {
  selectedRevision.value = String(version.value)
  try { revisions.value = await $fetch(`/api/admin/articles/${articleId.value}/revisions`) }
  catch { revisionError.value = 'Version history could not be loaded.' }
}
watch(version, async current => {
  if (!current || !articleId.value) return
  selectedRevision.value = String(current)
  viewedRevision.value = null
  revisionError.value = ''
  try { revisions.value = await $fetch(`/api/admin/articles/${articleId.value}/revisions`) }
  catch { revisionError.value = 'Version history could not be loaded.' }
})
useHead({ title: computed(() => draft.value.title || 'New article') })
const saveLabel = computed(() => saveError.value ? 'Save failed' : saving.value ? 'Saving…' : dirty.value ? 'Saving soon…' : savedAt.value ? 'All changes saved' : 'Not saved yet')
const articleStatusLabel = computed(() => status.value === 'published' && publishedVersion.value < version.value ? 'Draft changes not live' : status.value === 'published' ? 'Published' : 'Draft')
const savedTime = computed(() => savedAt.value ? new Intl.DateTimeFormat('en-IN', { timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(savedAt.value) : '')
const canApplyTemplate = computed(() => !articleText(draft.value.body).trim())
const toolbarState = computed<AdminArticleToolbar>(() => ({
  saveLabel: saveLabel.value,
  saveDisabled: loading.value || !!loadError.value || saving.value || !dirty.value,
  saving: saving.value,
  generating: generation.starting.value,
  generatingDisabled: loading.value || !!loadError.value || saving.value || generation.active.value || draft.value.title.trim().length < 8,
  editLabel: viewedRevision.value ? 'Restore version' : preview.value ? 'Edit article' : 'Preview article',
  editIcon: viewedRevision.value ? 'i-lucide-history' : preview.value ? 'i-lucide-pencil' : 'i-lucide-eye',
  editDisabled: loading.value || !!loadError.value || dirty.value || saving.value,
  publishing: publishing.value,
  publishDisabled: loading.value || !!loadError.value || conflict.value || saving.value,
  publishLabel: status.value === 'published' ? 'Publish update' : 'Publish',
  onSave: () => { void saveDraft() },
  onGenerate: () => { void generateDraft() },
  onToggleEdit: toggleEdit,
  onPublish: () => { void publishArticle() },
  onDetails: () => { detailsOpen.value = true },
}))
watchEffect(() => { if (articleToolbar) articleToolbar.value = toolbarState.value })
function applyTemplate() { if (canApplyTemplate.value) draft.value.body = templateBody(draft.value.template) }
let leavingAfterSave = false
let autoSaveTimer: ReturnType<typeof setTimeout> | undefined
function scheduleAutoSave(delay = 900) {
  clearTimeout(autoSaveTimer)
  if (!dirty.value || loading.value || loadError.value || conflict.value) return
  autoSaveTimer = setTimeout(() => { void autoSaveDraft() }, delay)
}
async function autoSaveDraft() {
  if (!dirty.value || loading.value || loadError.value || conflict.value) return
  if (saving.value) { scheduleAutoSave(900); return }
  const saved = await save()
  if (saved && route.params.id === 'new' && articleId.value) {
    leavingAfterSave = true
    await navigateTo(`/admin/articles/${articleId.value}`, { replace: true })
  } else if (saved && dirty.value) scheduleAutoSave()
}
watch(draft, () => scheduleAutoSave(), { deep: true })
onBeforeUnmount(() => clearTimeout(autoSaveTimer))
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
async function selectRevision(value: string | number) {
  const selected = String(value)
  if (dirty.value || saving.value) return
  revisionError.value = ''
  selectedRevision.value = selected
  if (selected === 'generated') {
    const result = generation.job.value?.status === 'ready' ? generation.job.value.result : null
    if (!result) return
    viewedRevision.value = structuredClone(toRaw(result))
    preview.value = true
    return
  }
  if (Number(selected) === version.value) {
    viewedRevision.value = null
    preview.value = true
    return
  }
  try {
    const revision = await $fetch<ArticleDraft>(`/api/admin/articles/${articleId.value}/revisions`, { query: { version: selected } })
    const { articleId: _articleId, version: _version, savedAt: _savedAt, ...content } = revision as ArticleDraft & { articleId: string; version: number; savedAt: number }
    viewedRevision.value = content
    preview.value = true
  } catch {
    selectedRevision.value = String(version.value)
    revisionError.value = 'This version could not be opened. Please try again.'
  }
}
function restoreViewedRevision() {
  if (!viewedRevision.value || dirty.value || saving.value) return
  draft.value = structuredClone(toRaw(viewedRevision.value))
  viewedRevision.value = null
  selectedRevision.value = String(version.value)
  preview.value = false
}
function toggleEdit() {
  if (viewedRevision.value) {
    restoreViewedRevision()
    return
  }
  preview.value = !preview.value
}
function updateArticleBody(body: ArticleDraft['body']) {
  if (!preview.value) draft.value.body = body
}
watch(() => generation.job.value, job => {
  if (job?.status === 'ready' && job.result && appliedJob.value !== job.jobId && !dirty.value && wordCount.value === 0 && draft.value.title === job.result.title) {
    draft.value = structuredClone(toRaw(job.result))
    appliedJob.value = job.jobId
  }
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
onMounted(() => {
  detailsMediaQuery = window.matchMedia('(min-width: 768px)')
  updateDetailsSide = () => { detailsSide.value = detailsMediaQuery?.matches ? 'right' : 'bottom' }
  updateDetailsSide()
  detailsMediaQuery.addEventListener('change', updateDetailsSide)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', saveShortcut)
  if (detailsMediaQuery && updateDetailsSide) detailsMediaQuery.removeEventListener('change', updateDetailsSide)
  if (articleToolbar) articleToolbar.value = null
})
watch(saveError, message => { if (message) toast.add({ title: 'Draft not saved', description: message, color: 'error', icon: 'i-lucide-circle-alert', duration: 6000 }) })
watch(publishError, message => { if (message) toast.add({ title: 'Article not published', description: message, color: 'error', icon: 'i-lucide-circle-alert', duration: 6000 }) })
watch(() => generation.error.value, message => { if (message) toast.add({ title: 'Generation unavailable', description: message, color: 'error', icon: 'i-lucide-circle-alert', duration: 6000 }) })
watch(() => generation.job.value?.status, status => { if (status === 'failed') toast.add({ title: 'Article generation failed', description: generation.job.value?.error || 'Your existing draft is unchanged. Please try again.', color: 'error', icon: 'i-lucide-circle-alert', duration: 7000 }) })
watch(publishedUrl, url => { if (url) toast.add({ title: 'Article published', description: 'Your saved public version is live.', color: 'success', icon: 'i-lucide-check', duration: 6500, actions: [{ label: 'Open article', onClick: () => window.open(url, '_blank', 'noopener,noreferrer') }] }) })
</script>

<template>
  <div>
    <h1 class="sr-only">Article editor</h1>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <UButton to="/admin/articles" label="Articles" icon="i-lucide-arrow-left" color="neutral" variant="ghost" class="-ml-2" />
    </div>
    <div v-if="loading" class="py-20 text-muted" role="status">Loading article…</div>
    <UAlert v-else-if="loadError" title="Article could not be opened" :description="loadError" color="error" variant="soft" class="mt-8" :actions="[{ label: 'Try again', onClick: load }]" />
    <template v-else>
      <div class="mt-4 h-5" role="status" aria-live="polite"><span v-if="generation.active.value" class="flex items-center gap-2 text-sm text-muted"><UIcon name="i-lucide-loader-circle" class="size-4 animate-spin text-primary" /><span>{{ generation.job.value?.status === 'queued' ? 'Article queued. You can leave this page.' : 'Writing your article in the background…' }}</span></span></div>
      <UButton v-if="conflict" :to="`/admin/articles/${articleId}`" target="_blank" label="Open saved version in a new tab" color="neutral" variant="outline" class="mt-3" />
      <div class="mt-6 min-w-0">
        <section class="mx-auto min-w-0 max-w-4xl" :aria-label="preview ? 'Article preview' : 'Article editor'">
          <div class="h-6">
            <UBadge v-if="preview" :label="viewedRevision ? (selectedRevision === 'generated' ? 'Generated draft' : `Version ${selectedRevision}`) : 'Private preview'" color="neutral" variant="subtle" />
          </div>
          <UFormField label="Article title" name="title" class="mt-3 w-full">
            <h1 v-if="preview" class="min-h-24 break-words text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl">{{ previewDraft.title || 'Untitled article' }}</h1>
            <UTextarea v-else v-model="draft.title" aria-label="Article title" :rows="2" autoresize :maxrows="5" :maxlength="200" variant="none" class="w-full" :ui="{ base: 'min-h-24 w-full rounded-none px-0 py-2 text-3xl font-semibold leading-tight tracking-tight text-highlighted sm:text-4xl md:text-4xl bg-transparent focus-visible:ring-0' }" />
          </UFormField>
          <UFormField label="Summary" name="excerpt" class="mt-5 w-full" :help="preview ? undefined : 'A short introduction for the article list and search description.'">
            <p v-if="preview" class="min-h-16 break-words text-lg leading-8 text-muted">{{ previewDraft.excerpt }}</p>
            <UTextarea v-else v-model="draft.excerpt" :rows="2" autoresize :maxlength="600" class="w-full" />
          </UFormField>
          <p class="my-6 min-h-6 text-sm text-muted">{{ user?.name }}<template v-if="previewDraft.gameweek"> · Gameweek {{ previewDraft.gameweek }}</template><template v-if="previewDraft.season"> · {{ previewDraft.season }}</template></p>
          <h2 class="mt-8 mb-3 min-h-5 text-sm font-medium text-highlighted" :class="preview ? 'invisible' : ''" :aria-hidden="preview">Article body</h2>
          <ClientOnly>
            <AdminArticleBodyEditor :model-value="preview ? previewDraft.body : draft.body" :preview="preview" :article-id="articleId" @update:model-value="updateArticleBody" />
            <template #fallback><div class="min-h-96 py-6 text-muted">Loading editor…</div></template>
          </ClientOnly>
          <div class="flex flex-wrap justify-between gap-2 border-t border-default pt-4 text-xs text-muted">
            <span>{{ previewWordCount }} {{ previewWordCount === 1 ? 'word' : 'words' }}</span>
            <span v-if="savedAt">{{ viewedRevision ? `Version ${selectedRevision}` : `Saved at ${savedTime} IST · Revision ${version}` }}</span>
          </div>
        </section>
        <USlideover v-model:open="detailsOpen" :side="detailsSide" title="Article details" description="Article settings, sources and saved versions.">
          <template #body>
          <aside class="min-w-0" aria-label="Article details">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-highlighted">Article details</h2>
            <UBadge :label="articleStatusLabel" :color="articleStatusLabel === 'Published' ? 'success' : 'neutral'" variant="subtle" />
          </div>
          <UFormField v-if="version > 0" label="Version history" class="mt-6 w-full">
            <USelect :model-value="selectedRevision" :items="revisionItems" class="w-full" aria-label="Article version history" :disabled="dirty || saving || loading" @update:model-value="selectRevision" />
            <p v-if="revisionError" role="alert" class="mt-2 text-sm text-error">{{ revisionError }}</p>
          </UFormField>
          <UFormField label="Template" class="mt-6 w-full">
            <USelect :model-value="preview ? previewDraft.template : draft.template" :items="articleTemplates.map(({ label, value }) => ({ label, value }))" class="w-full" :disabled="preview" @update:model-value="draft.template = $event" />
          </UFormField>
          <UButton v-if="canApplyTemplate && !preview" label="Add section headings" icon="i-lucide-list-plus" color="neutral" variant="outline" block class="mt-3" @click="applyTemplate" />
          <UFormField label="Season" help="Use YYYY/YY, or leave empty for an evergreen guide." class="mt-6 w-full">
            <UInput :model-value="preview ? previewDraft.season : draft.season" :maxlength="7" class="w-full" :disabled="preview" @update:model-value="draft.season = $event" />
          </UFormField>
          <UFormField label="Gameweek" class="mt-5 w-full">
            <UInput :model-value="(preview ? previewDraft.gameweek : draft.gameweek) ?? ''" type="number" :min="1" :max="38" :step="1" class="w-full" :disabled="preview" @update:model-value="draft.gameweek = $event === '' ? null : Number($event)" />
          </UFormField>
          <UButton v-if="draft.gameweek && !preview" label="Clear gameweek" variant="link" color="neutral" size="xs" class="mt-1 px-0" @click="draft.gameweek = null" />
          <UFormField label="URL slug" help="This becomes the public article address when you publish." class="mt-6 w-full">
            <UInput :model-value="preview ? previewDraft.slug : draft.slug" :maxlength="160" class="w-full" :disabled="preview" @update:model-value="draft.slug = $event" />
          </UFormField>
          <UButton v-if="draft.title && !preview" label="Use article title" color="neutral" variant="link" size="xs" class="mt-1 px-0" @click="draft.slug = articleSlug(draft.title)" />
          <div class="mt-7 border-t border-default pt-5">
            <div class="flex items-center justify-between gap-3"><h3 class="text-sm font-medium text-highlighted">Sources</h3><UButton label="Add source" icon="i-lucide-plus" size="xs" color="neutral" variant="outline" :disabled="preview || draft.sources.length >= 20" @click="draft.sources.push({ title: '', url: '' })" /></div>
            <p class="mt-2 text-xs leading-5 text-muted">Add the sources that support the article. At least one is required to publish.</p>
            <div v-for="(source, index) in (preview ? previewDraft.sources : draft.sources)" :key="index" class="mt-4 space-y-2">
              <UFormField :label="`Source ${index + 1} title`" class="w-full"><UInput v-model="source.title" maxlength="200" class="w-full" :disabled="preview" /></UFormField>
              <div class="flex items-end gap-2"><UFormField label="Source URL" class="min-w-0 flex-1"><UInput v-model="source.url" type="url" maxlength="2000" class="w-full" :disabled="preview" /></UFormField><UButton label="Remove" icon="i-lucide-trash-2" color="neutral" variant="ghost" size="sm" :disabled="preview" @click="draft.sources.splice(index, 1)" /></div>
            </div>
          </div>
          <p class="mt-8 border-t border-default pt-5 text-sm leading-6 text-muted">Saving keeps your article private. Publishing creates a public version; later edits stay in the draft until you publish again.</p>
          </aside>
          </template>
        </USlideover>
      </div>
    </template>
    <UModal v-model:open="discardOpen" title="Leave this draft?" description="Your latest changes are not saved yet. Keep editing until the save completes, or leave and discard them.">
      <template #footer>
        <UButton label="Keep editing" color="neutral" variant="outline" @click="discardOpen = false" />
        <UButton label="Leave and discard" color="error" :disabled="saving" @click="discardAndLeave" />
      </template>
    </UModal>
  </div>
</template>
