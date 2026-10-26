<template>
  <USlideover title="Leagues" :description="managerName" :ui="{ content: 'bg-[#101216] divide-white/10 ring-white/10', title: 'text-white', description: 'text-stone-400', overlay: 'bg-black/70', body: 'min-w-0', close: 'bg-transparent text-stone-300 hover:bg-lime-300/10 hover:text-lime-200 focus-visible:bg-lime-300/10 focus-visible:outline-2 focus-visible:outline-lime-300' }">
    <UButton icon="i-lucide-trophy" color="neutral" variant="ghost" size="sm" class="size-9 justify-center rounded-full border border-white/10 bg-white/[0.04] p-0 text-stone-300 hover:border-lime-300/30 hover:bg-lime-300/10 hover:text-lime-200 focus-visible:bg-lime-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300" aria-label="View leagues" title="View leagues" />
    <template #body><ManagerLeagueStandings :leagues="leagues" /></template>
  </USlideover>
</template>

<script setup>
defineProps({ leagues: { type: Array, default: () => [] }, managerName: { type: String, required: true } });
</script>
