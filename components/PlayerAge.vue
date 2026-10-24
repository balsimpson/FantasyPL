<template>
  <span v-if="age !== null" class="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-current/20 font-sans font-medium leading-tight tracking-normal normal-case tabular-nums" :class="artwork ? 'px-3 py-1 text-[20px]' : compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-xs'" :aria-label="`Age ${age} years`">
    {{ age }} yrs
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{
  player?: { birth_date?: unknown; birthDate?: unknown };
  birthDate?: unknown;
  artwork?: boolean;
  compact?: boolean;
}>();
const age = usePlayerAge(() => props.birthDate ?? props.player?.birth_date ?? props.player?.birthDate);
</script>
