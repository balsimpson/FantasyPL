<template>
	<section aria-labelledby="manager-squad-title" class="min-w-0 space-y-4">
		<header class="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
			<div class="flex flex-col gap-1">
				<h2 id="manager-squad-title" class="text-xl font-bold tracking-tight text-white sm:text-2xl">{{ planningGameweek ? `Suggested XI · GW ${planningGameweek}` : 'Your squad' }}</h2>
				<span class="text-xs text-stone-400">Formation <span class="ml-1 font-semibold tabular-nums text-lime-300">{{ formation }}</span></span>
				<span v-if="fixtureGameweek && !planningGameweek" class="text-xs text-stone-400">GW {{ fixtureGameweek }} fixtures</span>
			</div>
			<div class="flex shrink-0 items-center gap-1" role="group" aria-label="Squad view">
				<UButton v-for="option in views" :key="option.value" :icon="option.icon" color="neutral" variant="ghost" size="sm" class="min-h-10 rounded-none border-b-2 bg-transparent px-2.5 text-xs font-semibold transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 motion-reduce:transition-none sm:px-3 sm:text-sm" :class="view === option.value ? 'border-lime-300 text-lime-300 hover:text-lime-200' : 'border-transparent text-stone-400 hover:text-white'" :aria-pressed="view === option.value" @click="view = option.value">{{ option.label }}</UButton>
			</div>
		</header>
		<ManagerSquadPerformance :squad="squad" :published-squad="publishedSquad ?? squad" :rows="fixtureRows" :gameweek="fixtureGameweek" :suggested="Boolean(planningGameweek)" />

		<template v-if="view === 'pitch'">
			<div class="relative isolate px-1 pb-4 sm:px-3">
				<ManagerPitchSurface />
				<div class="relative">
					<div v-for="row in pitchRows" :key="row.key" class="mx-auto grid" :class="row.pitchClass">
						<ul v-for="variant in variants" :key="variant.key" :aria-label="row.label" class="col-start-1 row-start-1 flex items-start justify-evenly gap-1 sm:gap-3"
							:class="variant.key === activeVariant.key ? '' : 'invisible pointer-events-none'" :inert="variant.key !== activeVariant.key" :aria-hidden="variant.key !== activeVariant.key ? true : undefined">
							<li v-for="pick in variant.squad.groupedByType[row.key] || []" :key="pick.element.id" class="min-w-0 max-w-32 flex-1 basis-0">
								<ManagerSquadPick :pick="pick" compact :compared-pick="comparedPick(pick, variant)" :matches="fixturesFor(pick, variant.gameweek)" :compared-matches="fixturesFor(comparedPick(pick, variant), variant.gameweek)" :fixtures-available="fixtureRows.length > 0" @compare="openComparison" />
							</li>
						</ul>
					</div>
				</div>
				<p class="relative mt-5 text-center text-[0.65rem] text-emerald-100/75">Current price · Season points{{ planningGameweek ? ' · Suggested captain and vice-captain' : '' }}</p>
			</div>
			<section aria-labelledby="manager-bench-title" class="space-y-3">
				<h3 id="manager-bench-title" class="text-sm font-semibold text-stone-300">Bench <span class="ml-1 font-normal text-stone-500">{{ squad.bench.length }}</span></h3>
				<div class="grid">
					<ul v-for="variant in variants" :key="variant.key" class="col-start-1 row-start-1 grid auto-rows-fr grid-cols-2 items-stretch gap-3 sm:grid-cols-4"
						:class="variant.key === activeVariant.key ? '' : 'invisible pointer-events-none'" :inert="variant.key !== activeVariant.key" :aria-hidden="variant.key !== activeVariant.key ? true : undefined">
						<li v-for="pick in variant.squad.bench" :key="pick.element.id" class="h-full min-w-0"><ManagerSquadPick :pick="pick" :compared-pick="comparedPick(pick, variant)" :matches="fixturesFor(pick, variant.gameweek)" :compared-matches="fixturesFor(comparedPick(pick, variant), variant.gameweek)" :fixtures-available="fixtureRows.length > 0" @compare="openComparison" /></li>
					</ul>
				</div>
			</section>
		</template>

		<template v-else>
			<div class="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
				<div class="flex gap-2" role="group" aria-label="Squad selection">
					<UButton color="neutral" variant="ghost" size="sm" class="rounded-md px-3 py-1.5 text-xs font-medium" :class="selection === 'starting' ? 'bg-lime-300 text-lime-950 hover:bg-lime-200' : 'text-white/75 hover:bg-white/5 hover:text-white'" :aria-pressed="selection === 'starting'" @click="selection = 'starting'">Starting XI</UButton>
					<UButton color="neutral" variant="ghost" size="sm" class="rounded-md px-3 py-1.5 text-xs font-medium" :class="selection === 'bench' ? 'bg-lime-300 text-lime-950 hover:bg-lime-200' : 'text-white/75 hover:bg-white/5 hover:text-white'" :aria-pressed="selection === 'bench'" @click="selection = 'bench'">Bench</UButton>
				</div>
				<span class="text-xs text-stone-400">{{ galleryPicks.length }} players</span>
			</div>
			<div class="space-y-6" :aria-label="selection === 'starting' ? 'Starting XI' : 'Bench'">
				<section v-for="group in galleryGroups" :key="group.position" :aria-labelledby="`gallery-${selection}-${group.position}`" class="space-y-3">
					<h3 :id="`gallery-${selection}-${group.position}`" class="sticky top-0 z-20 flex items-center gap-3 py-3 text-xs font-medium text-stone-300 backdrop-blur-md">
						{{ group.label }}
						<span aria-hidden="true" class="h-px flex-1 bg-white/10" />
					</h3>
					<ul class="grid auto-rows-fr grid-cols-1 items-stretch gap-4 sm:grid-cols-2" :aria-label="group.label">
						<li v-for="pick in group.picks" :key="pick.element.id" class="h-full min-w-0"><ManagerSquadPick :pick="pick" detailed :events="squad.events" :teams="squad.teams" :compared-pick="comparedPick(pick)" :matches="fixturesFor(pick)" :compared-matches="fixturesFor(comparedPick(pick))" :fixtures-available="fixtureRows.length > 0" @compare="openComparison" /></li>
					</ul>
				</section>
			</div>
		</template>
		<dl class="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-sm">
			<div class="flex items-baseline gap-2"><dt class="text-stone-400">Starting XI current cost</dt><dd class="font-bold tabular-nums text-white">£{{ (squad.teamCost / 10).toFixed(1) }}m</dd></div>
			<div class="flex items-baseline gap-2"><dt class="text-stone-400">Starting XI season points</dt><dd class="font-bold tabular-nums text-white">{{ squad.teamPoints.toLocaleString('en-GB') }}</dd></div>
		</dl>
		<ManagerLineupComparison v-model:open="comparisonOpen" :pair="comparisonPair" :gameweek="fixtureGameweek" :rows="fixtureRows" />
	</section>
</template>

<script setup>
import ManagerPitchSurface from '~/components/ManagerPitchSurface.vue';
import ManagerSquadPerformance from '~/components/ManagerSquadPerformance.vue';
const props = defineProps({
	squad: { type: Object, required: true }, planningGameweek: { type: Number, default: null },
	fixtureGameweek: { type: Number, default: null }, fixtureRows: { type: Array, default: () => [] },
	publishedSquad: { type: Object, default: null }, plans: { type: Array, default: () => [] },
});
const { variants } = useManagerPlannerDisplay(() => props.publishedSquad ?? props.squad, () => props.plans);
const activeVariant = computed(() => variants.value.find((variant) => variant.key === (props.planningGameweek ? String(props.planningGameweek) : `published-${props.fixtureGameweek ?? 'current'}`)) ?? variants.value[0]);
const comparisonOpen = ref(false);
const comparisonPair = ref(null);
const pairFor = (pick, variant = activeVariant.value) => variant.changes.find((pair) => pair.incoming.element.id === pick?.element.id || pair.outgoing.element.id === pick?.element.id);
const comparedPick = (pick, variant = activeVariant.value) => {
	const pair = pairFor(pick, variant);
	return pair ? pair.incoming.element.id === pick.element.id ? pair.outgoing : pair.incoming : null;
};
const fixturesFor = (pick, gameweek = props.fixtureGameweek) => props.fixtureRows.find((row) => row.pick.element.id === pick?.element.id)?.run.find((week) => week.gameweek === (gameweek ?? props.fixtureGameweek))?.matches ?? [];
const openComparison = (pick) => { comparisonPair.value = pairFor(pick) ?? null; comparisonOpen.value = Boolean(comparisonPair.value); };
watch(() => props.fixtureGameweek, () => { comparisonOpen.value = false; comparisonPair.value = null; });
const view = ref('pitch');
const selection = ref('starting');
const views = [{ value: 'pitch', label: 'Pitch', icon: 'i-lucide-panels-top-left' }, { value: 'gallery', label: 'Gallery', icon: 'i-lucide-layout-grid' }];
const pitchRows = computed(() => [
	{ key: 'Forward', label: 'Forwards', pitchClass: 'w-[94%] sm:w-[76%]' },
	{ key: 'Midfielder', label: 'Midfielders', pitchClass: 'mt-2 w-full sm:mt-3 sm:w-[90%]' },
	{ key: 'Defender', label: 'Defenders', pitchClass: 'mt-3 w-full sm:mt-5' },
	{ key: 'Goalkeeper', label: 'Goalkeepers', pitchClass: 'mt-4 w-full sm:mt-6' },
]);
const formation = computed(() => ['Defender', 'Midfielder', 'Forward'].map((position) => (props.squad.groupedByType[position] ?? []).length).join('–'));
const galleryPicks = computed(() => [...(selection.value === 'bench' ? props.squad.bench : props.squad.startingXI)].sort((a, b) => Number(b.element.element_type) - Number(a.element.element_type)));
const positionLabels = { Goalkeeper: 'Goalkeepers', Defender: 'Defenders', Midfielder: 'Midfielders', Forward: 'Forwards' };
const galleryGroups = computed(() => {
	const groups = new Map();
	for (const pick of galleryPicks.value) {
		const position = pick.element_type ?? 'Unknown';
		if (!groups.has(position)) groups.set(position, { position, label: positionLabels[position] ?? position, picks: [] });
		groups.get(position).picks.push(pick);
	}
	return [...groups.values()];
});
</script>
