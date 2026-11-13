<script setup lang="ts">
import { getWallpaperColours, wallpaperDesigns, type WallpaperArtworkModel, type WallpaperDesignId, type WallpaperPalette } from '~/utils/wallpaper'
import WallpaperThumb from '~/components/wallpaper/WallpaperThumb.vue'
const props = defineProps<{ design: WallpaperDesignId; palette: WallpaperPalette; clubCode: number; club: string; modelFor: (design: WallpaperDesignId) => WallpaperArtworkModel | undefined; thumbWidth?: number; row?: boolean }>()
const emit = defineEmits<{ 'update:design': [WallpaperDesignId]; 'update:palette': [WallpaperPalette] }>()
const palettes = computed(() => (['signature', 'club'] as const).map(value => ({ value, label: value === 'signature' ? 'Signature' : `${props.club} colours`, colours: getWallpaperColours(props.design, value, props.clubCode) })))
</script>

<template>
  <div class="space-y-5">
    <section>
      <h2 class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">Design</h2>
      <div :class="row ? '-mx-4 flex gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1' : 'grid grid-cols-3 gap-3'" role="radiogroup" aria-label="Design">
        <button v-for="item in wallpaperDesigns" :key="item.id" type="button" role="radio" :aria-checked="design === item.id" :title="item.description" class="group shrink-0 text-left" @click="emit('update:design', item.id)">
          <span class="block overflow-hidden transition-[box-shadow,transform] duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none" :class="design === item.id ? 'shadow-[0_0_0_2px_#c8ff3d]' : 'shadow-[0_0_0_1px_rgba(255,255,255,0.1)]'">
            <WallpaperThumb v-if="modelFor(item.id)" :model="modelFor(item.id)!" :width="thumbWidth ?? 80" />
          </span>
          <span class="mt-1.5 block truncate text-[11px] font-medium" :class="design === item.id ? 'text-white' : 'text-stone-400'">{{ item.name }}</span>
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
    </section>
  </div>
</template>
