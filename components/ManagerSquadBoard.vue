<template>
	<section aria-labelledby="manager-squad-title" class="min-w-0 space-y-4">
		<div class="space-y-3 border-b border-white/10 pb-4">
			<header class="grid items-center gap-x-3 gap-y-3 md:grid-cols-[minmax(0,1fr)_auto]">
				<div class="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
					<h2 id="manager-squad-title" class="text-xl font-bold leading-7 tracking-tight text-white">{{ planningGameweek ? 'Suggested XI' : 'Starting XI' }}</h2>
					<span v-if="planningGameweek || fixtureGameweek" class="text-xs text-stone-400">{{ planningGameweek ? `GW ${planningGameweek}` : `GW ${fixtureGameweek} fixtures` }}</span>
					<span aria-hidden="true" class="text-xs text-stone-500">·</span>
					<span class="text-xs tabular-nums text-stone-400"><span class="sr-only">Formation </span>{{ formation }}</span>
				</div>
				<div class="flex flex-wrap items-center gap-3 md:justify-end">
					<UButton v-if="planningGameweek" color="neutral" variant="ghost" size="sm" icon="i-lucide-undo-2" class="h-8 w-44 shrink-0 justify-center rounded-lg border border-white/10 bg-white/5 text-stone-300 hover:border-lime-300/40 hover:bg-lime-300/10 hover:text-lime-200 focus-visible:bg-lime-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300" @click="$emit('published')">Show published squad</UButton>
					<UButton v-else-if="canPreview" color="primary" variant="soft" size="sm" icon="i-lucide-users" class="h-8 w-44 shrink-0 justify-center border border-lime-300/30 bg-lime-300/10 text-lime-300 hover:border-lime-300/50 hover:bg-lime-300/15 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300" @click="$emit('preview')">Show suggested XI</UButton>
					<div class="flex shrink-0 items-center gap-1" role="group" aria-label="Squad view">
						<UButton v-for="option in views" :key="option.value" :icon="option.icon" color="neutral" variant="ghost" size="sm" class="min-h-10 rounded-none border-b-2 bg-transparent px-2.5 text-xs font-semibold transition-colors hover:bg-lime-300/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 motion-reduce:transition-none sm:px-3 sm:text-sm" :class="view === option.value ? 'border-lime-300 text-lime-300 hover:text-lime-200' : 'border-transparent text-stone-400 hover:text-lime-200'" :aria-pressed="view === option.value" @click="view = option.value">{{ option.label }}</UButton>
					</div>
				</div>
			</header>
			<ManagerSquadPerformance :squad="squad" :published-squad="publishedSquad ?? squad" :rows="fixtureRows" :gameweek="fixtureGameweek" :suggested="Boolean(planningGameweek)" :published-gameweek="publishedGameweek" :gameweek-points="gameweekPoints" :season-points="seasonPoints" />
		</div>

		<template v-if="view === 'pitch'">
			<div class="relative isolate px-1 pb-4 sm:px-3">
				<ManagerPitchSurface />
				<div class="relative">
					<div v-for="row in pitchRows" :key="row.key" class="mx-auto grid" :class="row.pitchClass">
						<ul v-for="variant in variants" :key="variant.key" :aria-label="row.label" class="relative isolate col-start-1 row-start-1 grid grid-rows-[auto_auto_auto_auto_auto] content-start justify-evenly gap-x-1 motion-safe:transition-opacity motion-safe:duration-200 sm:gap-x-3" :style="{ gridTemplateColumns: `repeat(${(variant.squad.groupedByType[row.key] || []).length}, minmax(0, 8rem))` }"
							:class="variantOpacity(variant)" :inert="variant.key !== activeVariant.key" :aria-hidden="variant.key !== activeVariant.key ? true : undefined">
							<li v-for="pick in variant.squad.groupedByType[row.key] || []" :key="pick.element.id" class="row-span-5 grid min-w-0 grid-rows-subgrid">
								<ManagerSquadPick :pick="pick" compact :gameweek="variant.gameweek" :transfer="pairFor(pick, variant)?.transfer" :compared-pick="comparedPick(pick, variant)" :matches="fixturesFor(pick, variant.gameweek)" :fixtures-available="fixtureRows.length > 0" @compare="openComparison" />
							</li>
						</ul>
					</div>
				</div>
			</div>
			<section aria-labelledby="manager-bench-title" class="space-y-3">
				<header class="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
					<h3 id="manager-bench-title" class="text-sm font-semibold text-stone-200">Bench</h3>
					<dl class="flex items-center gap-4 text-xs tabular-nums" aria-label="Bench performance">
						<div v-for="metric in benchMetrics" :key="metric.label" class="flex items-baseline gap-1.5" :title="metric.title">
							<dt class="text-stone-400">{{ metric.label }}</dt>
							<dd class="font-semibold text-white">{{ metric.value }}</dd>
							<dd class="min-w-9 text-right font-semibold motion-safe:transition-opacity motion-safe:duration-200" :class="[metric.tone, planningGameweek ? 'opacity-100' : 'opacity-0']" :aria-hidden="!planningGameweek" title="Change from the published bench">{{ metric.delta }}</dd>
						</div>
					</dl>
				</header>
				<div class="grid">
					<ul v-for="variant in variants" :key="variant.key" class="relative isolate col-start-1 row-start-1 grid grid-cols-2 grid-rows-[auto_auto_auto_auto_auto_auto] items-stretch gap-x-3 motion-safe:transition-opacity motion-safe:duration-200 sm:grid-cols-4"
						:class="variantOpacity(variant)" :inert="variant.key !== activeVariant.key" :aria-hidden="variant.key !== activeVariant.key ? true : undefined">
						<li v-for="pick in variant.squad.bench" :key="pick.element.id" class="row-span-6 mb-3 grid min-w-0 grid-rows-subgrid sm:mb-0"><ManagerBenchPick :pick="pick" :gameweek="variant.gameweek" :compared-pick="benchComparedPick(pick, variant)" :matches="fixturesFor(pick, variant.gameweek)" :fixtures-available="fixtureRows.length > 0" @compare="openComparison" /></li>
					</ul>
				</div>
			</section>
		</template>

		<template v-else>
			<div class="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
				<div class="flex gap-2" role="group" aria-label="Squad selection">
					<UButton color="neutral" variant="ghost" size="sm" class="rounded-md px-3 py-1.5 text-xs font-medium" :class="selection === 'starting' ? 'bg-lime-300 text-lime-950 hover:bg-lime-200' : 'text-stone-300 hover:bg-lime-300/10 hover:text-lime-200'" :aria-pressed="selection === 'starting'" @click="selection = 'starting'">Starting XI</UButton>
					<UButton color="neutral" variant="ghost" size="sm" class="rounded-md px-3 py-1.5 text-xs font-medium" :class="selection === 'bench' ? 'bg-lime-300 text-lime-950 hover:bg-lime-200' : 'text-stone-300 hover:bg-lime-300/10 hover:text-lime-200'" :aria-pressed="selection === 'bench'" @click="selection = 'bench'">Bench</UButton>
				</div>
				<span class="text-xs text-stone-400">{{ galleryPicks.length }} players</span>
			</div>
			<div class="grid" :aria-label="selection === 'starting' ? 'Starting XI' : 'Bench'">
				<div v-for="variant in galleryVariants" :key="variant.key" class="relative isolate col-start-1 row-start-1 space-y-6 motion-safe:transition-opacity motion-safe:duration-200"
					:class="variantOpacity(variant)" :inert="variant.key !== activeVariant.key" :aria-hidden="variant.key !== activeVariant.key ? true : undefined">
					<section v-for="group in galleryGroups(variant)" :key="group.position" :aria-labelledby="`gallery-${variant.key}-${selection}-${group.position}`" class="space-y-3">
						<h3 :id="`gallery-${variant.key}-${selection}-${group.position}`" class="sticky top-0 z-20 flex items-center gap-3 py-3 text-xs font-medium text-stone-300 backdrop-blur-md">
							{{ group.label }}
							<span aria-hidden="true" class="h-px flex-1 bg-white/10" />
						</h3>
						<ul class="grid auto-rows-fr grid-cols-1 items-stretch gap-4 sm:grid-cols-2" :aria-label="group.label">
							<li v-for="pick in group.picks" :key="pick.element.id" class="h-full min-w-0"><ManagerSquadPick :pick="pick" detailed :gameweek="variant.gameweek" :events="squad.events" :teams="squad.teams" :transfer="pairFor(pick, variant)?.transfer" :compared-pick="selection === 'bench' ? benchComparedPick(pick, variant) : comparedPick(pick, variant)" :matches="fixturesFor(pick, variant.gameweek)" :fixtures-available="fixtureRows.length > 0" @compare="openComparison" /></li>
						</ul>
					</section>
				</div>
			</div>
		</template>
		<ManagerLineupComparison v-model:open="comparisonOpen" :pair="comparisonPair" :gameweek="fixtureGameweek" :rows="fixtureRows" />
	</section>
</template>

<script setup>
import ManagerBenchPick from '~/components/ManagerBenchPick.vue';
import ManagerPitchSurface from '~/components/ManagerPitchSurface.vue';
import ManagerSquadPerformance from '~/components/ManagerSquadPerformance.vue';
import { getManagerLineupDeltas } from '~/utils/manager-lineup-metrics';
const props = defineProps({
	squad: { type: Object, required: true }, planningGameweek: { type: Number, default: null },
	fixtureGameweek: { type: Number, default: null }, fixtureRows: { type: Array, default: () => [] },
	publishedGameweek: { type: Number, default: null }, gameweekPoints: { type: Number, default: null }, seasonPoints: { type: Number, default: null },
	publishedSquad: { type: Object, default: null }, plans: { type: Array, default: () => [] },
});
defineEmits(['published', 'preview']);
const canPreview = computed(() => props.plans.some((plan) => plan.gameweek === props.fixtureGameweek && plan.canPreview));
const { variants } = useManagerPlannerDisplay(() => props.publishedSquad ?? props.squad, () => props.plans);
const activeVariant = computed(() => variants.value.find((variant) => variant.key === (props.planningGameweek ? String(props.planningGameweek) : `published-${props.fixtureGameweek ?? 'current'}`)) ?? variants.value[0]);
const variantOpacity = variant => variant.key === activeVariant.value.key ? 'z-10 opacity-100' : 'pointer-events-none opacity-0';
const benchMetrics = computed(() => getManagerLineupDeltas(props.squad.bench, props.publishedSquad?.bench ?? props.squad.bench, props.fixtureGameweek));
const comparisonOpen = ref(false);
const comparisonPair = ref(null);
const pairFor = (pick, variant = activeVariant.value) => variant.changes.find((pair) => pair.incoming.element.id === pick?.element.id || pair.outgoing.element.id === pick?.element.id);
const comparedPick = (pick, variant = activeVariant.value) => {
	const pair = pairFor(pick, variant);
	return pair ? pair.incoming.element.id === pick.element.id ? pair.outgoing : pair.incoming : null;
};
const benchComparedPick = (pick, variant) => pairFor(pick, variant)?.transfer ? comparedPick(pick, variant) : null;
const fixturesFor = (pick, gameweek = props.fixtureGameweek) => props.fixtureRows.find((row) => row.pick.element.id === pick?.element.id)?.run.find((week) => week.gameweek === (gameweek ?? props.fixtureGameweek))?.matches ?? [];
const openComparison = (pick) => { comparisonPair.value = pairFor(pick) ?? null; comparisonOpen.value = Boolean(comparisonPair.value); };
watch(activeVariant, () => { comparisonOpen.value = false; comparisonPair.value = null; });
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
const galleryVariants = computed(() => variants.value.filter(variant => variant.gameweek === props.fixtureGameweek));
const positionLabels = { Goalkeeper: 'Goalkeepers', Defender: 'Defenders', Midfielder: 'Midfielders', Forward: 'Forwards' };
const galleryGroups = (variant) => {
	const groups = new Map();
	const picks = [...(selection.value === 'bench' ? variant.squad.bench : variant.squad.startingXI)].sort((a, b) => Number(b.element.element_type) - Number(a.element.element_type));
	for (const pick of picks) {
		const position = pick.element_type ?? 'Unknown';
		if (!groups.has(position)) groups.set(position, { position, label: positionLabels[position] ?? position, picks: [] });
		groups.get(position).picks.push(pick);
	}
	return [...groups.values()];
};
</script>
