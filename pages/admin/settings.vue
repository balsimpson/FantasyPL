<script setup lang="ts">
import { articleTemplates } from '~/shared/articles'
import type { ArticlePromptScope } from '~/shared/article-prompts'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Settings' })

interface Prompt {
  _id: string
  scope: ArticlePromptScope
  template: string | null
  name: string
  instructions: string
  isDefault: boolean
  updatedAt: number
}

const prompts = ref<Prompt[]>([])
const edits = reactive<Record<string, { name: string; instructions: string }>>({})
const loading = ref(true)
const pageError = ref('')
const savingId = ref('')
const creating = ref(false)
const createScope = ref<ArticlePromptScope>('article')
const createTemplate = ref<string | null>('comparison')
const createName = ref('')
const createInstructions = ref('')
const createError = ref('')
const toast = useToast()

const researchGroups = computed(() => [
  { key: 'research-search' as const, title: 'Competitor search', description: 'Find current FPL competitor articles and source links.' },
  { key: 'research-analysis' as const, title: 'Research analysis', description: 'Assess coverage and suggest useful article ideas.' },
].map(group => ({ ...group, prompts: prompts.value.filter(prompt => prompt.scope === group.key) })))
const articleGroups = computed(() => articleTemplates.map(template => ({
  key: template.value,
  title: template.label,
  prompts: prompts.value.filter(prompt => prompt.scope === 'article' && prompt.template === template.value),
})))

async function load() {
  loading.value = true
  pageError.value = ''
  try {
    prompts.value = await $fetch<Prompt[]>('/api/admin/prompts')
    for (const prompt of prompts.value) edits[prompt._id] = { name: prompt.name, instructions: prompt.instructions }
  } catch (cause: any) {
    pageError.value = cause.data?.statusMessage || 'Prompt settings could not be loaded.'
  } finally { loading.value = false }
}

async function save(prompt: Prompt) {
  const value = edits[prompt._id]
  if (!value || savingId.value) return
  savingId.value = prompt._id
  pageError.value = ''
  try {
    await $fetch(`/api/admin/prompts/${prompt._id}`, { method: 'PUT', body: value })
    await load()
    toast.add({ title: 'Prompt saved', color: 'success', icon: 'i-lucide-check', duration: 2500 })
  } catch (cause: any) {
    pageError.value = cause.data?.statusMessage || 'Prompt could not be saved.'
  } finally { savingId.value = '' }
}

async function makeDefault(prompt: Prompt) {
  savingId.value = prompt._id
  pageError.value = ''
  try {
    await $fetch(`/api/admin/prompts/${prompt._id}/default`, { method: 'POST' })
    await load()
  } catch (cause: any) { pageError.value = cause.data?.statusMessage || 'Default prompt could not be changed.' }
  finally { savingId.value = '' }
}

function startCreate(scope: ArticlePromptScope, template: string | null = null) {
  createScope.value = scope
  createTemplate.value = template
  createName.value = ''
  createInstructions.value = ''
  createError.value = ''
  creating.value = true
}

async function addPrompt() {
  if (!createName.value.trim() || !createInstructions.value.trim()) {
    createError.value = 'Add a name and prompt instructions.'
    return
  }
  savingId.value = 'new'
  createError.value = ''
  try {
    await $fetch('/api/admin/prompts', { method: 'POST', body: { scope: createScope.value, template: createTemplate.value, name: createName.value, instructions: createInstructions.value } })
    creating.value = false
    await load()
    toast.add({ title: 'Prompt added', color: 'success', icon: 'i-lucide-check', duration: 2500 })
  } catch (cause: any) { createError.value = cause.data?.statusMessage || 'Prompt could not be added.' }
  finally { savingId.value = '' }
}

await load()
</script>

<template>
  <section class="mx-auto max-w-4xl" aria-labelledby="settings-title">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 id="settings-title" class="text-3xl font-semibold tracking-tight text-highlighted">Settings</h1>
        <p class="mt-2 max-w-2xl leading-7 text-muted">Review the prompts used for research and article drafts. Set a default or choose another prompt in the article editor.</p>
      </div>
      <UButton to="/admin/articles" label="Articles" icon="i-lucide-arrow-left" color="neutral" variant="ghost" />
    </div>

    <UAlert v-if="pageError" title="Settings could not be saved" :description="pageError" color="error" variant="soft" class="mt-6" :actions="[{ label: 'Try again', onClick: load } ]" />
    <div v-if="loading" class="py-16 text-center text-muted" role="status">Loading prompts…</div>
    <template v-else>
      <section class="mt-10" aria-labelledby="research-prompts-title">
        <div class="flex items-end justify-between gap-4 border-b border-default pb-3">
          <div>
            <h2 id="research-prompts-title" class="text-xl font-semibold text-highlighted">Research</h2>
            <p class="mt-1 text-sm text-muted">These prompts guide the automatic idea research.</p>
          </div>
        </div>
        <div v-for="group in researchGroups" :key="group.key" class="border-b border-default py-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="font-medium text-highlighted">{{ group.title }}</h3>
              <p class="mt-1 text-sm text-muted">{{ group.description }}</p>
            </div>
            <UButton label="Add variant" icon="i-lucide-plus" color="neutral" variant="ghost" size="sm" @click="startCreate(group.key)" />
          </div>
          <details v-for="prompt in group.prompts" :key="prompt._id" class="group mt-3 rounded-sm">
            <summary class="flex cursor-pointer list-none items-center gap-2 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary">
              <UIcon name="i-lucide-chevron-right" class="size-4 text-muted transition-transform group-open:rotate-90" />
              <span class="font-medium text-highlighted">{{ prompt.name }}</span>
              <UBadge v-if="prompt.isDefault" label="Default" color="primary" variant="subtle" size="xs" />
            </summary>
            <div class="space-y-4 pb-3 pl-6 pt-2">
              <UFormField label="Prompt name" class="w-full"><UInput v-model="edits[prompt._id].name" maxlength="80" class="w-full" /></UFormField>
              <UFormField label="Instructions" class="w-full"><UTextarea v-model="edits[prompt._id].instructions" :rows="8" autoresize :maxrows="30" class="w-full" /></UFormField>
              <div class="flex flex-wrap items-center gap-2">
                <UButton label="Save changes" icon="i-lucide-save" size="sm" :loading="savingId === prompt._id" @click="save(prompt)" />
                <UButton v-if="!prompt.isDefault" label="Make default" color="neutral" variant="outline" size="sm" :loading="savingId === prompt._id" @click="makeDefault(prompt)" />
              </div>
            </div>
          </details>
          <div v-if="creating && createScope === group.key" class="mt-4 space-y-4 border-t border-default pt-4">
            <h4 class="text-sm font-semibold text-highlighted">New research prompt</h4>
            <UFormField label="Prompt name" class="w-full"><UInput v-model="createName" maxlength="80" class="w-full" /></UFormField>
            <UFormField label="Instructions" class="w-full"><UTextarea v-model="createInstructions" :rows="8" autoresize :maxrows="30" class="w-full" /></UFormField>
            <p v-if="createError" role="alert" class="text-sm text-error">{{ createError }}</p>
            <div class="flex gap-2"><UButton label="Add prompt" icon="i-lucide-plus" :loading="savingId === 'new'" @click="addPrompt" /><UButton label="Cancel" color="neutral" variant="ghost" @click="creating = false" /></div>
          </div>
        </div>
      </section>

      <section class="mt-10" aria-labelledby="article-prompts-title">
        <div class="border-b border-default pb-3">
          <h2 id="article-prompts-title" class="text-xl font-semibold text-highlighted">Article writing</h2>
          <p class="mt-1 text-sm text-muted">Each format has its own prompt variants. New drafts use the default unless you choose another.</p>
        </div>
        <div v-for="group in articleGroups" :key="group.key" class="border-b border-default py-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="font-medium text-highlighted">{{ group.title }}</h3>
            <UButton label="Add variant" icon="i-lucide-plus" color="neutral" variant="ghost" size="sm" @click="startCreate('article', group.key)" />
          </div>
          <details v-for="prompt in group.prompts" :key="prompt._id" class="group mt-2 rounded-sm">
            <summary class="flex cursor-pointer list-none items-center gap-2 py-2 text-sm focus-visible:outline-2 focus-visible:outline-primary">
              <UIcon name="i-lucide-chevron-right" class="size-4 text-muted transition-transform group-open:rotate-90" />
              <span class="font-medium text-highlighted">{{ prompt.name }}</span>
              <UBadge v-if="prompt.isDefault" label="Default" color="primary" variant="subtle" size="xs" />
            </summary>
            <div class="space-y-4 pb-3 pl-6 pt-2">
              <UFormField label="Prompt name" class="w-full"><UInput v-model="edits[prompt._id].name" maxlength="80" class="w-full" /></UFormField>
              <UFormField label="Instructions" class="w-full"><UTextarea v-model="edits[prompt._id].instructions" :rows="8" autoresize :maxrows="30" class="w-full" /></UFormField>
              <div class="flex flex-wrap items-center gap-2">
                <UButton label="Save changes" icon="i-lucide-save" size="sm" :loading="savingId === prompt._id" @click="save(prompt)" />
                <UButton v-if="!prompt.isDefault" label="Make default" color="neutral" variant="outline" size="sm" :loading="savingId === prompt._id" @click="makeDefault(prompt)" />
              </div>
            </div>
          </details>
          <div v-if="creating && createScope === 'article' && createTemplate === group.key" class="mt-4 space-y-4 border-t border-default pt-4">
            <h4 class="text-sm font-semibold text-highlighted">New {{ group.title.toLowerCase() }} prompt</h4>
            <UFormField label="Prompt name" class="w-full"><UInput v-model="createName" maxlength="80" class="w-full" /></UFormField>
            <UFormField label="Instructions" class="w-full"><UTextarea v-model="createInstructions" :rows="8" autoresize :maxrows="30" class="w-full" /></UFormField>
            <p v-if="createError" role="alert" class="text-sm text-error">{{ createError }}</p>
            <div class="flex gap-2"><UButton label="Add prompt" icon="i-lucide-plus" :loading="savingId === 'new'" @click="addPrompt" /><UButton label="Cancel" color="neutral" variant="ghost" @click="creating = false" /></div>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>
