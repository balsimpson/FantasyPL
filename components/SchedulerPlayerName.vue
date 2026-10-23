<script setup lang="ts">
import type { InstagramPlayer } from '~/utils/instagram-templates'
const props = withDefaults(defineProps<{ player: InstagramPlayer, width: number, maxSize?: number, singleLine?: boolean }>(), { maxSize: 150, singleLine: false })
const lines = computed(() => props.singleLine ? [props.player.fullName] : [props.player.firstName, props.player.lastName])
const sizes = ref<number[]>([])
const state = ref('loading')
let request = 0
async function fit() {
  const revision = ++request
  state.value = 'loading'
  try {
    await document.fonts.load(`${props.maxSize}px FPLDisplay`)
    if (revision !== request) return
    const context = document.createElement('canvas').getContext('2d')!
    context.font = `${props.maxSize}px FPLDisplay`
    sizes.value = lines.value.map(line => Math.min(props.maxSize, Math.floor(props.maxSize * props.width / Math.max(1, context.measureText(line.toUpperCase()).width))))
    state.value = 'ready'
  } catch { state.value = 'missing' }
}
onMounted(fit)
watch(() => [props.player.id, props.width, props.maxSize, props.singleLine], () => { if (import.meta.client) fit() })
</script>

<template>
  <h2 :data-asset-state="state" :aria-label="player.fullName" class="font-[FPLDisplay] font-normal uppercase leading-[1.08] tracking-[-0.025em]" :style="{ width: `${width}px` }">
    <span v-for="(line, index) in lines" :key="index" class="block whitespace-nowrap" :style="{ fontSize: `${sizes[index] ?? Math.min(maxSize, width / Math.max(line.length * 0.6, 1))}px` }">{{ line }}</span>
  </h2>
</template>
