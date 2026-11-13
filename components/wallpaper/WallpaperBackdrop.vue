<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import type { WallpaperColours, WallpaperDesignId } from '~/utils/wallpaper'

const props = defineProps<{ design: WallpaperDesignId; c: WallpaperColours; layout: SchedulerLayout }>()
const id = useId()
const shade = computed(() => props.c.lettering ? (props.c.ink === '#000000' ? '#ffffff' : '#000000') : '#000000')
</script>

<template>
  <div v-scheduler-element="{ id: design === 'split' ? 'blocks' : 'backdrop', label: 'Backdrop', layout }" :key="design" class="absolute inset-0 -z-10">
    <svg v-if="design === 'royal'" class="absolute inset-0" width="1080" height="2400" viewBox="0 0 1080 2400" aria-hidden="true">
      <defs>
        <linearGradient :id="`${id}-shade`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" :stop-color="shade" stop-opacity="0" />
          <stop offset="1" :stop-color="shade" stop-opacity="0.28" />
        </linearGradient>
      </defs>
      <circle cx="1010" cy="900" r="560" fill="none" :stroke="c.alt" stroke-width="130" />
      <circle cx="1010" cy="900" r="350" fill="none" :stroke="c.alt" stroke-width="54" opacity="0.75" />
      <path d="M -40 1320 C 300 1180 700 1260 1120 1120" fill="none" :stroke="c.alt" stroke-width="34" opacity="0.6" />
      <rect x="0" y="1400" width="1080" height="1000" :fill="`url(#${id}-shade)`" />
    </svg>

    <div v-else-if="design === 'gallery'" class="absolute inset-0" aria-hidden="true" :style="{ backgroundImage: `radial-gradient(circle at 88% 34%, ${c.alt} 0 30%, transparent 30.2%), linear-gradient(170deg, ${c.field} 20%, ${c.alt} 100%)` }" />

    <svg v-else-if="design === 'halftone'" class="absolute inset-0" width="1080" height="2400" viewBox="0 0 1080 2400" aria-hidden="true">
      <defs>
        <pattern :id="`${id}-fine`" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="8" cy="8" r="3" :fill="c.alt" />
        </pattern>
        <radialGradient :id="`${id}-corner`" cx="1" cy="0" r="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0.9" />
          <stop offset="0.55" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
        <mask :id="`${id}-corner-mask`"><rect width="1080" height="2400" :fill="`url(#${id}-corner)`" /></mask>
      </defs>
      <rect width="1080" height="1100" :fill="`url(#${id}-fine)`" :mask="`url(#${id}-corner-mask)`" opacity="0.5" />
    </svg>

    <div v-else-if="design === 'floodlit'" class="absolute inset-0" aria-hidden="true" :style="{ backgroundImage: `radial-gradient(ellipse 62% 30% at 50% 40%, ${c.alt}cc, transparent 72%), linear-gradient(115deg, transparent 38%, ${c.alt}33 46%, transparent 54%), linear-gradient(65deg, transparent 52%, ${c.alt}26 58%, transparent 64%)` }" />

    <svg v-else-if="design === 'split'" class="absolute left-0 top-0" width="1080" height="2400" viewBox="0 0 1080 2400" aria-hidden="true">
      <polygon points="0,0 470,0 0,760" fill="#000" opacity="0.12" />
      <polygon points="700,0 1080,0 1080,1620 850,1700" :fill="c.alt" />
      <polygon points="0,1380 420,1960 0,2180" :fill="c.alt" />
      <polygon points="540,2400 1080,1880 1080,2400" :fill="c.alt" />
      <polygon points="620,420 760,380 700,1180" :fill="c.alt" opacity="0.55" />
    </svg>
  </div>
</template>
