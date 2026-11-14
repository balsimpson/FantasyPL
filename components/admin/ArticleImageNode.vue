<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import type { ArticleImage } from '~/shared/article-images'
const props = defineProps(nodeViewProps)
// The body editor listens for this event and opens the photo dialog for this node.
function request(action: 'replace' | 'details') {
  const pos = props.getPos()
  if (typeof pos !== 'number') return
  props.editor.view.dom.dispatchEvent(new CustomEvent('article-image-action', { bubbles: true, detail: { action, pos } }))
}
</script>

<template>
  <NodeViewWrapper contenteditable="false" class="relative max-w-[68ch]" :class="selected ? 'rounded-md outline-2 outline-offset-4 outline-primary' : ''" data-article-image>
    <ArticlesArticleImage :image="node.attrs as ArticleImage" eager />
    <div v-if="editor.isEditable" class="absolute right-2 top-2 flex gap-1 transition-opacity" :class="selected ? 'visible opacity-100' : 'invisible opacity-0'">
      <UButton label="Replace" icon="i-lucide-image" color="neutral" variant="solid" size="xs" @click="request('replace')" />
      <UButton label="Caption" icon="i-lucide-type" color="neutral" variant="solid" size="xs" @click="request('details')" />
      <UButton icon="i-lucide-trash-2" color="error" variant="solid" size="xs" aria-label="Remove photo" @click="deleteNode" />
    </div>
  </NodeViewWrapper>
</template>
