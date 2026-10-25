<script setup lang="ts">
import { articleTemplates } from '~/shared/articles'
import { promptDescriptions, type ArticlePromptScope } from '~/shared/article-prompts'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Settings' })

interface Prompt {
  _id: string
  scope: ArticlePromptScope
  template: string | null
  name: string
  description?: string
  instructions: string
  isDefault: boolean
  updatedAt: number
}
interface Learning {
  title: string
  instruction: string
  scope: ArticlePromptScope
  template: string | null
  sources: { title: string; url: string }[]
}

const groups = [
  { key: 'research-search', scope: 'research-search' as const, template: null, title: 'Competitor search' },
  { key: 'research-analysis', scope: 'research-analysis' as const, template: null, title: 'Research analysis' },
  ...articleTemplates.map(item => ({ key: item.value, scope: 'article' as const, template: item.value, title: item.label })),
]
const prompts = ref<Prompt[]>([])
const edits = reactive<Record<string, { name: string; description: string; instructions: string }>>({})
const selectedGroup = ref('research-search')
const selectedPromptId = ref('')
const loading = ref(true)
const pageError = ref('')
const savingId = ref('')
const formMode = ref<'edit' | 'new' | 'copy'>('edit')
const newPrompt = reactive({ name: '', description: '', instructions: '' })
const formError = ref('')
const suggestionError = ref('')
const suggesting = ref(false)
const suggestionScheduled = ref(false)
const detailsManuallyEdited = ref(false)
let suggestionTimer: ReturnType<typeof setTimeout> | undefined
let suggestionRequest = 0
const learnings = ref<Learning[]>([])
const dismissedLearnings = ref<number[]>([])
const addedLearnings = ref<number[]>([])
const toast = useToast()

const activeGroup = computed(() => groups.find(group => group.key === selectedGroup.value) || groups[0])
const groupPrompts = computed(() => prompts.value
  .filter(prompt => prompt.scope === activeGroup.value.scope && prompt.template === activeGroup.value.template)
  .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name)))
const selectedPrompt = computed(() => prompts.value.find(prompt => prompt._id === selectedPromptId.value) || null)
const currentValue = computed(() => formMode.value === 'edit' && selectedPrompt.value
  ? edits[selectedPrompt.value._id]
  : newPrompt)
const visibleLearnings = computed(() => learnings.value
  .map((learning, index) => ({ ...learning, index }))
  .filter(learning => !dismissedLearnings.value.includes(learning.index)))

function descriptionFor(prompt: Prompt) {
  return prompt.description?.trim() || promptDescriptions[prompt.scope]
}

async function load() {
  loading.value = true
  pageError.value = ''
  try {
    const [loadedPrompts, research] = await Promise.all([
      $fetch<Prompt[]>('/api/admin/prompts'),
      $fetch<{ capturedAt: string | null; learnings: Learning[] }>('/api/admin/prompts/learnings').catch(() => null),
    ])
    prompts.value = loadedPrompts
    for (const prompt of loadedPrompts) {
      edits[prompt._id] = { name: prompt.name, description: descriptionFor(prompt), instructions: prompt.instructions }
    }
    learnings.value = research?.learnings || []
    if (!groups.some(group => group.key === selectedGroup.value)) selectedGroup.value = groups[0].key
    if (!groupPrompts.value.some(prompt => prompt._id === selectedPromptId.value)) {
      selectedPromptId.value = groupPrompts.value[0]?._id || ''
    }
    const active = prompts.value.find(prompt => prompt._id === selectedPromptId.value)
    if (import.meta.client && active && !active.description) schedulePromptDetails(0)
  } catch (cause: any) {
    pageError.value = cause.data?.statusMessage || 'Prompt settings could not be loaded.'
  } finally { loading.value = false }
}

function selectGroup(key: string) {
  cancelPendingSuggestion()
  selectedGroup.value = key
  formMode.value = 'edit'
  detailsManuallyEdited.value = false
  selectedPromptId.value = groupPrompts.value[0]?._id || ''
  formError.value = ''
}

function selectPrompt(prompt: Prompt) {
  cancelPendingSuggestion()
  formMode.value = 'edit'
  detailsManuallyEdited.value = false
  selectedPromptId.value = prompt._id
  formError.value = ''
  if (!prompt.description) schedulePromptDetails(0)
}

function startNew(source?: Prompt) {
  cancelPendingSuggestion()
  formMode.value = source ? 'copy' : 'new'
  newPrompt.name = source ? `${source.name} copy` : ''
  newPrompt.description = source ? descriptionFor(source) : ''
  newPrompt.instructions = source ? source.instructions : ''
  formError.value = ''
  suggestionError.value = ''
  detailsManuallyEdited.value = false
  if (source) schedulePromptDetails(0)
}

function cancelNew() {
  cancelPendingSuggestion()
  formMode.value = 'edit'
  formError.value = ''
  suggestionRequest++
  suggesting.value = false
}

function schedulePromptDetails(delay = 900) {
  if (suggestionTimer) clearTimeout(suggestionTimer)
  suggestionScheduled.value = false
  if (detailsManuallyEdited.value || !currentValue.value?.instructions.trim()) return
  suggestionError.value = ''
  suggestionScheduled.value = true
  suggestionTimer = setTimeout(() => {
    suggestionScheduled.value = false
    void suggestPromptDetails()
  }, delay)
}

function cancelPendingSuggestion() {
  if (suggestionTimer) clearTimeout(suggestionTimer)
  suggestionTimer = undefined
  suggestionScheduled.value = false
  suggestionRequest++
  suggesting.value = false
}

async function suggestPromptDetails() {
  const value = currentValue.value
  if (!value?.instructions.trim() || detailsManuallyEdited.value) return
  const instructions = value.instructions
  const requestId = ++suggestionRequest
  suggesting.value = true
  suggestionError.value = ''
  try {
    const result = await $fetch<{ name: string; description: string }>('/api/admin/prompts/suggest', {
      method: 'POST',
      body: { instructions },
    })
    if (requestId === suggestionRequest && !detailsManuallyEdited.value && value.instructions === instructions) {
      value.name = result.name
      value.description = result.description
      const legacyPrompt = formMode.value === 'edit' && selectedPrompt.value && !selectedPrompt.value.description ? selectedPrompt.value : null
      if (legacyPrompt) {
        await $fetch(`/api/admin/prompts/${legacyPrompt._id}`, { method: 'PUT', body: result })
        legacyPrompt.name = result.name
        legacyPrompt.description = result.description
      }
    }
  } catch (cause: any) {
    if (requestId === suggestionRequest) suggestionError.value = cause.data?.statusMessage || 'Title and description could not be suggested. Please try again.'
  } finally {
    if (requestId === suggestionRequest) suggesting.value = false
  }
}

function markDetailsEdited() {
  detailsManuallyEdited.value = true
  cancelPendingSuggestion()
}

function onPromptInstructionsChanged() {
  schedulePromptDetails()
}

onBeforeUnmount(() => {
  if (suggestionTimer) clearTimeout(suggestionTimer)
  suggestionRequest++
})

async function savePrompt() {
  const value = currentValue.value
  if (!value || savingId.value) return
  if (!value.name.trim()) formError.value = 'Add a title.'
  else if (value.name.trim().length > 80) formError.value = 'The title must be 80 characters or fewer.'
  else if (!value.description.trim()) formError.value = 'Add a one-line description.'
  else if (value.description.trim().length > 160) formError.value = 'The description must be 160 characters or fewer.'
  else if (!value.instructions.trim()) formError.value = 'Add the prompt instructions.'
  else if (value.instructions.length > 30_000) formError.value = 'Prompt instructions must be 30,000 characters or fewer.'
  else formError.value = ''
  if (formError.value) return
  savingId.value = formMode.value === 'edit' ? selectedPromptId.value : 'new'
  try {
    if (formMode.value === 'edit' && selectedPrompt.value) {
      await $fetch(`/api/admin/prompts/${selectedPrompt.value._id}`, { method: 'PUT', body: value })
      await load()
      toast.add({ title: 'Prompt saved', color: 'success', icon: 'i-lucide-check', duration: 2500 })
    } else {
      const result = await $fetch<{ promptId: string }>('/api/admin/prompts', {
        method: 'POST',
        body: { scope: activeGroup.value.scope, template: activeGroup.value.template, ...value },
      })
      selectedPromptId.value = result.promptId
      formMode.value = 'edit'
      await load()
      selectedPromptId.value = result.promptId
      toast.add({ title: 'Prompt added', color: 'success', icon: 'i-lucide-check', duration: 2500 })
    }
  } catch (cause: any) {
    formError.value = cause.data?.statusMessage || 'Prompt could not be saved.'
  } finally { savingId.value = '' }
}

async function makeDefault() {
  if (!selectedPrompt.value || savingId.value) return
  savingId.value = selectedPromptId.value
  formError.value = ''
  try {
    await $fetch(`/api/admin/prompts/${selectedPromptId.value}/default`, { method: 'POST' })
    await load()
    toast.add({ title: 'Default prompt updated', color: 'success', icon: 'i-lucide-check', duration: 2500 })
  } catch (cause: any) {
    formError.value = cause.data?.statusMessage || 'Default prompt could not be changed.'
  } finally { savingId.value = '' }
}

function addLearning(learning: Learning, index: number) {
  const group = groups.find(item => item.scope === learning.scope && item.template === learning.template)
  if (!group) return
  if (formMode.value !== 'edit') cancelNew()
  selectGroup(group.key)
  const target = groupPrompts.value.find(prompt => prompt.isDefault) || groupPrompts.value[0]
  if (!target) {
    startNew()
    newPrompt.name = group.title
    newPrompt.description = promptDescriptions[learning.scope]
    newPrompt.instructions = learning.instruction
    addedLearnings.value.push(index)
    detailsManuallyEdited.value = false
    schedulePromptDetails()
    return
  }
  selectPrompt(target)
  const edit = edits[target._id]
  if (!edit.instructions.includes(learning.instruction)) {
    edit.instructions = `${edit.instructions.trim()}\n\nResearch learning: ${learning.instruction}`
    if (!detailsManuallyEdited.value) schedulePromptDetails()
  }
  addedLearnings.value.push(index)
}

await load()
</script>

<template>
  <section class="mx-auto max-w-6xl" aria-labelledby="settings-title">
    <header class="flex flex-wrap items-end justify-between gap-4 border-b border-default pb-5">
      <div>
        <h1 id="settings-title" class="text-3xl font-semibold tracking-tight text-highlighted">Settings</h1>
        <p class="mt-2 max-w-2xl leading-7 text-muted">Manage the prompts used for research and article drafts.</p>
      </div>
      <UButton to="/admin/articles" label="Articles" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
    </header>

    <UAlert v-if="pageError" title="Settings could not be loaded" :description="pageError" color="error" variant="soft" class="mt-5" :actions="[{ label: 'Try again', onClick: load } ]" />
    <div v-if="loading" class="py-16 text-center text-muted" role="status">Loading prompts…</div>

    <div v-else class="grid gap-8 pt-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <nav aria-label="Prompt types" class="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        <button
          v-for="group in groups"
          :key="group.key"
          type="button"
          class="flex shrink-0 items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary lg:w-full"
          :class="selectedGroup === group.key ? 'bg-elevated font-medium text-highlighted' : 'text-muted hover:bg-elevated/60 hover:text-highlighted'"
          :aria-current="selectedGroup === group.key ? 'page' : undefined"
          @click="selectGroup(group.key)"
        >
          <span>{{ group.title }}</span>
          <span class="text-xs tabular-nums text-muted">{{ prompts.filter(prompt => prompt.scope === group.scope && prompt.template === group.template).length }}</span>
        </button>
      </nav>

      <div class="min-w-0">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold text-highlighted">{{ activeGroup.title }}</h2>
            <p class="mt-1 text-sm text-muted">{{ groupPrompts.length }} {{ groupPrompts.length === 1 ? 'prompt' : 'prompts' }} for this type</p>
          </div>
          <div class="flex gap-2">
            <UButton label="New prompt" icon="i-lucide-plus" color="neutral" variant="outline" size="sm" @click="startNew()" />
            <UButton v-if="selectedPrompt && formMode === 'edit'" label="Copy prompt" icon="i-lucide-copy" color="neutral" variant="ghost" size="sm" @click="startNew(selectedPrompt)" />
          </div>
        </div>

        <div class="mt-5 flex gap-2 overflow-x-auto border-b border-default pb-3" role="group" :aria-label="`${activeGroup.title} prompts`">
          <button
            v-for="prompt in groupPrompts"
            :key="prompt._id"
            type="button"
            class="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary"
            :class="formMode === 'edit' && selectedPromptId === prompt._id ? 'bg-primary/10 font-medium text-primary' : 'text-muted hover:bg-elevated hover:text-highlighted'"
            :aria-pressed="formMode === 'edit' && selectedPromptId === prompt._id"
            @click="selectPrompt(prompt)"
          >
            {{ prompt.name }}
            <UBadge v-if="prompt.isDefault" label="Default" color="primary" variant="subtle" size="xs" />
          </button>
          <p v-if="!groupPrompts.length" class="py-2 text-sm text-muted">No prompts yet.</p>
          <span v-if="formMode !== 'edit'" class="shrink-0 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">{{ formMode === 'copy' ? 'Copy' : 'New prompt' }}</span>
        </div>

        <div v-if="formMode === 'edit' && !selectedPrompt" class="py-8 text-sm text-muted">Add a prompt to start using this type.</div>
        <section v-else class="space-y-5 pt-5" :aria-label="formMode === 'edit' ? 'Edit prompt' : 'Create prompt'">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold text-highlighted">{{ formMode === 'edit' ? 'Edit prompt' : formMode === 'copy' ? 'Copy prompt' : 'New prompt' }}</h3>
              <p v-if="formMode === 'copy'" class="mt-1 text-sm text-muted">Make changes to the copy, then save it as a separate variant.</p>
            </div>
            <UButton v-if="formMode !== 'edit'" label="Cancel" color="neutral" variant="ghost" size="sm" @click="cancelNew" />
          </div>

          <UFormField label="Title" class="w-full">
            <UInput v-model="currentValue.name" maxlength="80" class="w-full" @update:model-value="markDetailsEdited" />
          </UFormField>
          <UFormField label="Description" description="One line to explain when to use this prompt." class="w-full">
            <UInput v-model="currentValue.description" maxlength="160" class="w-full" @update:model-value="markDetailsEdited" />
          </UFormField>
          <UFormField label="Prompt" class="w-full">
          <template #label><span>Prompt <span v-if="suggesting || suggestionScheduled" class="ml-2 text-xs font-normal text-muted" role="status">Updating title and description…</span></span></template>
            <template #description>Title and description fill automatically from the prompt. You can edit them any time.</template>
            <UTextarea v-model="currentValue.instructions" :rows="12" autoresize :maxrows="32" maxlength="30000" class="w-full" @update:model-value="onPromptInstructionsChanged" />
          </UFormField>

          <p v-if="suggestionError" role="alert" class="text-sm text-error">{{ suggestionError }}</p>
          <p v-if="formError" role="alert" class="text-sm text-error">{{ formError }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <UButton :label="formMode === 'edit' ? 'Save changes' : 'Save prompt'" icon="i-lucide-save" :loading="savingId !== ''" :disabled="suggesting || suggestionScheduled" @click="savePrompt" />
            <UButton v-if="formMode === 'edit' && selectedPrompt && !selectedPrompt.isDefault" label="Make default" color="neutral" variant="outline" :loading="savingId === selectedPromptId" @click="makeDefault" />
            <span v-else-if="formMode === 'edit' && selectedPrompt?.isDefault" class="text-sm text-muted">This is the default prompt for {{ activeGroup.title.toLowerCase() }}.</span>
          </div>
        </section>

        <section v-if="visibleLearnings.length" class="mt-10 border-t border-default pt-5" aria-labelledby="learnings-title">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 id="learnings-title" class="font-semibold text-highlighted">Research learnings</h3>
              <p class="mt-1 text-sm text-muted">Optional suggestions from cited articles. Add one to a prompt to review it before saving.</p>
            </div>
            <span class="text-xs text-muted">{{ visibleLearnings.length }} suggestions</span>
          </div>
          <ul class="mt-3 divide-y divide-default">
            <li v-for="learning in visibleLearnings" :key="learning.index" class="flex flex-wrap items-start justify-between gap-3 py-4">
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-medium text-highlighted">{{ learning.title }}</h4>
                <p class="mt-1 text-sm leading-6 text-muted">{{ learning.instruction }}</p>
                <p class="mt-1 text-xs text-muted">For {{ groups.find(group => group.scope === learning.scope && group.template === learning.template)?.title || 'prompt' }}</p>
                <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <a v-for="source in learning.sources" :key="source.url" :href="source.url" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-4">{{ source.title }}</a>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <UButton v-if="!addedLearnings.includes(learning.index)" label="Add to prompt" icon="i-lucide-plus" size="sm" variant="outline" color="neutral" @click="addLearning(learning, learning.index)" />
                <span v-else class="text-xs font-medium text-primary">Added to unsaved edits</span>
                <UButton v-if="!addedLearnings.includes(learning.index)" label="Dismiss" color="neutral" variant="ghost" size="sm" @click="dismissedLearnings.push(learning.index)" />
              </div>
            </li>
          </ul>
        </section>
        <p v-else class="mt-10 border-t border-default pt-5 text-sm text-muted">Research learnings will appear here after a research run finds useful, cited patterns.</p>
      </div>
    </div>
  </section>
</template>
