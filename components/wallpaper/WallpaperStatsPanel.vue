<script setup lang="ts">
import { cleanWallpaperText, formatWallpaperStat, wallpaperStatKeys, wallpaperStatLabel, type WallpaperDesign, type WallpaperPlayer, type WallpaperStatKey } from '~/utils/wallpaper'
const props = defineProps<{ design: WallpaperDesign; player: WallpaperPlayer; stats: WallpaperStatKey[]; text: string; customised: boolean }>()
const emit = defineEmits<{ stat: [slot: number, key: WallpaperStatKey]; text: [value: string]; reset: [] }>()
const statOptions = computed(() => wallpaperStatKeys.map(key => ({
  value: key,
  label: `${wallpaperStatLabel(key)} · ${formatWallpaperStat(props.player, key)}`,
})))

function updateText(value: string | number) {
  if (props.design.text) emit('text', cleanWallpaperText(String(value), props.design.text.maxLength))
}
</script>

<template>
  <div class="space-y-3">
    <UFormField v-for="slot in design.slots" :key="slot" :label="design.slotNames[slot]" class="w-full min-w-0" :ui="{ label: 'text-xs text-stone-400' }">
      <USelectMenu
        :model-value="stats[slot]"
        :items="statOptions"
        value-key="value"
        :aria-label="design.slotNames[slot]"
        :search-input="{ placeholder: 'Search stats', 'aria-label': 'Search stats' }"
        color="neutral"
        size="sm"
        class="w-full min-w-0"
        :ui="{ base: 'w-full min-w-0' }"
        @update:model-value="emit('stat', slot, $event)"
      />
    </UFormField>
    <section v-if="design.text">
      <h2 class="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">{{ design.text.label }}</h2>
      <UInput :model-value="text" :maxlength="design.text.maxLength" :placeholder="`${design.text.auto} (automatic)`" :aria-label="design.text.label" class="w-full" :ui="{ root: 'w-full', base: 'w-full' }" @update:model-value="updateText" />
      <p class="mt-1.5 text-xs text-stone-500">Leave empty to use the {{ design.text.auto.toLowerCase() }}.</p>
    </section>
    <UButton v-if="customised" label="Use recommended stats" icon="i-lucide-rotate-ccw" color="neutral" variant="ghost" size="sm" @click="emit('reset')" />
  </div>
</template>
