<script setup lang="ts">
import { useRemixFit } from '~/composables/useRemixFit'
import { mixColour } from '~/utils/wallpaper'
import { lightVector, type Light, type RemixFont, type WordTreatment } from '~/utils/wallpaper-remix'

// One fitted line of display type with an optional depth treatment.
// Extrusion and echoes are stacked text-shadows and copies, which export reliably.
const props = withDefaults(defineProps<{
  text: string
  font: RemixFont
  length: number
  maxSize: number
  minSize: number
  colour: string
  treatment?: WordTreatment | 'flat'
  vertical?: boolean
  skew?: boolean
  // Extruded face colours must be real hex values.
  extrude?: { style: 'block' | 'long'; face: string; deep: string; field: string; light: Light } | null
  echo?: { colour: string; light: Light } | null
  // Pop-out: show only the part below this fraction of the box height (artboard orientation).
  split?: number | null
}>(), { treatment: 'solid', vertical: false, skew: false, extrude: null, echo: null, split: null })
const emit = defineEmits<{ measure: [{ width: number; height: number; size: number }] }>()

const display = computed(() => props.font.uppercase ? props.text.toLocaleUpperCase() : props.text)
const { size, width } = useRemixFit(() => ({ text: props.text, font: props.font, length: props.length, maxSize: props.maxSize, minSize: props.minSize }))
const lineHeight = computed(() => Math.round(size.value * (props.font.uppercase ? 0.86 : 1.02)))
const textWidth = computed(() => width.value || Math.round(props.length))
const box = computed(() => props.vertical ? { width: lineHeight.value, height: textWidth.value } : { width: textWidth.value, height: lineHeight.value })
watch(box, value => emit('measure', { ...value, size: size.value }), { immediate: true })

const shadows = computed(() => {
  const extrude = props.extrude
  if (!extrude) return 'none'
  const vector = lightVector(extrude.light)
  // In vertical text the glyphs are rotated, so the shadow vector rotates with them.
  const v = props.vertical ? { x: -vector.y, y: vector.x } : vector
  const long = extrude.style === 'long'
  const depth = Math.min(long ? 220 : 64, Math.round(size.value * (long ? 0.32 : 0.1)))
  const steps = Math.max(6, Math.min(long ? 44 : 28, Math.round(depth / 2.5)))
  const layers: string[] = []
  for (let index = 1; index <= steps; index++) {
    const t = index / steps
    const offset = depth * t
    const colour = long ? mixColour(extrude.deep, extrude.field, t * 0.9) : mixColour(mixColour(extrude.face, extrude.deep, 0.5), extrude.deep, t)
    layers.push(`${(v.x * offset).toFixed(1)}px ${(v.y * offset).toFixed(1)}px 0 ${colour}`)
  }
  if (!long) layers.push(`${(v.x * depth * 1.3).toFixed(1)}px ${(v.y * depth * 1.3 + 18).toFixed(1)}px 36px rgba(0,0,0,0.32)`)
  return layers.join(', ')
})

const echoes = computed(() => {
  if (!props.echo) return []
  const v = lightVector(props.echo.light)
  const step = Math.round(size.value * 0.055)
  return [2, 1].map(index => ({ index, x: v.x * step * index * 1.4, y: v.y * step * index * 1.4, opacity: 0.22 + 0.2 * (2 - index) }))
})

const strokeWidth = computed(() => Math.max(3, Math.round(size.value * 0.014)))
const maskStyle = computed(() => {
  const masks: string[] = []
  const sizes: string[] = []
  const repeats: string[] = []
  if (props.treatment === 'halftone') {
    masks.push('linear-gradient(to bottom, transparent 30%, #000 82%)', 'radial-gradient(circle at center, #000 0 44%, transparent 52%)')
    sizes.push('100% 100%', '20px 20px')
    repeats.push('no-repeat', 'repeat')
  }
  if (props.split != null) {
    const at = Math.round(Math.min(1, Math.max(0, props.split)) * 1000) / 10
    // Vertical text is rotated -90°, so the artboard's downward direction is the glyphs' leftward one.
    masks.push(`linear-gradient(${props.vertical ? 'to left' : 'to bottom'}, transparent ${at}%, #000 ${Math.min(100, at + 2.5)}%)`)
    sizes.push('100% 100%')
    repeats.push('no-repeat')
  }
  if (!masks.length) return {}
  const image = masks.join(', ')
  return { maskImage: image, WebkitMaskImage: image, maskSize: sizes.join(', '), WebkitMaskSize: sizes.join(', '), maskRepeat: repeats.join(', '), WebkitMaskRepeat: repeats.join(', ') }
})

function glyphStyle(kind: 'main' | 'echo', offset = { x: 0, y: 0 }) {
  const transforms: string[] = []
  if (offset.x || offset.y) transforms.push(`translate(${offset.x}px, ${offset.y}px)`)
  if (props.vertical) transforms.push('rotate(-90deg)')
  if (props.skew) transforms.push('skewX(-9deg)')
  const outline = kind === 'echo' || props.treatment === 'outline'
  return {
    fontFamily: props.font.family,
    fontWeight: props.font.weight,
    fontStyle: props.font.style,
    fontSize: `${size.value}px`,
    lineHeight: `${lineHeight.value}px`,
    top: props.vertical ? `${textWidth.value}px` : '0px',
    transform: transforms.join(' ') || undefined,
    transformOrigin: props.vertical ? '0 0' : '50% 50%',
    color: outline ? 'transparent' : props.colour,
    WebkitTextStroke: outline ? `${strokeWidth.value}px ${kind === 'echo' ? props.echo?.colour : props.colour}` : undefined,
    opacity: props.treatment === 'ghost' && kind === 'main' ? 0.2 : undefined,
    textShadow: kind === 'main' ? shadows.value : undefined,
  }
}
</script>

<template>
  <div class="relative" :style="{ width: `${box.width}px`, height: `${box.height}px` }">
    <span
      v-for="item in echoes"
      :key="item.index"
      aria-hidden="true"
      class="absolute left-0 block whitespace-nowrap"
      :style="{ ...glyphStyle('echo', item), opacity: item.opacity }"
    >{{ display }}</span>
    <span class="absolute left-0 block whitespace-nowrap" :style="{ ...glyphStyle('main'), ...maskStyle }">{{ display }}</span>
  </div>
</template>
