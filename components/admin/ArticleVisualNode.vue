<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3'
import type { ArticlePlayerSnapshot } from '~/shared/article-visuals'
defineProps(nodeViewProps)
</script>

<template>
  <NodeViewWrapper contenteditable="false" class="relative" :class="selected ? 'rounded-xl outline-2 outline-primary' : ''">
    <ArticlesPlayerVisual :player="node.attrs.player as ArticlePlayerSnapshot" :fixtures-only="node.type.name === 'fixtureRun'" />
    <UButton v-if="editor.isEditable && selected" label="Remove visual" icon="i-lucide-trash-2" color="error" variant="soft" size="xs" class="absolute right-2 top-2" @click="deleteNode" />
  </NodeViewWrapper>
</template>
