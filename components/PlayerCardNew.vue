<template>
	<div class="flex flex-col h-full">
		<!-- content -->
		<div class="flex-grow">
			<div class="flex flex-col order-1 p-3 sm:order-1">
				<div class="leading-3">
					<!-- cards issued -->
					<div class="flex items-center">
						<div class="pr-3">
							<div class="text-sm font-semibold">{{ teamName }}</div>
							<div class="text-xs uppercase text-slate-500">
								{{ elementType }}
							</div>
						</div>
					</div>
				</div>

				<div class="flex justify-between">
					<div>
						<h2 class="w-full text-2xl font-bold leading-5">
							{{ player.web_name }}
						</h2>
						<div class="mt-1 mb-3 text-3xl font-black text-slate-500">
							{{ player.now_cost / 10 }}<span class="text-slate-400">m</span>
						</div>
					</div>
					<section v-if="player.yellow_cards > 0 || player.red_cards > 0">
						<!-- <div class="mt-2 text-sm font-semibold">Cards</div> -->
						<div class="flex items-center">
							<div
								v-if="player.yellow_cards > 0"
								class="w-4 h-6 mr-1 bg-yellow-400"
								:title="`${player.yellow_cards} Yellow Card${
									player.yellow_cards > 1 ? 's' : ''
								}`"
							/>
							<div
								v-if="player.red_cards > 0"
								class="w-4 h-6 bg-red-600 rounded-[2px]"
								:title="`${player.red_cards} Red Card${
									player.red_cards > 1 ? 's' : ''
								}`"
							/>
							<span
								v-if="player.yellow_cards === 0 && player.red_cards === 0"
								class="text-sm"
							>
								None
							</span>
						</div>
					</section>
				</div>

				<!-- transfers -->
				<div class="w-full">
					<ComparisonBar
						:comparison="{
							label: 'Transfers',
							homeWidth: inPercentage,
							homeTitle: 'In',
							homeValue: shortenNumber(player.transfers_in_event),
							awayWidth: outPercentage,
							awayTitle: 'Out',
							awayValue: shortenNumber(player.transfers_out_event),
						}"
					/>
				</div>
			</div>
		</div>

		<!-- image -->
		<img
			:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${player.code}.png`"
			class="object-cover w-full h-auto sm:z-10 sm:h-36 sm:w-auto"
			:alt="player.web_name"
		/>
	</div>
</template>

<script setup>
	const props = defineProps({
		player: Object,
	});

	const teamName = ref("");

	const inPercentage = computed(() =>
		totalTransfers.value === 0
			? 50
			: (props.player.transfers_in_event / totalTransfers.value) * 100
	);

	const outPercentage = computed(() =>
		totalTransfers.value === 0
			? 50
			: (props.player.transfers_out_event / totalTransfers.value) * 100
	);

	const totalTransfers = computed(
		() => props.player.transfers_in_event + props.player.transfers_out_event
	);

	const elementTypeMap = {
		1: "Goalkeeper",
		2: "Defender",
		3: "Midfielder",
		4: "Forward",
	};

	const elementType = computed(
		() => elementTypeMap[props.player.element_type] || "Unknown"
	);
</script>
