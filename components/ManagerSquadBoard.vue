<template>
	<section aria-labelledby="manager-squad-title" class="min-w-0 space-y-4">
		<header class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex items-baseline gap-3">
				<h2 id="manager-squad-title" class="text-xl font-bold tracking-tight text-white">Your squad</h2>
				<span class="text-sm tabular-nums text-stone-400">{{ formation }}</span>
			</div>
			<div class="flex gap-1 rounded-lg border border-white/15 bg-[#181d1c] p-1" role="group" aria-label="Squad view">
				<UButton v-for="option in views" :key="option.value" :icon="option.icon" color="neutral" variant="ghost" size="sm" class="rounded-md px-3 py-1.5 text-xs font-medium" :class="view === option.value ? 'bg-lime-300 text-lime-950 hover:bg-lime-200' : 'text-white/75 hover:bg-white/5 hover:text-white'" :aria-pressed="view === option.value" @click="view = option.value">{{ option.label }}</UButton>
			</div>
		</header>

		<template v-if="view === 'pitch'">
			<div class="relative isolate overflow-hidden rounded-2xl border border-emerald-300/20 bg-[#0c3024] px-2 pb-5 pt-7 sm:px-5 sm:pt-9">
				<div aria-hidden="true" class="pointer-events-none absolute inset-3 -z-10 border border-emerald-100/15 sm:inset-5">
					<div class="absolute inset-x-0 top-1/2 border-t border-emerald-100/15" />
					<div class="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100/15 sm:size-44" />
					<div class="absolute inset-x-[24%] top-0 h-[13%] border-x border-b border-emerald-100/15" />
					<div class="absolute inset-x-[24%] bottom-0 h-[13%] border-x border-t border-emerald-100/15" />
					<div class="absolute inset-x-[38%] top-0 h-[5%] border-x border-b border-emerald-100/15" />
					<div class="absolute inset-x-[38%] bottom-0 h-[5%] border-x border-t border-emerald-100/15" />
				</div>
				<div class="relative space-y-5 sm:space-y-6">
					<ul v-for="row in pitchRows" :key="row.key" :aria-label="row.label" class="flex items-start justify-evenly gap-1 sm:gap-3">
						<li v-for="pick in row.items" :key="pick.element.id" class="min-w-0 flex-1 basis-0 max-w-32">
							<PlayerCardPick :pick="pick" compact />
						</li>
					</ul>
				</div>
				<p class="relative mt-5 text-center text-[0.65rem] text-emerald-100/75">Current price · Season points</p>
			</div>
			<section aria-labelledby="manager-bench-title" class="space-y-3">
				<h3 id="manager-bench-title" class="text-sm font-semibold text-stone-300">Bench <span class="ml-1 font-normal text-stone-500">{{ squad.bench.length }}</span></h3>
				<ul class="grid auto-rows-fr grid-cols-2 items-stretch gap-3 sm:grid-cols-4">
					<li v-for="pick in squad.bench" :key="pick.element.id" class="h-full min-w-0"><PlayerCardPick :pick="pick" /></li>
				</ul>
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
						<li v-for="pick in group.picks" :key="pick.element.id" class="h-full min-w-0"><PlayerCardPick :pick="pick" detailed :events="squad.events" :teams="squad.teams" /></li>
					</ul>
				</section>
			</div>
		</template>
		<dl class="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-white/10 pt-4 text-sm">
			<div class="flex items-baseline gap-2"><dt class="text-stone-400">Starting XI current cost</dt><dd class="font-bold tabular-nums text-white">£{{ (squad.teamCost / 10).toFixed(1) }}m</dd></div>
			<div class="flex items-baseline gap-2"><dt class="text-stone-400">Starting XI season points</dt><dd class="font-bold tabular-nums text-white">{{ squad.teamPoints.toLocaleString('en-GB') }}</dd></div>
		</dl>
	</section>
</template>

<script setup>
const props = defineProps({ squad: { type: Object, required: true } });
const view = ref('pitch');
const selection = ref('starting');
const views = [{ value: 'pitch', label: 'Pitch', icon: 'i-lucide-panels-top-left' }, { value: 'gallery', label: 'Gallery', icon: 'i-lucide-layout-grid' }];
const pitchRows = computed(() => [
	{ key: 'Forward', label: 'Forwards' },
	{ key: 'Midfielder', label: 'Midfielders' },
	{ key: 'Defender', label: 'Defenders' },
	{ key: 'Goalkeeper', label: 'Goalkeepers' },
].map((row) => ({ ...row, items: props.squad.groupedByType[row.key] ?? [] })).filter((row) => row.items.length));
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
