<script setup lang="ts">
import type { InstagramDraft } from '~/utils/instagram-templates'
import SchedulerPostArtwork from '~/components/SchedulerPostArtwork.vue'
defineProps<{ draft: InstagramDraft }>()
const container = useTemplateRef('container')
const artwork = useTemplateRef('artwork')
const scale = ref(0)
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(entries => { scale.value = entries[0]!.contentRect.width / 1080 })
  if (container.value) observer.observe(container.value)
})
onBeforeUnmount(() => observer?.disconnect())
defineExpose({ getElement: () => artwork.value })
</script>

<template>
  <div ref="container" class="relative aspect-square w-full overflow-hidden">
    <div ref="artwork" class="absolute top-0 left-0 h-[1080px] w-[1080px] origin-top-left" :style="{ transform: `scale(${scale})` }">
      <SchedulerPostArtwork :draft="draft" />
    </div>
  </div>
</template>
