<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperFitText from '~/components/wallpaper/WallpaperFitText.vue'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperBrand from '~/components/wallpaper/WallpaperBrand.vue'
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
const id = useId()
</script>

<template>
  <svg class="absolute inset-0" width="1080" height="2400" viewBox="0 0 1080 2400" aria-hidden="true">
    <defs>
      <linearGradient :id="`${id}-shade`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0" />
        <stop offset="1" stop-color="#000" stop-opacity="0.28" />
      </linearGradient>
    </defs>
    <circle cx="1010" cy="900" r="560" fill="none" :stroke="c.alt" stroke-width="130" />
    <circle cx="1010" cy="900" r="350" fill="none" :stroke="c.alt" stroke-width="54" opacity="0.75" />
    <path d="M -40 1320 C 300 1180 700 1260 1120 1120" fill="none" :stroke="c.alt" stroke-width="34" opacity="0.6" />
    <rect x="0" y="1400" width="1080" height="1000" :fill="`url(#${id}-shade)`" />
  </svg>

  <div v-scheduler-element="el('player-name', 'Background word', { textContrast: true })" class="absolute left-[-30px] top-[330px]" :style="{ color: c.alt }">
    <WallpaperFitText :text="model.text.text" :width="1150" :max-size="720" :min-size="240" family="FPLDisplay" uppercase />
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" :fade="c.field" class="absolute left-[40px] top-[600px] h-[1000px] w-[1000px]" />

  <div v-if="model.stats[0]" v-scheduler-element="el('hero', 'Big number', { group: true })" class="absolute left-[72px] top-[1540px] flex items-end gap-7">
    <div v-scheduler-element="el('hero-value', 'Number')" class="tabular-nums">
      <WallpaperFitText :text="model.stats[0].value" :width="640" :max-size="430" :min-size="160" family="'Archivo Black'" />
    </div>
    <p v-scheduler-element="el('hero-label', 'Label')" class="wp-numbers pb-5 text-[80px] font-bold uppercase leading-[0.92]">
      <span v-for="line in model.stats[0].lines" :key="line" class="block">{{ line }}</span>
    </p>
  </div>

  <div v-scheduler-element="el('stats', 'Footer stats', { group: true })" class="wp-numbers absolute left-[72px] top-[1990px] flex w-[936px] items-center justify-center gap-10 border-t-[3px] pt-8 text-[46px] font-semibold uppercase tracking-[0.14em]" :style="{ borderColor: c.muted }">
    <template v-for="(slot, index) in [1, 2]" :key="slot">
      <span v-if="index" aria-hidden="true" class="h-[48px] w-[3px]" :style="{ backgroundColor: c.muted }" />
      <p v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label)" class="whitespace-nowrap">
        <span class="font-bold">{{ model.stats[slot]!.value }}</span> {{ model.stats[slot]!.label }}
      </p>
    </template>
  </div>

  <WallpaperBrand :player="model.player" :layout="model.layout" :season="model.season" align="right" class="absolute right-[72px] top-[1440px]" />
</template>
