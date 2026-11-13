<script setup lang="ts">
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperRoyal from '~/components/wallpaper/designs/WallpaperRoyal.vue'
import WallpaperPoster from '~/components/wallpaper/designs/WallpaperPoster.vue'
import WallpaperGallery from '~/components/wallpaper/designs/WallpaperGallery.vue'
import WallpaperHalftone from '~/components/wallpaper/designs/WallpaperHalftone.vue'
import WallpaperFloodlit from '~/components/wallpaper/designs/WallpaperFloodlit.vue'
import WallpaperSplit from '~/components/wallpaper/designs/WallpaperSplit.vue'
// Fixed 1080 × 2400 artwork. Preview, thumbnails, depth layer and export all render this component.
defineProps<{ model: WallpaperArtworkModel; portraitOnly?: boolean }>()
const designs = { royal: WallpaperRoyal, poster: WallpaperPoster, gallery: WallpaperGallery, halftone: WallpaperHalftone, floodlit: WallpaperFloodlit, split: WallpaperSplit }
</script>

<template>
  <article
    class="relative h-[2400px] w-[1080px] overflow-hidden font-sans"
    :class="{ 'wp-portrait-only': portraitOnly }"
    :style="{ backgroundColor: model.colours.field, color: model.colours.ink }"
    :aria-label="`${model.player.fullName} wallpaper`"
    :aria-hidden="portraitOnly || undefined"
    :data-wallpaper-artwork="portraitOnly ? undefined : model.design"
  >
    <component :is="designs[model.design]" :model="model" />
  </article>
</template>
