<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { SchedulerLayout } from '~/utils/scheduler-layout'
import type { WallpaperRecipe } from '~/utils/wallpaper-remix'

// Field, backdrop shape, light, floor and finish for a remix. All SVG, drawn once.
const props = defineProps<{ recipe: WallpaperRecipe; layout: SchedulerLayout }>()
const id = useId()
const c = computed(() => props.recipe.colours)
const kind = computed(() => props.recipe.backdrop.kind)
const variant = computed(() => props.recipe.backdrop.variant)
const angle = computed(() => props.recipe.backdrop.angle)
const glow = computed(() => props.recipe.skeleton.glow)

// The rim light follows the portrait if it has been moved.
const head = computed(() => {
  const { portrait } = props.recipe.skeleton
  const change = props.layout.portrait
  const scale = change?.scale ?? 1
  return { x: portrait.x + (change?.x ?? 0) + portrait.size * scale / 2, y: portrait.y + (change?.y ?? 0) + portrait.size * scale * 0.34, r: portrait.size * scale * 0.62 }
})

const rays = computed(() => {
  const count = 28
  const { x, y } = glow.value
  return Array.from({ length: count / 2 }, (_, index) => {
    const a1 = (index * 2) / count * Math.PI * 2 + angle.value * Math.PI / 180
    const a2 = (index * 2 + 1) / count * Math.PI * 2 + angle.value * Math.PI / 180
    return `${x},${y} ${x + Math.cos(a1) * 2800},${y + Math.sin(a1) * 2800} ${x + Math.cos(a2) * 2800},${y + Math.sin(a2) * 2800}`
  })
})

// Perspective floor: lines run to one vanishing point; cross lines get closer toward the horizon.
const floor = computed(() => {
  const top = 1640
  const vp = { x: 540, y: 1180 }
  const radials = Array.from({ length: 19 }, (_, index) => -1620 + index * 240).map(x => ({ x1: vp.x, y1: vp.y, x2: x, y2: 2400 }))
  const cross = Array.from({ length: 9 }, (_, index) => top + (2400 - top) * ((index + 1) / 9) ** 1.7)
  return { top, radials, cross }
})

const stripes = computed(() => [
  { x: 640, w: 150, o: 0.9 },
  { x: 820, w: 46, o: 0.75 },
  { x: 900, w: 18, o: 0.6 },
  { x: 120, w: 70, o: 0.35 },
])
</script>

<template>
  <div v-scheduler-element="{ id: 'backdrop', label: 'Backdrop', layout }" class="absolute inset-0 -z-10" aria-hidden="true">
    <svg class="absolute inset-0" width="1080" height="2400" viewBox="0 0 1080 2400">
      <defs>
        <linearGradient :id="`${id}-base`" :x1="variant % 2 ? 0 : 0.5" y1="0" :x2="variant % 2 ? 1 : 0.5" y2="1">
          <stop offset="0" :stop-color="c.field" />
          <stop offset="1" :stop-color="c.field2" />
        </linearGradient>
        <radialGradient :id="`${id}-glow`" :cx="glow.x / 1080" :cy="glow.y / 2400" r="0.55">
          <stop offset="0" :stop-color="c.glow" stop-opacity="0.85" />
          <stop offset="0.55" :stop-color="c.glow" stop-opacity="0.18" />
          <stop offset="1" :stop-color="c.glow" stop-opacity="0" />
        </radialGradient>
        <radialGradient :id="`${id}-rim`">
          <stop offset="0" :stop-color="c.glow" stop-opacity="0.75" />
          <stop offset="0.45" :stop-color="c.glow" stop-opacity="0.32" />
          <stop offset="1" :stop-color="c.glow" stop-opacity="0" />
        </radialGradient>
        <linearGradient :id="`${id}-beam`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" :stop-color="c.glow" stop-opacity="0.55" />
          <stop offset="1" :stop-color="c.glow" stop-opacity="0" />
        </linearGradient>
        <radialGradient :id="`${id}-fade`" :cx="glow.x / 1080" :cy="glow.y / 2400" r="0.7">
          <stop offset="0" stop-color="#fff" stop-opacity="1" />
          <stop offset="1" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
        <mask :id="`${id}-fade-mask`"><rect width="1080" height="2400" :fill="`url(#${id}-fade)`" /></mask>
        <pattern :id="`${id}-dots`" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <circle cx="9" cy="9" r="3.4" :fill="c.alt" />
        </pattern>
        <radialGradient :id="`${id}-corner`" :cx="variant % 2 ? 1 : 0" :cy="variant < 2 ? 0 : 1" r="1">
          <stop offset="0" stop-color="#fff" stop-opacity="1" />
          <stop offset="0.6" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
        <mask :id="`${id}-corner-mask`"><rect width="1080" height="2400" :fill="`url(#${id}-corner)`" /></mask>
        <linearGradient :id="`${id}-floor`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff" stop-opacity="0" />
          <stop offset="0.35" stop-color="#fff" stop-opacity="0.9" />
          <stop offset="1" stop-color="#fff" stop-opacity="1" />
        </linearGradient>
        <mask :id="`${id}-floor-mask`"><rect :y="floor.top - 200" width="1080" :height="2600 - floor.top" :fill="`url(#${id}-floor)`" /></mask>
        <filter v-if="recipe.finish === 'grain'" :id="`${id}-grain`" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="table" tableValues="0 0.55" /></feComponentTransfer>
        </filter>
      </defs>

      <rect width="1080" height="2400" :fill="`url(#${id}-base)`" />

      <g v-if="kind === 'rings'" fill="none" :stroke="c.alt">
        <circle :cx="variant % 2 ? 1010 : 70" :cy="glow.y" r="560" stroke-width="130" />
        <circle :cx="variant % 2 ? 1010 : 70" :cy="glow.y" r="350" stroke-width="54" opacity="0.75" />
        <path :d="`M -40 ${glow.y + 460} C 300 ${glow.y + 320} 700 ${glow.y + 400} 1120 ${glow.y + 260}`" stroke-width="34" opacity="0.6" />
      </g>

      <rect v-else-if="kind === 'glow'" width="1080" height="2400" :fill="`url(#${id}-glow)`" />

      <g v-else-if="kind === 'beams'" :fill="`url(#${id}-beam)`">
        <polygon :points="`-60,0 140,0 ${glow.x + 80},2400 ${glow.x - 360},2400`" />
        <polygon :points="`940,0 1140,0 ${glow.x + 360},2400 ${glow.x - 80},2400`" />
        <polygon :points="`${glow.x - 70},0 ${glow.x + 70},0 ${glow.x + 260},2400 ${glow.x - 260},2400`" opacity="0.6" />
        <rect width="1080" height="2400" :fill="`url(#${id}-glow)`" opacity="0.6" />
      </g>

      <g v-else-if="kind === 'diagonal'" :transform="`rotate(${angle / 3} 540 1200)`">
        <polygon points="0,0 470,0 0,760" fill="#000" opacity="0.12" />
        <polygon :points="variant % 2 ? '700,-40 1140,-40 1140,1620 850,1700' : '-60,-40 380,-40 230,1700 -60,1620'" :fill="c.alt" />
        <polygon points="0,1380 420,1960 0,2180" :fill="c.alt" opacity="0.85" />
        <polygon points="540,2440 1140,1880 1140,2440" :fill="c.alt" />
      </g>

      <rect v-else-if="kind === 'halftone'" width="1080" height="2400" :fill="`url(#${id}-dots)`" :mask="`url(#${id}-corner-mask)`" opacity="0.55" />

      <g v-else-if="kind === 'sunburst'" :mask="`url(#${id}-fade-mask)`" :fill="c.alt" opacity="0.32">
        <polygon v-for="(points, index) in rays" :key="index" :points="points" />
      </g>

      <g v-else-if="kind === 'stripes'" :transform="`rotate(${angle} 540 1200)`" :fill="c.alt">
        <rect v-for="(stripe, index) in stripes" :key="index" :x="variant % 2 ? 1080 - stripe.x - stripe.w : stripe.x" y="-600" :width="stripe.w" height="3600" :opacity="stripe.o" />
      </g>

      <g v-else-if="kind === 'arc'">
        <circle :cx="[540, 980, 100, 540][variant]" :cy="variant === 3 ? 2900 : 1980" :r="variant === 3 ? 1500 : 940" :fill="c.alt" opacity="0.9" />
        <circle :cx="[540, 980, 100, 540][variant]" :cy="variant === 3 ? 2900 : 1980" :r="variant === 3 ? 1560 : 1000" fill="none" :stroke="c.alt" stroke-width="6" opacity="0.5" />
      </g>

      <!-- Rim light behind the head (layered and sculpted depth) -->
      <ellipse v-if="recipe.depth.rim" :cx="head.x" :cy="head.y" :rx="head.r" :ry="head.r * 1.15" :fill="`url(#${id}-rim)`" />

      <!-- Perspective floor (sculpted) -->
      <g v-if="recipe.depth.floor" :mask="`url(#${id}-floor-mask)`" :stroke="c.ink" stroke-opacity="0.22" stroke-width="3">
        <line v-for="(line, index) in floor.radials" :key="`r${index}`" :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2" />
        <line v-for="(y, index) in floor.cross" :key="`c${index}`" x1="0" x2="1080" :y1="y" :y2="y" />
      </g>

      <rect v-if="recipe.accents.frame" x="40" y="40" width="1000" height="2320" fill="none" :stroke="c.muted" stroke-width="3" opacity="0.7" />

      <rect v-if="recipe.finish === 'grain'" width="1080" height="2400" :filter="`url(#${id}-grain)`" opacity="0.16" />
    </svg>
  </div>
</template>
