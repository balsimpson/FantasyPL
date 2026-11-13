<script setup lang="ts">
import type { WallpaperPlayer, WallpaperPosition } from '~/utils/wallpaper'
const props = defineProps<{ players: WallpaperPlayer[]; selectedCode?: number }>()
const emit = defineEmits<{ select: [code: number] }>()
const search = ref('')
const position = ref<'ALL' | WallpaperPosition>('ALL')
const positions = [{ value: 'ALL', label: 'All' }, { value: 'GK', label: 'GK' }, { value: 'DEF', label: 'DEF' }, { value: 'MID', label: 'MID' }, { value: 'FWD', label: 'FWD' }] as const
const fold = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
const results = computed(() => {
  const query = fold(search.value.trim())
  return props.players
    .filter(player => (position.value === 'ALL' || player.positionShort === position.value) && (!query || fold(`${player.fullName} ${player.name} ${player.club} ${player.teamShort}`).includes(query)))
    .sort((a, b) => (b.values.total_points ?? -1) - (a.values.total_points ?? -1) || a.id - b.id)
    .slice(0, 60)
})
</script>

<template>
  <div class="flex min-h-0 flex-col gap-3">
    <UInput v-model="search" type="search" icon="i-lucide-search" placeholder="Search players or clubs" aria-label="Search players or clubs" :maxlength="60" class="w-full" :ui="{ root: 'w-full', base: 'w-full' }" />
    <div class="flex gap-1" role="radiogroup" aria-label="Position">
      <button v-for="item in positions" :key="item.value" type="button" role="radio" :aria-checked="position === item.value" class="h-8 flex-1 text-xs font-semibold tracking-wide transition-colors" :class="position === item.value ? 'bg-white text-black' : 'bg-white/5 text-stone-300 hover:bg-white/10'" @click="position = item.value">{{ item.label }}</button>
    </div>
    <ul class="-mx-1 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1" aria-label="Players">
      <li v-for="player in results" :key="player.code">
        <button type="button" class="group flex w-full items-center gap-3 border-b border-white/8 py-2 text-left transition-colors" :class="player.code === selectedCode ? 'text-white' : 'text-stone-300 hover:text-white'" :aria-current="player.code === selectedCode || undefined" @click="emit('select', player.code)">
          <span class="relative h-12 w-12 shrink-0 overflow-hidden bg-white/5" :class="player.code === selectedCode ? 'ring-2 ring-[#c8ff3d]' : ''">
            <img :src="player.photoUrl" :alt="''" loading="lazy" decoding="async" class="h-full w-full object-contain object-bottom" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'">
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold">{{ player.name }}</span>
            <span class="block truncate text-xs text-stone-400">{{ player.club }} · {{ player.positionShort }}</span>
          </span>
          <span class="shrink-0 text-right tabular-nums">
            <span class="block text-sm font-semibold">{{ player.values.total_points ?? '–' }}</span>
            <span class="block text-[10px] uppercase tracking-wider text-stone-500">pts</span>
          </span>
        </button>
      </li>
      <li v-if="!results.length" class="py-8 text-center text-sm text-stone-400">No players match. Try another name or club.</li>
    </ul>
  </div>
</template>
