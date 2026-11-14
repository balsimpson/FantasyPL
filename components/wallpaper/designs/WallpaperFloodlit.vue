<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperFitText from '~/components/wallpaper/WallpaperFitText.vue'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperClubLogo from '~/components/wallpaper/WallpaperClubLogo.vue'
// Floodlit: a night match. Floodlight beams fall from the top corners onto the
// player, the photo dissolves into the dark, and the number glows in the pool of light.
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
const heroLabel = computed(() => props.model.stats[0]?.key === 'total_points' ? 'Points' : props.model.stats[0]?.label ?? '')
</script>

<template>
  <WallpaperPortrait :player="model.player" :layout="model.layout" :fade-height="48" class="absolute left-[90px] top-[560px] h-[900px] w-[900px]" />

  <div v-if="model.stats[0]" v-scheduler-element="el('hero', 'Big number', { group: true })" class="absolute left-[90px] top-[1300px] flex w-[900px] flex-col items-center text-center">
    <div v-scheduler-element="el('hero-value', 'Number')" class="tabular-nums" :class="{ '[text-shadow:0_0_60px_var(--wp-glow)]': !model.layout.hero?.flatDepth && !model.layout['hero-value']?.flatDepth }" :style="{ '--wp-glow': `${c.alt}aa` }">
      <WallpaperFitText :text="model.stats[0].value" :width="820" :max-size="470" :min-size="180" family="'Archivo Black'" />
    </div>
    <p v-scheduler-element="el('hero-label', 'Label')" class="wp-numbers mt-6 text-[64px] font-medium uppercase leading-none tracking-[0.5em] [margin-right:-0.5em]">{{ heroLabel }}</p>
  </div>

  <div v-scheduler-element="el('stats', 'Split stats', { group: true })" class="absolute left-[140px] top-[1880px] grid w-[800px] grid-cols-[1fr_auto_1fr] items-center text-center">
    <template v-for="(slot, index) in [1, 2]" :key="slot">
      <span v-if="index" aria-hidden="true" class="h-[150px] w-[3px]" :style="{ backgroundColor: c.muted }" />
      <div v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label, { group: true })">
        <p v-scheduler-element="el(`stat-${slot}-label`, `${model.stats[slot]!.label} label`)" class="wp-numbers text-[34px] font-semibold uppercase tracking-[0.18em]" :style="{ color: `var(--wallpaper-text-colour, ${c.muted})` }">{{ model.stats[slot]!.label }}</p>
        <p v-scheduler-element="el(`stat-${slot}-value`, `${model.stats[slot]!.label} value`)" class="wp-heavy mt-2 text-[104px] leading-none tabular-nums">{{ model.stats[slot]!.value }}</p>
      </div>
    </template>
  </div>

  <WallpaperClubLogo :player="model.player" :layout="model.layout" class="absolute left-[496px] top-[2106px]" />
</template>
