<template>
  <UButton
    type="button"
    :icon="direction === 'previous' ? 'i-lucide-chevron-left' : 'i-lucide-chevron-right'"
    color="neutral"
    variant="ghost"
    size="sm"
    class="size-8 shrink-0 justify-center rounded-lg border border-white/10 bg-white/[0.04] p-0 text-stone-300 ring-0 transition-colors enabled:hover:border-lime-300/30 enabled:hover:bg-lime-300/10 enabled:hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 disabled:opacity-40 motion-reduce:transition-none"
  />
</template>

<script setup lang="ts">
defineProps<{ direction: "previous" | "next" }>();
</script>
