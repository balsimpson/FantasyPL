<template>
  <article class="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101216] text-white shadow-[0_18px_48px_-32px_rgba(0,0,0,0.9)]" :style="cardStyle">
    <NuxtLink :to="getPlayerRoute(player)" :aria-label="`Open ${player.web_name} profile`"
      class="relative block aspect-[4/4.7] overflow-hidden bg-[linear-gradient(145deg,var(--club-wash),#101216_72%)] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--club-light)]">
      <div aria-hidden="true" class="absolute inset-0 opacity-35" :style="pitchStyle">
        <div class="absolute inset-x-[12%] top-[12%] bottom-0 rounded-t-[50%] border border-white/15" />
        <div class="absolute inset-x-[12%] top-[12%] bottom-0 rounded-t-[50%] border border-white/10 scale-x-75" />
      </div>
      <img :src="imageSrc" :alt="player.web_name" width="440" height="560" loading="lazy" decoding="async"
        class="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_18px_24px_rgba(0,0,0,0.5)] transition-transform duration-300 motion-safe:group-hover:scale-[1.025]" @error="useFallbackImage" />
      <div aria-hidden="true" class="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,7,10,0.64),transparent_28%,transparent_55%,rgba(5,7,10,0.86))]" />
      <header class="absolute inset-x-4 top-4 z-10 flex items-start justify-between gap-3">
        <span class="max-w-[75%] rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.15em] text-[var(--club-light)] backdrop-blur-sm">{{ sectionLabel }}</span>
        <img v-if="team?.code" :src="`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`" :alt="team.name" width="44" height="44" loading="lazy" decoding="async" class="size-11 rounded-full bg-white/95 p-1.5 object-contain shadow-lg" />
      </header>
      <div class="absolute inset-x-4 bottom-4 z-10 flex items-end justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-white/75">{{ team?.name || 'Club unavailable' }} · {{ positionLabel }}</p>
          <h3 class="mt-1 text-[1.75rem] font-black leading-none tracking-tight text-white [overflow-wrap:anywhere]">{{ player.web_name }}</h3>
        </div>
        <span class="shrink-0 rounded-lg border border-white/15 bg-black/50 px-2.5 py-2 font-serif text-lg font-bold tabular-nums text-white">£{{ (player.now_cost / 10).toFixed(1) }}m</span>
      </div>
    </NuxtLink>

    <div class="flex flex-1 flex-col px-4 pb-4">
      <div class="grid grid-cols-[1fr_auto] items-end gap-3 border-b border-white/10 py-4">
        <div>
          <p class="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-stone-400">{{ leadStat.label }}</p>
          <p class="mt-1 font-serif text-[2.5rem] font-bold leading-none tracking-tight tabular-nums text-[var(--club-light)]">{{ leadStat.value }}</p>
        </div>
        <p v-if="player.status && player.status !== 'a'" class="max-w-28 pb-1 text-right text-xs leading-4 text-amber-200">{{ availabilityLabel }}</p>
      </div>

      <dl class="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10 py-2.5 text-center">
        <div v-for="stat in secondaryStats" :key="stat.label" class="px-1">
          <dt class="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-stone-400">{{ stat.label }}</dt>
          <dd class="mt-1 font-serif text-lg font-bold tabular-nums text-white">{{ stat.value }}</dd>
        </div>
      </dl>

      <div class="mt-3">
        <p class="mb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-stone-400">Upcoming fixtures</p>
        <HomeFixtureRun v-if="fixturesAvailable && gameweeks.length" :run="fixtureRun" />
        <p v-else class="text-xs text-stone-400">{{ gameweeks.length ? 'Fixture data is unavailable.' : 'No upcoming gameweeks are published.' }}</p>
      </div>
      <PlayerWatchlistButton :player="player" class="mt-3 w-full justify-center rounded-lg border border-white/15 bg-white/[0.04] text-sm font-semibold text-stone-200 transition hover:border-[var(--club-primary)] hover:bg-white/[0.08] hover:text-white [&>span]:justify-center" />
    </div>
  </article>
</template>

<script setup lang="ts">
import { getPlayerRoute } from "~/composables/usePlayerRoute";
import { getInstagramClubTheme } from "~/utils/instagram-designs";
import { getTeamFixtureRun, type ShortlistPlayer, type ShortlistFixture } from "~/utils/homepage-shortlist";
const props = defineProps<{ player: ShortlistPlayer; teams: Record<string, any>[]; fixtures: ShortlistFixture[]; gameweeks: number[]; fixturesAvailable: boolean; sortKey: string }>();
const team = computed(() => props.teams.find((item) => item.id === props.player.team));
const positionLabel = computed(() => ["", "Goalkeeper", "Defender", "Midfielder", "Forward"][props.player.element_type] || "Player");
const sectionLabel = computed(() => ({ form: 'Form leaders', total_points: 'Season points', selected_by_percent: 'Most selected', transfers_in_event: 'Most bought this gameweek', transfers_out_event: 'Most sold this gameweek' }[props.sortKey] || 'Player shortlist'));
const formatTransferCount = (value: unknown) => value == null || !Number.isFinite(Number(value))
  ? '—'
  : new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
const leadStat = computed(() => ({ form: { label: 'Form', value: props.player.form ?? '—' }, total_points: { label: 'Season points', value: props.player.total_points ?? '—' }, selected_by_percent: { label: 'Selected by', value: props.player.selected_by_percent == null ? '—' : `${props.player.selected_by_percent}%` }, transfers_in_event: { label: 'Transfers in this gameweek', value: formatTransferCount(props.player.transfers_in_event) }, transfers_out_event: { label: 'Transfers out this gameweek', value: formatTransferCount(props.player.transfers_out_event) } }[props.sortKey] || { label: 'Form', value: props.player.form ?? '—' }));
const secondaryStats = computed(() => {
  const stats = [
    { key: 'form', label: 'Form', value: props.player.form ?? '—' },
    { key: 'total_points', label: 'Season pts', value: props.player.total_points ?? '—' },
    { key: 'minutes', label: 'Minutes', value: props.player.minutes ?? '—' },
    { key: 'assists', label: 'Assists', value: props.player.assists ?? '—' },
    { key: 'goals_scored', label: 'Goals', value: props.player.goals_scored ?? '—' },
  ].filter((stat) => stat.key !== props.sortKey);
  return stats.slice(0, 3);
});
const clubTheme = computed(() => getInstagramClubTheme(Number(team.value?.code)));
const cardStyle = computed(() => ({ '--club-wash': `${clubTheme.value.primary}55`, '--club-light': clubTheme.value.light, '--club-primary': clubTheme.value.primary }));
const pitchStyle = computed(() => ({ backgroundImage: `linear-gradient(90deg, transparent 49.7%, rgba(255,255,255,.12) 50%, transparent 50.3%), linear-gradient(0deg, transparent 49.7%, rgba(255,255,255,.12) 50%, transparent 50.3%)` }));
const fixtureRun = computed(() => getTeamFixtureRun(props.player.team, props.fixtures, props.teams, props.gameweeks));
const availabilityLabels: Record<string, string> = { d: "Flagged doubtful by FPL", i: "Flagged injured by FPL", s: "Flagged suspended by FPL", u: "Flagged unavailable by FPL", n: "Not available in FPL" };
const availabilityLabel = computed(() => availabilityLabels[props.player.status] || "Availability unconfirmed");
const fallbackImage = ref(false);
const imageSrc = computed(() => fallbackImage.value || !props.player.code ? "/fallback.png" : `https://resources.premierleague.com/premierleague25/photos/players/110x140/${props.player.code}.png`);
const useFallbackImage = () => { fallbackImage.value = true; };
</script>
