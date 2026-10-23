<script setup lang="ts">
import { formatInstagramStat, instagramStatLabel, type InstagramPlayer, type InstagramStatKey } from '~/utils/instagram-templates'
import { getInstagramStatSignals, getInstagramStatSignalColor } from '~/utils/instagram-designs'
const props = withDefaults(defineProps<{ player: InstagramPlayer, stats: InstagramStatKey[], columns?: 2 | 3 | 6, compact?: boolean, accent?: string }>(), { columns: 3, compact: false, accent: 'currentColor' })
const signals = computed(() => getInstagramStatSignals(props.player, props.stats))
</script>

<template>
  <dl class="grid" :class="columns === 2 ? 'grid-cols-2' : columns === 6 ? 'grid-cols-6' : 'grid-cols-3'" data-stat-grid>
    <div v-for="key in stats" :key="key" class="min-w-0 border-t border-current/25 px-5 py-4" :class="compact ? 'pb-2' : 'pb-5'">
      <dd class="font-[FPLNumbers] font-bold leading-[1.05] tabular-nums whitespace-nowrap" :class="compact ? 'text-[48px]' : columns === 2 ? 'text-[68px]' : 'text-[64px]'">{{ formatInstagramStat(player, key) }}</dd>
      <span v-if="signals[key]" aria-hidden="true" class="mt-2 block h-[3px] w-8 rounded-full" :style="{ backgroundColor: getInstagramStatSignalColor(signals[key], accent) }" />
      <dt class="mt-1 text-[23px] font-medium leading-tight">{{ instagramStatLabel(key) }}</dt>
    </div>
  </dl>
</template>
