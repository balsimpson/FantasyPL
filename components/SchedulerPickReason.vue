<script setup lang="ts">
import type { InstagramPostStory } from '~/utils/instagram-templates'

const props = defineProps<{ story: InstagramPostStory }>()
const styles: Record<string, { icon: string; colour: string; label?: string }> = {
  differential: { icon: 'i-lucide-gem', colour: 'bg-violet-400 text-violet-950', label: 'Differential' },
  bought: { icon: 'i-lucide-trending-up', colour: 'bg-emerald-300 text-emerald-950' },
  sold: { icon: 'i-lucide-trending-down', colour: 'bg-rose-300 text-rose-950' },
  budget: { icon: 'i-lucide-wallet', colour: 'bg-sky-300 text-sky-950' },
  form: { icon: 'i-lucide-flame', colour: 'bg-orange-300 text-orange-950' },
  standout: { icon: 'i-lucide-trophy', colour: 'bg-amber-300 text-amber-950' },
}
const visual = computed(() => styles[props.story.id] ?? { icon: 'i-lucide-star', colour: 'bg-white text-zinc-950' })
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-start gap-1 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-1.5 pb-2 pt-6">
    <span class="inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-1 text-[9px] leading-tight font-bold shadow-sm sm:text-[10px]" :class="visual.colour">
      <UIcon :name="visual.icon" class="size-3 shrink-0" aria-hidden="true" />
      <span>{{ visual.label ?? story.label }}</span>
    </span>
    <span class="text-[9px] leading-snug font-medium text-white sm:text-[10px]">{{ story.evidence }}</span>
  </div>
</template>
