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
const comparisonMetrics = [
  { key: 'points', label: 'Season points', format: (value: number) => String(value) },
  { key: 'form', label: 'FPL form', format: (value: number) => String(value) },
  { key: 'minutes', label: 'Season minutes', format: (value: number) => new Intl.NumberFormat('en-GB').format(value) },
  { key: 'price', label: 'Price', format: (value: number) => `£${value.toFixed(1)}m` },
  { key: 'ownership', label: 'Selected by', format: (value: number) => `${value}%` },
] as const
const comparisonBarWidth = (key: typeof comparisonMetrics[number]['key'], value: number | null | undefined) => {
  const max = Math.max(0, ...props.players.map(player => Number.isFinite(player[key]) ? Number(player[key]) : 0))
  return value == null || !Number.isFinite(value) || max === 0 ? '0%' : `${Math.max(0, value / max * 100)}%`
}
const playerName = (player: ArticlePlayerSnapshot) => `${player.first_name} ${player.second_name}`.trim() || player.web_name
const barColours = ['bg-lime-300', 'bg-sky-300', 'bg-amber-300']
const crestUrl = (code: number) => {
  const source = `https://resources.premierleague.com/premierleague/badges/t${code}.png`
  return `/api/image-proxy/club-${code}?url=${encodeURIComponent(source)}&strict=1`
}
</script>

<template>
  <figure class="my-8 overflow-hidden rounded-xl border border-white/15 bg-[#111519] text-white" :aria-label="title">
    <figcaption class="border-b border-white/15 px-4 py-3 text-sm font-semibold sm:px-5">{{ title }} <span class="font-normal text-white/65">· GW {{ players[0]?.gameweek }} · {{ players[0]?.season }}</span></figcaption>
    <div v-if="type === 'comparisonCard'">
      <div class="grid grid-cols-1 gap-4 px-4 py-5 sm:grid-cols-2 sm:px-5" :class="players.length === 3 ? 'sm:grid-cols-3' : ''">
        <div v-for="player in players" :key="player.id" class="flex min-w-0 items-center gap-3">
          <div class="size-14 shrink-0 overflow-hidden rounded-lg bg-white/10"><PlayerPortrait :player="player" /></div>
          <div class="min-w-0">
            <NuxtLink :to="getPlayerRoute(player)" target="_blank" class="block break-words font-semibold leading-snug underline-offset-4 hover:underline">{{ playerName(player) }}</NuxtLink>
            <p class="mt-1 text-xs text-white/70">{{ player.teamName }} · {{ player.position }}</p>
          </div>
        </div>
      </div>
      <section v-for="metric in comparisonMetrics" :key="metric.key" class="border-t border-white/10 px-4 py-4 sm:px-5" :aria-label="metric.label">
        <h3 class="text-sm font-semibold">{{ metric.label }}</h3>
        <dl class="mt-3 space-y-2.5">
          <div v-for="(player, index) in players" :key="player.id" class="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)]">
            <dt class="break-words text-xs leading-4 text-white/80 sm:text-sm">{{ player.web_name }}</dt>
            <dd class="flex min-w-0 items-center gap-3">
              <div class="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true"><div class="h-full rounded-full" :class="barColours[index]" :style="{ width: comparisonBarWidth(metric.key, player[metric.key]) }" /></div>
              <span class="min-w-12 text-right text-sm font-semibold tabular-nums">{{ player[metric.key] == null ? '—' : metric.format(player[metric.key]!) }}</span>
            </dd>
          </div>
        </dl>
      </section>
    </div>
    <ol v-else-if="type === 'transferWatch' || type === 'budgetShortlist'" class="divide-y divide-white/10">
      <li v-for="(player, index) in players" :key="player.id" class="flex min-w-0 items-center gap-4 px-4 py-3 sm:px-5">
        <span class="w-6 shrink-0 text-sm tabular-nums text-white/60">{{ index + 1 }}</span>
        <div class="size-12 shrink-0 overflow-hidden rounded-lg bg-white/10"><PlayerPortrait :player="player" /></div>
        <div class="min-w-0 flex-1"><NuxtLink :to="getPlayerRoute(player)" target="_blank" class="font-semibold underline-offset-4 hover:underline">{{ player.web_name }}</NuxtLink><p class="text-xs text-white/65">{{ player.teamName }} · {{ player.position }} · £{{ player.price.toFixed(1) }}m</p></div>
        <template v-if="type === 'transferWatch'"><div class="text-right"><p class="text-xs text-white/65">{{ transferLabel }}</p><p class="font-semibold tabular-nums">{{ compact(transferValue(player)) }}</p></div></template>
        <template v-else><div class="text-right"><p class="text-xs text-white/65">Form · points</p><p class="font-semibold tabular-nums">{{ player.form ?? '—' }} · {{ player.points ?? '—' }}</p></div></template>
      </li>
    </ol>
    <div v-else-if="type === 'teamFixtureTable'" class="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0">
      <section v-for="player in teams" :key="player.teamCode" class="min-w-0 px-4 py-4 sm:px-5" :class="teams.length > 2 ? 'sm:border-b sm:border-white/10' : ''">
        <h3 class="flex items-center gap-2 font-semibold"><SchedulerArtworkAsset :src="crestUrl(player.teamCode)" :label="`${player.teamName} crest`" decorative class="size-8 shrink-0 rounded-full bg-white/90 p-1" />{{ player.teamName }}</h3>
        <div v-for="week in player.gameweeks" :key="week" class="mt-3 flex items-center justify-between gap-3 text-sm">
          <span class="shrink-0 text-xs text-white/65">GW {{ week }}</span>
          <template v-if="player.fixtures.filter(fixture => fixture.gameweek === week).length">
            <span v-for="(fixture, index) in player.fixtures.filter(item => item.gameweek === week)" :key="index" class="min-w-0 truncate text-right">{{ fixture.home ? '' : '@ ' }}{{ fixture.opponent }} <span class="text-white/65">{{ fixture.difficulty }}/5</span></span>
          </template>
          <span v-else class="text-white/65">Blank</span>
        </div>
      </section>
    </div>
    <p class="border-t border-white/10 px-4 py-3 text-xs leading-5 text-white/70 sm:px-5"><span>{{ criteria }}</span><br>FPL data captured {{ new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(players[0]?.capturedAt || '')) }}.<template v-if="type === 'teamFixtureTable'"> Difficulty is an FPL rating, not a points forecast.</template></p>
  </figure>
</template>
