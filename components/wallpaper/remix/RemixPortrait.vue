<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import type { WallpaperPlayer } from '~/utils/wallpaper'
import { lightVector, type WallpaperRecipe } from '~/utils/wallpaper-remix'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'

// The cut-out photo, with an optional cast shadow on the backdrop behind it.
// The shadow is one drop-shadow filter on the photo, so it follows the silhouette exactly.
const props = defineProps<{ player: WallpaperPlayer; layout: SchedulerLayout; recipe: WallpaperRecipe }>()
const spec = computed(() => props.recipe.skeleton.portrait)
const photoStyle = computed(() => {
  const { shadow, light } = props.recipe.depth
  const v = lightVector(light)
  const c = props.recipe.colours
  const style: Record<string, string> = {}
  if (!props.layout.portrait?.flatDepth) {
    if (shadow === 'offset') style.filter = `drop-shadow(${Math.round(v.x * 34)}px ${Math.round(v.y * 28)}px 0 ${c.alt})`
    if (shadow === 'soft') style.filter = `drop-shadow(${Math.round(v.x * 44)}px ${Math.round(v.y * 38)}px 24px ${c.deep}b3)`
  }
  // A photo that stops above the bottom edge fades out, so the torso never ends in a hard line.
  const fade = spec.value.y + spec.value.size < 2360 ? Math.max(spec.value.fade, 30) : spec.value.fade
  if (fade) style.maskImage = style.WebkitMaskImage = `linear-gradient(to top, transparent, black ${fade}%)`
  return style
})
</script>

<template>
  <div
    v-scheduler-element="{ id: 'portrait', label: 'Player photo', layout }"
    class="wp-portrait absolute"
    data-wp-portrait
    :style="{ left: `${spec.x}px`, top: `${spec.y}px`, width: `${spec.size}px`, height: `${spec.size}px` }"
  >
    <SchedulerPlayerPhoto :player="player" class="h-full w-full text-[48px]" :style="photoStyle" />
  </div>
</template>
