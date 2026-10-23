<script setup lang="ts">
const props = withDefaults(defineProps<{ src: string, label: string, cover?: boolean, decorative?: boolean }>(), { cover: false, decorative: false })
const state = ref<'loading' | 'ready' | 'missing'>('loading')
const image = useTemplateRef('image')
function inspect() {
  if (image.value?.complete) state.value = image.value.naturalWidth > 0 ? 'ready' : 'missing'
}
onMounted(inspect)
watch(() => props.src, async () => { state.value = 'loading'; await nextTick(); inspect() })
</script>

<template>
  <div :data-asset-state="state" class="overflow-hidden">
    <img v-if="state !== 'missing'" ref="image" :key="src" :src="src" :alt="decorative ? '' : label" :aria-hidden="decorative || undefined" crossorigin="anonymous" class="h-full w-full" :class="cover ? 'object-cover' : 'object-contain object-bottom'" @load="state = 'ready'" @error="state = 'missing'" />
    <div v-else-if="!decorative" class="flex h-full w-full flex-col items-center justify-center gap-2 bg-black/5 p-2 text-center" role="img" :aria-label="`${label} unavailable`">
      <span class="text-[0.35em] leading-tight">{{ label }} unavailable</span>
    </div>
  </div>
</template>
