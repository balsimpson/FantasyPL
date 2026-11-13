<script setup lang="ts">
import { getWallpaperColours, getWallpaperDesign, wallpaperDesigns, type WallpaperArtworkModel, type WallpaperDesignId, type WallpaperPalette } from '~/utils/wallpaper'
import WallpaperThumb from '~/components/wallpaper/WallpaperThumb.vue'
const props = defineProps<{
  design: WallpaperDesignId; palette: WallpaperPalette; clubCode: number; club: string; modelFor: (design: WallpaperDesignId) => WallpaperArtworkModel | undefined
  row?: boolean; background?: string; backdrop?: WallpaperDesignId | null
  // Set while a generated remix is shown.
  remix?: { label: string; model: WallpaperArtworkModel } | null
  colourFor?: (palette: WallpaperPalette) => { field: string; alt: string }
}>()
const emit = defineEmits<{ 'update:design': [WallpaperDesignId]; 'update:palette': [WallpaperPalette]; 'update:background': [string] }>()
const palettes = computed(() => (['signature', 'club'] as const).map(value => ({
  value,
  label: value === 'signature' ? (props.remix ? 'Remix colours' : 'Signature') : `${props.club} colours`,
  colours: props.colourFor ? props.colourFor(value) : getWallpaperColours(props.design, value, props.clubCode),
})))
</script>

<template>
  <div class="space-y-5">
    <section>
      <div class="mb-2 flex items-center justify-between gap-2 text-xs">
        <h2 class="font-semibold uppercase tracking-[0.14em] text-stone-400">Design</h2>
        <p v-if="backdrop && !remix" class="truncate text-stone-400" role="status">{{ getWallpaperDesign(backdrop).name }} backdrop</p>
      </div>
      <div v-if="remix" class="mb-3 flex items-center gap-3 border-b border-white/8 pb-3" :class="row && '-mx-4 px-4'">
        <span class="block w-14 shrink-0 overflow-hidden shadow-[0_0_0_2px_#c8ff3d]"><WallpaperThumb :model="remix.model" /></span>
        <p class="min-w-0 text-xs leading-relaxed text-stone-300" role="status"><span class="block font-semibold text-white">Remix</span>{{ remix.label }}</p>
      </div>
      <div :class="row ? '-mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1' : 'grid grid-cols-3 gap-3'" role="radiogroup" aria-label="Design">
        <button v-for="item in wallpaperDesigns" :key="item.id" type="button" role="radio" :aria-checked="!remix && design === item.id" :title="item.description" class="group min-w-0 shrink-0 text-left" :class="row && 'w-16'" @click="emit('update:design', item.id)">
          <span class="block overflow-hidden transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none" :class="!remix && design === item.id ? 'shadow-[0_0_0_2px_#c8ff3d]' : 'shadow-[0_0_0_1px_rgba(255,255,255,0.1)]'">
            <WallpaperThumb v-if="modelFor(item.id)" :model="modelFor(item.id)!" />
          </span>
          <span class="mt-1.5 block truncate text-[11px] font-medium" :class="!remix && design === item.id ? 'text-white' : 'text-stone-400'">{{ item.name }}</span>
        </button>
      </div>
    </section>
    <section>
      <h2 class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Colour</h2>
      <div class="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Colour">
        <button v-for="item in palettes" :key="item.value" type="button" role="radio" :aria-checked="palette === item.value" class="flex h-11 min-w-0 items-center gap-2.5 px-3 text-left text-xs font-semibold transition-colors" :class="palette === item.value ? 'bg-white text-black' : 'bg-white/5 text-stone-300 hover:bg-white/10'" @click="emit('update:palette', item.value)">
          <span class="flex shrink-0 -space-x-1.5" aria-hidden="true">
            <span class="size-4 rounded-full ring-2 ring-black/30" :style="{ backgroundColor: item.colours.field }" />
            <span class="size-4 rounded-full ring-2 ring-black/30" :style="{ backgroundColor: item.colours.alt }" />
          </span>
          <span class="truncate">{{ item.label }}</span>
        </button>
      </div>
      <label class="mt-2 flex min-h-11 cursor-pointer items-center gap-2.5 bg-white/5 px-3 text-xs font-semibold text-stone-300 focus-within:ring-1 focus-within:ring-primary" :class="palette === 'custom' && 'ring-1 ring-primary'">
        <input type="color" aria-label="Custom background" :value="background" class="size-7 cursor-pointer bg-transparent" @input="emit('update:background', ($event.target as HTMLInputElement).value)">
        <span class="flex-1">Custom background</span>
        <span v-if="palette === 'custom'" class="font-mono text-stone-400">{{ background }}</span>
      </label>
    </section>
  </div>
</template>
