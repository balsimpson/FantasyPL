<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import { PORTRAIT_HEAD, type WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperFitText from '~/components/wallpaper/WallpaperFitText.vue'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperClubLogo from '~/components/wallpaper/WallpaperClubLogo.vue'
// Name poster: a magazine cover. The whole surname runs edge to edge, tucked
// behind the head and in front of the shoulders; the photo stands on a solid
// colour band that carries the stats.
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
const name = computed(() => props.model.player.lastName || props.model.player.name)

// Portrait box and the chin line (PL headshots put the chin at about 60% height).
const PORTRAIT = { top: 700, size: 1120 }
const CHIN = PORTRAIT.top + PORTRAIT.size * (PORTRAIT_HEAD.y + PORTRAIT_HEAD.ry * 0.85)
// Anton is about half an em per letter; the fitted line is 0.86 em tall. The name is
// placed so its top third hides behind the head and the rest crosses the shoulders.
const nameHeight = computed(() => Math.min(560, Math.max(180, 960 / (0.5 * Math.max(1, name.value.length)))) * 0.86)
const nameTop = computed(() => Math.round(CHIN - nameHeight.value * 0.38))
const nameColour = computed(() => props.model.layout['player-name']?.textColour ?? c.value.alt)
// The front copy follows the surname's layout and has a head-shaped hole, so the
// head overlaps the name while the name covers the shoulders and chest.
const front = computed(() => {
  const word = props.model.layout['player-name']
  const portrait = props.model.layout.portrait
  const scale = word?.scale ?? 1
  const size = PORTRAIT.size * (portrait?.scale ?? 1)
  const left = -20 + (portrait?.x ?? 0)
  const top = PORTRAIT.top + (portrait?.y ?? 0)
  const x = (left + size * PORTRAIT_HEAD.x - 36 - (word?.x ?? 0)) / scale
  const y = (top + size * PORTRAIT_HEAD.y - nameTop.value - (word?.y ?? 0)) / scale
  const mask = `radial-gradient(ellipse ${Math.round(size * PORTRAIT_HEAD.rx / scale)}px ${Math.round(size * PORTRAIT_HEAD.ry / scale)}px at ${Math.round(x)}px ${Math.round(y)}px, transparent 96%, #000 100%)`
  return {
    transform: word ? `translate(${word.x}px, ${word.y}px) scale(${word.scale})` : undefined,
    transformOrigin: '0 0',
    zIndex: Math.max(word?.z ?? 10, portrait?.z ?? 10),
    visibility: word?.hidden ? 'hidden' as const : undefined,
    opacity: word?.opacity,
    maskImage: mask,
    WebkitMaskImage: mask,
  }
})
</script>

<template>
  <p v-if="model.season" v-scheduler-element="el('season', 'Season')" class="wp-numbers absolute left-[72px] top-[640px] text-[34px] font-bold uppercase tracking-[0.2em]" :style="{ color: `var(--wallpaper-text-colour, ${c.ink})` }">{{ model.season }} season</p>
  <WallpaperClubLogo :player="model.player" :layout="model.layout" class="absolute left-[920px] top-[616px]" />

  <div v-scheduler-element="el('player-name', 'Surname', { textContrast: true })" class="absolute left-[36px] w-[1008px]" :style="{ top: `${nameTop}px`, color: `var(--wallpaper-text-colour, ${c.alt})` }">
    <div style="transform: skewX(-8deg)">
      <WallpaperFitText :text="name" :width="960" :max-size="560" :min-size="180" family="FPLDisplay" uppercase />
    </div>
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" class="absolute left-[-20px] top-[700px] h-[1120px] w-[1120px]" />

  <!-- Front copy of the surname: the part below the chin crosses in front of the body. -->
  <div class="pointer-events-none absolute left-[36px] w-[1008px]" :style="{ ...front, top: `${nameTop}px`, color: nameColour }" aria-hidden="true">
    <div style="transform: skewX(-8deg)">
      <WallpaperFitText :text="name" :width="960" :max-size="560" :min-size="180" family="FPLDisplay" uppercase />
    </div>
  </div>

  <div v-scheduler-element="el('wedge', 'Colour band')" class="absolute left-0 top-[1820px] h-[580px] w-[1080px]" :style="{ backgroundColor: c.alt }" aria-hidden="true" />

  <div v-scheduler-element="el('stats', 'Stats', { group: true })" class="absolute left-[72px] top-[1880px] grid w-[936px] grid-cols-[1fr_auto_1fr_auto_1fr] items-start text-center" :style="{ color: c.field }">
    <template v-for="(slot, index) in [0, 1, 2]" :key="slot">
      <span v-if="index" aria-hidden="true" class="mt-3 h-[150px] w-[3px] opacity-40" :style="{ backgroundColor: c.field }" />
      <div v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label, { group: true })" class="min-w-0">
        <p v-scheduler-element="el(`stat-${slot}-value`, `${model.stats[slot]!.label} value`)" class="wp-heavy text-[118px] leading-none tabular-nums">{{ model.stats[slot]!.value }}</p>
        <p v-scheduler-element="el(`stat-${slot}-label`, `${model.stats[slot]!.label} label`)" class="wp-numbers mt-3 text-[34px] font-bold uppercase leading-[1.05] tracking-[0.18em]">
          <span v-for="line in model.stats[slot]!.lines.filter(line => line !== 'FPL')" :key="line" class="block">{{ line }}</span>
        </p>
      </div>
    </template>
  </div>
</template>
