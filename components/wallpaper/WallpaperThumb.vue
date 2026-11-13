<script setup lang="ts">
import { WALLPAPER_HEIGHT, WALLPAPER_WIDTH, type WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperArtwork from '~/components/wallpaper/WallpaperArtwork.vue'
// A live miniature of a design with the selected player and the saved layout.
defineProps<{ model: WallpaperArtworkModel }>()
const frame = useTemplateRef('frame')
const width = ref(0)
const scale = computed(() => width.value / WALLPAPER_WIDTH)
let observer: ResizeObserver | undefined
onMounted(() => {
  if (!frame.value) return
  observer = new ResizeObserver(([entry]) => { width.value = entry!.contentRect.width })
  observer.observe(frame.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div ref="frame" class="relative w-full overflow-hidden" :style="{ aspectRatio: `${WALLPAPER_WIDTH} / ${WALLPAPER_HEIGHT}` }" aria-hidden="true" inert>
    <div class="absolute left-0 top-0 origin-top-left" :style="{ transform: `scale(${scale})` }">
      <WallpaperArtwork :model="model" />
    </div>
  </div>
</template>
