<script setup lang="ts">
// Fits one line of display text to a width, after its font has loaded.
const props = withDefaults(defineProps<{ text: string; width: number; maxSize: number; minSize?: number; family: string; weight?: number | string; tracking?: number; uppercase?: boolean; tag?: string }>(), { minSize: 40, weight: 400, tracking: 0, uppercase: false, tag: 'span' })
const size = ref(props.maxSize)
// Lets the editor re-measure item boxes once fitted text settles.
const fitTick = useState('wallpaper-fit-tick', () => 0)
const display = computed(() => props.uppercase ? props.text.toLocaleUpperCase() : props.text)
let request = 0
async function fit() {
  if (!import.meta.client) return
  const revision = ++request
  const font = `${props.weight} ${props.maxSize}px ${props.family}`
  try { await document.fonts.load(font, display.value) } catch { /* fall back to the system font metrics */ }
  if (revision !== request) return
  const context = document.createElement('canvas').getContext('2d')
  if (!context) return
  context.font = font
  const measured = context.measureText(display.value).width + props.tracking * props.maxSize * Math.max(0, display.value.length - 1)
  size.value = measured > 0 ? Math.max(props.minSize, Math.min(props.maxSize, Math.floor(props.maxSize * props.width / measured))) : props.maxSize
  await nextTick()
  fitTick.value++
}
onMounted(fit)
watch(() => [props.text, props.width, props.maxSize, props.family], fit)
</script>

<template>
  <component :is="tag" class="block whitespace-nowrap leading-[0.86]" :style="{ fontFamily: family, fontWeight: weight, fontSize: `${size}px`, letterSpacing: `${tracking}em` }">{{ display }}</component>
</template>
