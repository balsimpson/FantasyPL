<script setup lang="ts">
import type { ArticlePlayerSnapshot } from '~/shared/article-visuals'
import { getPlayerRoute } from '~/composables/usePlayerRoute'

const props = defineProps<{ type: string; players: ArticlePlayerSnapshot[]; criteria: string }>()
const title = computed(() => ({
  comparisonCard: 'Player comparison',
  transferWatch: 'Gameweek transfer watch',
  budgetShortlist: 'Budget shortlist',
  teamFixtureTable: 'Team fixture run',
}[props.type] || 'FPL data'))
const transferLabel = 'Transfers in this gameweek'
const transferValue = (player: ArticlePlayerSnapshot) => player.transfersIn
const teams = computed(() => {
  const unique = new Map<number, ArticlePlayerSnapshot>()
  for (const player of props.players) if (!unique.has(player.teamCode)) unique.set(player.teamCode, player)
  return [...unique.values()]
})
const compact = (value: number | null) => value === null ? '—' : new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
</script>

<template>
  <figure class="my-8 overflow-hidden rounded-xl border border-white/15 bg-[#111519] text-white" :aria-label="title">
    <figcaption class="border-b border-white/15 px-4 py-3 text-sm font-semibold sm:px-5">{{ title }} <span class="font-normal text-white/65">· GW {{ players[0]?.gameweek }} · {{ players[0]?.season }}</span></figcaption>
    <div v-if="type === 'comparisonCard'" class="overflow-x-auto">
      <table class="w-full min-w-[560px] text-left text-sm">
        <thead class="text-xs text-white/70"><tr><th class="px-4 py-3 font-medium">Player</th><th class="px-3 py-3 font-medium">Price</th><th class="px-3 py-3 font-medium">Points</th><th class="px-3 py-3 font-medium">Form</th><th class="px-3 py-3 font-medium">Minutes</th><th class="px-3 py-3 font-medium">Selected by</th></tr></thead>
        <tbody><tr v-for="player in players" :key="player.id" class="border-t border-white/10"><td class="px-4 py-3"><NuxtLink :to="getPlayerRoute(player)" target="_blank" class="font-semibold underline-offset-4 hover:underline">{{ player.web_name }}</NuxtLink><span class="ml-2 text-xs text-white/60">{{ player.teamName }} · {{ player.position }}</span></td><td class="px-3 py-3">£{{ player.price.toFixed(1) }}m</td><td class="px-3 py-3">{{ player.points ?? '—' }}</td><td class="px-3 py-3">{{ player.form ?? '—' }}</td><td class="px-3 py-3">{{ compact(player.minutes) }}</td><td class="px-3 py-3">{{ player.ownership === null ? '—' : `${player.ownership}%` }}</td></tr></tbody>
      </table>
    </div>
    <ol v-else-if="type === 'transferWatch' || type === 'budgetShortlist'" class="divide-y divide-white/10">
      <li v-for="(player, index) in players" :key="player.id" class="flex min-w-0 items-center gap-4 px-4 py-3 sm:px-5">
        <span class="w-6 shrink-0 text-sm tabular-nums text-white/60">{{ index + 1 }}</span>
        <div class="min-w-0 flex-1"><NuxtLink :to="getPlayerRoute(player)" target="_blank" class="font-semibold underline-offset-4 hover:underline">{{ player.web_name }}</NuxtLink><p class="text-xs text-white/65">{{ player.teamName }} · {{ player.position }} · £{{ player.price.toFixed(1) }}m</p></div>
        <template v-if="type === 'transferWatch'"><div class="text-right"><p class="text-xs text-white/65">{{ transferLabel }}</p><p class="font-semibold tabular-nums">{{ compact(transferValue(player)) }}</p></div></template>
        <template v-else><div class="text-right"><p class="text-xs text-white/65">Form · points</p><p class="font-semibold tabular-nums">{{ player.form ?? '—' }} · {{ player.points ?? '—' }}</p></div></template>
      </li>
    </ol>
    <div v-else-if="type === 'teamFixtureTable'" class="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0">
      <section v-for="player in teams" :key="player.teamCode" class="min-w-0 px-4 py-4 sm:px-5" :class="teams.length > 2 ? 'sm:border-b sm:border-white/10' : ''">
        <h3 class="font-semibold">{{ player.teamName }}</h3>
        <div v-for="week in player.gameweeks" :key="week" class="mt-3 flex items-center justify-between gap-3 text-sm">
          <span class="shrink-0 text-xs text-white/65">GW {{ week }}</span>
          <template v-if="player.fixtures.filter(fixture => fixture.gameweek === week).length">
            <span v-for="(fixture, index) in player.fixtures.filter(item => item.gameweek === week)" :key="index" class="min-w-0 truncate text-right">{{ fixture.home ? '' : '@ ' }}{{ fixture.opponent }} <span class="text-white/65">{{ fixture.difficulty }}/5</span></span>
          </template>
          <span v-else class="text-white/65">Blank</span>
        </div>
      </section>
    </div>
    <p class="border-t border-white/10 px-4 py-3 text-xs leading-5 text-white/70 sm:px-5"><span>{{ criteria }}</span><br>FPL data captured {{ new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(players[0]?.capturedAt || '')) }}. Difficulty is an FPL rating, not a points forecast.</p>
  </figure>
</template>
