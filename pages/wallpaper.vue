<script setup lang="ts">
import '~/assets/css/wallpaper-artwork.css'
import { useWallpaperStudio } from '~/composables/useWallpaperStudio'
import WallpaperStudio from '~/components/wallpaper/WallpaperStudio.vue'
import WallpaperRemixSheet from '~/components/wallpaper/WallpaperRemixSheet.vue'

const studio = useWallpaperStudio()
const { status, error, refresh } = await studio.request
const route = useRoute()
const canonical = useCanonicalUrl('/wallpaper')
useHead({ link: [{ rel: 'canonical', href: canonical }] })
useSeoMeta({
  title: 'FPL Player Wallpapers for iPhone and Android',
  description: 'Make a phone wallpaper of your favourite Fantasy Premier League player with live season stats. Six poster designs plus generated remixes, drag-and-drop layout, lock screen preview.',
  robots: () => route.query.player || route.query.design || route.query.remix || route.query.sheet ? 'noindex, follow' : 'index, follow',
})
</script>

<template>
  <main id="main-content" class="w-full">
    <div v-if="error" class="site-content-rail flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-center" role="alert">
      <h1 class="text-xl font-bold text-white">Player wallpapers</h1>
      <p class="text-sm text-stone-300">Player data is temporarily unavailable.</p>
      <UButton label="Try again" color="neutral" variant="outline" @click="refresh()" />
    </div>
    <div v-else-if="status === 'pending'" class="site-content-rail flex min-h-[60dvh] items-center justify-center" role="status">
      <h1 class="sr-only">Player wallpapers</h1>
      <USkeleton class="aspect-[9/19.5] h-[60dvh] rounded-[2.5rem]" />
    </div>
    <UApp v-else>
      <WallpaperRemixSheet v-if="route.query.sheet" :studio="studio" />
      <WallpaperStudio v-else :studio="studio" />
    </UApp>
  </main>
</template>
