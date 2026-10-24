<template>
	<section aria-labelledby="manager-recommendations-title" aria-roledescription="carousel" class="min-w-0 space-y-3">
		<header class="flex h-9 items-center justify-between gap-3">
			<h2 id="manager-recommendations-title" class="text-xl font-bold tracking-tight text-white">Recommendations</h2>
			<div v-if="result && result.suggestions.length" class="flex items-center gap-2">
				<span aria-live="polite" aria-atomic="true" class="min-w-8 text-center text-xs tabular-nums text-stone-400">{{ activeSlide + 1 }} / {{ result.suggestions.length }}</span>
				<div v-if="result.suggestions.length > 1" class="flex items-center gap-1">
					<UButton
						icon="i-lucide-chevron-left"
						color="neutral"
						variant="ghost"
						size="xs"
						class="size-8 justify-center text-stone-300"
						aria-label="Previous recommendation"
						aria-controls="manager-recommendations-list"
						:disabled="activeSlide === 0"
						@click="scrollToSlide(activeSlide - 1)"
					/>
					<UButton
						icon="i-lucide-chevron-right"
						color="neutral"
						variant="ghost"
						size="xs"
						class="size-8 justify-center text-stone-300"
						aria-label="Next recommendation"
						aria-controls="manager-recommendations-list"
						:disabled="activeSlide === result.suggestions.length - 1"
						@click="scrollToSlide(activeSlide + 1)"
					/>
				</div>
			</div>
		</header>

		<div class="h-[28rem] min-w-0 lg:h-[24rem]" :aria-busy="loading">
			<p v-if="loading && !result" class="flex h-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#101216] px-4 text-sm text-stone-300" role="status" aria-live="polite">
				<UIcon name="i-lucide-loader-circle" class="size-4 text-primary motion-safe:animate-spin" aria-hidden="true" />
				<span>Comparing your squad with current FPL options…</span>
			</p>

			<div v-else-if="errorMessage" class="flex h-full min-w-0 flex-col justify-center gap-3 rounded-2xl border border-white/10 bg-[#101216] p-4">
				<UAlert color="error" variant="soft" title="Recommendations unavailable" :description="errorMessage" />
				<UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="loading" :disabled="loading" @click="loadRecommendations">
					Retry recommendations
				</UButton>
			</div>

			<div v-else-if="result" class="h-full min-w-0">
				<p v-if="!result.suggestions.length" class="flex h-full items-center justify-center rounded-2xl border border-white/10 bg-[#101216] px-4 text-center text-sm leading-6 text-stone-300" role="status">
					{{ result.message }}
				</p>
				<ol
					v-else
					id="manager-recommendations-list"
					ref="recommendationTrack"
					aria-label="Transfer recommendations"
					class="flex h-full min-w-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-2xl border border-white/10 bg-[#101216] scroll-smooth motion-reduce:scroll-auto"
					@scroll.passive="updateActiveSlide"
				>
					<li
						v-for="(suggestion, slideIndex) in visibleSuggestions"
						:key="suggestion.id"
						class="h-full w-full min-w-0 shrink-0 snap-start p-3 sm:p-4"
						aria-roledescription="slide"
						:aria-label="`Recommendation ${slideIndex + 1} of ${result.suggestions.length}`"
					>
						<div class="grid h-full min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(15rem,0.75fr)_minmax(0,1.25fr)] lg:grid-rows-1">
							<div class="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3 lg:h-full">
								<ManagerRecommendationPlayer label="Current player" align="left" :player="suggestion.outgoing" />
								<UIcon name="i-lucide-arrow-right" class="size-4 shrink-0 text-stone-400 sm:size-5" aria-hidden="true" />
								<ManagerRecommendationPlayer label="Recommended player" align="right" :player="suggestion.incoming" />
							</div>

							<div class="flex h-full min-h-0 min-w-0 flex-col">
								<div class="min-h-0 min-w-0 flex-1 overflow-x-auto border-t border-white/10 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
									<table class="h-full w-full min-w-[15.5rem] table-fixed text-left text-sm">
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

								<dl class="mt-auto flex min-w-0 flex-nowrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[0.65rem] tabular-nums sm:text-sm">
									<div class="flex min-w-0 shrink-0 items-center gap-1.5">
										<dt class="shrink-0 text-stone-400">
											<span class="sm:hidden">Transfer</span>
											<span class="hidden sm:inline">Sell / buy</span>
										</dt>
										<dd class="inline-flex shrink-0 items-center gap-1 font-semibold text-white">
											<span>{{ formatPrice(suggestion.outgoing.price) }}</span>
											<UIcon name="i-lucide-arrow-right" class="size-3 shrink-0 text-stone-400" aria-hidden="true" />
											<span>{{ formatPrice(suggestion.incoming.price) }}</span>
										</dd>
									</div>
									<div class="flex shrink-0 items-center gap-1.5">
										<dt class="shrink-0 text-stone-400">
											<span class="sm:hidden">Bank</span>
											<span class="hidden sm:inline">Bank after</span>
										</dt>
										<dd class="inline-flex items-center gap-1.5 font-semibold text-white">
											<span>{{ formatPrice(suggestion.bankAfter) }}</span>
											<span class="inline-flex items-center gap-1" :class="suggestion.bankImpact.color">
												<UIcon :name="suggestion.bankImpact.icon" class="size-3 shrink-0" aria-hidden="true" />
												<span>{{ suggestion.bankImpact.value }}</span>
												<span class="sr-only">{{ suggestion.bankImpact.label }}</span>
											</span>
										</dd>
									</div>
								</dl>
							</div>
						</div>
					</li>
				</ol>
			</div>
		</div>
	</section>
</template>

<script setup>
const props = defineProps({ managerId: { type: [String, Number], required: true } });
const loading = ref(true);
const errorMessage = ref("");
const result = ref(null);
const recommendationTrack = ref(null);
const activeSlide = ref(0);
const toFiniteNumber = (value) => {
	if (value === null || value === undefined || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
};
const getBankImpact = (netCost) => {
	const cost = toFiniteNumber(netCost);
	if (cost === null) {
		return { value: "Unavailable", label: "bank change unavailable", icon: "i-lucide-minus", color: "text-stone-400" };
	}
	const bankChange = -cost;
	const increased = bankChange > 0;
	const decreased = bankChange < 0;
	return {
		value: bankChange === 0 ? "£0.0m" : `${increased ? "+" : "-"}£${Math.abs(bankChange).toFixed(1)}m`,
		label: increased ? "bank increase" : decreased ? "bank decrease" : "no bank change",
		icon: increased ? "i-lucide-arrow-up" : decreased ? "i-lucide-arrow-down" : "i-lucide-minus",
		color: increased ? "text-primary" : decreased ? "text-rose-300" : "text-stone-400",
	};
};
const visibleSuggestions = computed(() => {
	return (result.value?.suggestions ?? []).map((suggestion) => ({ ...suggestion, bankImpact: getBankImpact(suggestion.netCost) }));
});
const cacheKey = computed(() => `manager-recommendations:${props.managerId}`);
const readCachedRecommendations = () => {
	try {
		const cached = JSON.parse(localStorage.getItem(cacheKey.value) || "null");
		return /^[a-f0-9]{64}$/.test(cached?.fingerprint)
			&& cached.response?.fingerprint === cached.fingerprint
			&& Array.isArray(cached.response?.suggestions) ? cached : null;
	} catch {
		return null;
	}
};
const scrollToSlide = (index) => {
	const track = recommendationTrack.value;
	const lastSlide = visibleSuggestions.value.length - 1;
	if (!track || lastSlide < 0) return;
	const targetIndex = Math.min(Math.max(index, 0), lastSlide);
	activeSlide.value = targetIndex;
	track.scrollTo({ left: targetIndex * track.clientWidth, behavior: "auto" });
};
const updateActiveSlide = () => {
	const track = recommendationTrack.value;
	if (!track?.clientWidth) return;
	const lastSlide = visibleSuggestions.value.length - 1;
	activeSlide.value = Math.min(Math.round(track.scrollLeft / track.clientWidth), Math.max(lastSlide, 0));
};

const loadRecommendations = async () => {
	loading.value = true;
	errorMessage.value = "";
	activeSlide.value = 0;
	const cached = readCachedRecommendations();
	if (cached) result.value = cached.response;
	try {
		const latest = await $fetch(`/api/managers/${props.managerId}/recommendations`, {
			retry: 0,
			cache: "no-store",
			query: cached ? { cachedFingerprint: cached.fingerprint } : undefined,
		});
		if (latest.unchanged && cached) return;
		result.value = latest;
		if (typeof latest.fingerprint === "string" && Array.isArray(latest.suggestions)) {
			try {
				localStorage.setItem(cacheKey.value, JSON.stringify({ fingerprint: latest.fingerprint, response: latest }));
			} catch {
				// Recommendations remain usable when browser storage is full or unavailable.
			}
		}
	} catch (error) {
		if (!cached) errorMessage.value = error?.data?.statusMessage || "We couldn't compare transfer options just now. Try again shortly.";
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
