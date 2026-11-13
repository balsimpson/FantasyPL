<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import { luminance, mixColour, type WallpaperStatView } from '~/utils/wallpaper'
import { lightVector, remixFonts, type WallpaperRecipe } from '~/utils/wallpaper-remix'

// The supporting stats in one of four arrangements. Sculpted remixes can set them
// on solid 3D tiles: an extruded box-shadow stack that follows the light.
const props = defineProps<{ recipe: WallpaperRecipe; stats: Record<number, WallpaperStatView>; slots: number[]; layout: SchedulerLayout }>()
const spec = computed(() => props.recipe.skeleton.stats)
const c = computed(() => props.recipe.colours)
const font = computed(() => remixFonts[props.recipe.type.stat])
const wide = computed(() => font.value.width > 0.6)
const items = computed(() => props.slots.map(slot => props.stats[slot]).filter((stat): stat is WallpaperStatView => Boolean(stat)))
const arrangement = computed(() => props.recipe.arrangement)
const tiles = computed(() => props.recipe.depth.tiles && arrangement.value !== 'lines')
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.layout, ...extra })
const labelLines = (stat: WallpaperStatView) => stat.lines.filter(line => line !== 'FPL')

const tileFace = computed(() => luminance(c.value.field) < 0.25 ? mixColour(c.value.field, '#ffffff', 0.14) : mixColour(c.value.field, '#ffffff', 0.5))
const tileStyle = computed(() => {
  if (!tiles.value) return {}
  const v = lightVector(props.recipe.depth.light)
  const depth = 22
  const layers = Array.from({ length: depth }, (_, index) => `${(v.x * (index + 1)).toFixed(1)}px ${(v.y * (index + 1)).toFixed(1)}px 0 ${mixColour(c.value.deep, tileFace.value, 0.25 * (1 - index / depth))}`)
  layers.push(`${(v.x * depth * 1.6).toFixed(1)}px ${(v.y * depth * 1.6 + 16).toFixed(1)}px 34px rgba(0,0,0,0.3)`, 'inset 0 2px 0 rgba(255,255,255,0.28)')
  return { backgroundColor: tileFace.value, boxShadow: layers.join(', ') }
})
const valueSize = computed(() => {
  if (arrangement.value === 'column') return wide.value ? 118 : 168
  return wide.value ? 88 : 116
})
const align = computed(() => ({ left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' })[spec.value.align])
const valueStyle = computed(() => ({ fontFamily: font.value.family, fontWeight: font.value.weight, fontStyle: font.value.style === 'italic' ? 'italic' : 'normal', fontSize: `${valueSize.value}px` }))
</script>

<template>
  <div
    v-scheduler-element="el('stats', 'Stats', { group: true })"
    class="absolute"
    :style="{ left: `${spec.x}px`, top: `${spec.y}px`, width: `${spec.width}px`, color: c.ink }"
  >
    <!-- Row and pair -->
    <div v-if="arrangement === 'row' || arrangement === 'pair'" class="grid items-start text-center" :class="tiles ? 'gap-7' : 'gap-0'" :style="{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }">
      <div
        v-for="(stat, index) in items"
        :key="stat.slot"
        v-scheduler-element="el(`stat-${stat.slot}`, stat.label, { group: true })"
        class="min-w-0"
        :class="[tiles ? 'px-4 py-7' : 'px-2', !tiles && index ? 'border-l-[4px]' : '']"
        :style="{ ...tileStyle, borderColor: c.muted }"
      >
        <template v-if="arrangement === 'pair'">
          <p v-scheduler-element="el(`stat-${stat.slot}-label`, `${stat.label} label`)" class="wp-numbers text-[34px] font-semibold uppercase tracking-[0.18em]" :style="{ color: `var(--wallpaper-text-colour, ${c.muted})` }">{{ stat.label }}</p>
          <p v-scheduler-element="el(`stat-${stat.slot}-value`, `${stat.label} value`)" class="mt-2 leading-none tabular-nums" :style="valueStyle">{{ stat.value }}</p>
        </template>
        <template v-else>
          <p v-scheduler-element="el(`stat-${stat.slot}-value`, `${stat.label} value`)" class="leading-none tabular-nums" :style="valueStyle">{{ stat.value }}</p>
          <p v-scheduler-element="el(`stat-${stat.slot}-label`, `${stat.label} label`)" class="wp-numbers mt-3 text-[34px] font-bold uppercase leading-[1.05] tracking-[0.16em]">
            <span v-for="line in labelLines(stat)" :key="line" class="block">{{ line }}</span>
          </p>
        </template>
      </div>
    </div>

    <!-- Column -->
    <div v-else-if="arrangement === 'column'" class="flex flex-col" :class="[align, tiles ? 'gap-9' : 'gap-0']">
      <template v-for="(stat, index) in items" :key="stat.slot">
        <span v-if="index && !tiles" aria-hidden="true" class="my-7 block h-[5px] w-[80px]" :style="{ backgroundColor: c.accent }" />
        <div v-scheduler-element="el(`stat-${stat.slot}`, stat.label, { group: true })" class="flex flex-col" :class="[align, tiles && 'w-full px-6 py-6']" :style="tileStyle">
          <p v-scheduler-element="el(`stat-${stat.slot}-value`, `${stat.label} value`)" class="leading-[0.9] tabular-nums" :style="valueStyle">{{ stat.value }}</p>
          <p v-scheduler-element="el(`stat-${stat.slot}-label`, `${stat.label} label`)" class="wp-numbers mt-2 text-[40px] font-bold uppercase leading-[1.04] tracking-[0.1em]">
            <span v-for="line in labelLines(stat)" :key="line" class="block">{{ line }}</span>
          </p>
        </div>
      </template>
    </div>

    <!-- Lines -->
    <div v-else class="wp-numbers flex flex-col gap-5 text-[48px] font-medium uppercase tracking-[0.22em]" :class="align">
      <p v-for="stat in items" :key="stat.slot" v-scheduler-element="el(`stat-${stat.slot}`, stat.label)" class="whitespace-nowrap">
        {{ stat.label }} <span class="font-bold" :style="{ color: `var(--wallpaper-text-colour, ${c.accent})` }">{{ stat.value }}</span>
      </p>
    </div>
  </div>
</template>
