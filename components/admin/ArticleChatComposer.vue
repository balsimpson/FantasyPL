<script setup lang="ts">
// Bottom-anchored composer for whole-article guidance. Its height never changes, so typing,
// sending and status updates do not move the article.
const props = defineProps<{ busy: boolean; disabled: boolean; disabledReason?: string; status: string; statusTone: 'muted' | 'success' | 'error'; canUndo: boolean }>()
const emit = defineEmits<{ send: [instruction: string]; undo: [] }>()
const message = ref('')
const suggestions = ['Add two photos', 'Add a short checklist at the end', 'Make the intro punchier', 'Simplify the language for new managers']

function send(value = message.value) {
  const text = value.trim()
  if (!text || props.busy || props.disabled) return
  emit('send', text)
  message.value = ''
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    send()
  }
}
</script>

<template>
  <div class="sticky -bottom-4 z-20 border-t border-default bg-default pb-4 pt-2 sm:-bottom-6 sm:pb-6">
    <div class="flex h-6 items-center justify-between gap-3 text-xs" role="status" aria-live="polite">
      <span class="flex min-w-0 items-center gap-2" :class="statusTone === 'error' ? 'text-error' : statusTone === 'success' ? 'text-success' : 'text-muted'">
        <UIcon v-if="busy" name="i-lucide-loader-circle" class="size-3.5 shrink-0 animate-spin" />
        <span class="truncate">{{ status }}</span>
      </span>
      <UButton v-if="canUndo" label="Undo revision" icon="i-lucide-undo-2" color="neutral" variant="link" size="xs" class="shrink-0 px-0" @click="emit('undo')" />
    </div>
    <form class="mt-1 border border-default bg-default shadow-lg focus-within:border-primary" @submit.prevent="send()">
      <label for="article-chat" class="sr-only">Guidance for the whole article</label>
      <textarea id="article-chat" v-model="message" rows="2" maxlength="1000" class="block h-16 w-full resize-none bg-transparent px-3 pt-3 text-sm leading-5 text-highlighted outline-none placeholder:text-dimmed" :placeholder="disabled ? (disabledReason || 'Switch to editing to ask for changes') : 'Ask for changes to the whole article…'" :disabled="busy || disabled" @keydown="onKeydown" />
      <div class="flex h-10 items-center gap-1 px-2">
        <div class="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          <UButton v-for="item in suggestions" :key="item" :label="item" color="neutral" variant="ghost" size="xs" class="shrink-0 text-muted" :disabled="busy || disabled" @click="send(item)" />
        </div>
        <UButton type="submit" icon="i-lucide-arrow-up" size="sm" aria-label="Send guidance" class="shrink-0" :loading="busy" :disabled="!message.trim() || busy || disabled" />
      </div>
    </form>
  </div>
</template>
