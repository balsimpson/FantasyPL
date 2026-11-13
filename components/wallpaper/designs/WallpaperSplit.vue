<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperClubLogo from '~/components/wallpaper/WallpaperClubLogo.vue'
// Split: a Bauhaus colour field. One diagonal divides the board; the stat column
// and the crest line hang from the top margin, and the photo rises out of the split.
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
</script>

<template>
  <div class="absolute left-[72px] top-[620px] flex items-center gap-5">
    <WallpaperClubLogo :player="model.player" :layout="model.layout" />
  </div>
  <div v-scheduler-element="el('footer-stats', 'Footnotes', { group: true })" class="wp-numbers absolute left-[72px] top-[760px] space-y-3 text-[40px] font-semibold uppercase tracking-[0.2em]">
    <template v-for="slot in [3, 4]" :key="slot">
      <p v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label)" class="whitespace-nowrap">{{ model.stats[slot]!.label }} <span class="font-bold">{{ model.stats[slot]!.value }}</span></p>
    </template>
  </div>

  <div v-scheduler-element="el('stats', 'Stat column', { group: true })" class="absolute right-[64px] top-[620px] flex w-[300px] flex-col items-end text-right">
    <template v-for="(slot, index) in [0, 1, 2]" :key="slot">
      <span v-if="index" aria-hidden="true" class="my-6 block h-[5px] w-[90px]" :style="{ backgroundColor: c.ink }" />
      <div v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label, { group: true })">
        <p v-scheduler-element="el(`stat-${slot}-value`, `${model.stats[slot]!.label} value`)" class="wp-display text-[200px] leading-[0.9] tabular-nums">{{ model.stats[slot]!.value }}</p>
        <p v-scheduler-element="el(`stat-${slot}-label`, `${model.stats[slot]!.label} label`)" class="wp-numbers mt-1 text-[40px] font-semibold uppercase leading-[1.04] tracking-[0.14em]">
          <span v-for="line in model.stats[slot]!.lines.filter(line => line !== 'FPL')" :key="line" class="block">{{ line }}</span>
        </p>
      </div>
    </template>
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" class="absolute left-[-70px] top-[1240px] h-[1160px] w-[1160px]" />
</template>
