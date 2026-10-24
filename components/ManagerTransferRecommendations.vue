<template>
	<section aria-labelledby="manager-recommendations-title" class="min-w-0 space-y-3">
		<header class="flex items-center justify-between gap-3">
			<h2 id="manager-recommendations-title" class="text-xl font-bold tracking-tight text-white">Recommendations</h2>
			<span v-if="result" class="text-xs tabular-nums text-stone-400">{{ result.suggestions.length }} {{ result.suggestions.length === 1 ? "option" : "options" }}</span>
		</header>

		<p v-if="loading" class="py-2 text-sm text-stone-300" role="status" aria-live="polite">
			Comparing your squad with current FPL options…
		</p>

		<div v-else-if="errorMessage" class="space-y-3">
			<UAlert color="error" variant="soft" title="Recommendations unavailable" :description="errorMessage" />
			<UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="loading" :disabled="loading" @click="loadRecommendations">
				Retry recommendations
			</UButton>
		</div>

		<div v-else-if="result" aria-live="polite" class="min-w-0">
			<p v-if="!result.suggestions.length" class="py-2 text-sm leading-6 text-stone-300" role="status">
				{{ result.message }}
			</p>
			<template v-else>
				<ol id="manager-recommendations-list" class="min-w-0 divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#101216] px-3 sm:px-4">
					<li v-for="suggestion in visibleSuggestions" :key="suggestion.id" class="min-w-0 py-4">
						<div class="grid min-w-0 gap-4 lg:grid-cols-[minmax(15rem,0.75fr)_minmax(0,1.25fr)]">
							<div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
								<ManagerRecommendationPlayer label="Current player" :player="suggestion.outgoing" />
								<UIcon name="i-lucide-arrow-right" class="size-4 shrink-0 text-stone-400 sm:size-5" aria-hidden="true" />
								<ManagerRecommendationPlayer label="Recommended player" :player="suggestion.incoming" />
							</div>

							<div class="min-w-0">
								<div class="min-w-0 overflow-x-auto border-t border-white/10 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
									<table class="w-full min-w-[15.5rem] table-fixed text-left text-sm">
										<caption class="sr-only">Current, recommended, and difference in player performance measures</caption>
										<colgroup>
											<col class="w-[39%]" />
											<col class="w-[18%]" />
											<col class="w-[27%]" />
											<col class="w-[16%]" />
										</colgroup>
										<thead>
											<tr class="text-stone-400">
												<th scope="col" class="pb-2 pr-2 text-left text-[0.65rem] font-medium leading-tight sm:text-xs">Measure</th>
												<th scope="col" class="px-1 pb-2 text-right text-[0.65rem] font-medium leading-tight sm:text-xs">Current</th>
												<th scope="col" class="px-1 pb-2 text-right text-[0.65rem] font-medium leading-tight sm:text-xs">Recommended</th>
												<th scope="col" aria-label="Difference, recommended minus current" title="Recommended minus current" class="pb-2 pl-1 text-right text-[0.65rem] font-medium leading-tight sm:text-xs">Δ</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-white/5 tabular-nums">
											<tr v-for="metric in getMetricRows(suggestion, result.nextGameweek)" :key="metric.label">
												<th scope="row" class="py-2 pr-2 text-left font-medium leading-tight text-stone-300">{{ metric.label }}</th>
												<td class="px-1 py-2 text-right text-white [overflow-wrap:anywhere]">{{ metric.currentValue }}</td>
												<td class="px-1 py-2 text-right font-semibold text-white [overflow-wrap:anywhere]">{{ metric.recommendedValue }}</td>
												<td class="py-2 pl-1 text-right">
													<span v-if="metric.delta !== null" class="inline-flex items-center justify-end gap-1 whitespace-nowrap tabular-nums" :class="getDeltaClass(metric.delta)">
														<UIcon v-if="metric.delta > 0" name="i-lucide-arrow-up" class="size-3 shrink-0" aria-hidden="true" />
														<UIcon v-else-if="metric.delta < 0" name="i-lucide-arrow-down" class="size-3 shrink-0" aria-hidden="true" />
														{{ metric.deltaLabel }}
													</span>
													<span v-else class="text-[0.65rem] text-stone-400">Unavailable</span>
												</td>
											</tr>
										</tbody>
									</table>
								</div>

								<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs tabular-nums sm:grid-cols-3 sm:text-sm">
									<div>
										<dt class="text-stone-400">{{ suggestion.bankImpact.label }}</dt>
										<dd class="mt-0.5 inline-flex items-center gap-1.5 font-semibold tabular-nums" :class="suggestion.bankImpact.color">
											<UIcon :name="suggestion.bankImpact.icon" class="size-3.5 shrink-0" aria-hidden="true" />
											{{ suggestion.bankImpact.value }}
										</dd>
									</div>
									<div>
										<dt class="text-stone-400">Sell / buy</dt>
										<dd class="mt-0.5 inline-flex items-center gap-1 font-semibold tabular-nums text-white">
											<span>{{ formatPrice(suggestion.outgoing.price) }}</span>
											<UIcon name="i-lucide-arrow-right" class="size-3 shrink-0 text-stone-400" aria-hidden="true" />
											<span>{{ formatPrice(suggestion.incoming.price) }}</span>
										</dd>
									</div>
									<div>
										<dt class="text-stone-400">Bank after</dt>
										<dd class="mt-0.5 font-semibold text-white">{{ formatPrice(suggestion.bankAfter) }}</dd>
									</div>
								</dl>
							</div>
						</div>
					</li>
				</ol>
				<UButton
					v-if="result.suggestions.length > initialVisibleCount"
					color="neutral"
					variant="ghost"
					class="min-h-11 w-full justify-center text-stone-300 hover:bg-white/5 hover:text-white"
					:aria-expanded="expanded"
					aria-controls="manager-recommendations-list"
					@click="expanded = !expanded"
				>
					{{ expanded ? "Show fewer recommendations" : `Show all ${result.suggestions.length} recommendations` }}
					<UIcon :name="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4" aria-hidden="true" />
				</UButton>
			</template>
		</div>
	</section>
</template>

<script setup>
const props = defineProps({ managerId: { type: [String, Number], required: true } });
const initialVisibleCount = 3;
const loading = ref(true);
const errorMessage = ref("");
const result = ref(null);
const expanded = ref(false);
const toFiniteNumber = (value) => {
	if (value === null || value === undefined || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
};
const getBankImpact = (netCost) => {
	const cost = toFiniteNumber(netCost);
	if (cost === null) {
		return { label: "Bank change", value: "Unavailable", icon: "i-lucide-minus", color: "text-stone-400" };
	}
	const bankChange = -cost;
	const increased = bankChange > 0;
	const decreased = bankChange < 0;
	return {
		label: increased ? "Bank increase" : decreased ? "Bank decrease" : "Bank change",
		value: bankChange === 0 ? "£0.0m" : `${increased ? "+" : "-"}£${Math.abs(bankChange).toFixed(1)}m`,
		icon: increased ? "i-lucide-arrow-up" : decreased ? "i-lucide-arrow-down" : "i-lucide-minus",
		color: increased ? "text-primary" : decreased ? "text-rose-300" : "text-stone-400",
	};
};
const visibleSuggestions = computed(() => {
	const suggestions = result.value?.suggestions ?? [];
	const visible = expanded.value ? suggestions : suggestions.slice(0, initialVisibleCount);
	return visible.map((suggestion) => ({ ...suggestion, bankImpact: getBankImpact(suggestion.netCost) }));
});

const loadRecommendations = async () => {
	loading.value = true;
	errorMessage.value = "";
	try {
		result.value = await $fetch(`/api/managers/${props.managerId}/recommendations`, { retry: 0, cache: "no-store" });
	} catch (error) {
		errorMessage.value = error?.data?.statusMessage || "We couldn't compare transfer options just now. Try again shortly.";
	} finally {
		loading.value = false;
	}
};

let automaticRequestStarted = false;
onMounted(() => {
	if (automaticRequestStarted) return;
	automaticRequestStarted = true;
	void loadRecommendations();
});

const formatStat = (value) => value === null || value === undefined ? "Unavailable" : Number(value).toFixed(1);
const formatNumber = (value) => value === null || value === undefined ? "Unavailable" : Number(value).toLocaleString("en-GB");
const formatPrice = (value) => value === null || value === undefined ? "Unavailable" : `£${Number(value).toFixed(1)}m`;
const hasExpectedPoints = (suggestion) => [suggestion.outgoing.expectedPoints, suggestion.incoming.expectedPoints].some((value) => value !== null && value !== undefined);
const calculateDelta = (current, recommended, precision) => {
	const currentValue = toFiniteNumber(current);
	const recommendedValue = toFiniteNumber(recommended);
	if (currentValue === null || recommendedValue === null) return null;
	return Number((recommendedValue - currentValue).toFixed(precision));
};
const formatDelta = (delta, precision) => {
	if (delta === null) return "Unavailable";
	const magnitude = Math.abs(delta).toLocaleString("en-GB", {
		minimumFractionDigits: precision,
		maximumFractionDigits: precision,
	});
	return `${delta > 0 ? "+" : delta < 0 ? "-" : ""}${magnitude}`;
};
const getDeltaClass = (delta) => delta > 0 ? "text-primary" : delta < 0 ? "text-rose-400" : "text-stone-400";
const getMetricRows = (suggestion, gameweek) => {
	const metrics = [
		{ label: "Form", current: suggestion.outgoing.form, recommended: suggestion.incoming.form, format: formatStat, precision: 1 },
		{ label: "Points per game", current: suggestion.outgoing.pointsPerGame, recommended: suggestion.incoming.pointsPerGame, format: formatStat, precision: 1 },
		{ label: "Minutes played", current: suggestion.outgoing.minutes, recommended: suggestion.incoming.minutes, format: formatNumber, precision: 0 },
		{ label: "Season points (cumulative)", current: suggestion.outgoing.totalPoints, recommended: suggestion.incoming.totalPoints, format: formatNumber, precision: 0 },
	];
	if (hasExpectedPoints(suggestion)) {
		metrics.push({ label: `FPL estimate · GW ${gameweek}`, current: suggestion.outgoing.expectedPoints, recommended: suggestion.incoming.expectedPoints, format: formatStat, precision: 1 });
	}
	return metrics.map((metric) => {
		const delta = calculateDelta(metric.current, metric.recommended, metric.precision);
		return {
			label: metric.label,
			currentValue: metric.format(metric.current),
			recommendedValue: metric.format(metric.recommended),
			delta,
			deltaLabel: formatDelta(delta, metric.precision),
		};
	});
};
</script>
