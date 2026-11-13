<script setup lang="ts">
import { WALLPAPER_HEIGHT, WALLPAPER_WIDTH, type WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperArtwork from '~/components/wallpaper/WallpaperArtwork.vue'
// A live miniature of a design with the selected player and the saved layout.
const props = defineProps<{ model: WallpaperArtworkModel; width: number }>()
const scale = computed(() => props.width / WALLPAPER_WIDTH)
</script>

<template>
  <div class="relative overflow-hidden" :style="{ width: `${width}px`, height: `${Math.round(WALLPAPER_HEIGHT * scale)}px` }" aria-hidden="true" inert>
    <div class="absolute left-0 top-0 origin-top-left" :style="{ transform: `scale(${scale})` }">
      <WallpaperArtwork :model="model" />
    </div>
  </div>
</template>
