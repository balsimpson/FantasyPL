<template>
  <section aria-labelledby="player-profile-title" class="overflow-hidden rounded-2xl border border-white/10 bg-[#101216] text-white md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]" :style="cardStyle">
    <header class="relative isolate flex min-h-80 flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,var(--club-wash),#101216_85%)] p-5 sm:min-h-96 sm:p-7 md:min-h-full">
      <img :src="playerImageSrc" :alt="playerFullName" width="440" height="560" fetchpriority="high" decoding="async"
        class="absolute inset-0 -z-20 h-full w-full object-contain object-bottom" @error="useFallbackImage" />
      <div aria-hidden="true" class="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,7,10,0.35),transparent_35%,rgba(5,7,10,0.92))]" />
      <div class="flex items-start justify-between gap-4">
        <img v-if="team?.code" :src="`https://resources.premierleague.com/premierleague/badges/t${team.code}.png`" :alt="team.name"
          width="52" height="52" class="size-13 rounded-full bg-white/95 p-2 object-contain" />
        <span class="ml-auto rounded-lg border border-white/15 bg-black/50 px-3 py-2 font-serif text-xl font-bold tabular-nums">{{ playerPrice }}</span>
      </div>
      <PlayerDisciplineBadges :yellow-cards="player.yellow_cards" :red-cards="player.red_cards" class="absolute left-5 top-20 sm:left-7 sm:top-24" />
      <div class="mt-28 min-w-0 md:mt-44">
        <p class="text-sm font-semibold text-white/80 [overflow-wrap:anywhere]">{{ team?.name || 'Club unavailable' }} · {{ elementType }}</p>
        <div class="mt-1 flex flex-wrap items-center gap-2"><h1 id="player-profile-title" class="text-4xl font-black leading-none tracking-tight text-white [overflow-wrap:anywhere] sm:text-5xl">{{ playerFullName }}</h1><PlayerAge :player="player" class="text-white/80" /></div>
      </div>
    </header>

    <div class="flex min-w-0 flex-col gap-6 p-5 sm:p-7">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold tracking-tight">Season overview</h2>
        <PlayerWatchlistButton :player="player" />
      </div>
      <dl class="grid grid-cols-3 gap-3 border-b border-white/10 pb-6">
        <div v-for="(stat, index) in primaryStats" :key="stat.label" class="min-w-0">
          <dt class="text-xs font-medium text-stone-400">{{ stat.label }}</dt>
          <dd class="mt-2 font-serif text-2xl font-bold leading-none tracking-tight tabular-nums min-[380px]:text-3xl sm:text-4xl md:text-3xl lg:text-5xl" :class="index === 0 ? 'text-[var(--club-light)]' : 'text-white'">{{ stat.value }}</dd>
        </div>
      </dl>
      <dl class="grid grid-cols-3 gap-x-3 gap-y-5 tabular-nums">
        <div v-for="stat in secondaryStats" :key="stat.label" class="min-w-0">
          <dt class="text-xs text-stone-400">{{ stat.label }}</dt>
          <dd class="mt-1 font-serif text-xl font-bold text-white sm:text-2xl">{{ stat.value }}</dd>
        </div>
      </dl>
      <div class="border-t border-white/10 pt-5">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="text-sm font-semibold text-stone-300">{{ transferHeading }}</h3>
          <span v-if="transferBalance.total !== null" class="text-xs tabular-nums text-stone-400">{{ formatNumber(transferBalance.total, true) }} total</span>
        </div>
        <div class="mt-3 flex h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]" role="img"
          :aria-label="transferBalance.total === null ? 'Transfer balance unavailable' : `Transfers in ${formatNumber(player.transfers_in_event)}, transfers out ${formatNumber(player.transfers_out_event)}`">
          <span class="h-full bg-lime-300" :style="{ width: `${transferBalance.inPercent}%` }" />
          <span class="h-full bg-rose-500" :style="{ width: `${transferBalance.outPercent}%` }" />
        </div>
        <dl class="mt-2 grid grid-cols-2 gap-4 tabular-nums">
          <div><dt class="text-xs text-stone-400">Transfers in</dt><dd class="mt-1 font-serif text-2xl font-bold text-lime-200">{{ formatNumber(player.transfers_in_event, true) }}</dd></div>
          <div class="text-right"><dt class="text-xs text-stone-400">Transfers out</dt><dd class="mt-1 font-serif text-2xl font-bold text-rose-200">{{ formatNumber(player.transfers_out_event, true) }}</dd></div>
        </dl>
      </div>
      <p v-if="player.news || availabilityLabel" class="flex items-start gap-2 border-t border-white/10 pt-4 text-sm leading-6 text-amber-200">
        <UIcon name="i-lucide-triangle-alert" class="mt-1 size-4 shrink-0" aria-hidden="true" />
        <span>{{ player.news || availabilityLabel }}</span>
      </p>
    </div>
  </section>
</template>

<script setup>
import { getInstagramClubTheme, getInstagramTransfers } from '~/utils/instagram-designs';
const props = defineProps({
  player: { type: Object, required: true },
  bootstrap: { type: Object, default: null },
});
const team = computed(() => props.player.teamData || props.bootstrap?.teams?.find((item) => item.id === props.player.team));
const elementType = computed(() => ['', 'Goalkeeper', 'Defender', 'Midfielder', 'Forward'][props.player.element_type] || 'Player');
const playerFullName = computed(() => [props.player.first_name, props.player.second_name].filter(Boolean).join(' ') || props.player.web_name || 'Unknown player');
const clubTheme = computed(() => getInstagramClubTheme(Number(team.value?.code || props.player.team_code)));
const cardStyle = computed(() => ({ '--club-wash': `${clubTheme.value.primary}66`, '--club-light': clubTheme.value.light }));
const numericValue = (value) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value);
const formatNumber = (value, compact = false) => numericValue(value) === null ? '—' : new Intl.NumberFormat('en-GB', {
  notation: compact ? 'compact' : 'standard', maximumFractionDigits: 1,
}).format(Number(value));
const playerPrice = computed(() => numericValue(props.player.now_cost) === null ? 'Price unavailable' : `£${(Number(props.player.now_cost) / 10).toFixed(1)}m`);
const primaryStats = computed(() => [
  { label: 'Season points', value: formatNumber(props.player.total_points) },
  { label: 'Form', value: formatNumber(props.player.form) },
  { label: 'Selected by', value: numericValue(props.player.selected_by_percent) === null ? '—' : `${formatNumber(props.player.selected_by_percent)}%` },
]);
const secondaryStats = computed(() => [
  { label: 'Goals', value: formatNumber(props.player.goals_scored) },
  { label: 'Assists', value: formatNumber(props.player.assists) },
  { label: 'Minutes', value: formatNumber(props.player.minutes) },
  { label: 'Season value', value: formatNumber(props.player.value_season) },
  { label: 'ICT rank', value: numericValue(props.player.ict_index_rank) === null ? '—' : `#${formatNumber(props.player.ict_index_rank)}` },
  { label: 'Points / game', value: formatNumber(props.player.points_per_game) },
]);
const currentGameweek = computed(() => props.bootstrap?.events?.find((event) => event.is_current));
const transferBalance = computed(() => getInstagramTransfers(numericValue(props.player.transfers_in_event), numericValue(props.player.transfers_out_event)));
const transferHeading = computed(() => currentGameweek.value ? `Gameweek ${currentGameweek.value.id} transfers` : 'Gameweek transfers');
const availabilityLabels = { d: 'Flagged doubtful by FPL', i: 'Flagged injured by FPL', s: 'Flagged suspended by FPL', u: 'Flagged unavailable by FPL', n: 'Not available in FPL' };
const availabilityLabel = computed(() => props.player.status && props.player.status !== 'a' ? availabilityLabels[props.player.status] || 'Availability unconfirmed' : '');
const fallbackImage = ref(false);
watch(() => props.player.code, () => { fallbackImage.value = false; });
const playerImageSrc = computed(() => fallbackImage.value || !props.player.code ? '/fallback.png' : `https://resources.premierleague.com/premierleague25/photos/players/110x140/${props.player.code}.png`);
const useFallbackImage = () => { fallbackImage.value = true; };
</script>
