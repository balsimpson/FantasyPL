<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperFitText from '~/components/wallpaper/WallpaperFitText.vue'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperBrand from '~/components/wallpaper/WallpaperBrand.vue'
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
const heroLabel = computed(() => props.model.stats[0]?.key === 'total_points' ? 'Points' : props.model.stats[0]?.label ?? '')
</script>

<template>
  <!-- The glow sits behind the head, well away from the numbers below. -->
  <div class="absolute inset-0" aria-hidden="true" :style="{ backgroundImage: `radial-gradient(ellipse 62% 30% at 50% 40%, ${c.alt}cc, transparent 72%), linear-gradient(115deg, transparent 38%, ${c.alt}33 46%, transparent 54%), linear-gradient(65deg, transparent 52%, ${c.alt}26 58%, transparent 64%)` }" />

  <WallpaperPortrait :player="model.player" :layout="model.layout" :fade="c.field" :fade-height="40" class="absolute left-[60px] top-[620px] h-[960px] w-[960px]" />

  <div v-if="model.stats[0]" v-scheduler-element="el('hero', 'Big number', { group: true })" class="absolute left-[90px] top-[1370px] flex w-[900px] flex-col items-center text-center">
    <div v-scheduler-element="el('hero-value', 'Number')" class="tabular-nums">
      <WallpaperFitText :text="model.stats[0].value" :width="860" :max-size="470" :min-size="180" family="'Archivo Black'" />
    </div>
    <p v-scheduler-element="el('hero-label', 'Label')" class="wp-numbers mt-6 text-[70px] font-medium uppercase leading-none tracking-[0.5em] [margin-right:-0.5em]">{{ heroLabel }}</p>
  </div>

  <div v-scheduler-element="el('stats', 'Split stats', { group: true })" class="absolute left-[140px] top-[1890px] grid w-[800px] grid-cols-[1fr_auto_1fr] items-center text-center">
    <template v-for="(slot, index) in [1, 2]" :key="slot">
      <span v-if="index" aria-hidden="true" class="h-[150px] w-[3px]" :style="{ backgroundColor: c.muted }" />
      <div v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label, { group: true })">
        <p v-scheduler-element="el(`stat-${slot}-label`, `${model.stats[slot]!.label} label`)" class="wp-numbers text-[34px] font-semibold uppercase tracking-[0.18em]" :style="{ color: c.muted }">{{ model.stats[slot]!.label }}</p>
        <p v-scheduler-element="el(`stat-${slot}-value`, `${model.stats[slot]!.label} value`)" class="wp-heavy mt-2 text-[104px] leading-none tabular-nums">{{ model.stats[slot]!.value }}</p>
      </div>
    </template>
  </div>

  <WallpaperBrand :player="model.player" :layout="model.layout" :season="model.season" align="center" class="absolute left-[240px] top-[2110px] w-[600px]" :style="{ color: c.muted }" />
</template>
