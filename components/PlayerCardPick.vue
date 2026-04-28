<template>
	<div class="col-span-1 text-center">
		<article class="group relative w-36 overflow-visible transition duration-300 hover:-translate-y-0.5">
			<div class="relative z-10 pt-2">
				<img
					v-if="playerCode"
					:src="imageUrl"
					class="-mb-5 h-40 w-full bg-transparent object-contain object-top transition duration-300 group-hover:scale-105"
					:alt="playerName"
					loading="lazy"
					decoding="async"
				/>
				<div
					v-else
					class="-mb-5 flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.28em] text-white/40"
				>
					No image
				</div>

				<div class="absolute left-2 top-18 flex flex-col gap-1">
					<span
						v-if="pick?.is_captain"
						class="inline-flex items-center rounded-full bg-teal-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow"
					>
						Captain
					</span>
					<span
						v-if="pick?.is_vice_captain"
						class="inline-flex items-center rounded-full bg-amber-300/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-900 shadow"
					>
						Vice
					</span>
				</div>

				<div class="absolute left-1/2 -translate-x-1/2 bottom-2 rounded-full bg-zinc-900/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
					{{ totalPoints }} pts
				</div>
			</div>

			<div class="relative z-0 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.025] px-2 pb-2 pt-6 text-left shadow-lg ring-1 ring-white/10">
				<p v-if="news" class="text-[10px] leading-snug text-amber-200">
						{{ news }}
					</p>
				
<div class="flex items-center justify-between mt-2">
	<p class="truncate text-sm font-semibold text-white">
		{{ playerName }}
	</p>

	<div class="flex items-center justify-between gap-2 text-[10px] font-medium text-white/80">
		<span class="rounded-full bg-emerald-400/90 px-2 py-0.5 text-[11px] font-semibold text-zinc-950 shadow-sm">
			{{ costLabel }}
		</span>
		<span v-if="multiplier > 1" class="text-teal-300">
			x{{ multiplier }}
		</span>
	</div>
</div>


				<div class="mt-3 text-center text-xs capitalize text-muted">Predicted</div>
				<div v-if="predictions.length" class="mt-1 flex items-center justify-center gap-1 text-[10px] font-semibold text-zinc-300">
					<template v-for="(item, index) in predictions" :key="item.gw ?? index">
						<span class="min-w-6 text-center">{{ Number(item.predicted_pts ?? 0).toFixed(1) }}</span>
						<span v-if="index < predictions.length - 1" class="h-3 w-px bg-white/25"></span>
					</template>
				</div>
			</div>
		</article>
	</div>
</template>

<script setup>
const props = defineProps({
	pick: {
		type: Object,
		required: true,
	},
});

const player = computed(() => props.pick?.element ?? {});
const playerCode = computed(() => player.value?.code ?? null);
const playerName = computed(() => player.value?.web_name || "Unknown player");
const news = computed(() => player.value?.news || "");
const totalPoints = computed(() => Number(player.value?.total_points ?? 0));
const multiplier = computed(() => Number(props.pick?.multiplier ?? 1));
const costLabel = computed(() => {
	const cost = Number(player.value?.now_cost ?? 0) / 10;
	if (!Number.isFinite(cost)) return "-";

	return `${cost.toFixed(cost % 1 === 0 ? 0 : 1)}m`;
});
const imageUrl = computed(
	() => `https://resources.premierleague.com/premierleague25/photos/players/110x140/${playerCode.value}.png`
);
const predictions = computed(() => (Array.isArray(props.pick?.predictions) ? props.pick.predictions : []));
</script>
