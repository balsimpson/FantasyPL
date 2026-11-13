<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import type { WallpaperPlayer } from '~/utils/wallpaper'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
// Small, discreet identity: club crest and the site mark. It never competes with the player.
withDefaults(defineProps<{ player: WallpaperPlayer; layout: SchedulerLayout; season?: string | null; align?: 'left' | 'right' | 'center' }>(), { align: 'left', season: null })
</script>

<template>
  <div v-scheduler-element="{ id: 'brand', label: 'Crest and mark', layout }" class="wp-numbers flex items-center gap-4 text-[28px] font-semibold uppercase tracking-[0.26em]" :class="{ 'flex-row-reverse': align === 'right', 'justify-center': align === 'center' }">
    <SchedulerArtworkAsset :src="player.crestUrl" :label="`${player.club} crest`" decorative class="h-[64px] w-[64px] shrink-0" />
    <span class="whitespace-nowrap opacity-85">FPL Insights<template v-if="season"> · {{ season }}</template></span>
  </div>
</template>
