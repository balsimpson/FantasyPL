<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import type { WallpaperPlayer } from '~/utils/wallpaper'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'
// Fade the photo itself so the artwork underneath shows through.
defineProps<{ player: WallpaperPlayer; layout: SchedulerLayout; fadeHeight?: number }>()
</script>

<template>
  <div v-scheduler-element="{ id: 'portrait', label: 'Player photo', layout }" class="wp-portrait" data-wp-portrait>
    <SchedulerPlayerPhoto :player="player" class="h-full w-full text-[48px]" :style="fadeHeight ? { maskImage: `linear-gradient(to top, transparent, black ${fadeHeight}%)` } : undefined" />
  </div>
</template>
