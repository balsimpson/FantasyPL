<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'
import type { ArticleNode } from '~/shared/articles'
import { articleVisualExtensions } from '~/utils/article-editor-extensions'
const body = defineModel<ArticleNode>({ required: true })
defineProps<{ preview?: boolean }>()
const items: EditorToolbarItem[][] = [
  [{ kind: 'undo', icon: 'i-lucide-undo-2', 'aria-label': 'Undo', tooltip: { text: 'Undo' } }, { kind: 'redo', icon: 'i-lucide-redo-2', 'aria-label': 'Redo', tooltip: { text: 'Redo' } }],
  [{ kind: 'heading', level: 2, icon: 'i-lucide-heading-2', 'aria-label': 'Heading 2', tooltip: { text: 'Heading 2' } }, { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', 'aria-label': 'Heading 3', tooltip: { text: 'Heading 3' } }],
  [{ kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', 'aria-label': 'Bold', tooltip: { text: 'Bold' } }, { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', 'aria-label': 'Italic', tooltip: { text: 'Italic' } }, { kind: 'link', icon: 'i-lucide-link', 'aria-label': 'Add or remove link', tooltip: { text: 'Add or remove link' } }],
  [{ kind: 'bulletList', icon: 'i-lucide-list', 'aria-label': 'Bullet list', tooltip: { text: 'Bullet list' } }, { kind: 'orderedList', icon: 'i-lucide-list-ordered', 'aria-label': 'Numbered list', tooltip: { text: 'Numbered list' } }, { kind: 'blockquote', icon: 'i-lucide-text-quote', 'aria-label': 'Quote', tooltip: { text: 'Quote' } }],
]
</script>

<template>
  <UEditor :key="preview ? 'preview' : 'write'" v-slot="{ editor }" v-model="body" :editable="!preview" :extensions="articleVisualExtensions" :image="false" :mention="false" :starter-kit="{ heading: { levels: [2, 3] }, codeBlock: false, code: false }" :editor-props="{ attributes: { 'aria-label': preview ? 'Article preview' : 'Article body', role: preview ? 'document' : 'textbox', 'aria-multiline': preview ? undefined : 'true' } }" class="w-full" :ui="{ base: 'min-h-96 px-0 py-6 text-base break-words sm:px-0', content: 'min-w-0' }">
    <UEditorToolbar v-if="!preview" :editor="editor" :items="items" aria-label="Article formatting" class="sticky top-0 z-10 flex-wrap border-y border-default bg-default py-2" />
  </UEditor>
</template>
