<script setup lang="ts">
import type { SchedulerCaptionDraft } from '~/composables/useSchedulerCaptionDrafts'

defineProps<{ drafts: SchedulerCaptionDraft[]; storageError: string }>()
const emit = defineEmits<{ remove: [signature: string] }>()
const open = ref(false)
const copied = ref('')
const copyError = ref('')

async function copy(text: string, key: string) {
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(text)
    copied.value = key
  } catch {
    copyError.value = 'Could not copy the caption. Select the text and copy it.'
  }
}
</script>

<template>
  <USlideover v-model:open="open" title="Saved captions" description="Saved on this device. Review the details before reusing a caption.">
    <UButton label="Saved captions" icon="i-lucide-bookmark" color="neutral" variant="ghost" size="sm" />
    <template #body>
      <p v-if="storageError" class="mb-4 text-sm text-error" role="alert">{{ storageError }}</p>
      <p v-if="copyError" class="mb-4 text-sm text-error" role="alert">{{ copyError }}</p>
      <p v-if="!drafts.length" class="text-sm text-muted">No saved captions.</p>
      <section v-for="draft in drafts" :key="draft.signature" class="border-b border-default py-5 first:pt-0">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-semibold text-highlighted">{{ draft.playerName }}</h3>
            <p class="text-xs text-muted">{{ draft.gameweek ? `GW${draft.gameweek} · ` : '' }}{{ draft.storyLabel }}{{ draft.season ? ` · ${draft.season}` : '' }}</p>
          </div>
          <UButton label="Remove" color="neutral" variant="ghost" size="xs" :aria-label="`Remove saved captions for ${draft.playerName}`" @click="emit('remove', draft.signature)" />
        </div>
        <div v-for="item in [{ label: 'Instagram', text: draft.caption }, { label: 'X', text: draft.xCaption }].filter(item => item.text)" :key="item.label" class="mt-4">
          <div class="flex items-center justify-between gap-2">
            <h4 class="text-xs font-semibold text-muted">{{ item.label }}</h4>
            <UButton :label="copied === `${draft.signature}:${item.label}` ? 'Copied' : 'Copy'" icon="i-lucide-copy" color="neutral" variant="ghost" size="xs" :aria-label="`Copy ${item.label} caption for ${draft.playerName}`" @click="copy(item.text, `${draft.signature}:${item.label}`)" />
          </div>
          <p class="whitespace-pre-wrap break-words text-sm text-default">{{ item.text }}</p>
        </div>
      </section>
    </template>
  </USlideover>
</template>
