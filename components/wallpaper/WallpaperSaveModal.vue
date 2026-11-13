<script setup lang="ts">
import type { WallpaperDevice } from '~/utils/wallpaper-devices'
const open = defineModel<boolean>('open', { default: false })
defineProps<{ device: WallpaperDevice; busy: boolean; phase: string; error: string; imageUrl: string; canShare: boolean; sharing: boolean; playerName: string }>()
const emit = defineEmits<{ download: []; share: []; retry: [] }>()
</script>

<template>
  <UModal v-model:open="open" :title="`${playerName} wallpaper`" :description="device === 'iphone' ? 'Sized for iPhone (19.5:9).' : 'Sized for Android (20:9).'" :ui="{ content: 'rounded-none sm:max-w-md border-t-2 border-t-[#c8ff3d] bg-[#101216]', footer: 'justify-end gap-2' }">
    <template #body>
      <div class="flex min-h-[16rem] flex-col items-center justify-center gap-4">
        <div v-if="busy" class="flex flex-col items-center gap-3 py-10 text-sm text-stone-300" role="status" aria-live="polite">
          <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-[#c8ff3d] motion-reduce:animate-none" aria-hidden="true" />
          {{ phase || 'Preparing…' }}
        </div>
        <div v-else-if="error" class="flex flex-col items-center gap-3 py-8 text-center" role="alert">
          <p class="max-w-xs text-sm text-stone-200">{{ error }}</p>
          <UButton label="Try again" icon="i-lucide-refresh-cw" color="neutral" variant="soft" @click="emit('retry')" />
        </div>
        <template v-else-if="imageUrl">
          <img :src="imageUrl" :alt="`${playerName} wallpaper preview`" class="max-h-[52dvh] w-auto shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
          <ol class="w-full space-y-1 text-xs leading-relaxed text-stone-400">
            <template v-if="device === 'iphone'">
              <li>1. Tap <strong class="text-stone-200">Share</strong> and choose <strong class="text-stone-200">Save Image</strong>, or press and hold the image.</li>
              <li>2. In Photos, open it and choose <strong class="text-stone-200">Use as Wallpaper</strong>.</li>
            </template>
            <template v-else>
              <li>1. Download the PNG, or share it to your gallery app.</li>
              <li>2. Open it and choose <strong class="text-stone-200">Set as wallpaper</strong>.</li>
            </template>
          </ol>
        </template>
      </div>
    </template>
    <template #footer>
      <UButton label="Close" color="neutral" variant="ghost" @click="open = false" />
      <UButton v-if="canShare" :loading="sharing" :disabled="busy || !imageUrl" label="Share" icon="i-lucide-share" color="neutral" variant="soft" @click="emit('share')" />
      <UButton :disabled="busy || !imageUrl" label="Download PNG" icon="i-lucide-download" color="primary" @click="emit('download')" />
    </template>
  </UModal>
</template>
