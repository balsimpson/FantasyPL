<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import { positionName, type WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperClubLogo from '~/components/wallpaper/WallpaperClubLogo.vue'
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const numeralColour = computed(() => props.model.layout.numerals?.textColour ?? c.value.alt)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
const id = useId()
// Anton numerals are roughly half an em wide; this keeps 1–3 characters inside the field.
const numeralSize = computed(() => Math.min(1080, Math.round(820 / (0.5 * Math.max(1, props.model.text.text.length)))))
const caption = computed(() => props.model.text.custom || !props.model.player.positionRank ? '' : `No. ${props.model.player.positionRank} ${positionName(props.model.player.positionShort)} by FPL points`)
</script>

<template>
  <div v-if="model.text.text" v-scheduler-element="el('numerals', 'Big numerals')" class="absolute left-[16px] top-[250px] h-[1040px] w-[780px]" aria-hidden="true">
    <svg width="780" height="1040" viewBox="0 0 780 1040">
      <defs>
        <pattern :id="`${id}-dots`" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="11" cy="11" r="7" :fill="numeralColour" />
        </pattern>
        <linearGradient :id="`${id}-solid`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stop-color="#fff" />
          <stop offset="0.85" stop-color="#000" />
        </linearGradient>
        <mask :id="`${id}-solid-mask`"><rect width="780" height="1040" :fill="`url(#${id}-solid)`" /></mask>
      </defs>
      <g transform="skewX(-8) translate(120 0)">
        <text x="0" y="980" :font-size="numeralSize" font-family="FPLDisplay" :fill="`url(#${id}-dots)`">{{ model.text.text }}</text>
        <text x="0" y="980" :font-size="numeralSize" font-family="FPLDisplay" :fill="numeralColour" :mask="`url(#${id}-solid-mask)`">{{ model.text.text }}</text>
      </g>
    </svg>
  </div>
  <p v-if="caption && model.text.text" v-scheduler-element="el('caption', 'Rank caption')" class="wp-numbers absolute left-[80px] top-[1300px] text-[30px] font-semibold uppercase tracking-[0.2em]" :style="{ color: `var(--wallpaper-text-colour, ${c.muted})` }">{{ caption }}</p>

  <div v-scheduler-element="el('stats', 'Stat column', { group: true })" class="absolute right-[64px] top-[620px] flex w-[300px] flex-col items-end text-right" :style="{ color: `var(--wallpaper-text-colour, ${c.accent})` }">
    <template v-for="(slot, index) in [0, 1, 2]" :key="slot">
      <span v-if="index" aria-hidden="true" class="my-7 block h-[5px] w-[70px]" :style="{ backgroundColor: c.accent }" />
      <div v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label, { group: true })">
        <p v-scheduler-element="el(`stat-${slot}-value`, `${model.stats[slot]!.label} value`)" class="wp-display text-[150px] leading-[0.9] tabular-nums"><span class="inline-block" style="transform: skewX(-8deg)">{{ model.stats[slot]!.value }}</span></p>
        <p v-scheduler-element="el(`stat-${slot}-label`, `${model.stats[slot]!.label} label`)" class="wp-numbers mt-1 text-[42px] font-bold uppercase italic leading-[1.02] tracking-[0.08em]">
          <span v-for="line in model.stats[slot]!.lines.filter(line => line !== 'FPL')" :key="line" class="block">{{ line }}</span>
        </p>
      </div>
    </template>
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" class="absolute left-[-40px] top-[1250px] h-[1150px] w-[1150px]" />

  <WallpaperClubLogo :player="model.player" :layout="model.layout" class="absolute right-[64px] top-[1480px]" />
</template>
