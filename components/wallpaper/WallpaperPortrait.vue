<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import type { WallpaperPlayer } from '~/utils/wallpaper'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'
// A contained, bottom-aligned portrait. The optional fade blends the shirt into the field.
defineProps<{ player: WallpaperPlayer; layout: SchedulerLayout; fade?: string; fadeHeight?: number }>()
</script>

<template>
  <div v-scheduler-element="{ id: 'portrait', label: 'Player photo', layout }" class="wp-portrait" data-wp-portrait>
    <SchedulerPlayerPhoto :player="player" class="h-full w-full text-[48px]" />
    <div v-if="fade" data-wp-fade aria-hidden="true" class="pointer-events-none absolute inset-x-0 bottom-0" :style="{ height: `${fadeHeight ?? 34}%`, backgroundImage: `linear-gradient(to bottom, transparent, ${fade} 92%)` }" />
  </div>
</template>
