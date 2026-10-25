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
const learnings = ref<Learning[]>([])
const learningsError = ref('')
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
      $fetch<{ capturedAt: string | null; learnings: Learning[] }>('/api/admin/prompts/learnings').catch(() => ({ capturedAt: null, learnings: [] })),
    ])
    prompts.value = loadedPrompts
    for (const prompt of loadedPrompts) {
      edits[prompt._id] = { name: prompt.name, description: descriptionFor(prompt), instructions: prompt.instructions }
    }
    learnings.value = research.learnings
    if (!groups.some(group => group.key === selectedGroup.value)) selectedGroup.value = groups[0].key
    if (!groupPrompts.value.some(prompt => prompt._id === selectedPromptId.value)) {
      selectedPromptId.value = groupPrompts.value[0]?._id || ''
    }
  } catch (cause: any) {
    pageError.value = cause.data?.statusMessage || 'Prompt settings could not be loaded.'
  } finally { loading.value = false }
}

function selectGroup(key: string) {
  selectedGroup.value = key
  formMode.value = 'edit'
  selectedPromptId.value = groupPrompts.value[0]?._id || ''
  formError.value = ''
}

function selectPrompt(prompt: Prompt) {
  formMode.value = 'edit'
  selectedPromptId.value = prompt._id
  formError.value = ''
}

function startNew(source?: Prompt) {
  formMode.value = source ? 'copy' : 'new'
  newPrompt.name = source ? `${source.name} copy` : ''
  newPrompt.description = source ? descriptionFor(source) : ''
  newPrompt.instructions = source ? source.instructions : ''
  formError.value = ''
}

function cancelNew() {
  formMode.value = 'edit'
  formError.value = ''
}

async function savePrompt() {
  const value = currentValue.value
  if (!value || savingId.value) return
  if (!value.name.trim() || !value.description.trim() || !value.instructions.trim()) {
    formError.value = 'Add a title, a one-line description and the prompt instructions.'
    return
  }
  savingId.value = formMode.value === 'edit' ? selectedPromptId.value : 'new'
  formError.value = ''
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
    return
  }
  selectPrompt(target)
  const edit = edits[target._id]
  if (!edit.instructions.includes(learning.instruction)) {
    edit.instructions = `${edit.instructions.trim()}\n\nResearch learning: ${learning.instruction}`
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

        <div class="mt-5 flex gap-2 overflow-x-auto border-b border-default pb-3" role="tablist" :aria-label="`${activeGroup.title} prompts`">
          <button
            v-for="prompt in groupPrompts"
            :key="prompt._id"
            type="button"
            role="tab"
            class="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary"
            :class="formMode === 'edit' && selectedPromptId === prompt._id ? 'bg-primary/10 font-medium text-primary' : 'text-muted hover:bg-elevated hover:text-highlighted'"
            :aria-selected="formMode === 'edit' && selectedPromptId === prompt._id"
            @click="selectPrompt(prompt)"
          >
            {{ prompt.name }}
            <UBadge v-if="prompt.isDefault" label="Default" color="primary" variant="subtle" size="xs" />
          </button>
          <p v-if="!groupPrompts.length" class="py-2 text-sm text-muted">No prompts yet.</p>
          <button v-if="formMode !== 'edit'" type="button" role="tab" aria-selected="true" class="shrink-0 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary">{{ formMode === 'copy' ? 'Copy' : 'New prompt' }}</button>
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
            <UInput v-model="currentValue.name" maxlength="80" class="w-full" />
          </UFormField>
          <UFormField label="Description" description="One line to explain when to use this prompt." class="w-full">
            <UInput v-model="currentValue.description" maxlength="160" class="w-full" />
          </UFormField>
          <UFormField label="Prompt" class="w-full">
            <UTextarea v-model="currentValue.instructions" :rows="12" autoresize :maxrows="32" class="w-full" />
          </UFormField>

          <p v-if="formError" role="alert" class="text-sm text-error">{{ formError }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <UButton :label="formMode === 'edit' ? 'Save changes' : 'Save prompt'" icon="i-lucide-save" :loading="savingId !== ''" @click="savePrompt" />
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
        <p v-else-if="!learningsError" class="mt-10 border-t border-default pt-5 text-sm text-muted">Research learnings will appear here after a research run finds useful, cited patterns.</p>
      </div>
    </div>
  </section>
</template>
