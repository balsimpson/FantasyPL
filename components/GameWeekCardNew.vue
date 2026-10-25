<template>
  <section aria-labelledby="gameweek-recap-title" class="grid w-full gap-5">
    <header class="flex flex-wrap items-center gap-3">
      <h2 id="gameweek-recap-title" class="text-3xl font-black tracking-tight text-white">{{ gameweek.name || 'Gameweek' }}</h2>
      <span class="rounded-full border px-2.5 py-1 text-xs font-medium" :class="gameweek.finished ? 'border-white/10 text-stone-400' : 'border-lime-300/25 text-lime-200'">{{ gameweek.finished ? 'Completed' : 'In progress' }}</span>
      <CalendarSubscribeActions class="w-full sm:ml-auto sm:w-auto" />
    </header>

    <div class="grid gap-5 border-y border-white/10 py-5 lg:grid-cols-2 lg:items-center lg:gap-8">
      <dl aria-label="Gameweek statistics" class="grid grid-cols-3 gap-4 sm:gap-6">
        <div v-for="(stat, index) in summaryStats" :key="stat.label" class="min-w-0">
          <dt class="text-xs font-medium leading-4 text-stone-400">{{ stat.label }}</dt>
          <dd class="mt-2 flex h-9 items-end font-sans font-bold leading-none tracking-tight tabular-nums" :class="[stat.primary ? 'text-4xl' : 'text-xl sm:text-3xl', index === 0 ? 'text-lime-200' : 'text-white']">{{ shortenNumber(stat.value) }}</dd>
        </div>
      </dl>

      <dl v-if="chipStats.length" aria-label="Chips played" class="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-white/10 pt-4 sm:grid-cols-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
        <div v-for="chip in chipStats" :key="chip.label" class="min-w-0">
          <dt class="text-xs font-medium leading-4 text-stone-400">{{ chip.label }}</dt>
          <dd class="mt-1 font-sans text-lg font-bold leading-6 tabular-nums text-lime-100">{{ shortenNumber(chip.value) }}</dd>
        </div>
      </dl>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
      <component :is="captain.player ? NuxtLink : 'article'" v-for="(captain, index) in captains" :key="captain.label"
        :to="captain.player ? getPlayerRoute(captain.player) : undefined"
        :style="captain.player ? captainStyle(captain.player) : undefined"
        class="group relative isolate flex min-h-72 min-w-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">
        <div aria-hidden="true" class="absolute inset-x-0 top-6 bottom-0 -z-10 overflow-hidden rounded-2xl border border-white/10 bg-[#101216]">
          <div v-if="captain.player" class="absolute inset-0" :class="index === 1 ? 'bg-[linear-gradient(235deg,var(--club-wash),transparent_72%)]' : 'bg-[linear-gradient(125deg,var(--club-wash),transparent_72%)]'" />
        </div>
        <img v-if="captain.player" :src="playerImage(captain.player)" :alt="captain.player.web_name" width="260" height="330" loading="lazy" decoding="async"
          class="absolute bottom-0 h-full w-[56%] rounded-b-2xl object-contain object-top drop-shadow-[0_12px_16px_rgba(0,0,0,0.5)] transition-transform duration-300 motion-safe:group-hover:-translate-y-1 motion-safe:group-focus-visible:-translate-y-1" :class="index === 1 ? 'left-0' : 'right-0'" @error="imageFallback" />
        <div class="relative z-10 flex w-[60%] min-w-0 flex-col justify-between gap-4 px-4 pt-10 pb-5 sm:px-5" :class="index === 1 ? 'ml-auto items-end text-right' : 'items-start text-left'">
          <p class="text-xs font-semibold leading-4 text-[var(--club-light,#d6d3d1)]">{{ captain.label }}</p>
          <div class="w-full min-w-0">
            <PlayerAge :player="captain.player" plain class="mb-1 text-stone-400" />
            <h3 class="text-2xl font-black leading-tight tracking-tight text-white [overflow-wrap:anywhere] [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">{{ captain.name || captain.player?.web_name || 'Unavailable' }}</h3>
            <p v-if="captain.player" class="mt-2 flex items-center gap-2 text-xs font-medium text-stone-300" :class="index === 1 ? 'flex-row-reverse' : ''">
              <img v-if="teamCode(captain.player)" :src="`https://resources.premierleague.com/premierleague/badges/t${teamCode(captain.player)}.png`" alt="" width="20" height="20" loading="lazy" decoding="async" class="size-5 shrink-0 object-contain" />
              {{ teamName(captain.player) }}
            </p>
          </div>
          <dl v-if="captain.player" class="grid w-full grid-cols-2 gap-x-3 gap-y-3">
            <div class="col-span-2">
              <dt class="text-xs font-medium leading-4 text-stone-400">Selected by</dt>
              <dd class="mt-1 font-sans text-2xl font-bold leading-none tracking-tight tabular-nums text-[var(--club-light)]">{{ captain.player.selected_by_percent == null ? '—' : `${captain.player.selected_by_percent}%` }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium leading-4 text-stone-400">Season pts</dt>
              <dd class="mt-1 font-sans text-lg font-bold leading-6 tabular-nums text-white">{{ captain.player.total_points ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-xs font-medium leading-4 text-stone-400">Form</dt>
              <dd class="mt-1 font-sans text-lg font-bold leading-6 tabular-nums text-white">{{ captain.player.form ?? '—' }}</dd>
            </div>
          </dl>
        </div>
      </component>
    </div>
  </section>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components';
import { getPlayerRoute } from '~/composables/usePlayerRoute';
import { getInstagramClubTheme } from '~/utils/instagram-designs';
const props = defineProps({
  gameweek: { type: Object, required: true },
  teams: { type: Array, default: () => [] },
});
const summaryStats = computed(() => [
  { label: 'Average points', value: props.gameweek.average_entry_score, primary: true },
  { label: 'Highest points', value: props.gameweek.highest_score, primary: true },
  { label: 'Transfers', value: props.gameweek.transfers_made, primary: false },
]);
const chipStats = computed(() => (props.gameweek.chip_plays || []).map(chip => ({
  label: chipNames[chip.chip_name] || chip.chip_name, value: chip.num_played,
})));
const captains = computed(() => [
  { label: 'Most captained', player: props.gameweek.captainedPlayer, name: props.gameweek.mostCaptained },
  { label: 'Most vice-captained', player: props.gameweek.viceCaptainedPlayer, name: props.gameweek.mostViceCaptained },
]);
const chipNames: Record<string, string> = { wildcard: 'Wildcard', freehit: 'Free Hit', bboost: 'Bench Boost', '3xc': 'Triple Captain', manager: 'Assistant Manager' };
const shortenNumber = (value: unknown) => value == null ? '—' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
const captainStyle = (player: Record<string, any>) => {
  const team = props.teams.find((entry: any) => entry.id === player.team);
  const theme = getInstagramClubTheme(Number(team?.code));
  return { '--club-wash': `${theme.primary}33`, '--club-light': theme.light };
};
const teamCode = (player: Record<string, any>) => props.teams.find((entry: any) => entry.id === player.team)?.code;
const teamName = (player: Record<string, any>) => props.teams.find((entry: any) => entry.id === player.team)?.name || 'Club unavailable';
const playerImage = (player: Record<string, any>) => player.code
  ? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`
  : '/fallback.png';
const imageFallback = (event: Event) => {
  const image = event.target as HTMLImageElement;
  image.onerror = null;
  image.src = '/fallback.png';
};
</script>
