<script setup lang="ts">
import type { WallpaperDevice } from '~/utils/wallpaper-devices'

const props = defineProps<{ device: WallpaperDevice; colour: string; now: number; clockOpacity: number }>()
const date = computed(() => new Date(props.now))
const day = computed(() => new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(date.value))
const time = computed(() => new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }).format(date.value))
</script>

<template>
  <div class="pointer-events-none absolute inset-0 select-none font-sans" :style="{ color: colour }" aria-hidden="true">
    <div class="absolute inset-x-0 top-[6.6%] z-10 text-center transition-opacity duration-200 motion-reduce:transition-none" :style="{ opacity: clockOpacity }">
      <p class="text-[5cqw] font-semibold">{{ day }}</p>
      <p class="font-semibold leading-none tracking-tight tabular-nums" :class="device === 'iphone' ? 'text-[25cqw]' : 'text-[23cqw]'">{{ time }}</p>
    </div>
    <div class="absolute inset-x-[11%] bottom-[4.6%] z-50 flex justify-between text-white" data-lock-shortcuts>
      <span class="grid size-[13cqw] place-items-center rounded-full bg-black/60">
        <UIcon :name="device === 'iphone' ? 'i-lucide-flashlight' : 'i-lucide-wallet'" class="size-[5.4cqw]" />
      </span>
      <span class="grid size-[13cqw] place-items-center rounded-full bg-black/60">
        <UIcon name="i-lucide-camera" class="size-[5.4cqw]" />
      </span>
    </div>
  </div>
</template>
