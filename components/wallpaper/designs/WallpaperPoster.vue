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
  <div v-scheduler-element="el('player-name', 'Surname', { textContrast: true })" class="absolute left-[-70px] top-[610px]" :style="{ color: `var(--wallpaper-text-colour, ${c.alt})` }">
    <div style="transform: skewX(-9deg)">
      <WallpaperFitText :text="model.player.lastName || model.player.name" :width="1240" :max-size="640" :min-size="200" family="FPLDisplay" uppercase />
    </div>
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" class="absolute left-[30px] top-[740px] h-[1020px] w-[1020px]" />

  <svg v-scheduler-element="el('wedge', 'Wedge')" class="absolute left-0 top-[1380px]" width="1080" height="420" viewBox="0 1380 1080 420" aria-hidden="true">
    <polygon points="0,1740 1080,1640 1080,1800 0,1800" :fill="c.field" />
    <polygon points="1080,1420 1080,1640 790,1667" :fill="c.alt" />
  </svg>

  <div v-scheduler-element="el('stats', 'Stats', { group: true })" class="absolute left-[56px] top-[1810px] grid w-[968px] grid-cols-[1fr_auto_1fr_auto_1fr] items-start text-center">
    <template v-for="(slot, index) in [0, 1, 2]" :key="slot">
      <span v-if="index" aria-hidden="true" class="mt-4 h-[150px] w-[4px]" :style="{ backgroundColor: c.alt }" />
      <div v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label, { group: true })" class="min-w-0">
        <p v-scheduler-element="el(`stat-${slot}-value`, `${model.stats[slot]!.label} value`)" class="wp-heavy text-[118px] leading-none tabular-nums">{{ model.stats[slot]!.value }}</p>
        <p v-scheduler-element="el(`stat-${slot}-label`, `${model.stats[slot]!.label} label`)" class="wp-numbers mt-2 text-[38px] font-bold uppercase leading-[1.05] tracking-[0.16em]">
          <span v-for="line in model.stats[slot]!.lines.filter(line => line !== 'FPL')" :key="line" class="block">{{ line }}</span>
        </p>
      </div>
    </template>
  </div>

  <div class="absolute left-[72px] top-[2060px] flex w-[936px] items-center gap-6">
    <WallpaperClubLogo :player="model.player" :layout="model.layout" />
    <span v-scheduler-element="el('rule', 'Rule')" aria-hidden="true" class="h-[3px] flex-1" :style="{ backgroundColor: c.alt }" />
    <span v-if="model.season" v-scheduler-element="el('season', 'Season')" class="wp-numbers text-[34px] font-bold italic tracking-[0.12em]">{{ model.season }}</span>
  </div>
</template>
