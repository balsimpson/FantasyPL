<script setup lang="ts">
// Floating panel for the highlighted text. It overlays the article, so opening, loading
// and showing a suggestion never move the content underneath.
const props = defineProps<{ text: string; top: number; left: number; width: number; canEdit: boolean; linkTargets: { kind: 'article' | 'player'; title: string; url: string }[]; linkTargetsLoading: boolean; linkTargetsError: string }>()
const emit = defineEmits<{ close: []; request: [instruction: string]; apply: [text: string]; link: [target: { title: string; url: string }]; loadLinks: [] }>()
const instruction = ref('')
const lastInstruction = ref('')
const view = ref<'ask' | 'link'>('ask')
const loading = ref(false)
const suggestion = ref('')
const error = ref('')
const linkSearch = ref('')
const input = ref<{ inputRef?: HTMLInputElement } | null>(null)
const quickActions = ['Tighten', 'Simplify', 'Make it punchier', 'Fix grammar']
const matchingTargets = computed(() => {
  const term = linkSearch.value.trim().toLocaleLowerCase()
  return props.linkTargets.filter(target => !term || target.title.toLocaleLowerCase().includes(term)).slice(0, 30)
})

watch(() => props.text, () => { suggestion.value = ''; error.value = ''; view.value = 'ask' })

function submit(value = instruction.value) {
  const text = value.trim()
  if (!text || loading.value || !props.canEdit) return
  lastInstruction.value = text
  emit('request', text)
}
function showLinks() {
  view.value = 'link'
  emit('loadLinks')
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); emit('close') }
}
defineExpose({
  begin() { loading.value = true; error.value = ''; suggestion.value = '' },
  finish(result: { text?: string; error?: string }) { loading.value = false; suggestion.value = result.text || ''; error.value = result.error || '' },
  reset() { loading.value = false; suggestion.value = ''; error.value = ''; instruction.value = ''; view.value = 'ask' },
  focus() { nextTick(() => input.value?.inputRef?.focus()) },
})
</script>

<template>
  <div class="absolute z-30 border border-default bg-default shadow-xl" :style="{ top: `${top}px`, left: `${left}px`, width: `${width}px` }" role="dialog" aria-label="Edit highlighted text" @keydown="onKeydown" @mousedown.stop>
    <div class="flex items-center justify-between gap-2 border-b border-default px-3 py-2">
      <p class="min-w-0 truncate text-xs text-muted">“{{ text }}”</p>
      <div class="flex shrink-0 items-center">
        <UButton :icon="view === 'link' ? 'i-lucide-wand-sparkles' : 'i-lucide-link-2'" :aria-label="view === 'link' ? 'Back to edit' : 'Link to an article or player'" color="neutral" variant="ghost" size="xs" @click="view === 'link' ? view = 'ask' : showLinks()" />
        <UButton icon="i-lucide-x" aria-label="Close" color="neutral" variant="ghost" size="xs" @click="emit('close')" />
      </div>
    </div>

    <div v-if="view === 'link'" class="p-3">
      <UInput v-model="linkSearch" aria-label="Search internal links" placeholder="Search articles or players" icon="i-lucide-search" size="sm" class="w-full" autofocus />
      <div class="mt-2 h-48 overflow-y-auto">
        <p v-if="linkTargetsLoading" role="status" class="p-2 text-sm text-muted">Loading pages…</p>
        <p v-else-if="linkTargetsError" role="alert" class="p-2 text-sm text-error">{{ linkTargetsError }}</p>
        <p v-else-if="!matchingTargets.length" class="p-2 text-sm text-muted">No matching pages.</p>
        <button v-for="target in matchingTargets" v-else :key="target.url" type="button" class="flex w-full items-baseline justify-between gap-3 px-2 py-1.5 text-left text-sm hover:bg-elevated" @click="emit('link', target)">
          <span class="min-w-0 truncate text-default">{{ target.title }}</span><span class="shrink-0 text-xs text-muted">{{ target.kind === 'article' ? 'Article' : 'Player' }}</span>
        </button>
      </div>
    </div>

    <div v-else class="p-3">
      <div v-if="suggestion" class="space-y-3">
        <p class="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-highlighted">{{ suggestion }}</p>
        <div class="flex flex-wrap gap-2">
          <UButton label="Replace" icon="i-lucide-check" size="sm" @click="emit('apply', suggestion)" />
          <UButton label="Try again" icon="i-lucide-refresh-cw" color="neutral" variant="outline" size="sm" @click="submit(lastInstruction)" />
          <UButton label="Discard" color="neutral" variant="ghost" size="sm" @click="suggestion = ''" />
        </div>
      </div>
      <template v-else>
        <form class="flex items-center gap-2" @submit.prevent="submit()">
          <UInput ref="input" v-model="instruction" aria-label="What should change?" :placeholder="canEdit ? 'What should change?' : 'Save the draft to edit with AI'" size="sm" class="w-full" :maxlength="500" :disabled="loading || !canEdit" />
          <UButton type="submit" icon="i-lucide-arrow-up" size="sm" aria-label="Rewrite highlighted text" :loading="loading" :disabled="!instruction.trim() || !canEdit" />
        </form>
        <div class="mt-2 flex h-7 items-center gap-1 overflow-x-auto">
          <span v-if="loading" role="status" class="flex items-center gap-2 text-xs text-muted"><UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" /> Rewriting…</span>
          <template v-else>
            <UButton v-for="action in quickActions" :key="action" :label="action" color="neutral" variant="soft" size="xs" class="shrink-0" :disabled="!canEdit" @click="submit(action)" />
          </template>
        </div>
        <p v-if="error" role="alert" class="mt-2 text-xs text-error">{{ error }}</p>
      </template>
    </div>
  </div>
</template>
