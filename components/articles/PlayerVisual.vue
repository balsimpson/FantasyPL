<script setup lang="ts">
import type { ArticlePlayerSnapshot } from '~/shared/article-visuals'
import { getPlayerRoute } from '~/composables/usePlayerRoute'
const props = defineProps<{ player: ArticlePlayerSnapshot; fixturesOnly?: boolean }>()
const name = computed(() => `${props.player.first_name} ${props.player.second_name}`.trim())
const captured = computed(() => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(props.player.capturedAt)))
const compact = (value: number | null) => value === null ? 'Unavailable' : new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
const difficulty = (value: number) => ({ 1: 'bg-success/15 text-success', 2: 'bg-success/15 text-success', 3: 'bg-warning/15 text-warning', 4: 'bg-error/15 text-error', 5: 'bg-error/25 text-error' }[value])
</script>

<template>
  <figure class="my-6 overflow-hidden rounded-xl border border-default bg-elevated/40 text-default" :aria-label="`${name}, ${fixturesOnly ? 'fixture run' : 'player card'}`">
    <div class="flex items-center gap-4 px-4 pt-4 sm:px-5">
      <div v-if="!fixturesOnly" class="h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-primary/10"><PlayerPortrait :player="player" :alt="name" /></div>
      <div class="min-w-0 flex-1">
        <p class="text-sm text-muted">{{ player.teamName }} · {{ player.position }}</p>
        <NuxtLink :to="getPlayerRoute(player)" target="_blank" class="mt-1 block break-words text-xl font-semibold text-highlighted hover:text-primary">{{ name }}</NuxtLink>
        <p v-if="!fixturesOnly" class="mt-2 text-lg font-semibold tabular-nums">£{{ player.price.toFixed(1) }}m</p>
        <p v-else class="mt-1 text-sm text-muted">Upcoming fixtures · {{ player.season }}</p>
      </div>
    </div>
    <dl v-if="!fixturesOnly" class="mx-4 mt-5 grid grid-cols-2 gap-y-4 border-y border-default py-4 text-sm sm:mx-5 sm:grid-cols-4">
      <div><dt class="text-muted">Season points</dt><dd class="mt-1 text-xl font-semibold tabular-nums text-highlighted">{{ player.points ?? 'Unavailable' }}</dd></div>
      <div><dt class="text-muted">Minutes</dt><dd class="mt-1 text-xl font-semibold tabular-nums text-highlighted">{{ compact(player.minutes) }}</dd></div>
      <div><dt class="text-muted">FPL form</dt><dd class="mt-1 text-xl font-semibold tabular-nums text-highlighted">{{ player.form ?? 'Unavailable' }}</dd></div>
      <div><dt class="text-muted">Selected by</dt><dd class="mt-1 text-xl font-semibold tabular-nums text-highlighted">{{ player.ownership === null ? 'Unavailable' : `${player.ownership}%` }}</dd></div>
    </dl>
    <div v-if="!fixturesOnly" class="flex flex-wrap gap-x-6 gap-y-2 px-4 pt-4 text-sm sm:px-5">
      <span>Transfers in · GW {{ player.gameweek }} <strong class="ml-1 tabular-nums text-success">{{ compact(player.transfersIn) }}</strong></span>
      <span>Transfers out · GW {{ player.gameweek }} <strong class="ml-1 tabular-nums text-error">{{ compact(player.transfersOut) }}</strong></span>
    </div>
    <div v-if="fixturesOnly" class="mx-4 mt-5 grid grid-cols-3 divide-x divide-default border-y border-default sm:mx-5">
      <div v-for="gameweek in player.gameweeks" :key="gameweek" class="min-w-0 px-2 py-3 first:pl-0 last:pr-0">
        <p class="text-xs font-medium text-muted">GW {{ gameweek }}</p>
        <div v-for="(fixture, index) in player.fixtures.filter(f => f.gameweek === gameweek)" :key="index" class="mt-2">
          <p class="break-words text-sm font-medium text-highlighted">{{ fixture.opponent }}</p>
          <p class="mt-1 text-xs text-muted">{{ fixture.home ? 'Home' : 'Away' }}</p>
          <span class="mt-2 inline-flex rounded px-2 py-1 text-xs font-semibold" :class="difficulty(fixture.difficulty)">FDR {{ fixture.difficulty }}/5</span>
          <p v-if="!fixture.kickoff" class="mt-1 text-xs text-muted">Kickoff TBC</p>
        </div>
        <p v-if="!player.fixtures.some(f => f.gameweek === gameweek)" class="mt-2 text-sm text-muted">No fixture listed</p>
      </div>
    </div>
    <figcaption class="px-4 py-4 text-xs leading-5 text-muted sm:px-5">Official FPL snapshot · {{ captured }} IST<template v-if="fixturesOnly">. FDR is a difficulty rating, not a prediction.</template></figcaption>
  </figure>
</template>
