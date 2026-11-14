<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'
import type { Editor } from '@tiptap/core'
import { articleAtomTypes, type ArticleNode } from '~/shared/articles'
import type { ArticleImage } from '~/shared/article-images'
import { parseInlineMarkdown } from '~/shared/article-revision'
import { articleVisualExtensions, assistRangeKey } from '~/utils/article-editor-extensions'

const body = defineModel<ArticleNode>({ required: true })
const props = defineProps<{ preview?: boolean; locked?: boolean; articleId: string; title?: string }>()
const emit = defineEmits<{ notice: [message: string]; error: [message: string] }>()

const root = ref<HTMLElement | null>(null)
const editorComponent = ref<{ editor?: Editor } | null>(null)
const assist = ref<InstanceType<typeof import('./ArticleSelectionAssist.vue').default> | null>(null)
const selection = ref<{ from: number; to: number; text: string } | null>(null)
const assistPosition = ref({ top: 0, left: 0, width: 360 })
const editing = ref(false)
const pointerSelecting = ref(false)
const linkTargets = ref<{ kind: 'article' | 'player'; title: string; url: string }[]>([])
const linkTargetsLoading = ref(false)
const linkTargetsError = ref('')
const imagePicker = ref<{ open: boolean; mode: 'insert' | 'replace' | 'details'; pos: number | null; initial: ArticleImage | null }>({ open: false, mode: 'insert', pos: null, initial: null })
let currentEditor: Editor | undefined
const atomTypes = new Set<string>(articleAtomTypes)
const showAssist = computed(() => !props.preview && !!selection.value && !pointerSelecting.value)

const items: EditorToolbarItem[][] = [
  [{ kind: 'undo', icon: 'i-lucide-undo-2', 'aria-label': 'Undo', tooltip: { text: 'Undo' } }, { kind: 'redo', icon: 'i-lucide-redo-2', 'aria-label': 'Redo', tooltip: { text: 'Redo' } }],
  [{ kind: 'heading', level: 2, icon: 'i-lucide-heading-2', 'aria-label': 'Heading 2', tooltip: { text: 'Heading 2' } }, { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', 'aria-label': 'Heading 3', tooltip: { text: 'Heading 3' } }],
  [{ kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', 'aria-label': 'Bold', tooltip: { text: 'Bold' } }, { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', 'aria-label': 'Italic', tooltip: { text: 'Italic' } }, { kind: 'link', icon: 'i-lucide-link', 'aria-label': 'Add or remove link', tooltip: { text: 'Add or remove link' } }],
  [{ kind: 'bulletList', icon: 'i-lucide-list', 'aria-label': 'Bullet list', tooltip: { text: 'Bullet list' } }, { kind: 'orderedList', icon: 'i-lucide-list-ordered', 'aria-label': 'Numbered list', tooltip: { text: 'Numbered list' } }, { kind: 'blockquote', icon: 'i-lucide-text-quote', 'aria-label': 'Quote', tooltip: { text: 'Quote' } }],
]

function setHighlight(range: { from: number; to: number } | null) {
  const editor = currentEditor
  if (!editor || editor.isDestroyed) return
  editor.view.dispatch(editor.state.tr.setMeta(assistRangeKey, range).setMeta('addToHistory', false))
}

function placeAssist() {
  const editor = currentEditor
  const target = selection.value
  if (!editor || !target || !root.value) return
  const rootRect = root.value.getBoundingClientRect()
  const start = editor.view.coordsAtPos(target.from)
  const end = editor.view.coordsAtPos(target.to)
  const width = Math.min(380, rootRect.width)
  const left = Math.min(Math.max(start.left - rootRect.left, 0), Math.max(rootRect.width - width, 0))
  assistPosition.value = { top: Math.max(end.bottom, start.bottom) - rootRect.top + 10, left, width }
}

function closeAssist() {
  if (editing.value) return
  selection.value = null
  setHighlight(null)
  assist.value?.reset()
}

function updateSelection({ editor }: { editor: Editor }) {
  currentEditor = editor
  if (editing.value) return
  const { from, to, empty } = editor.state.selection
  if (empty || props.preview) { if (selection.value) closeAssist(); return }
  let hasAtom = false
  editor.state.doc.nodesBetween(from, to, node => { if (atomTypes.has(node.type.name)) hasAtom = true })
  const text = editor.state.doc.textBetween(from, to, '\n').trim()
  if (!text || text.length > 3000 || hasAtom) { if (selection.value) closeAssist(); return }
  const changed = selection.value?.from !== from || selection.value?.to !== to
  selection.value = { from, to, text }
  if (changed) assist.value?.reset()
  setHighlight({ from, to })
  nextTick(placeAssist)
}

function attachEditor(editor: Editor) {
  currentEditor = editor
  editor.setEditable(!props.preview && !props.locked)
  const dom = editor.view.dom
  dom.addEventListener('pointerdown', () => { pointerSelecting.value = true })
  dom.addEventListener('article-image-action', ((event: CustomEvent<{ action: 'replace' | 'details'; pos: number }>) => {
    const node = editor.state.doc.nodeAt(event.detail.pos)
    if (node?.type.name !== 'image') return
    imagePicker.value = { open: true, mode: event.detail.action, pos: event.detail.pos, initial: { ...node.attrs } as ArticleImage }
  }) as EventListener)
}
function endPointerSelection() {
  if (!pointerSelecting.value) return
  pointerSelecting.value = false
  if (selection.value) nextTick(placeAssist)
}

async function loadLinkTargets() {
  if (linkTargets.value.length || linkTargetsLoading.value) return
  linkTargetsLoading.value = true
  linkTargetsError.value = ''
  try { linkTargets.value = await $fetch('/api/admin/articles/link-targets') }
  catch { linkTargetsError.value = 'Internal links could not be loaded. Your article is unchanged.' }
  finally { linkTargetsLoading.value = false }
}

function insertInternalLink(target: { title: string; url: string }) {
  const editor = currentEditor
  const selected = selection.value
  if (!editor || !selected) return
  editor.chain().focus().setTextSelection({ from: selected.from, to: selected.to }).setLink({ href: target.url }).run()
  closeAssist()
  emit('notice', `Linked to ${target.title}.`)
}

async function requestEdit(instruction: string) {
  const target = selection.value
  const editor = currentEditor
  if (!target || !editor || editing.value || !props.articleId) return
  editing.value = true
  assist.value?.begin()
  editor.setEditable(false)
  try {
    const doc = editor.state.doc
    const context = doc.textBetween(Math.max(0, target.from - 800), Math.min(doc.content.size, target.to + 800), '\n')
    const result = await $fetch<{ replacementText: string }>(`/api/admin/articles/${props.articleId}/edit`, {
      method: 'POST',
      body: { selectedText: target.text, instruction, title: props.title || '', context },
    })
    assist.value?.finish({ text: result.replacementText.trim() })
  } catch (cause: any) {
    assist.value?.finish({ error: cause.data?.statusMessage || cause.message || 'The highlighted text could not be edited. Your article is unchanged.' })
  } finally {
    editing.value = false
    editor.setEditable(!props.preview && !props.locked)
  }
}

function applySuggestion(text: string) {
  const target = selection.value
  const editor = currentEditor
  if (!target || !editor) return
  if (editor.state.doc.textBetween(target.from, target.to, '\n').trim() !== target.text) {
    assist.value?.finish({ error: 'The highlighted text changed. Highlight it again and retry.' })
    return
  }
  const sameBlock = editor.state.doc.resolve(target.from).sameParent(editor.state.doc.resolve(target.to))
  const content = sameBlock
    ? parseInlineMarkdown(text.replace(/\s*\n{2,}\s*/g, ' '))
    : text.split(/\n{2,}/).filter(part => part.trim()).map(part => ({ type: 'paragraph', content: parseInlineMarkdown(part.trim()) }))
  if (!content.length) return
  editor.chain().focus().insertContentAt({ from: target.from, to: target.to }, content).run()
  closeAssist()
  emit('notice', 'Text replaced. Undo with ⌘Z / Ctrl+Z.')
}

function openImagePicker() {
  imagePicker.value = { open: true, mode: 'insert', pos: null, initial: null }
}

function placeImage(image: ArticleImage) {
  const editor = currentEditor
  if (!editor) return
  const { mode, pos } = imagePicker.value
  if (mode !== 'insert' && pos !== null && editor.state.doc.nodeAt(pos)?.type.name === 'image') {
    editor.chain().focus().command(({ tr }) => { tr.setNodeMarkup(pos, undefined, { ...image }); return true }).run()
    emit('notice', mode === 'details' ? 'Caption updated.' : 'Photo replaced.')
    return
  }
  // Insert after the block that holds the cursor, so a photo never splits a paragraph.
  const { $from } = editor.state.selection
  const at = $from.depth > 0 ? $from.after(1) : editor.state.selection.from
  editor.chain().focus().insertContentAt(at, { type: 'image', attrs: { ...image } }).run()
  emit('notice', 'Photo added.')
}

// UEditor only reads `editable` on creation, so keep it in sync here.
watch(() => editorComponent.value?.editor, (editor, previous) => { if (editor && editor !== previous) attachEditor(editor) }, { immediate: true })
watch(() => [props.preview, props.locked], () => {
  if (props.preview || props.locked) closeAssist()
  if (currentEditor && !editing.value) currentEditor.setEditable(!props.preview && !props.locked)
})
onMounted(() => {
  window.addEventListener('pointerup', endPointerSelection)
  window.addEventListener('resize', placeAssist)
})
onBeforeUnmount(() => {
  window.removeEventListener('pointerup', endPointerSelection)
  window.removeEventListener('resize', placeAssist)
})
</script>

<template>
  <div ref="root" class="relative">
    <UEditor v-slot="{ editor }" v-model="body" :editable="!preview && !locked" ref="editorComponent" :on-selection-update="updateSelection" :extensions="articleVisualExtensions" :image="false" :mention="false" :starter-kit="{ heading: { levels: [2, 3] }, codeBlock: false, code: false }" :editor-props="{ attributes: { 'aria-label': preview ? 'Article preview' : 'Article body', role: preview ? 'document' : 'textbox', 'aria-multiline': preview ? undefined : 'true' } }" class="w-full" :ui="{ base: 'min-h-96 px-0 py-6 text-base break-words sm:px-0', content: 'min-w-0' }">
      <div class="sticky top-0 z-10 flex h-12 items-center gap-2 border-y border-default bg-default" :class="preview ? 'invisible' : ''" :aria-hidden="preview">
        <UEditorToolbar :editor="editor" :items="items" aria-label="Article formatting" class="min-w-0 flex-1 flex-nowrap overflow-x-auto" />
        <UButton label="Photo" icon="i-lucide-image-plus" color="neutral" variant="ghost" size="sm" class="shrink-0" :disabled="preview || locked" @click="openImagePicker" />
      </div>
    </UEditor>
    <AdminArticleSelectionAssist
      v-if="showAssist && selection"
      ref="assist"
      :text="selection.text"
      :top="assistPosition.top"
      :left="assistPosition.left"
      :width="assistPosition.width"
      :can-edit="!!articleId"
      :link-targets="linkTargets"
      :link-targets-loading="linkTargetsLoading"
      :link-targets-error="linkTargetsError"
      @close="closeAssist"
      @request="requestEdit"
      @apply="applySuggestion"
      @link="insertInternalLink"
      @load-links="loadLinkTargets"
    />
    <AdminArticleImagePicker v-model:open="imagePicker.open" :mode="imagePicker.mode" :initial="imagePicker.initial" @select="placeImage" />
  </div>
</template>

<style>
.article-assist-range { background: color-mix(in oklab, var(--ui-primary) 28%, transparent); border-radius: 2px; }
</style>
