<template>
	<div>
		<div>Instagram</div>

		<!-- <pre v-if="selectedPlayerData">Player: {{ player?.fixtures.slice(0, 5) }}</pre> -->

		<select
			v-model="selectedPlayer"
			@change="handlePlayerChange"
			class="p-2 mt-4 border rounded"
		>
			<option disabled value="">Select a player</option>
			<option
				v-for="(player, index) in mostTransferredIn"
				:key="player.id"
				:value="index"
			>
				{{ player.first_name }} {{ player.second_name }}
			</option>
		</select>

		<pre>
            <!-- {{ selectedPlayerData }} -->
        </pre>

		<PlayerCardCanvas
			v-if="selectedPlayerData"
			:key="canvasKey"
			:playerName="selectedPlayerData.web_name"
			:playerPrice="`${selectedPlayerData.now_cost / 10}m`"
			:playerImage="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${selectedPlayerData.code}.png`"
			:team="getTeamInfo(selectedPlayerData.team, bootstrap).name"
			:teamImage="`https://resources.premierleague.com/premierleague/badges/t${selectedPlayerData.team_code}.png`"
			:position="getPositionName(selectedPlayerData.element_type)"
			:transfersIn="selectedPlayerData.transfers_in_event"
			:transfersOut="selectedPlayerData.transfers_out_event"
			:points="selectedPlayerData.total_points"
			:goals="3"
			:index="selectedPlayer"
			:played="`${selectedPlayerData.minutes} min`"
			:form="selectedPlayerData.form"
			:selectedBy="shortenNumber(selectedPlayerData.selected_by_percent)"
			:upcoming="player?.fixtures.slice(0, 5)"
			:gameweek="currentGameWeek.name"
		/>
	</div>
</template>

<script setup>
	const player = ref(null)

	const { data: bootstrap, error } = await useLazyAsyncData("bootstrap", () =>
		$fetch("/api/bootstrap-static")
	);

	const selectedPlayer = ref();
	const selectedPlayerData = ref();
	const canvasKey = ref(0);

	const mostTransferredIn = computed(() => {
		if (bootstrap.value && bootstrap.value.elements) {
			return getMostTransferredInPlayers(bootstrap.value.elements, 20);
		}
		return [];
	});

	const currentGameWeek = computed(() => {
		if (bootstrap.value && bootstrap.value.events) {
			return bootstrap.value.events.find((event) => event.is_current);
		}
	});

	const handlePlayerChange = () => {
		// console.log("event", selectedPlayer.value);
		// console.log("selected", mostTransferredIn.value[selectedPlayer.value]);

		selectedPlayerData.value = mostTransferredIn.value[selectedPlayer.value];

		// Increment the key to force a redraw
		canvasKey.value++;
	};

	watchEffect(async() => {
		if (selectedPlayerData.value) {
			console.log('watching', selectedPlayerData.value);
			let playerId = selectedPlayerData.value.id;
			player.value = await $fetch(`/api/players/${playerId}`);
		}
	});
</script>
