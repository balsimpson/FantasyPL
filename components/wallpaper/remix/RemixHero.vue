<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import type { WallpaperStatView } from '~/utils/wallpaper'
import { remixFonts, type WallpaperRecipe } from '~/utils/wallpaper-remix'
import RemixText from '~/components/wallpaper/remix/RemixText.vue'

// The lead number. Sculpted remixes extrude it; layered ones echo it in outline.
const props = defineProps<{ recipe: WallpaperRecipe; stat: WallpaperStatView; layout: SchedulerLayout }>()
const spec = computed(() => props.recipe.skeleton.hero!)
const c = computed(() => props.recipe.colours)
const font = computed(() => remixFonts[props.recipe.type.hero])
const beside = computed(() => spec.value.label === 'beside')
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.layout, ...extra })
const valueColour = computed(() => props.layout['hero-value']?.textColour ?? c.value.ink)
const flat = computed(() => props.layout.hero?.flatDepth || props.layout['hero-value']?.flatDepth)
const extrude = computed(() => props.recipe.depth.extrude === 'hero' && !flat.value
  ? { style: props.recipe.depth.extrudeStyle, face: valueColour.value, deep: c.value.deep, field: c.value.field, light: props.recipe.depth.light }
  : null)
const echo = computed(() => props.recipe.depth.echo && !flat.value ? { colour: c.value.accent, light: props.recipe.depth.light } : null)
const label = computed(() => props.stat.key === 'total_points' ? ['FPL', 'Points'] : props.stat.lines)
const justify = computed(() => ({ left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' })[spec.value.align])
</script>

<template>
  <div
    v-scheduler-element="el('hero', 'Big number', { group: true })"
    class="absolute flex"
    :class="beside ? 'flex-row items-end gap-7' : ['flex-col', justify]"
    :style="{ left: `${spec.x}px`, top: `${spec.y}px`, width: `${spec.width}px` }"
  >
    <div v-scheduler-element="el('hero-value', 'Number')" class="tabular-nums">
      <RemixText :text="stat.value" :font="font" :length="beside ? spec.width * 0.6 : spec.width * 0.92" :max-size="spec.maxSize" :min-size="140" :colour="`var(--wallpaper-text-colour, ${c.ink})`" :treatment="'flat'" :extrude="extrude" :echo="echo" />
    </div>
    <p
      v-scheduler-element="el('hero-label', 'Label')"
      class="wp-numbers font-bold uppercase"
      :class="beside ? 'pb-4 text-[64px] leading-[0.94] tracking-[0.04em]' : 'mt-6 text-[60px] leading-none tracking-[0.36em] [margin-right:-0.36em]'"
      :style="{ color: `var(--wallpaper-text-colour, ${beside ? c.ink : c.muted})` }"
    >
      <template v-if="beside"><span v-for="line in label" :key="line" class="block">{{ line }}</span></template>
      <template v-else>{{ label.join(' ') }}</template>
    </p>
  </div>
</template>
