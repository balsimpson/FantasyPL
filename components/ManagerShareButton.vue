<script setup lang="ts">
import { useManagerShare } from '~/composables/useManagerShare'

const props = defineProps<{ title: string; url: string }>()
const { sharing, copied, showCopyDialog, share, copyLink } = useManagerShare(() => ({ title: props.title, url: props.url }))
function selectLink(event: FocusEvent) {
  (event.target as HTMLInputElement).select()
}
</script>

<template>
  <UButton
    :icon="copied ? 'i-lucide-check' : 'i-lucide-share-2'"
    :aria-label="copied ? 'Link copied' : 'Share team'"
    :title="copied ? 'Link copied' : 'Share team'"
    :loading="sharing" color="neutral" variant="ghost" size="sm"
    class="size-9 justify-center rounded-full border border-white/10 bg-white/[0.04] p-0 hover:border-primary/40 hover:bg-white/[0.08] hover:text-white"
    :class="copied ? 'text-primary' : 'text-stone-300'" @click="share"
  />
  <span class="sr-only" role="status">{{ copied ? 'Link copied' : '' }}</span>
  <UModal v-model:open="showCopyDialog" title="Copy link">
    <template #body>
      <div class="grid gap-3">
        <UInput :model-value="url" aria-label="Manager page link" readonly class="w-full" :ui="{ base: 'w-full' }" @focus="selectLink" />
        <UButton label="Copy link" icon="i-lucide-copy" class="w-full justify-center" @click="copyLink" />
      </div>
    </template>
  </UModal>
</template>
