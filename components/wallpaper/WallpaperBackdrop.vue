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
      <!-- A halo centred on the head: one heavy ring between two hairlines. -->
      <circle cx="540" cy="880" r="430" fill="none" :stroke="c.alt" stroke-width="110" />
      <circle cx="540" cy="880" r="300" fill="none" :stroke="c.alt" stroke-width="3" opacity="0.9" />
      <circle cx="540" cy="880" r="560" fill="none" :stroke="c.alt" stroke-width="3" opacity="0.9" />
      <rect x="0" y="1400" width="1080" height="1000" :fill="`url(#${id}-shade)`" />
    </svg>

    <!-- A disc set behind the portrait's head, like a gallery spotlight. -->
    <svg v-else-if="design === 'gallery'" class="absolute inset-0" width="1080" height="2400" viewBox="0 0 1080 2400" aria-hidden="true">
      <defs>
        <linearGradient :id="`${id}-wash`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.3" :stop-color="c.field" />
          <stop offset="1" :stop-color="c.alt" />
        </linearGradient>
      </defs>
      <rect width="1080" height="2400" :fill="`url(#${id}-wash)`" />
      <circle cx="830" cy="1590" r="440" :fill="c.alt" />
      <circle cx="830" cy="1590" r="470" fill="none" :stroke="c.ink" stroke-width="2" opacity="0.35" />
    </svg>

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

    <!-- Floodlight beams from both top corners meet on the player. -->
    <svg v-else-if="design === 'floodlit'" class="absolute inset-0" width="1080" height="2400" viewBox="0 0 1080 2400" aria-hidden="true">
      <defs>
        <linearGradient :id="`${id}-beam`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" :stop-color="c.alt" stop-opacity="0.6" />
          <stop offset="0.75" :stop-color="c.alt" stop-opacity="0" />
        </linearGradient>
        <radialGradient :id="`${id}-pool`" cx="0.5" cy="0.42" r="0.5">
          <stop offset="0" :stop-color="c.alt" stop-opacity="0.75" />
          <stop offset="0.6" :stop-color="c.alt" stop-opacity="0.12" />
          <stop offset="1" :stop-color="c.alt" stop-opacity="0" />
        </radialGradient>
      </defs>
      <polygon points="-80,0 120,0 760,1900 300,1900" :fill="`url(#${id}-beam)`" />
      <polygon points="960,0 1160,0 780,1900 320,1900" :fill="`url(#${id}-beam)`" />
      <circle cx="0" cy="0" r="70" :fill="c.alt" opacity="0.5" />
      <circle cx="1080" cy="0" r="70" :fill="c.alt" opacity="0.5" />
      <ellipse cx="540" cy="1010" rx="620" ry="760" :fill="`url(#${id}-pool)`" />
    </svg>

    <svg v-else-if="design === 'split'" class="absolute left-0 top-0" width="1080" height="2400" viewBox="0 0 1080 2400" aria-hidden="true">
      <!-- One diagonal divides the field; a thin parallel stripe echoes it. -->
      <polygon points="1080,1060 1080,2400 0,2400 0,1760" :fill="c.alt" />
      <polygon points="1080,980 1080,1010 0,1710 0,1680" :fill="c.alt" />
    </svg>
  </div>
</template>
