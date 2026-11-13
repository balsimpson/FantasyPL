<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperFitText from '~/components/wallpaper/WallpaperFitText.vue'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperBrand from '~/components/wallpaper/WallpaperBrand.vue'
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
const heroLabel = computed(() => props.model.stats[0]?.key === 'total_points' ? 'Pts' : props.model.stats[0]?.label ?? '')
</script>

<template>
  <div class="absolute inset-0" aria-hidden="true" :style="{ backgroundImage: `radial-gradient(circle at 88% 34%, ${c.alt} 0 30%, transparent 30.2%), linear-gradient(170deg, ${c.field} 20%, ${c.alt} 100%)` }" />

  <div v-if="model.stats[0]" v-scheduler-element="el('hero', 'Big number', { group: true })" class="wp-serif absolute left-[64px] top-[640px]">
    <div v-scheduler-element="el('hero-value', 'Number')" class="tabular-nums">
      <WallpaperFitText :text="model.stats[0].value" :width="600" :max-size="560" :min-size="200" family="'Bodoni Moda'" />
    </div>
    <div v-scheduler-element="el('hero-label', 'Label')" class="mt-2">
      <WallpaperFitText :text="heroLabel" :width="560" :max-size="300" :min-size="100" family="'Bodoni Moda'" uppercase />
    </div>
  </div>

  <span v-scheduler-element="el('rule', 'Rule')" aria-hidden="true" class="absolute left-[72px] top-[1530px] block h-[4px] w-[120px]" :style="{ backgroundColor: c.ink }" />

  <div v-scheduler-element="el('stats', 'Stat lines', { group: true })" class="wp-numbers absolute left-[72px] top-[1590px] space-y-5 text-[50px] font-medium uppercase tracking-[0.24em]">
    <template v-for="slot in [3, 4]" :key="slot">
      <p v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label)" class="whitespace-nowrap">{{ model.stats[slot]!.label }} <span class="font-bold">{{ model.stats[slot]!.value }}</span></p>
    </template>
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" class="absolute left-[250px] top-[1250px] h-[1150px] w-[1150px]" />

  <WallpaperBrand :player="model.player" :layout="model.layout" class="absolute left-[72px] top-[1820px]" />
</template>
