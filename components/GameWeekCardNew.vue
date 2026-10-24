<template>
  <section aria-labelledby="gameweek-recap-title" class="grid w-full gap-5">
    <header class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="gameweek-recap-title" class="text-3xl font-black tracking-tight text-white sm:text-4xl">{{ gameweek.name || 'Gameweek' }} recap</h2>
      </div>
      <span class="pb-1 text-sm font-semibold text-stone-300">{{ gameweek.finished ? 'Completed' : 'In progress' }}</span>
    </header>

    <dl aria-label="Gameweek statistics" class="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 lg:grid-cols-7">
      <div v-for="stat in summaryStats" :key="stat.label" class="min-w-0">
        <dt class="text-xs leading-4 text-stone-400">{{ stat.label }}</dt>
        <dd class="mt-1.5 font-serif text-2xl font-bold tabular-nums text-white">{{ shortenNumber(stat.value) }}</dd>
      </div>
    </dl>

    <div class="grid gap-3 sm:grid-cols-2">
      <component :is="captain.player ? NuxtLink : 'article'" v-for="captain in captains" :key="captain.label"
        :to="captain.player ? getPlayerRoute(captain.player) : undefined"
        :style="captain.player ? captainStyle(captain.player) : undefined"
        class="group relative isolate flex min-h-64 min-w-0 overflow-hidden rounded-2xl bg-[linear-gradient(125deg,var(--club-colour),#111318_78%)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--club-light)]">
        <div aria-hidden="true" class="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,12,16,0.08),rgba(10,12,16,0.05)_45%,rgba(10,12,16,0.75))]" />
        <img v-if="captain.player" :src="playerImage(captain.player)" :alt="captain.player.web_name" width="260" height="330" loading="lazy" decoding="async"
          class="absolute inset-y-0 right-0 h-full w-[58%] object-contain object-bottom drop-shadow-[0_14px_22px_rgba(0,0,0,0.45)] transition-transform duration-300 motion-safe:group-hover:scale-[1.025]" @error="imageFallback" />
        <div class="relative z-10 flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
        <div class="max-w-[58%] min-w-0">
            <p class="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[var(--club-light)]">{{ captain.label }}</p>
            <h3 class="mt-2 text-2xl font-black leading-tight tracking-tight text-white [overflow-wrap:anywhere]">{{ captain.player?.web_name || captain.name || 'Unavailable' }}</h3><PlayerAge :player="captain.player" class="mt-1 text-white/80" />
            <p v-if="captain.player" class="mt-1 text-xs font-medium text-white/75">{{ teamName(captain.player) }}</p>
          </div>
          <div v-if="captain.player" class="mt-5 grid max-w-[58%] grid-cols-3 gap-2">
            <div>
              <p class="text-[0.58rem] text-white/65">Selected</p>
              <p class="mt-0.5 font-serif text-base font-bold tabular-nums text-white">{{ captain.player.selected_by_percent ?? '—' }}%</p>
            </div>
            <div>
              <p class="text-[0.58rem] text-white/65">Season pts</p>
              <p class="mt-0.5 font-serif text-base font-bold tabular-nums text-white">{{ captain.player.total_points ?? '—' }}</p>
            </div>
            <div>
              <p class="text-[0.58rem] text-white/65">Form</p>
              <p class="mt-0.5 font-serif text-base font-bold tabular-nums text-[var(--club-light)]">{{ captain.player.form ?? '—' }}</p>
            </div>
          </div>
          <p v-else class="mt-5 text-sm text-white/70">Player details are unavailable.</p>
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
  { label: 'Average points', value: props.gameweek.average_entry_score },
  { label: 'Highest points', value: props.gameweek.highest_score },
  { label: 'Transfers made', value: props.gameweek.transfers_made },
  ...(props.gameweek.chip_plays || []).map(chip => ({
    label: `${chipNames[chip.chip_name] || chip.chip_name} plays`, value: chip.num_played,
  })),
]);
const captains = computed(() => [
  { label: 'Most captained', player: props.gameweek.captainedPlayer, name: props.gameweek.mostCaptained },
  { label: 'Most vice-captained', player: props.gameweek.viceCaptainedPlayer, name: props.gameweek.mostViceCaptained },
]);
const chipNames: Record<string, string> = { wildcard: 'Wildcard', freehit: 'Free Hit', bboost: 'Bench Boost', '3xc': 'Triple Captain', manager: 'Assistant Manager' };
const shortenNumber = (value: unknown) => value == null ? '—' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
const captainStyle = (player: Record<string, any>) => {
  const team = props.teams.find((entry: any) => entry.id === player.team);
  const theme = getInstagramClubTheme(Number(team?.code));
  return { '--club-colour': theme.primary, '--club-light': theme.light };
};
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
