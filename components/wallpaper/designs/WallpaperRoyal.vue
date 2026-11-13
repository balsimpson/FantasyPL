<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperFitText from '~/components/wallpaper/WallpaperFitText.vue'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperClubLogo from '~/components/wallpaper/WallpaperClubLogo.vue'
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
</script>

<template>
  <div v-scheduler-element="el('player-name', 'Background word', { textContrast: true })" class="absolute left-[-30px] top-[330px]" :style="{ color: `var(--wallpaper-text-colour, ${c.lettering ?? c.alt})` }">
    <WallpaperFitText :text="model.text.text" :width="1150" :max-size="720" :min-size="240" family="FPLDisplay" uppercase />
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" :fade-height="34" class="absolute left-[40px] top-[600px] h-[1000px] w-[1000px]" />

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

  <WallpaperClubLogo :player="model.player" :layout="model.layout" class="absolute right-[72px] top-[1440px]" />
</template>
