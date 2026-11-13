<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperBrand from '~/components/wallpaper/WallpaperBrand.vue'
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
</script>

<template>
  <svg v-scheduler-element="el('blocks', 'Colour blocks')" class="absolute left-0 top-0" width="1080" height="2400" viewBox="0 0 1080 2400" aria-hidden="true">
    <polygon points="0,0 470,0 0,760" fill="#000" opacity="0.12" />
    <polygon points="700,0 1080,0 1080,1620 850,1700" :fill="c.alt" />
    <polygon points="0,1380 420,1960 0,2180" :fill="c.alt" />
    <polygon points="540,2400 1080,1880 1080,2400" :fill="c.alt" />
    <polygon points="620,420 760,380 700,1180" :fill="c.alt" opacity="0.55" />
  </svg>

  <div v-scheduler-element="el('stats', 'Stat column', { group: true })" class="absolute right-[64px] top-[640px] flex w-[290px] flex-col items-center text-center">
    <template v-for="(slot, index) in [0, 1, 2]" :key="slot">
      <span v-if="index" aria-hidden="true" class="my-7 block h-[4px] w-[90px]" :style="{ backgroundColor: c.muted }" />
      <div v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label, { group: true })">
        <p v-scheduler-element="el(`stat-${slot}-value`, `${model.stats[slot]!.label} value`)" class="wp-display text-[190px] leading-[0.92] tabular-nums">{{ model.stats[slot]!.value }}</p>
        <p v-scheduler-element="el(`stat-${slot}-label`, `${model.stats[slot]!.label} label`)" class="wp-numbers mt-1 text-[42px] font-semibold uppercase leading-[1.04] tracking-[0.14em]">
          <span v-for="line in model.stats[slot]!.lines.filter(line => line !== 'FPL')" :key="line" class="block">{{ line }}</span>
        </p>
      </div>
    </template>
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" class="absolute left-[-110px] top-[1120px] h-[1120px] w-[1120px]" />

  <div v-scheduler-element="el('footer-stats', 'Footer stats', { group: true })" class="wp-numbers absolute left-[90px] top-[2040px] flex w-[900px] items-center justify-center gap-10 text-[44px] font-semibold uppercase tracking-[0.2em] [text-shadow:0_2px_10px_rgba(0,0,0,0.35)]">
    <template v-for="(slot, index) in [3, 4]" :key="slot">
      <span v-if="index" aria-hidden="true" class="h-[46px] w-[3px]" :style="{ backgroundColor: c.ink }" />
      <p v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label)" class="whitespace-nowrap">{{ model.stats[slot]!.label }} <span class="font-bold">{{ model.stats[slot]!.value }}</span></p>
    </template>
  </div>

  <WallpaperBrand :player="model.player" :layout="model.layout" class="absolute left-[72px] top-[620px]" />
</template>
