<template>
  <span v-if="cards.length" class="inline-flex shrink-0 items-center gap-1.5">
    <span
      v-for="card in cards"
      :key="card.color"
      role="img"
      :aria-label="card.label"
      :title="card.label"
      class="inline-flex items-center justify-center rounded-[2px] font-black tabular-nums ring-1 ring-black/25 shadow-md"
      :class="[compact ? 'h-5 min-w-3.5 px-0.5 text-[0.6rem]' : 'h-8 min-w-6 px-1 text-xs', card.color === 'yellow' ? 'bg-yellow-300 text-stone-950' : 'bg-red-600 text-white']"
    >
      {{ card.count }}
    </span>
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ yellowCards?: number | string; redCards?: number | string; compact?: boolean }>();
const cards = computed(() => [
  { color: 'yellow', count: Number(props.yellowCards) },
  { color: 'red', count: Number(props.redCards) },
].filter((card) => Number.isInteger(card.count) && card.count > 0)
  .map((card) => ({ ...card, label: `${card.count} ${card.color} card${card.count === 1 ? '' : 's'} this season` })));
</script>
