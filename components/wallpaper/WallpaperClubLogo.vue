<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import type { WallpaperPlayer } from '~/utils/wallpaper'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'

defineProps<{ player: WallpaperPlayer; layout: SchedulerLayout }>()
</script>

<template>
  <div v-scheduler-element="{ id: 'brand', label: 'Club logo', layout }" class="size-[88px]">
    <SchedulerArtworkAsset :key="player.clubCode" :src="player.crestUrl" :label="`${player.club} logo`" decorative class="size-full" />
  </div>
</template>
