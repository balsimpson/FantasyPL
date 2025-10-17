<template>
	<div class="px-2 mx-auto max-w-2xl">
		<div class="flex gap-x-3 items-center">
			<div>
				<h2 class="text-xl font-semibold">Most Transferred In</h2>
				<select v-model="selectedTransferIn" @change="handlePlayerInChange" class="p-2 mt-4 rounded border">
					<option disabled value="">Select a player</option>
					<option v-for="(player, index) in mostTransferredIn" :key="player.id" :value="index">
						{{ player.first_name }} {{ player.second_name }}
					</option>
				</select>
			</div>
			<div>
				<h2 class="text-xl font-semibold">Most Transferred Out</h2>
				<select v-model="selectedTransferOut" @change="handlePlayerOutChange" class="p-2 mt-4 rounded border">
					<option disabled value="">Select a player</option>
					<option v-for="(player, index) in mostTransferredOut" :key="player.id" :value="index">
						{{ player.first_name }} {{ player.second_name }}
					</option>
				</select>
			</div>
			<div>
				<h2 class="text-xl font-semibold">Most Recommended</h2>
				<select v-model="selectedPlayer" class="p-2 mt-4 rounded border"
					@change="handlePlayerReccomendedChange">
					<option disabled value="">Select a player</option>
					<option v-for="(player, index) in recommendedPlayers" :key="player.id" :value="index">
						{{ player.first_name }} {{ player.second_name }}
					</option>
				</select>
			</div>
		</div>

		<InstaPlayer v-if="selectedPlayerData" :player="selectedPlayerData"
			:team="getTeamInfo(selectedPlayerData.team, bootstrap).name" :upcoming="player?.fixtures.slice(0, 5)"
			:gameweek="currentGameWeek" :key="selectedPlayerData.web_name" ref="playerCard" id="my-node" />

		<div class="mt-12">
			<div class="flex gap-x-3 items-center">
				<div>
					<h2 class="text-xl font-semibold">Most Transferred In</h2>
					<select v-model="selectedPlayer1" @change="handlePlayerInChange" class="p-2 mt-4 rounded border">
						<option disabled value="">Select a player</option>
						<option v-for="(player, index) in mostTransferredIn" :key="player.id" :value="index">
							{{ player.first_name }} {{ player.second_name }}
						</option>
					</select>
				</div>
				<div>
					<h2 class="text-xl font-semibold">Most Transferred Out</h2>
					<select v-model="selectedPlayer2" @change="handlePlayerOutChange" class="p-2 mt-4 rounded border">
						<option disabled value="">Select a player</option>
						<option v-for="(player, index) in mostTransferredOut" :key="player.id" :value="index">
							{{ player.first_name }} {{ player.second_name }}
						</option>
					</select>
				</div>
			</div>

			<div v-if="selectedPlayer1 && selectedPlayer2">
				<!-- <div class="flex gap-2">
					<pre>{{ mostTransferredIn[selectedPlayer1] }}</pre>
					<pre>{{ mostTransferredOut[selectedPlayer2] }}</pre>
				</div> -->
				<InstaPlayerComparison id="comparison-node" v-if="selectedPlayer1 && selectedPlayer2"
					:player1="mostTransferredIn[selectedPlayer1]" :player2="mostTransferredOut[selectedPlayer2]" :team1="getTeamInfo(mostTransferredIn[selectedPlayer1].team, bootstrap)
						" :team2="getTeamInfo(mostTransferredOut[selectedPlayer2].team, bootstrap)
						" />
			</div>
		</div>

		<div v-if="caption">{{ caption.message }}</div>

		<button @click.prevent="getInstaCaption(selectedPlayerData)"
			class="px-3 py-1 text-sm font-semibold text-white bg-purple-600 rounded-full">
			Get caption
		</button>

		<!-- Download Buttons -->
		<div class="flex gap-4 mt-8">
			<button @click="downloadImage" class="px-4 py-2 text-white bg-blue-500 rounded">
				Download Player Card
			</button>
			<button @click="downloadComparisonImage" :disabled="!selectedPlayer1 || !selectedPlayer2"
				class="px-4 py-2 text-white bg-green-500 rounded disabled:bg-gray-400">
				Download Comparison
			</button>
		</div>

		<pre>{{ recommendedPlayers.length }}</pre>
	</div>
</template>

<script setup>
import domtoimage from "dom-to-image-more";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import { toPng } from "html-to-image";

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

const downloadImage = async () => {
	let captureEl = document.querySelector("#my-node");

	try {
		// Perform capture using html-to-image
		const dataUrl = await toPng(captureEl, {
			canvasWidth: 1080,
			canvasHeight: 1080,
			useCORS: false, // CORS issues are bypassed by data URLs for mobile, and handled by preload for desktop
			allowTaint: true, // Allow taint as a fallback, especially useful for complex scenarios
			backgroundColor: '#000000',
			style: {
				'transform': 'none',
				'overflow': 'visible'
			},
			filter: (node) => {
				if (node.tagName === 'IMG') {
					// Further debug here to see what img src is being processed
					// if (node.src && node.src.startsWith('data:')) {
					//   console.log('📷 Capturing DATA URL image:', node.src.substring(0, 50) + '...');
					// } else {
					console.log('📷 Capturing image:', node.src);
					// }
				}
				return true;
			}
		});
	} catch (error) {
		console.log(error)
	}
};

// Helper function to convert external image URLs to use our proxy
const convertExternalImagesToProxy = async (element) => {
	const images = element.querySelectorAll('img');
	const promises = [];

	images.forEach((img) => {
		const src = img.src || img.getAttribute('src');
		if (src && src.startsWith('http') && !src.startsWith(window.location.origin)) {
			const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
			img.src = proxyUrl;
		}
	});

	// Wait a bit for images to load
	await new Promise(resolve => setTimeout(resolve, 1000));
};

// Helper function to apply Instagram-optimized styles
const applyInstagramStyles = (element) => {
	// Store original styles
	const originalStyles = {
		width: element.style.width,
		height: element.style.height,
		transform: element.style.transform,
		position: element.style.position,
		top: element.style.top,
		left: element.style.left,
	};

	// Apply exact Instagram dimensions (no scaling needed since component is already 1080px)
	element.style.width = '1080px';
	element.style.height = '1080px';
	element.style.transform = 'none';
	element.style.transformOrigin = 'center center';
	element.style.position = 'absolute';
	element.style.top = '0';
	element.style.left = '0';

	return originalStyles;
};

// Helper function to restore original styles
const restoreOriginalStyles = (element, originalStyles) => {
	Object.keys(originalStyles).forEach(key => {
		element.style[key] = originalStyles[key];
	});
};

const downloadComparisonImage = async () => {
	const captureEl = document.querySelector("#comparison-node");

	if (!captureEl) {
		console.error("Comparison element not found");
		return;
	}

	// Store original styles to restore later
	const originalStyles = applyInstagramStyles(captureEl);

	try {
		// First, convert external images to use our proxy
		await convertExternalImagesToProxy(captureEl);

		// Use html2canvas which handles CORS better
		// Instagram post dimensions: 1080x1080 (square)
		const canvas = await html2canvas(captureEl, {
			useCORS: true,
			allowTaint: true,
			backgroundColor: '#000000',
			width: 1080,
			height: 1080,
			scale: 1, // No scaling - use exact dimensions
			logging: false,
			onclone: (clonedDoc) => {
				// Ensure the cloned element fills the canvas properly
				const clonedElement = clonedDoc.querySelector('#comparison-node');
				if (clonedElement) {
					// Set exact 1080px dimensions
					clonedElement.style.width = '1080px';
					clonedElement.style.height = '1080px';
					clonedElement.style.transform = 'none';
					clonedElement.style.overflow = 'hidden';
					clonedElement.style.position = 'relative';

					// Ensure all child elements have proper z-index and positioning
					const allElements = clonedElement.querySelectorAll('*');
					allElements.forEach(el => {
						// Remove any potential artifacts from transforms
						if (el.style.transform && el.style.transform.includes('scale')) {
							// Keep the transform but ensure it renders cleanly
							el.style.willChange = 'transform';
							el.style.backfaceVisibility = 'hidden';
						}
					});

					// The element should already be styled, but ensure parent is correct
					const parent = clonedElement.parentElement;
					if (parent) {
						parent.style.width = '1080px';
						parent.style.height = '1080px';
						parent.style.position = 'relative';
						parent.style.overflow = 'hidden';
						parent.style.backgroundColor = '#000000';
					}
				}
			}
		});

		// Convert canvas to data URL and download
		const dataUrl = canvas.toDataURL('image/png');
		const link = document.createElement('a');
		link.download = `player-comparison-${Date.now()}.png`;
		link.href = dataUrl;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

	} catch (error) {
		console.error("Error capturing comparison:", error);

		// Fallback: try with toPng but skip external images
		try {
			console.log("Trying fallback method...");
			const dataUrl = await toPng(captureEl, {
				canvasWidth: 1080,
				canvasHeight: 1080,
				pixelRatio: 1, // No scaling - use exact dimensions
				useCORS: false,
				allowTaint: false,
				backgroundColor: '#000000',
				style: {
					'transform': 'none',
					'overflow': 'visible',
					'width': '1080px',
					'height': '1080px',
					'display': 'flex',
					'justifyContent': 'center',
					'alignItems': 'center'
				},
				filter: (node) => {
					// Skip external images to avoid CORS issues
					if (node.tagName === 'IMG') {
						const src = node.src || node.getAttribute('src');
						if (src && (src.startsWith('http') && !src.startsWith(window.location.origin))) {
							console.log('Skipping external image:', src);
							return false;
						}
					}
					return true;
				}
			});

			const link = document.createElement('a');
			link.download = `player-comparison-${Date.now()}.png`;
			link.href = dataUrl;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (fallbackError) {
			console.error("Fallback also failed:", fallbackError);
		}
	} finally {
		// Always restore original styles
		restoreOriginalStyles(captureEl, originalStyles);
	}
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
