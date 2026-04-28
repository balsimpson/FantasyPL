<template>
	<div class="h-full snap-start">
		<UCard
			:ui="{ body: 'p-0', root: 'ring-0 border-none' }"
			class="group relative h-full w-full overflow-hidden rounded-[20px] border border-white/10 bg-neutral-950 text-stone-50 transition duration-300 hover:-translate-y-0.5"
		>
			<div
				class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,255,61,0.08),transparent_30%),radial-gradient(circle_at_110%_18%,rgba(72,214,255,0.06),transparent_24%),linear-gradient(135deg,#111317_0%,#090a0d_100%)]"
			/>
			<div
				class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size[5px_5px] opacity-8"
			/>

			<div class="relative z-10 px-3 py-2.5 sm:px-4">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-[0.52rem] font-semibold uppercase tracking-[0.26em] text-stone-500">
							Season
						</p>
						<h3 class="truncate text-[0.92rem] font-semibold text-white">
							{{ season.season_name }}
						</h3>
					</div>

					<div
						class="shrink-0 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-right backdrop-blur-sm"
						:class="pointsPillClass"
					>
						<div class="text-[0.52rem] font-semibold uppercase tracking-[0.24em] text-stone-400">
							Points
						</div>
						<div class="font-serif text-[1.15rem] font-black leading-none text-white">
							{{ season.total_points }}
						</div>
					</div>
				</div>

				<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
					<div class="rounded-2xl border border-white/10 bg-white/[0.05] px-2 py-2 text-center">
						<div class="text-[0.52rem] font-semibold uppercase tracking-[0.26em] text-stone-500">
							Played
						</div>
						<div class="mt-1 font-serif text-[0.95rem] font-black leading-none text-white">
							{{ playedLabel }}
						</div>
					</div>

					<div class="rounded-2xl border border-white/10 bg-white/[0.05] px-2 py-2 text-center">
						<div class="text-[0.52rem] font-semibold uppercase tracking-[0.26em] text-stone-500">
							Goals
						</div>
						<div class="mt-1 font-serif text-[0.95rem] font-black leading-none text-white">
							{{ season.goals_scored }}
						</div>
					</div>

					<div class="rounded-2xl border border-white/10 bg-white/[0.05] px-2 py-2 text-center sm:col-span-2">
						<div class="text-[0.52rem] font-semibold uppercase tracking-[0.26em] text-stone-500">
							Value
						</div>
						<div class="mt-1 font-serif text-[0.95rem] font-black leading-none" :class="valueDeltaClass">
							{{ valueRangeLabel }}
						</div>
					</div>
				</div>
			</div>
		</UCard>
	</div>
</template>

<script setup>
const props = defineProps({
	season: {
		type: Object,
		required: true,
	},
});

const playedLabel = computed(() => {
	const minutes = Number(props.season.minutes || 0);

	if (minutes >= 120) return `${Math.round(minutes / 60)} hrs`;
	return `${minutes} min`;
});

const valueStart = computed(() => Number(props.season.start_cost || 0) / 10);
const valueEnd = computed(() => Number(props.season.end_cost || 0) / 10);
const valueDelta = computed(() => valueEnd.value - valueStart.value);

const pointsPillClass = computed(() => {
	const points = Number(props.season.total_points || 0);
	if (points >= 150) return 'border-lime-300/30 bg-lime-400/10';
	if (points >= 100) return 'border-amber-300/30 bg-amber-400/10';
	return 'border-rose-300/30 bg-rose-400/10';
});

const valueDeltaClass = computed(() => {
	if (valueDelta.value > 0) return 'text-lime-200';
	if (valueDelta.value < 0) return 'text-rose-200';
	return 'text-stone-200';
});

const formatValue = (value) => `${Number(value).toFixed(Number.isInteger(value) ? 0 : 1)}m`;

const valueRangeLabel = computed(() => {
	const delta = valueDelta.value;
	const sign = delta > 0 ? '+' : '';
	return `${formatValue(valueStart.value)} → ${formatValue(valueEnd.value)} (${sign}${delta.toFixed(delta % 1 === 0 ? 0 : 1)}m)`;
});
</script>
