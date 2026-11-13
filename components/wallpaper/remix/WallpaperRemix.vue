<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import { PORTRAIT_HEAD, luminance, mixColour, positionName, type WallpaperArtworkModel } from '~/utils/wallpaper'
import { lightVector, remixFonts, remixStatSlots, type WallpaperRecipe } from '~/utils/wallpaper-remix'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
import RemixBackdrop from '~/components/wallpaper/remix/RemixBackdrop.vue'
import RemixText from '~/components/wallpaper/remix/RemixText.vue'
import RemixPortrait from '~/components/wallpaper/remix/RemixPortrait.vue'
import RemixHero from '~/components/wallpaper/remix/RemixHero.vue'
import RemixStats from '~/components/wallpaper/remix/RemixStats.vue'

// Renders a generated remix recipe. Every visible part keeps a stable layout id,
// so the editor can move, resize, recolour and hide it like the fixed designs.
const props = defineProps<{ model: WallpaperArtworkModel }>()
// The artwork only renders this component when a recipe is present.
const recipe = computed(() => props.model.recipe as WallpaperRecipe)
const sk = computed(() => recipe.value.skeleton)
const c = computed(() => recipe.value.colours)
const layout = computed(() => props.model.layout)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: layout.value, ...extra })

// ---- Lettering ----
const word = computed(() => sk.value.word)
const wordFont = computed(() => remixFonts[recipe.value.type.word])
const wordBox = ref({ width: 0, height: 0, size: 0 })
const wordColour = computed(() => layout.value['player-name']?.textColour ?? c.value.word)
const wordExtrude = computed(() => recipe.value.depth.extrude === 'word'
  ? { style: recipe.value.depth.extrudeStyle, face: wordColour.value, deep: c.value.deep, field: c.value.field, light: recipe.value.depth.light }
  : null)
const wordProps = computed(() => word.value ? {
  text: props.model.text.text,
  font: wordFont.value,
  length: word.value.length,
  maxSize: word.value.maxSize,
  minSize: word.value.minSize,
  treatment: recipe.value.wordTreatment,
  vertical: Boolean(word.value.vertical),
  skew: recipe.value.skew && !word.value.vertical,
  extrude: wordExtrude.value,
} : null)

// Pop-out: a second copy of the lettering sits in front of the photo with the head
// masked out, so the head overlaps the word and the word crosses the body.
const popOut = computed(() => Boolean(word.value && recipe.value.depth.popOut && !word.value.front && props.model.text.text))
const frontStyle = computed(() => {
  const change = layout.value['player-name']
  const portraitZ = layout.value.portrait?.z ?? 10
  return {
    left: `${word.value?.x ?? 0}px`,
    top: `${word.value?.y ?? 0}px`,
    transform: change ? `translate(${change.x}px, ${change.y}px) scale(${change.scale})` : undefined,
    transformOrigin: '0 0',
    zIndex: Math.max(change?.z ?? 10, portraitZ),
    visibility: change?.hidden ? 'hidden' as const : undefined,
    opacity: change?.opacity,
  }
})
// The front copy gets a head-shaped hole, in the wrapper's own (unrotated) px.
const frontMask = computed(() => {
  if (!word.value) return {}
  const portrait = layout.value.portrait
  const change = layout.value['player-name']
  const scale = change?.scale ?? 1
  const size = sk.value.portrait.size * (portrait?.scale ?? 1)
  const left = sk.value.portrait.x + (portrait?.x ?? 0)
  const top = sk.value.portrait.y + (portrait?.y ?? 0)
  const x = (left + size * PORTRAIT_HEAD.x - word.value.x - (change?.x ?? 0)) / scale
  const y = (top + size * PORTRAIT_HEAD.y - word.value.y - (change?.y ?? 0)) / scale
  const mask = `radial-gradient(ellipse ${Math.round(size * PORTRAIT_HEAD.rx / scale)}px ${Math.round(size * PORTRAIT_HEAD.ry / scale)}px at ${Math.round(x)}px ${Math.round(y)}px, transparent 96%, #000 100%)`
  return { maskImage: mask, WebkitMaskImage: mask }
})

// ---- Stats and accents ----
const slots = computed(() => remixStatSlots(recipe.value))
const hero = computed(() => sk.value.hero && props.model.stats[0])
const seasonText = computed(() => [props.model.player.positionShort, props.model.season].filter(Boolean).join(' · '))
const ticker = computed(() => {
  const parts = [props.model.player.lastName || props.model.player.name, props.model.player.club, positionName(props.model.player.positionShort), props.model.season].filter(Boolean).map(part => String(part).toUpperCase())
  return Array.from({ length: 4 }, () => parts.join('  ·  ')).join('  ·  ')
})

// Emboss: the crest sits on a struck medal with a bevelled edge.
const badgeStyle = computed(() => {
  if (!recipe.value.depth.emboss) return {}
  const v = lightVector(recipe.value.depth.light)
  const dark = luminance(c.value.field) < 0.25
  const face = dark ? mixColour(c.value.field, '#ffffff', 0.22) : mixColour(c.value.field, '#ffffff', 0.6)
  const rim = Array.from({ length: 10 }, (_, index) => `${(v.x * (index + 1)).toFixed(1)}px ${(v.y * (index + 1)).toFixed(1)}px 0 ${mixColour(c.value.deep, face, 0.3)}`)
  return {
    background: `radial-gradient(circle at ${v.x > 0 ? 32 : v.x < 0 ? 68 : 50}% 26%, ${mixColour(face, '#ffffff', 0.5)}, ${face} 46%, ${mixColour(face, c.value.deep, 0.25)} 100%)`,
    boxShadow: [...rim, `${(v.x * 18).toFixed(1)}px ${(v.y * 18 + 14).toFixed(1)}px 30px rgba(0,0,0,0.32)`, 'inset 0 3px 0 rgba(255,255,255,0.45)', 'inset 0 -4px 0 rgba(0,0,0,0.12)'].join(', '),
  }
})
</script>

<template>
  <RemixBackdrop :recipe="recipe" :layout="layout" />

  <!-- Lettering behind the photo -->
  <div
    v-if="wordProps && model.text.text && !word?.front"
    v-scheduler-element="el('player-name', 'Background word', { textContrast: true })"
    class="absolute"
    :style="{ left: `${word!.x}px`, top: `${word!.y}px` }"
  >
    <RemixText v-bind="wordProps" :colour="`var(--wallpaper-text-colour, ${c.word})`" @measure="wordBox = $event" />
  </div>

  <RemixPortrait :player="model.player" :layout="layout" :recipe="recipe" />

  <!-- Pop-out copy in front of the body -->
  <div v-if="popOut && wordProps" class="pointer-events-none absolute" :style="{ ...frontStyle, ...frontMask }" aria-hidden="true" data-remix-front>
    <RemixText v-bind="wordProps" :colour="wordColour" />
  </div>

  <!-- Lettering in front of the photo -->
  <div
    v-if="wordProps && model.text.text && word?.front"
    v-scheduler-element="el('player-name', 'Word', { textContrast: true })"
    class="absolute"
    :style="{ left: `${word!.x}px`, top: `${word!.y}px` }"
  >
    <RemixText v-bind="wordProps" :colour="`var(--wallpaper-text-colour, ${c.word})`" @measure="wordBox = $event" />
  </div>

  <RemixHero v-if="hero" :recipe="recipe" :stat="hero" :layout="layout" />
  <RemixStats :recipe="recipe" :stats="model.stats" :slots="slots" :layout="layout" />

  <div
    v-scheduler-element="el('brand', 'Club logo')"
    class="absolute flex items-center justify-center rounded-full"
    :class="recipe.depth.emboss ? 'size-[150px]' : 'size-[88px]'"
    :style="{ left: `${sk.crest.x - (recipe.depth.emboss ? 31 : 0)}px`, top: `${sk.crest.y - (recipe.depth.emboss ? 31 : 0)}px`, ...badgeStyle }"
  >
    <SchedulerArtworkAsset :key="model.player.clubCode" :src="model.player.crestUrl" :label="`${model.player.club} logo`" decorative class="size-[88px]" />
  </div>

  <p
    v-if="recipe.accents.season && sk.season && seasonText"
    v-scheduler-element="el('season', 'Season')"
    class="wp-numbers absolute text-[32px] font-semibold uppercase tracking-[0.24em]"
    :style="{ top: `${sk.season.y}px`, ...(sk.season.align === 'right' ? { right: `${1080 - sk.season.x}px` } : { left: `${sk.season.x}px` }), color: `var(--wallpaper-text-colour, ${c.muted})` }"
  >{{ seasonText }}</p>

  <div
    v-if="recipe.accents.ticker && sk.ticker"
    v-scheduler-element="el('ticker', 'Ticker')"
    class="wp-numbers absolute left-0 top-[2236px] flex h-[60px] w-[1080px] items-center overflow-hidden whitespace-nowrap border-y-2 text-[26px] font-semibold tracking-[0.34em]"
    :style="{ borderColor: c.muted, color: `var(--wallpaper-text-colour, ${c.muted})` }"
    aria-hidden="true"
  >
    <span class="-ml-[120px]">{{ ticker }}</span>
  </div>
</template>
