<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/core'
import type { ArticleNode } from '~/shared/articles'
import { articleVisualExtensions } from '~/utils/article-editor-extensions'
const body = defineModel<ArticleNode>({ required: true })
const props = defineProps<{ preview?: boolean; articleId: string }>()
const selection = ref<{ from: number; to: number; text: string } | null>(null)
const instruction = ref('')
const editing = ref(false)
const editError = ref('')
const editNotice = ref('')
let currentEditor: Editor | undefined
const items: EditorToolbarItem[][] = [
  [{ kind: 'undo', icon: 'i-lucide-undo-2', 'aria-label': 'Undo', tooltip: { text: 'Undo' } }, { kind: 'redo', icon: 'i-lucide-redo-2', 'aria-label': 'Redo', tooltip: { text: 'Redo' } }],
  [{ kind: 'heading', level: 2, icon: 'i-lucide-heading-2', 'aria-label': 'Heading 2', tooltip: { text: 'Heading 2' } }, { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', 'aria-label': 'Heading 3', tooltip: { text: 'Heading 3' } }],
  [{ kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', 'aria-label': 'Bold', tooltip: { text: 'Bold' } }, { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', 'aria-label': 'Italic', tooltip: { text: 'Italic' } }, { kind: 'link', icon: 'i-lucide-link', 'aria-label': 'Add or remove link', tooltip: { text: 'Add or remove link' } }],
  [{ kind: 'bulletList', icon: 'i-lucide-list', 'aria-label': 'Bullet list', tooltip: { text: 'Bullet list' } }, { kind: 'orderedList', icon: 'i-lucide-list-ordered', 'aria-label': 'Numbered list', tooltip: { text: 'Numbered list' } }, { kind: 'blockquote', icon: 'i-lucide-text-quote', 'aria-label': 'Quote', tooltip: { text: 'Quote' } }],
]

function updateSelection(editor: Editor) {
  currentEditor = editor
  const { from, to, empty } = editor.state.selection
  if (empty) {
    selection.value = null
    return
  }
  let hasVisual = false
  editor.state.doc.nodesBetween(from, to, node => {
    if (['playerCard', 'fixtureRun'].includes(node.type.name)) hasVisual = true
  })
  const text = editor.state.doc.textBetween(from, to, '\n').trim()
  selection.value = text && text.length <= 3000 && !hasVisual ? { from, to, text } : null
}

async function applyEdit() {
  const target = selection.value
  const editor = currentEditor
  if (!target || !editor || !instruction.value.trim() || editing.value) return
  editing.value = true
  editError.value = ''
  editNotice.value = ''
  try {
    const result = await $fetch<{ replacementText: string }>(`/api/admin/articles/${props.articleId}/edit`, {
      method: 'POST',
      body: { selectedText: target.text, instruction: instruction.value.trim() },
    })
    const currentText = editor.state.doc.textBetween(target.from, target.to, '\n').trim()
    if (currentText !== target.text) throw new Error('The selected text changed while the edit was running. Select it again and retry.')
    editor.chain().focus().insertContentAt({ from: target.from, to: target.to }, result.replacementText).run()
    instruction.value = ''
    selection.value = null
    editNotice.value = 'Selected text updated. Save the draft to keep the change.'
  } catch (cause: any) {
    editError.value = cause.data?.statusMessage || cause.message || 'The selected text could not be edited. Your article is unchanged.'
  } finally { editing.value = false }
}
</script>

<template>
  <UEditor :key="preview ? 'preview' : 'write'" v-slot="{ editor }" v-model="body" :editable="!preview && !editing" :on-selection-update="() => updateSelection(editor)" :extensions="articleVisualExtensions" :image="false" :mention="false" :starter-kit="{ heading: { levels: [2, 3] }, codeBlock: false, code: false }" :editor-props="{ attributes: { 'aria-label': preview ? 'Article preview' : 'Article body', role: preview ? 'document' : 'textbox', 'aria-multiline': preview ? undefined : 'true' } }" class="w-full" :ui="{ base: 'min-h-96 px-0 py-6 text-base break-words sm:px-0', content: 'min-w-0' }">
    <div v-if="!preview && selection" class="mb-4 space-y-3 border-y border-default py-4" aria-label="Edit selected text">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0"><p class="text-sm font-medium text-highlighted">Edit selected text</p><p class="mt-1 max-w-3xl truncate text-xs text-muted">“{{ selection.text }}”</p></div>
        <span v-if="editing" role="status" class="flex items-center gap-2 text-xs text-muted"><UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" /> Applying your edit…</span>
      </div>
      <UTextarea v-model="instruction" aria-label="Edit instruction" placeholder="Describe the change you want" :rows="2" :maxlength="500" class="w-full" :disabled="editing" @keydown.meta.enter.prevent="applyEdit" @keydown.ctrl.enter.prevent="applyEdit" />
      <div class="flex flex-wrap items-center gap-3">
        <UButton label="Apply edit" icon="i-lucide-wand-sparkles" :loading="editing" :disabled="editing || !instruction.trim() || !articleId" @click="applyEdit" />
        <UButton label="Clear selection" color="neutral" variant="ghost" :disabled="editing" @click="selection = null; instruction = ''" />
        <span class="text-xs text-muted">{{ articleId ? 'Only the selected text will change.' : 'Save the draft before editing selected text.' }}</span>
      </div>
      <p v-if="editError" role="alert" class="text-sm text-error">{{ editError }}</p>
      <p v-else-if="editNotice" role="status" class="text-sm text-success">{{ editNotice }}</p>
    </div>
    <p v-else-if="!preview && editNotice" role="status" class="mb-4 border-y border-default py-3 text-sm text-success">{{ editNotice }}</p>
    <UEditorToolbar v-if="!preview" :editor="editor" :items="items" aria-label="Article formatting" class="sticky top-0 z-10 flex-wrap border-y border-default bg-default py-2" />
  </UEditor>
</template>
