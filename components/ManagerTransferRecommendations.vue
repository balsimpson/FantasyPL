<template>
	<section v-if="visibleSuggestions.length" aria-labelledby="manager-recommendations-title" class="min-w-0 space-y-3">
		<header class="flex h-9 items-center justify-between gap-3">
			<h2 id="manager-recommendations-title" class="text-xl font-bold tracking-tight text-white">Transfer options <span v-if="result?.targetGameweek" class="ml-2 text-sm font-normal text-stone-400">GW {{ result.targetGameweek }}</span></h2>
			<div v-if="visibleSuggestions.length" class="flex items-center gap-2">
				<span aria-live="polite" aria-atomic="true" class="min-w-8 text-center text-xs tabular-nums text-stone-400">{{ activeSlide + 1 }} / {{ visibleSuggestions.length }}</span>
				<div v-if="visibleSuggestions.length > 1" class="flex items-center gap-1">
					<CarouselArrowButton
						direction="previous"
						aria-label="Previous recommendation"
						aria-controls="manager-recommendations-list"
						:disabled="activeSlide === 0"
						@click="scrollToSlide(activeSlide - 1)"
					/>
					<CarouselArrowButton
						direction="next"
						aria-label="Next recommendation"
						aria-controls="manager-recommendations-list"
						:disabled="activeSlide === visibleSuggestions.length - 1"
						@click="scrollToSlide(activeSlide + 1)"
					/>
				</div>
			</div>
		</header>

		<div class="h-[40rem] min-w-0 lg:h-[24rem]">
			<ol
				id="manager-recommendations-list"
				ref="recommendationTrack"
				aria-label="Transfer recommendations"
				:class="CAROUSEL_SINGLE_COLUMNS"
				class="grid h-full min-w-0 grid-flow-col gap-4 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-smooth motion-reduce:scroll-auto"
				@scroll.passive="updateActiveSlide"
			>
				<li
					v-for="(suggestion, slideIndex) in visibleSuggestions"
					:key="suggestion.id"
					tabindex="-1"
					class="h-full min-w-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-[#101216]"
					aria-roledescription="slide"
					:aria-label="`Recommendation ${slideIndex + 1} of ${visibleSuggestions.length}`"
				>
					<div class="grid h-full min-w-0 grid-rows-[18rem_minmax(0,1fr)] lg:grid-cols-[minmax(15rem,0.75fr)_minmax(0,1.25fr)] lg:grid-rows-1">
						<div class="relative grid h-full min-w-0 grid-cols-2 border-b border-white/10 lg:border-b-0 lg:border-r">
							<ManagerRecommendationPlayer label="Consider selling" align="left" :player="suggestion.outgoing" />
							<ManagerRecommendationPlayer label="Recommended player" align="right" :player="suggestion.incoming" />
							<span class="pointer-events-none absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-[#101216] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-stone-200" aria-hidden="true">vs</span>
						</div>

						<div class="flex h-full min-h-0 min-w-0 flex-col p-3 sm:p-4">
							<div class="min-h-0 min-w-0 flex-1 overflow-auto">
								<p class="mb-2 text-sm leading-5 text-white">{{ suggestion.reason }}</p>
								<table class="w-full min-w-[15.5rem] table-fixed text-left font-sans text-sm font-semibold leading-5 tabular-nums">
									<caption class="sr-only">Current, recommended, and difference in player performance measures</caption>
									<colgroup>
										<col class="w-[39%]" />
										<col class="w-[18%]" />
										<col class="w-[27%]" />
										<col class="w-[16%]" />
									</colgroup>
									<thead>
										<tr class="text-stone-400">
											<th scope="col" class="pb-2 pr-2 text-left text-xs font-medium leading-4">Measure</th>
											<th scope="col" class="px-1 pb-2 text-right text-xs font-medium leading-4">Current</th>
												<th scope="col" class="px-1 pb-2 text-right text-xs font-medium leading-4 [overflow-wrap:anywhere]">Recommended</th>
											<th scope="col" aria-label="Difference, recommended minus current" title="Recommended minus current" class="pb-2 pl-1 text-right text-xs font-medium leading-4">Δ</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-white/5 tabular-nums">
										<tr v-for="metric in getMetricRows(suggestion, result.nextGameweek)" :key="metric.label">
											<th scope="row" class="py-2 pr-2 text-left text-xs font-medium leading-4 text-stone-400">{{ metric.label }}</th>
											<td class="px-1 py-2 text-right text-white [overflow-wrap:anywhere]">{{ metric.currentValue }}</td>
											<td class="px-1 py-2 text-right font-semibold text-white [overflow-wrap:anywhere]">{{ metric.recommendedValue }}</td>
											<td class="py-2 pl-1 text-right">
												<span v-if="metric.delta !== null" class="inline-flex items-center justify-end gap-1 whitespace-nowrap text-xs font-semibold leading-4 tabular-nums" :class="getDeltaClass(metric.delta)">
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

						</div>
					</div>
				</li>
			</ol>
		</div>
	</section>
</template>

<script setup>
import CarouselArrowButton from "~/components/CarouselArrowButton.vue";
import { CAROUSEL_SINGLE_COLUMNS } from "~/utils/carousel-layout";
const props = defineProps({
	result: { type: Object, required: true },
});
const recommendationTrack = ref(null);
const activeSlide = ref(0);
const toFiniteNumber = (value) => {
	if (value === null || value === undefined || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
};
const visibleSuggestions = computed(() => props.result.suggestions);
const scrollToSlide = (index) => {
	const track = recommendationTrack.value;
	const lastSlide = visibleSuggestions.value.length - 1;
	if (!track || lastSlide < 0) return;
	const targetIndex = Math.min(Math.max(index, 0), lastSlide);
	activeSlide.value = targetIndex;
	const target = track.children[targetIndex];
	if (target) track.scrollTo({ left: target.offsetLeft - track.children[0].offsetLeft, behavior: "auto" });
};
const updateActiveSlide = () => {
	const track = recommendationTrack.value;
	if (!track?.clientWidth) return;
	const slides = Array.from(track.children);
	if (!slides.length) return;
	const origin = slides[0].offsetLeft;
	activeSlide.value = slides.reduce((nearest, slide, index) =>
		Math.abs(slide.offsetLeft - origin - track.scrollLeft) < Math.abs(slides[nearest].offsetLeft - origin - track.scrollLeft)
			? index : nearest, 0);
};

watch(visibleSuggestions, async () => {
	activeSlide.value = 0;
	await nextTick();
	scrollToSlide(0);
});

const formatStat = (value) => value === null || value === undefined ? "Unavailable" : Number(value).toFixed(1);
const formatNumber = (value) => value === null || value === undefined ? "Unavailable" : Number(value).toLocaleString("en-GB");
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
