<script setup lang="ts">
import type { ArticleImage } from '~/shared/article-images'
const props = defineProps<{ image: ArticleImage; eager?: boolean }>()
// Reserve the frame before the photo loads, within a calm range of shapes, so nothing below it moves.
const ratio = computed(() => {
  const { width, height } = props.image
  const value = width && height ? width / height : 16 / 9
  return Math.min(Math.max(value, 4 / 3), 21 / 9)
})
const hasCredit = computed(() => props.image.credit || props.image.license)
</script>

<template>
  <figure class="my-8 max-w-[68ch]">
    <div class="relative w-full overflow-hidden rounded-md bg-stone-500/10" :style="{ aspectRatio: String(ratio) }">
      <img :src="image.src" :alt="image.alt" :width="image.width || undefined" :height="image.height || undefined" :loading="eager ? 'eager' : 'lazy'" decoding="async" class="absolute inset-0 size-full object-cover" draggable="false">
    </div>
    <figcaption v-if="image.caption || hasCredit" class="mt-3 text-sm leading-6 text-stone-400">
      <span v-if="image.caption">{{ image.caption }}</span>
      <span v-if="hasCredit" class="text-xs" :class="image.caption ? 'ml-2' : ''">
        Photo:
        <a v-if="image.creditUrl" :href="image.creditUrl" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">{{ image.credit || 'source' }}</a><span v-else>{{ image.credit }}</span><template v-if="image.license"> · <a v-if="image.licenseUrl" :href="image.licenseUrl" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">{{ image.license }}</a><span v-else>{{ image.license }}</span></template>
      </span>
    </figcaption>
  </figure>
</template>
