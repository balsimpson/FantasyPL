<script setup lang="ts">
import { formatInstagramStat, type InstagramPlayer } from '~/utils/instagram-templates'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'
const props = defineProps<{ players: InstagramPlayer[], selected: InstagramPlayer[], limit: number, disabled?: boolean, activity?: Record<number, string> }>()
const emit = defineEmits<{ select: [id: number], move: [index: number, offset: number], viewHistory: [name: string] }>()
const search = ref('')
const position = ref('All positions')
const positions = ['All positions', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward']
const results = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return props.players.filter(player => (!query || `${player.fullName} ${player.name} ${player.club}`.toLocaleLowerCase().includes(query)) && (position.value === 'All positions' || player.position === position.value))
    .sort((a, b) => (b.stats.form ?? 0) - (a.stats.form ?? 0) || a.id - b.id).slice(0, 20)
})
</script>

<template>
  <div class="space-y-4">
    <div v-if="selected.length" class="divide-y divide-default">
      <div v-for="(player, index) in selected" :key="player.id" class="flex items-center gap-3 py-2 first:pt-0">
        <SchedulerPlayerPhoto :player="player" class="h-14 w-12 shrink-0 rounded-md bg-elevated text-xl" />
        <div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold text-highlighted">{{ limit > 1 ? `${index + 1}. ` : '' }}{{ player.name }}</p><PlayerAge :player="player" compact class="mt-1" /><p class="text-xs text-muted">{{ player.club }} · {{ formatInstagramStat(player, 'now_cost') }}</p><p v-if="activity?.[player.code]" class="mt-1 text-xs text-warning">{{ activity[player.code] }}</p><UButton v-if="activity?.[player.code]" size="xs" color="neutral" variant="link" label="View player history" @click="emit('viewHistory', player.name)" /></div>
        <div v-if="limit === 5" class="flex gap-1">
          <UButton :aria-label="`Move ${player.name} up`" icon="i-lucide-arrow-up" color="neutral" variant="ghost" :disabled="disabled || index === 0" @click="emit('move', index, -1)" />
          <UButton :aria-label="`Move ${player.name} down`" icon="i-lucide-arrow-down" color="neutral" variant="ghost" :disabled="disabled || index === selected.length - 1" @click="emit('move', index, 1)" />
        </div>
        <UButton :aria-label="`Remove ${player.name}`" icon="i-lucide-x" color="neutral" variant="ghost" :disabled="disabled" @click="emit('select', player.id)" />
      </div>
    </div>
    <UFormField label="Find a player" name="player-search" class="w-full">
      <UInput v-model="search" placeholder="Search by player or club" icon="i-lucide-search" class="w-full" :ui="{ base: 'w-full' }" :disabled="disabled" />
    </UFormField>
    <USelect v-model="position" :items="positions" aria-label="Filter players by position" class="w-full" :disabled="disabled" />
    <div class="max-h-64 overflow-y-auto overscroll-contain" aria-label="Player search results">
      <button v-for="player in results" :key="player.id" type="button" class="flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50" :class="selected.some(item => item.id === player.id) ? 'bg-primary/10 text-primary' : 'text-default'" :aria-pressed="selected.some(item => item.id === player.id)" :disabled="disabled || (limit > 1 && selected.length >= limit && !selected.some(item => item.id === player.id))" @click="emit('select', player.id)">
        <span class="min-w-0"><span class="block truncate font-medium">{{ player.fullName }}</span><PlayerAge :player="player" compact class="my-1" /><span class="text-xs text-muted">{{ player.club }} · {{ player.position }}</span><span v-if="activity?.[player.code]" class="block text-xs text-warning">{{ activity[player.code] }}</span></span>
        <span class="shrink-0 text-xs tabular-nums">{{ selected.some(item => item.id === player.id) ? 'Selected' : formatInstagramStat(player, 'now_cost') }}</span>
      </button>
      <p v-if="!results.length" class="py-5 text-sm text-muted">No players match. Try another name or position.</p>
    </div>
  </div>
</template>
