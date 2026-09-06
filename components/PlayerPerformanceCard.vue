<template>
  <div class="overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 text-stone-50">
    <div class="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)]">
      <header class="min-w-0 lg:col-start-1">
        <h1 class="text-3xl font-bold leading-tight tracking-tight text-white text-balance sm:text-4xl">{{ playerFullName }}</h1>
        <div class="mt-3 flex items-center gap-3 text-sm text-stone-300">
          <img :src="`https://resources.premierleague.com/premierleague/badges/t${player.teamData?.code || player.team_code}.png`"
            :alt="teamName" width="32" height="32" class="size-8 shrink-0 object-contain" />
          <div><p class="font-medium">{{ teamName }}</p><p class="text-stone-400">{{ elementType }}</p></div>
        </div>
      </header>

      <dl class="grid grid-cols-2 gap-x-4 gap-y-5 tabular-nums min-[380px]:grid-cols-3 lg:col-start-1">
        <div v-for="stat in primaryStats" :key="stat.label">
          <dt class="text-sm text-stone-400">{{ stat.label }}</dt>
          <dd class="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{{ stat.value }}</dd>
        </div>
      </dl>

      <div class="border-t border-white/10 pt-5 lg:col-start-1">
        <h2 class="text-sm font-medium text-stone-300">Gameweek transfers</h2>
        <dl class="mt-2 grid grid-cols-2 gap-4 tabular-nums">
          <div class="flex items-baseline gap-2"><dt class="text-sm text-stone-400">In</dt><dd class="text-lg font-semibold text-lime-200">{{ formatCompact(player.transfers_in_event) }}</dd></div>
          <div class="flex items-baseline gap-2"><dt class="text-sm text-stone-400">Out</dt><dd class="text-lg font-semibold text-rose-200">{{ formatCompact(player.transfers_out_event) }}</dd></div>
        </dl>
      </div>

      <div class="lg:col-start-1">
        <dl class="grid grid-cols-2 gap-x-4 gap-y-4 tabular-nums min-[380px]:grid-cols-3">
          <div v-for="stat in secondaryStats" :key="stat.label">
            <dt class="text-sm text-stone-400">{{ stat.label }}</dt>
            <dd class="mt-1 text-base font-semibold text-white">{{ stat.value }}</dd>
          </div>
        </dl>
        <p v-if="cardTotal" class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm tabular-nums">
          <span class="text-stone-400">Yellow cards <strong class="ml-1 font-semibold text-amber-200">{{ yellowCards }}</strong></span>
          <span class="text-stone-400">Red cards <strong class="ml-1 font-semibold text-rose-200">{{ redCards }}</strong></span>
        </p>
      </div>

      <div class="flex items-end justify-center lg:col-start-2 lg:row-start-1 lg:row-span-4">
        <img :src="playerImageSrc" :alt="player.web_name" width="352" height="448" fetchpriority="high" decoding="async"
          class="h-48 w-full object-contain sm:h-64 lg:h-96" @error="handleImageError" />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
	player: {
		type: Object,
		required: true,
	},
	bootstrap: {
		type: [Object, Array],
		default: null,
	},
});

const elementTypeMap = {
	1: 'Goalkeeper',
	2: 'Defender',
	3: 'Midfielder',
	4: 'Forward',
};

const bootstrapData = computed(() => props.bootstrap?.value ?? props.bootstrap);

const teamName = computed(() => {
	const teams = Array.isArray(bootstrapData.value) ? bootstrapData.value : bootstrapData.value?.teams || bootstrapData.value?.elements || [];
	const team = teams.find((item) => item.id === props.player.team || item.id === props.player.team_code);

	return props.player.teamData?.name || team?.name || 'N/A';
});

const formatCost = (value) => {
	const cost = Number(value || 0) / 10;

	return `£${cost.toFixed(cost % 1 === 0 ? 0 : 1)}m`;
};

const elementType = computed(() => elementTypeMap[props.player.element_type] || 'Unknown');

const playerFullName = computed(() => {
	const fullName = `${props.player.first_name || ''} ${props.player.second_name || ''}`.trim();

	return fullName || props.player.web_name || 'Unknown Player';
});

const playerPrice = computed(() => (props.player ? formatCost(props.player.now_cost) : "—"));

const playerPoints = computed(() => Number(props.player.total_points ?? props.player.event_points ?? 0));
const yellowCards = computed(() => Number(props.player.yellow_cards || 0));
const redCards = computed(() => Number(props.player.red_cards || 0));
const cardTotal = computed(() => yellowCards.value + redCards.value);

const playerImageSrc = computed(
	() => `https://resources.premierleague.com/premierleague25/photos/players/110x140/${props.player.code}.png`
);

const formatCompact = (value) => {
	const number = Number(value || 0);

	return new Intl.NumberFormat('en', {
		notation: 'compact',
		maximumFractionDigits: 1,
	}).format(number);
};

const formatPercent = (value) => {
	const number = Number(value || 0);

	return number % 1 === 0 ? `${number.toFixed(0)}%` : `${number.toFixed(1)}%`;
};

const primaryStats = computed(() => [
  { label: 'Price', value: playerPrice.value },
  { label: 'Season points', value: playerPoints.value },
  { label: 'Form', value: props.player.form ?? 'Unavailable' },
  { label: 'Selected by', value: formatPercent(props.player.selected_by_percent) },
  { label: 'Goals', value: props.player.goals_scored ?? 0 },
  { label: 'Assists', value: props.player.assists ?? 0 },
]);

const secondaryStats = computed(() => [
  { label: 'Minutes', value: props.player.minutes ?? 0 },
  { label: 'Season value', value: props.player.value_season ?? 'Unavailable' },
  { label: 'ICT rank', value: props.player.ict_index_rank ? `#${props.player.ict_index_rank}` : 'Unavailable' },
]);

const handleImageError = (event) => {
	const target = event?.target;

	if (!target) return;

	target.onerror = null;
	target.src = '/fallback.png';
};
</script>
