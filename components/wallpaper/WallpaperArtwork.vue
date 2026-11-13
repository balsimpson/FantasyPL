<script setup lang="ts">
import { customWallpaperColours, type WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperBackdrop from '~/components/wallpaper/WallpaperBackdrop.vue'
import WallpaperRoyal from '~/components/wallpaper/designs/WallpaperRoyal.vue'
import WallpaperPoster from '~/components/wallpaper/designs/WallpaperPoster.vue'
import WallpaperGallery from '~/components/wallpaper/designs/WallpaperGallery.vue'
import WallpaperHalftone from '~/components/wallpaper/designs/WallpaperHalftone.vue'
import WallpaperFloodlit from '~/components/wallpaper/designs/WallpaperFloodlit.vue'
import WallpaperSplit from '~/components/wallpaper/designs/WallpaperSplit.vue'
// Fixed 1080 × 2400 artwork. Preview, thumbnails and export all render this component.
const props = defineProps<{ model: WallpaperArtworkModel }>()
const designs = { royal: WallpaperRoyal, poster: WallpaperPoster, gallery: WallpaperGallery, halftone: WallpaperHalftone, floodlit: WallpaperFloodlit, split: WallpaperSplit }
const backdrop = computed(() => props.model.backdrop ?? props.model.design)
const backdropColours = computed(() => backdrop.value === props.model.design
  ? props.model.colours
  : customWallpaperColours(backdrop.value, props.model.colours.field))
</script>

<template>
  <article
    class="relative isolate h-[2400px] w-[1080px] overflow-hidden font-sans"
    :style="{ backgroundColor: model.colours.field, color: model.colours.ink }"
    :aria-label="`${model.player.fullName} wallpaper`"
    :data-wallpaper-artwork="model.design"
  >
    <WallpaperBackdrop v-if="backdrop !== 'poster'" :design="backdrop" :c="backdropColours" :layout="model.layout" />
    <component :is="designs[model.design]" :model="model" />
  </article>
</template>
