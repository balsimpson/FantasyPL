<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperFitText from '~/components/wallpaper/WallpaperFitText.vue'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperClubLogo from '~/components/wallpaper/WallpaperClubLogo.vue'
// Royal: a symmetrical, ceremonial poster. The halo rings are centred on the head,
// the surname sits whole behind it, and everything below shares one centre line.
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
</script>

<template>
  <div v-scheduler-element="el('player-name', 'Background word', { textContrast: true })" class="absolute left-[72px] top-[300px] flex w-[936px] justify-center" :style="{ color: `var(--wallpaper-text-colour, ${c.lettering ?? c.alt})` }">
    <WallpaperFitText :text="model.text.text" :width="936" :max-size="560" :min-size="200" family="FPLDisplay" uppercase />
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" :fade-height="46" class="absolute left-[90px] top-[560px] h-[900px] w-[900px]" />

  <div v-if="model.stats[0]" v-scheduler-element="el('hero', 'Big number', { group: true })" class="absolute left-[72px] top-[1380px] flex w-[936px] flex-col items-center text-center">
    <div v-scheduler-element="el('hero-value', 'Number')" class="tabular-nums">
      <WallpaperFitText :text="model.stats[0].value" :width="760" :max-size="430" :min-size="160" family="'Archivo Black'" />
    </div>
    <p v-scheduler-element="el('hero-label', 'Label')" class="wp-numbers mt-5 text-[54px] font-semibold uppercase leading-none tracking-[0.42em] [margin-right:-0.42em]" :style="{ color: `var(--wallpaper-text-colour, ${c.muted})` }">{{ model.stats[0].lines.join(' ') }}</p>
  </div>

  <div v-scheduler-element="el('stats', 'Footer stats', { group: true })" class="wp-numbers absolute left-[132px] top-[1920px] grid w-[816px] grid-cols-[1fr_auto_1fr] items-center border-y-[3px] py-7 text-center uppercase" :style="{ borderColor: c.muted }">
    <template v-for="(slot, index) in [1, 2]" :key="slot">
      <span v-if="index" aria-hidden="true" class="h-[96px] w-[3px]" :style="{ backgroundColor: c.muted }" />
      <div v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label, { group: true })">
        <p v-scheduler-element="el(`stat-${slot}-value`, `${model.stats[slot]!.label} value`)" class="wp-heavy text-[84px] leading-none tabular-nums">{{ model.stats[slot]!.value }}</p>
        <p v-scheduler-element="el(`stat-${slot}-label`, `${model.stats[slot]!.label} label`)" class="mt-2 text-[32px] font-semibold tracking-[0.22em]" :style="{ color: `var(--wallpaper-text-colour, ${c.muted})` }">{{ model.stats[slot]!.label }}</p>
      </div>
    </template>
  </div>

  <WallpaperClubLogo :player="model.player" :layout="model.layout" class="absolute left-[496px] top-[2128px]" />
</template>
