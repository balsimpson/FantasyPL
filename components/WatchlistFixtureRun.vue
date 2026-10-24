<template>
	<section aria-label="Upcoming fixtures by gameweek" class="mt-4 min-w-0">
		<h4 class="shrink-0 text-sm font-semibold text-white">Upcoming fixtures</h4>

		<div v-if="loading" class="mt-2 grid min-w-0 grid-cols-3 gap-2" role="status">
			<p class="sr-only">Loading upcoming fixtures.</p>
			<div v-for="week in run" :key="week.gameweek" class="flex min-w-0 flex-col border-l border-white/10 pl-2 first:border-l-0 first:pl-0">
				<p class="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-stone-300">GW {{ week.gameweek }}</p>
				<div class="mt-2 h-16 rounded bg-white/[0.04] motion-safe:animate-pulse" />
			</div>
		</div>

		<p v-else-if="error || !available" class="mt-2 text-xs leading-5 text-stone-400">
			Fixture information is temporarily unavailable.
		</p>
		<p v-else-if="!run.length" class="mt-2 text-xs leading-5 text-stone-400">
			No upcoming gameweeks have been published.
		</p>
		<div v-else class="mt-2 grid min-w-0 grid-cols-3 gap-2" role="group" aria-label="Fixtures across the next three gameweeks">
			<div
				v-for="week in run"
				:key="week.gameweek"
				class="flex min-w-0 flex-col border-l border-white/10 pl-2 first:border-l-0 first:pl-0"
			>
				<h5 class="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-stone-300">GW {{ week.gameweek }}</h5>
				<p v-if="!week.matches.length" class="mt-1 text-xs leading-4 text-stone-400">No scheduled match</p>
				<ul v-else class="mt-1 flex min-w-0 flex-col">
					<li
						v-for="(match, index) in week.matches"
						:key="match.id ?? `${week.gameweek}-${index}`"
						class="flex flex-col pt-2 first:pt-1"
						:class="{ 'border-t border-white/10': index > 0 }"
					>
						<div class="flex min-w-0 items-center gap-1.5">
							<img
								v-if="match.opponentCode"
								:src="`https://resources.premierleague.com/premierleague/badges/t${match.opponentCode}.png`"
								alt=""
								width="24"
								height="24"
								loading="lazy"
								decoding="async"
								class="size-5 shrink-0 object-contain"
							/>
							<div class="min-w-0">
								<p class="text-[0.64rem] font-semibold uppercase tracking-[0.08em] text-stone-300">
									{{ match.venue === "H" ? "Home" : "Away" }}
								</p>
								<p class="text-xs font-semibold leading-4 text-white [overflow-wrap:anywhere]">{{ match.opponent }}</p>
							</div>
						</div>

						<div class="min-w-0 pt-1.5">
							<ClientOnly>
								<time v-if="match.kickoff" :datetime="match.kickoff" class="block whitespace-nowrap text-[0.59rem] leading-4 tabular-nums text-stone-300">
									{{ formatKickoff(match.kickoff) }}
								</time>
								<span v-else class="block whitespace-nowrap text-[0.59rem] leading-4 text-stone-400">Kickoff TBC</span>
								<template #fallback>
									<span class="block whitespace-nowrap text-[0.59rem] leading-4 text-stone-400">
										{{ match.kickoff ? "Date set" : "Kickoff TBC" }}
									</span>
								</template>
							</ClientOnly>

							<div
								class="mt-1 flex min-w-0 items-center gap-1.5"
								role="img"
								:aria-label="match.difficulty === null ? 'Fixture difficulty unavailable' : `Fixture difficulty ${match.difficulty} out of 5, ${difficultyLabel(match.difficulty)}`"
							>
								<div class="flex w-10 shrink-0 gap-0.5" aria-hidden="true">
									<span
										v-for="level in 5"
										:key="level"
										class="h-1.5 flex-1 rounded-full"
										:class="difficultySegmentClass(match.difficulty, level)"
									/>
								</div>
								<span class="whitespace-nowrap text-[0.62rem] font-semibold tabular-nums" :class="difficultyClass(match.difficulty)">
									{{ match.difficulty === null ? "—" : `${match.difficulty}/5` }}
								</span>
							</div>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
type FixtureMatch = {
	id: number | string | null;
	opponent: string;
	opponentCode: number | string | null;
	venue: "H" | "A";
	difficulty: number | null;
	kickoff: string | null;
};
type FixtureWeek = { gameweek: number; matches: FixtureMatch[] };

withDefaults(defineProps<{
	run: FixtureWeek[];
	available: boolean;
	loading: boolean;
	error: boolean;
}>(), {
	run: () => [],
	available: false,
	loading: false,
	error: false,
});

const formatKickoff = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Kickoff TBC";

	const parts = new Intl.DateTimeFormat("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(date);
	const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
	return `${getPart("weekday")} ${getPart("day")} ${getPart("month")} · ${getPart("hour")}:${getPart("minute")}`;
};

const difficultyLabel = (value: number) => value <= 2 ? "easier" : value >= 4 ? "harder" : "medium";
const difficultyClass = (value: number | null) => value === null
	? "text-stone-400"
	: value <= 2 ? "text-lime-200"
		: value >= 4 ? "text-rose-200"
			: "text-amber-100";
const difficultySegmentClass = (value: number | null, level: number) => value === null || level > value
	? "bg-white/10"
	: value <= 2 ? "bg-lime-300" : value >= 4 ? "bg-rose-300" : "bg-amber-200";
</script>
