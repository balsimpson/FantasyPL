<script setup lang="ts">
import '~/assets/css/wallpaper-artwork.css'
import { useWallpaperStudio } from '~/composables/useWallpaperStudio'
import WallpaperStudio from '~/components/wallpaper/WallpaperStudio.vue'

const studio = useWallpaperStudio()
const { status, error, refresh } = await studio.request
const route = useRoute()
const canonical = useCanonicalUrl('/wallpaper')
useHead({ link: [{ rel: 'canonical', href: canonical }] })
useSeoMeta({
  title: 'FPL Player Wallpapers for iPhone and Android',
  description: 'Make a phone wallpaper of your favourite Fantasy Premier League player with live season stats. Six poster designs, drag-and-drop layout, lock screen preview.',
  robots: () => route.query.player || route.query.design ? 'noindex, follow' : 'index, follow',
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
    <WallpaperStudio v-else :studio="studio" />

    <section class="site-content-rail grid gap-8 border-t border-white/10 py-12 text-sm text-stone-300 sm:grid-cols-2" aria-labelledby="wallpaper-howto">
      <h2 id="wallpaper-howto" class="text-lg font-semibold text-white sm:col-span-2">Set it as your wallpaper</h2>
      <div>
        <h3 class="mb-2 font-semibold text-white">iPhone</h3>
        <p>Choose Save, then Share → Save Image. In Photos, open the image and tap Use as Wallpaper. The preview shows where the clock and widgets will sit.</p>
      </div>
      <div>
        <h3 class="mb-2 font-semibold text-white">Android</h3>
        <p>Choose Save, then download the PNG. Open it in your gallery and choose Set as wallpaper. Clock styles vary by phone, so check the lock screen preview.</p>
      </div>
    </section>
  </main>
</template>
