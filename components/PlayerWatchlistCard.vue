<template>
	<UCard
		:ui="{ body: 'p-4 sm:p-5', root: 'ring-0' }"
		class="h-full overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] text-stone-50"
	>
		<div class="flex h-full flex-col gap-5">
			<div class="flex items-start gap-4">
				<NuxtLink
					:to="playerRoute"
					class="group flex min-w-0 flex-1 items-start gap-4 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
					:aria-label="`Open ${playerName} profile`"
				>
					<div
						class="flex size-20 shrink-0 items-end justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] sm:size-24"
					>
						<img
							v-if="showImage"
							:src="playerImageSrc"
							:alt="playerName"
							width="110"
							height="140"
							loading="lazy"
							class="h-full w-full object-contain object-bottom transition duration-300 group-hover:scale-105"
							@error="showImage = false"
						/>
						<span
							v-else
							aria-hidden="true"
							class="mb-3 size-8 rounded-full border border-primary/30 bg-primary/10"
						/>
					</div>

					<div class="min-w-0 pt-1">
						<p class="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-stone-500">
							{{ elementType }} · {{ teamName }}
						</p>
						<h2 class="mt-2 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
							{{ playerName }}
						</h2>
						<p class="mt-2 text-sm text-stone-400">
							{{ player.web_name }} · {{ playerPrice }}
						</p>
					</div>
				</NuxtLink>

				<PlayerWatchlistButton :player="player" class="shrink-0" />
			</div>

			<div class="grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
				<div>
					<p class="text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
						Points
					</p>
					<p class="mt-1 font-serif text-xl font-black text-white">
						{{ player.total_points ?? "—" }}
					</p>
				</div>
				<div>
					<p class="text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
						Form
					</p>
					<p class="mt-1 font-serif text-xl font-black text-white">
						{{ player.form ?? "—" }}
					</p>
				</div>
				<div>
					<p class="text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-stone-500">
						Selected
					</p>
					<p class="mt-1 font-serif text-xl font-black text-white">
						{{ selectedBy }}
					</p>
				</div>
			</div>
		</div>
	</UCard>
</template>

<script setup lang="ts">
import { getPlayerRoute } from "~/composables/usePlayerRoute";

const props = defineProps<{
	player: Record<string, any>;
	bootstrap?: Record<string, any> | null;
}>();

const elementTypeMap: Record<number, string> = {
	1: "Goalkeeper",
	2: "Defender",
	3: "Midfielder",
	4: "Forward",
};

const bootstrapData = computed(() => props.bootstrap?.value ?? props.bootstrap);
const playerRoute = computed(() => getPlayerRoute(props.player));
const playerName = computed(() => {
	const fullName = `${props.player.first_name || ""} ${props.player.second_name || ""}`.trim();

	return fullName || props.player.web_name || "Unknown player";
});
const teamName = computed(() => {
	const team = bootstrapData.value?.teams?.find((item: any) => item.id === props.player.team);

	return props.player.teamData?.name || team?.name || "Unknown team";
});
const elementType = computed(() => elementTypeMap[props.player.element_type] || "Player");
const playerPrice = computed(() => {
	const cost = Number(props.player.now_cost || 0) / 10;

	return cost ? `£${cost.toFixed(cost % 1 === 0 ? 0 : 1)}m` : "Price unavailable";
});
const selectedBy = computed(() => {
	const value = Number(props.player.selected_by_percent);

	return Number.isFinite(value) ? `${value}%` : "—";
});
const playerImageSrc = computed(
	() => `https://resources.premierleague.com/premierleague25/photos/players/110x140/${props.player.code}.png`,
);
const showImage = ref(true);
</script>
