<template>
	<figure class="mt-4 flex min-w-0 shrink-0 flex-col border-t border-white/10 pt-3" :class="fullWidth ? 'min-h-[10rem]' : 'h-[10rem]'">
		<figcaption class="flex shrink-0 flex-col gap-1">
			<div class="min-w-0">
				<span class="text-xs font-semibold leading-4 text-white">{{ chartTitle }}</span>
			</div>
			<ul v-if="hasRecordedHistory" class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.55rem] leading-3 text-stone-400" aria-label="Chart legend">
				<li class="shrink-0">
					<button
						type="button"
						:aria-pressed="visibleSeries.points"
						:class="visibleSeries.points ? 'text-stone-300' : 'text-stone-500 line-through opacity-60'"
						class="inline-flex min-h-6 items-center gap-1 rounded-sm px-0.5 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
						@click="toggleSeries('points')"
					>
						<span class="h-[2px] w-2.5 rounded-full bg-lime-300" aria-hidden="true" />
						Points
					</button>
				</li>
				<li v-for="series in overlaySeries" :key="series.key" class="shrink-0">
					<button
						type="button"
						:aria-pressed="visibleSeries[series.key]"
						:class="visibleSeries[series.key] ? 'text-stone-300' : 'text-stone-500 line-through opacity-60'"
						class="inline-flex min-h-6 items-center gap-1 rounded-sm px-0.5 transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
						@click="toggleSeries(series.key)"
					>
						<span class="h-[2px] w-2.5 rounded-full" :style="{ backgroundColor: series.color }" aria-hidden="true" />
						{{ series.label }}
					</button>
				</li>
			</ul>
		</figcaption>

		<div class="mt-2 min-h-0 flex-1">
			<div v-if="loading" class="flex h-full items-end justify-between gap-3" role="status">
				<p class="sr-only">Loading recent gameweek points.</p>
				<span
					v-for="(height, index) in loadingBarHeights"
					:key="index"
					class="w-5 rounded-t bg-white/10 motion-safe:animate-pulse"
					:style="{ height: `${height}px` }"
				/>
			</div>
			<div v-else-if="error" class="flex h-full flex-wrap content-center items-center justify-between gap-x-3 gap-y-1">
				<p class="text-xs leading-5 text-stone-400">Recent point history is temporarily unavailable.</p>
				<UButton color="neutral" variant="link" size="xs" class="h-auto min-h-0 px-0 text-xs text-lime-200" @click="emit('retry')">
					Try again
				</UButton>
			</div>
			<p v-else-if="!chartPoints.length" class="flex h-full items-center text-xs leading-5 text-stone-400">
				No completed gameweeks are available yet.
			</p>
			<p v-else-if="!hasRecordedHistory" class="flex h-full items-center text-xs leading-5 text-stone-400">
				No recent match history is available for this player.
			</p>
			<svg
				v-else
				:class="fullWidth ? 'block h-auto w-full overflow-visible' : 'h-full w-full overflow-visible'"
				viewBox="0 0 360 116"
				role="group"
				:aria-label="chartDescription"
			>
				<title>{{ chartTitle }}</title>
				<desc>Focus a gameweek point to inspect raw points, minutes, goals, assists, and bonus totals.</desc>
				<defs>
					<linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stop-color="#bef264" stop-opacity="0.34" />
						<stop offset="100%" stop-color="#bef264" stop-opacity="0.015" />
					</linearGradient>
					<linearGradient
						v-for="series in overlaySeries"
						:key="`${series.key}-gradient`"
						:id="`${gradientId}-${series.key}`"
						x1="0"
						y1="0"
						x2="0"
						y2="1"
					>
						<stop offset="0%" :stop-color="series.color" stop-opacity="0.07" />
						<stop offset="100%" :stop-color="series.color" stop-opacity="0.004" />
					</linearGradient>
				</defs>
				<line
					:x1="fullWidth ? 0 : 12"
					:y1="chartBounds.baseline"
					:x2="fullWidth ? 360 : 348"
					:y2="chartBounds.baseline"
					stroke="rgba(255,255,255,0.14)"
					stroke-width="1"
				/>
				<line
					:x1="fullWidth ? 0 : 12"
					:y1="chartTop + plotHeight / 2"
					:x2="fullWidth ? 360 : 348"
					:y2="chartTop + plotHeight / 2"
					stroke="rgba(255,255,255,0.055)"
					stroke-width="1"
					stroke-dasharray="2 5"
				/>
				<g v-for="(segment, index) in plottedSegments" :key="`segment-${index}`">
					<path v-if="visibleSeries.points" :d="areaPath(segment)" :fill="`url(#${gradientId})`" class="chart-area" />
				</g>
				<g v-for="series in visibleOverlaySeries" :key="series.key" aria-hidden="true">
					<g v-for="(segment, segmentIndex) in series.segments" :key="`${series.key}-${segmentIndex}`">
						<path :d="overlayAreaPath(segment)" :fill="`url(#${gradientId}-${series.key})`" class="chart-area" />
						<path :d="linePath(segment)" fill="none" :stroke="series.color" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" />
						<circle
							v-for="point in segment"
							:key="`${series.key}-${point.index}`"
							:cx="point.x"
							:cy="point.y"
							r="2.4"
							:fill="series.color"
							stroke="#101216"
							stroke-width="1"
						/>
					</g>
				</g>
				<g v-if="visibleSeries.points" aria-hidden="true">
					<g v-for="(segment, index) in plottedSegments" :key="`points-line-${index}`">
						<path :d="linePath(segment)" fill="none" stroke="#bef264" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" />
					</g>
				</g>
				<text v-if="!hasVisibleSeries" x="180" y="56" text-anchor="middle" class="fill-stone-400 text-[10px] font-medium">
					Select a legend item to show its trend
				</text>
				<g
					v-for="(point, index) in chartPoints"
					:key="point.gameweek"
					:aria-label="describePoint(point)"
					class="group cursor-help outline-none"
					role="img"
					tabindex="0"
				>
					<title>{{ describePoint(point) }}</title>
					<circle
						v-if="visibleSeries.points && point.points !== null"
						:cx="pointX(index)"
						:cy="pointY(point)"
						r="3.5"
						class="fill-lime-200 stroke-[#101216] stroke-2 transition-colors duration-150 group-hover:stroke-white group-focus-visible:stroke-white motion-reduce:transition-none"
					/>
					<line
						v-else-if="visibleSeries.points"
						:x1="pointX(index) - 3"
						:y1="chartBounds.baseline"
						:x2="pointX(index) + 3"
						:y2="chartBounds.baseline"
						stroke="rgba(255,255,255,0.55)"
						stroke-width="2"
						stroke-dasharray="2 2"
					/>
					<text
						v-if="visibleSeries.points"
						:x="pointX(index)"
						:y="pointLabelY(point)"
						:text-anchor="pointAnchor(index)"
						class="fill-stone-100 text-[10px] font-bold tabular-nums"
					>
						{{ point.points === null ? "—" : point.points }}
					</text>
					<text
						:x="pointX(index)"
						y="110"
						:text-anchor="pointAnchor(index)"
						class="fill-stone-400 text-[9px] font-medium"
					>
						GW {{ point.gameweek }}
					</text>
				</g>
			</svg>
		</div>
	</figure>
</template>

<script setup lang="ts">
type HistoryEntry = Record<string, any>;
type EventEntry = Record<string, any>;
type ChartPoint = {
	gameweek: number;
	points: number | null;
	minutes: number | null;
	goals: number | null;
	assists: number | null;
	bonus: number | null;
};
type PlottedPoint = { point: ChartPoint; x: number; y: number };
type OverlayKey = "minutes" | "goals" | "assists" | "bonus";
type ChartSeriesKey = "points" | OverlayKey;
type OverlayMetric = { key: OverlayKey; label: string; color: string };
type OverlayCoordinate = { index: number; x: number; y: number };
type OverlaySeries = OverlayMetric & { segments: OverlayCoordinate[][] };

const props = withDefaults(defineProps<{
	playerId?: string | number;
	history?: HistoryEntry[];
	events?: EventEntry[];
	loading?: boolean;
	error?: boolean;
	fullWidth?: boolean;
}>(), {
	history: () => [],
	events: () => [],
	loading: false,
	error: false,
	fullWidth: false,
});
const emit = defineEmits<{ retry: [] }>();
const visibleSeries = ref<Record<ChartSeriesKey, boolean>>({
	points: true,
	minutes: true,
	goals: true,
	assists: true,
	bonus: true,
});

const loadingBarHeights = [27, 39, 31, 50, 35, 44];
const chartTop = 16;
const chartBottom = 76;
const plotHeight = chartBottom - chartTop;
const gradientId = computed(() => `watchlist-points-area-${String(props.playerId ?? "player").replace(/[^a-zA-Z0-9_-]/g, "")}`);
const overlayMetrics: OverlayMetric[] = [
	{ key: "minutes", label: "Minutes", color: "#38bdf8" },
	{ key: "goals", label: "Goals", color: "#fb7185" },
	{ key: "assists", label: "Assists", color: "#c4b5fd" },
	{ key: "bonus", label: "Bonus", color: "#fbbf24" },
];

const chartPoints = computed<ChartPoint[]>(() => {
	const completedEvents = props.events
		.filter((event) => event.finished === true && Number.isInteger(Number(event.id)))
		.sort((left, right) => Number(left.id) - Number(right.id))
		.slice(-7);
	const totalsByGameweek = new Map<number, ChartPoint>();

	for (const entry of props.history) {
		const gameweek = Number(entry.round);
		if (!Number.isInteger(gameweek)) continue;

		const total = totalsByGameweek.get(gameweek) || {
			gameweek,
			points: null,
			minutes: null,
			goals: null,
			assists: null,
			bonus: null,
		};
		const points = numericValue(entry.total_points);
		if (points !== null) total.points = (total.points ?? 0) + points;
		for (const [key, field] of [
			["minutes", "minutes"],
			["goals", "goals_scored"],
			["assists", "assists"],
			["bonus", "bonus"],
		] as const) {
			const value = numericValue(entry[field]);
			if (value !== null) total[key] = (total[key] ?? 0) + value;
		}
		totalsByGameweek.set(gameweek, total);
	}

	return completedEvents.map((event) => {
		const gameweek = Number(event.id);
		return totalsByGameweek.get(gameweek) || {
			gameweek,
			points: null,
			minutes: null,
			goals: null,
			assists: null,
			bonus: null,
		};
	});
});

const overlaySeries = computed<OverlaySeries[]>(() => overlayMetrics.flatMap((metric) => {
	const values = chartPoints.value
		.map((point) => point[metric.key])
		.filter((value): value is number => value !== null);
	if (!values.length) return [];

	const maximum = Math.max(1, ...values);
	const segments: OverlayCoordinate[][] = [];
	let currentSegment: OverlayCoordinate[] = [];

	chartPoints.value.forEach((point, index) => {
		const value = point[metric.key];
		if (value === null) {
			if (currentSegment.length) segments.push(currentSegment);
			currentSegment = [];
			return;
		}

		currentSegment.push({
			index,
			x: pointX(index),
			y: chartTop + ((maximum - value) / maximum) * plotHeight,
		});
	});

	if (currentSegment.length) segments.push(currentSegment);
	return [{ ...metric, segments }];
}));
const visibleOverlaySeries = computed(() => overlaySeries.value.filter((series) => visibleSeries.value[series.key]));
const hasVisibleSeries = computed(() => visibleSeries.value.points || visibleOverlaySeries.value.length > 0);

const hasRecordedHistory = computed(() => chartPoints.value.some((point) => point.points !== null));
const chartBounds = computed(() => {
	const values = chartPoints.value
		.map((point) => point.points)
		.filter((value): value is number => value !== null);
	const maximum = Math.max(1, ...values);
	const minimum = Math.min(0, ...values);
	const range = maximum - minimum || 1;

	return {
		baseline: chartTop + (maximum / range) * plotHeight,
		maximum,
		range,
	};
});
const visibleSeriesLabels = computed(() => [
	...(visibleSeries.value.points ? ["Points"] : []),
	...visibleOverlaySeries.value.map((series) => series.label),
]);
const chartTitle = computed(() => visibleSeriesLabels.value.length
	? `${visibleSeriesLabels.value.join(" + ")} by gameweek`
	: "Select stats to display");
const chartDescription = computed(() => {
	if (!visibleSeriesLabels.value.length) return "Trend chart by gameweek. No stats are visible. Use a legend button to show a series.";

	const scaleNote = visibleOverlaySeries.value.length ? "Additional stats use independent scales. " : "";
	return `${chartTitle.value}. ${scaleNote}Focus a gameweek marker to inspect visible raw values.`;
});
const plottedSegments = computed(() => {
	const segments: PlottedPoint[][] = [];
	let currentSegment: PlottedPoint[] = [];

	chartPoints.value.forEach((point, index) => {
		if (point.points === null) {
			if (currentSegment.length) segments.push(currentSegment);
			currentSegment = [];
			return;
		}

		currentSegment.push({ point, x: pointX(index), y: pointY(point) });
	});

	if (currentSegment.length) segments.push(currentSegment);
	return segments;
});

const pointX = (index: number) => chartPoints.value.length <= 1
	? 180
	: props.fullWidth ? (index * 360) / (chartPoints.value.length - 1) : 24 + (index * 312) / (chartPoints.value.length - 1);
const pointAnchor = (index: number) => !props.fullWidth || chartPoints.value.length <= 1
	? "middle"
	: index === 0 ? "start" : index === chartPoints.value.length - 1 ? "end" : "middle";
const pointY = (point: ChartPoint) => point.points === null
	? chartBounds.value.baseline
	: chartTop + ((chartBounds.value.maximum - point.points) / chartBounds.value.range) * plotHeight;
const pointLabelY = (point: ChartPoint) => {
	const y = pointY(point);
	return point.points !== null && point.points < 0
		? Math.min(92, y + 11)
		: Math.max(10, y - 8);
};
const curveCommands = (segment: Array<{ x: number; y: number }>) => segment
	.slice(0, -1)
	.map((current, index) => {
		const previous = segment[Math.max(0, index - 1)];
		const next = segment[index + 1];
		const following = segment[Math.min(segment.length - 1, index + 2)];
		const lower = Math.min(current.y, next.y);
		const upper = Math.max(current.y, next.y);
		const control1y = Math.max(lower, Math.min(upper, current.y + (next.y - previous.y) / 6));
		const control2y = Math.max(lower, Math.min(upper, next.y - (following.y - current.y) / 6));

		return `C ${current.x + (next.x - previous.x) / 6} ${control1y} ${next.x - (following.x - current.x) / 6} ${control2y} ${next.x} ${next.y}`;
	})
	.join(" ");
const areaPath = (segment: PlottedPoint[]) => {
	const first = segment[0];
	const last = segment[segment.length - 1];
	return `M ${first.x} ${chartBounds.value.baseline} L ${first.x} ${first.y} ${curveCommands(segment)} L ${last.x} ${chartBounds.value.baseline} Z`;
};
const overlayAreaPath = (segment: OverlayCoordinate[]) => {
	const first = segment[0];
	const last = segment[segment.length - 1];
	return `M ${first.x} ${chartBottom} L ${first.x} ${first.y} ${curveCommands(segment)} L ${last.x} ${chartBottom} Z`;
};
const linePath = (segment: Array<{ x: number; y: number }>) => {
	const first = segment[0];
	const commands = curveCommands(segment);
	return `M ${first.x} ${first.y}${commands ? ` ${commands}` : ""}`;
};
const describePoint = (point: ChartPoint) => {
	const details = [
		visibleSeries.value.points
			? point.points === null ? "points unavailable" : `${point.points} point${point.points === 1 ? "" : "s"}`
			: null,
		visibleSeries.value.minutes && point.minutes !== null ? `${point.minutes} minute${point.minutes === 1 ? "" : "s"}` : null,
		visibleSeries.value.goals && point.goals !== null ? `${point.goals} goal${point.goals === 1 ? "" : "s"}` : null,
		visibleSeries.value.assists && point.assists !== null ? `${point.assists} assist${point.assists === 1 ? "" : "s"}` : null,
		visibleSeries.value.bonus && point.bonus !== null ? `${point.bonus} bonus point${point.bonus === 1 ? "" : "s"}` : null,
	].filter((detail): detail is string => detail !== null);
	return details.length
		? `Gameweek ${point.gameweek}: ${details.join(", ")}.`
		: `Gameweek ${point.gameweek}: no visible stat values.`;
};

const toggleSeries = (series: ChartSeriesKey) => {
	visibleSeries.value[series] = !visibleSeries.value[series];
};

function numericValue(value: unknown) {
	if (value === null || value === undefined || value === "") return null;
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}
</script>

<style scoped>
@keyframes watchlist-area-reveal {
	from {
		opacity: 0;
		transform: scaleY(0.25);
	}

	to {
		opacity: 1;
		transform: scaleY(1);
	}
}

.chart-area {
	transform-box: fill-box;
	transform-origin: center bottom;
	animation: watchlist-area-reveal 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (prefers-reduced-motion: reduce) {
	.chart-area {
		animation: none;
	}
}
</style>
