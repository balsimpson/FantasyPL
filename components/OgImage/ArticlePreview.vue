<script setup lang="ts">
defineProps<{
  title: string
  category: string
  season?: string
  gameweek?: number | null
}>()

useHead({ style: [], link: [] })
</script>

<template>
  <div class="relative flex h-[630px] w-[1200px] flex-col justify-between overflow-hidden bg-[#10241c] p-[56px] text-[#f5f5f0]">
    <div class="flex items-center justify-between text-[24px]">
      <span class="font-bold text-[#bef264]">FPL Insights</span>
      <span>FPL articles and guides</span>
    </div>
    <div class="flex flex-col">
      <div class="mb-[22px] flex text-[22px] font-bold uppercase tracking-[3px] text-[#bef264]">{{ category }}</div>
      <div :class="title.length > 130 ? 'text-[44px]' : title.length > 85 ? 'text-[52px]' : 'text-[64px]'" class="flex font-bold leading-[1.12] tracking-[-1px]">{{ title }}</div>
    </div>
    <div class="flex items-center justify-between border-t border-[#42604c] pt-[24px] text-[22px]">
      <span>sportsync.in</span>
      <div class="flex gap-[20px]">
        <span v-if="gameweek">Gameweek {{ gameweek }}</span>
        <span v-if="season">{{ season }}</span>
      </div>
    </div>
  </div>
</template>
