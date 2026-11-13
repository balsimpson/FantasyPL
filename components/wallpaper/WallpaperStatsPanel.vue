<script setup lang="ts">
import { cleanWallpaperText, formatWallpaperStat, wallpaperStatKeys, wallpaperStatLabel, type WallpaperDesign, type WallpaperPlayer, type WallpaperStatKey } from '~/utils/wallpaper'
const props = defineProps<{ design: WallpaperDesign; player: WallpaperPlayer; stats: WallpaperStatKey[]; text: string; customised: boolean }>()
const emit = defineEmits<{ stat: [slot: number, key: WallpaperStatKey]; text: [value: string]; reset: [] }>()
function updateText(value: string | number) {
  if (props.design.text) emit('text', cleanWallpaperText(String(value), props.design.text.maxLength))
}
</script>

<template>
  <div class="space-y-5">
    <section v-for="slot in design.slots" :key="slot">
      <h2 class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{{ design.slotNames[slot] }}</h2>
      <div class="-mx-1 flex flex-wrap gap-1.5 px-1" role="radiogroup" :aria-label="design.slotNames[slot]">
        <button v-for="key in wallpaperStatKeys" :key="key" type="button" role="radio" :aria-checked="stats[slot] === key" class="flex h-8 items-center gap-1.5 px-2.5 text-xs transition-colors" :class="stats[slot] === key ? 'bg-white font-semibold text-black' : 'bg-white/5 text-stone-300 hover:bg-white/10'" @click="emit('stat', slot, key)">
          {{ wallpaperStatLabel(key) }}<span class="tabular-nums opacity-60">{{ formatWallpaperStat(player, key) }}</span>
        </button>
      </div>
    </section>
    <section v-if="design.text">
      <h2 class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{{ design.text.label }}</h2>
      <UInput :model-value="text" :maxlength="design.text.maxLength" :placeholder="`${design.text.auto} (automatic)`" :aria-label="design.text.label" class="w-full" :ui="{ root: 'w-full', base: 'w-full' }" @update:model-value="updateText" />
      <p class="mt-1.5 text-xs text-stone-500">Leave empty to use the {{ design.text.auto.toLowerCase() }}.</p>
    </section>
    <UButton v-if="customised" label="Use recommended stats" icon="i-lucide-rotate-ccw" color="neutral" variant="ghost" size="sm" class="-ml-2" @click="emit('reset')" />
  </div>
</template>
