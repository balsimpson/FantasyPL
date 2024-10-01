<template>
	<div class="max-w-2xl px-2 mx-auto">
		<div class="flex items-center gap-x-3">
			<div>
				<h2 class="text-xl font-semibold">Most Transferred In</h2>
				<select
					v-model="selectedTransferIn"
					@change="handlePlayerInChange"
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
			</div>
			<div>
				<h2 class="text-xl font-semibold">Most Transferred Out</h2>
				<select
					v-model="selectedTransferOut"
					@change="handlePlayerOutChange"
					class="p-2 mt-4 border rounded"
				>
					<option disabled value="">Select a player</option>
					<option
						v-for="(player, index) in mostTransferredOut"
						:key="player.id"
						:value="index"
					>
						{{ player.first_name }} {{ player.second_name }}
					</option>
				</select>
			</div>
			<div>
				<h2 class="text-xl font-semibold">Most Recommended</h2>
				<select
					v-model="selectedPlayer"
					class="p-2 mt-4 border rounded"
					@change="handlePlayerReccomendedChange"
				>
					<option disabled value="">Select a player</option>
					<option
						v-for="(player, index) in recommendedPlayers"
						:key="player.id"
						:value="index"
					>
						{{ player.first_name }} {{ player.second_name }}
					</option>
				</select>
			</div>
		</div>

		<InstaPlayer
			v-if="selectedPlayerData"
			:player="selectedPlayerData"
			:team="getTeamInfo(selectedPlayerData.team, bootstrap).name"
			:upcoming="player?.fixtures.slice(0, 5)"
			:gameweek="currentGameWeek"
			:key="selectedPlayerData.web_name"
			ref="playerCard"
			id="my-node"
		/>

		<div class="mt-12">
			<div class="flex items-center gap-x-3">
				<div>
					<h2 class="text-xl font-semibold">Most Transferred In</h2>
					<select
						v-model="selectedPlayer1"
						@change="handlePlayerInChange"
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
				</div>
				<div>
					<h2 class="text-xl font-semibold">Most Transferred Out</h2>
					<select
						v-model="selectedPlayer2"
						@change="handlePlayerOutChange"
						class="p-2 mt-4 border rounded"
					>
						<option disabled value="">Select a player</option>
						<option
							v-for="(player, index) in mostTransferredOut"
							:key="player.id"
							:value="index"
						>
							{{ player.first_name }} {{ player.second_name }}
						</option>
					</select>
				</div>
			</div>

			<div v-if="selectedPlayer1 && selectedPlayer2">
				<div class="flex gap-2">
					<pre>{{ mostTransferredIn[selectedPlayer1] }}</pre>
					<pre>{{ mostTransferredOut[selectedPlayer2] }}</pre>
				</div>
				<InstaPlayerComparison
					v-if="selectedPlayer1 && selectedPlayer2"
					:player1="mostTransferredIn[selectedPlayer1]"
					:player2="mostTransferredOut[selectedPlayer2]"
					:team1="
						getTeamInfo(mostTransferredIn[selectedPlayer1].team, bootstrap)
					"
					:team2="
						getTeamInfo(mostTransferredOut[selectedPlayer2].team, bootstrap)
					"
				/>
			</div>
		</div>

		<div v-if="caption">{{ caption.message }}</div>

		<button
			@click.prevent="getInstaCaption(selectedPlayerData)"
			class="px-3 py-1 text-sm font-semibold text-white bg-purple-600 rounded-full"
		>
			Get caption
		</button>

		<!-- Download Button -->
		<button
			@click="downloadImage"
			class="px-4 py-2 mt-8 text-white bg-blue-500 rounded"
		>
			Download as Image
		</button>

		<pre>{{ recommendedPlayers.length }}</pre>
	</div>
</template>

<script setup>
	import domtoimage from "dom-to-image-more";
	import html2canvas from "html2canvas";
	import { saveAs } from "file-saver";

	const player = ref(null);
	const caption = ref("");

	const selectedPlayer = ref();
	const selectedPlayer1 = ref();
	const selectedPlayer2 = ref();

	const { data: bootstrap } = await useLazyAsyncData("bootstrap", () =>
		$fetch("/api/bootstrap-static")
	);

	const getInstaCaption = async (playerData) => {
		caption.value = await $fetch("/api/instagram", {
			method: "POST",
			body: {
				prompt: JSON.stringify(playerData),
			},
		});

		console.log("caption", caption.value);
	};

	const setPlayerForComparison = () => {
		console.log("selectedPlayer1", selectedPlayer1.value);
		console.log("selectedPlayer2", selectedPlayer2.value);
		// Increment the key to force a redraw
		player.value = selectedPlayer1.value;
		canvasKey.value++;
	};

	const selectedTransferIn = ref();
	const selectedTransferOut = ref();
	const selectedPlayerData = ref();
	const canvasKey = ref(0);

	const playerCard = ref();

	const mostTransferredIn = computed(() => {
		if (bootstrap.value && bootstrap.value.elements) {
			return getMostTransferredInPlayers(bootstrap.value.elements, 20);
		}
		return [];
	});

	const mostTransferredOut = computed(() => {
		if (bootstrap.value && bootstrap.value.elements) {
			return getMostTransferredOutPlayers(bootstrap.value.elements, 20);
		}
		return [];
	});

	const currentGameWeek = computed(() => {
		if (bootstrap.value && bootstrap.value.events) {
			return bootstrap.value.events.find((event) => event.is_current);
		}
	});

	const handlePlayerInChange = () => {
		selectedPlayerData.value =
			mostTransferredIn.value[selectedTransferIn.value];

		// Increment the key to force a redraw
		canvasKey.value++;
	};
	const handlePlayerOutChange = () => {
		selectedPlayerData.value =
			mostTransferredOut.value[selectedTransferOut.value];

		// Increment the key to force a redraw
		canvasKey.value++;
	};
	const handlePlayerReccomendedChange = () => {
		selectedPlayerData.value = recommendedPlayers.value[selectedPlayer.value];

		// Increment the key to force a redraw
		canvasKey.value++;
	};

	const allPlayers = useState("allPlayers");
	const allTeams = useState("allTeams");
	const MAX_OPTIONS = 50;

	const selectedPosition = 1;
	const recommendedPlayers = computed(() => {
		if (!bootstrap.value.elements) return [];

		let filteredPlayers = bootstrap.value.elements.filter(
			(player) =>
				player.element_type == selectedPosition && player.now_cost <= 5 * 10
		);

		// Calculate scores
		// @ts-ignore
		const scoredPlayers = filteredPlayers.map((player) => ({
			...player,
			score: calculatePlayerScore(player),
		}));

		// Sort by score in descending order and take the top N
		// @ts-ignore
		return scoredPlayers
			.sort((a, b) => b.score - a.score)
			.slice(0, MAX_OPTIONS);
	});

	watchEffect(async () => {
		if (selectedPlayerData.value) {
			console.log("id", selectedPlayerData.value.id);

			let playerId = selectedPlayerData.value.id;
			player.value = await $fetch(`/api/players/${playerId}`);
		}
	});

	const downloadImage = () => {
		// const options = {
		// 	backgroundColor: "transparent", // Ensures the background is transparent
		// };

		// domtoimage
		// 	.toBlob(document.getElementById("my-node"), options)
		// 	.then(function (blob) {
		// 		saveAs(blob, "my-node.png");
		// 	})
		// 	.catch((error) => {
		// 		console.error("Error capturing element:", error);
		// 	});

		// html2canvas(document.getElementById("my-node")).then(function (canvas) {
		// 	saveAs(canvas.toDataURL(), "my-node.png");
		// });

		html2canvas(document.getElementById("'my-node"), { useCORS: true }).then(
			function (canvas) {
				saveAs(canvas.toDataURL(), "my-node.png");
			}
		);
	};

	// const downloadImage = async () => {
	// 	// let img = await domtoimage.toBlob(document.getElementById("my-node"));
	// 	// let res = window.saveAs(img, "my-node.png")
	// 	// console.log("img", img);

	// 	nextTick(() => {
	// 		// console.log("downloadImage");
	// 		let node = document.getElementById("my-node")

	// 		// 	.then(function (blob) {
	// 		// 		window.saveAs(blob, "my-node.png");
	// 		// 	});

	// 		// domtoimage
	// 		// 	.toPng(node)
	// 		// 	.then(function (dataUrl) {
	// 		// 		var img = new Image();
	// 		// 		img.src = dataUrl;
	// 		// 		// document.body.appendChild(img);
	// 		// 	})
	// 		// 	.catch(function (error) {
	// 		// 		console.error("oops, something went wrong!", error);
	// 		// 	});

	// 		domtoimage
	// 			.toBlob(document.getElementById("my-node"))
	// 			.then(function (blob) {
	// 				window.saveAs(blob, "my-node.png");
	// 			});
	// 	});
	// };
</script>
