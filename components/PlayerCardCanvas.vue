<template>
	<div class="flex flex-col items-center justify-center">
		<!-- <pre>{{ upcoming }}</pre> -->
		<canvas ref="canvasRef" width="1024" height="1024"></canvas>
	</div>
</template>

<script setup lang="ts">
	// Props to make the card dynamic
	const props = defineProps({
		playerName: { type: String, default: "Ui-jo" },
		playerPrice: { type: String, default: "4.5m" },
		playerImage: { type: String },
		team: { type: String },
		teamImage: { type: String },
		position: { type: String, default: "FORWARD" },
		transfersIn: { type: Number, default: 168000 },
		transfersOut: { type: Number, default: 40000 },
		points: { type: Number, default: 0 },
		goals: { type: Number, default: 0 },
		index: { type: Number, default: 0 },
		played: { type: String },
		form: { type: String },
		selectedBy: { type: String },
		upcoming: { type: Array },
		gameweek: { type: String },
	});

	// Ref for the canvas element
	const canvasRef = ref<HTMLCanvasElement | null>(null);

	onMounted(() => {
		const canvas = canvasRef.value;
		if (canvas) {
			const ctx = canvas.getContext("2d");
			const canvasWidth = 1024;
			const canvasHeight = 1024;

			// Set the canvas size
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;

			// Assume these variables are defined elsewhere
			let transfersInPercentage: number = 30; // Percentage of transfers in
			let transfersOutPercentage: number = 70; // Percentage of transfers out

			// Colors
			const transfersInColor = "#14b8a6"; // Green
			const transfersOutColor = "#ef4544"; // Red
			const textColor = "#f0f4f8";

			// Set shadow properties
			ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
			ctx.shadowBlur = 80;
			ctx.shadowOffsetX = 5;
			ctx.shadowOffsetY = 15;

			ctx.fillStyle = "#e2e8f0"; // Background color
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Load the player image
			const playerImg = new Image();
			// @ts-ignore
			playerImg.src = props.playerImage; // Replace with the actual path of the player image
			const teamImg = new Image();
			// @ts-ignore
			teamImg.src = props.teamImage; // Replace with the actual path of the player image

			teamImg.onload = () => {
				ctx.drawImage(teamImg, 50, 120, 100, 100);
			};

			playerImg.onload = () => {
				// Proceed with other canvas drawing after the image is loaded

				// Calculate the center point of the canvas
				const centerX = canvas.width / 2;

				// Determine the width and height of the drawn image
				let drawWidth = Math.min(800, canvas.width); // Limit max width to 800 or canvas width
				let drawHeight = playerImg.height * (drawWidth / playerImg.width);

				// Calculate the x-coordinate for horizontal centering
				const drawX = centerX - drawWidth / 2;
				// Draw the image once it's loaded

				// @ts-ignore
				// Draw the image centered horizontally
				ctx.drawImage(playerImg, drawX, 224, drawWidth, drawHeight);
				ctx.shadowColor = "transparent";
				ctx.shadowBlur = 0;
				ctx.shadowOffsetX = 0;
				ctx.shadowOffsetY = 0;

				ctx.save();

				// Calculate dimensions for centered rectangle
				const rectWidth = canvas.width; // Subtract 20px for 10px padding on each side
				const rectHeight = 180; // Adjust as needed
				const cornerRadius = 0; // Adjust as needed
				const rectX = 0; // Start 10px from the left edge

				// Set y-coordinate dynamically
				let rectY = 800; // Example value, adjust as needed

				ctx.save();

				// Create rounded rectangle path
				ctx.beginPath();
				ctx.moveTo(rectX + cornerRadius, rectY);
				ctx.lineTo(rectX + rectWidth - cornerRadius, rectY);
				ctx.arcTo(
					rectX + rectWidth,
					rectY,
					rectX + rectWidth,
					rectY + rectHeight,
					cornerRadius
				);
				ctx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
				ctx.arcTo(
					rectX + rectWidth,
					rectY + rectHeight,
					rectX + rectWidth - cornerRadius,
					rectY + rectHeight,
					cornerRadius
				);
				ctx.lineTo(rectX + cornerRadius, rectY + rectHeight);
				ctx.arcTo(
					rectX,
					rectY + rectHeight,
					rectX,
					rectY + rectHeight - cornerRadius,
					cornerRadius
				);
				ctx.lineTo(rectX, rectY + cornerRadius);
				ctx.arcTo(rectX, rectY, rectX + cornerRadius, rectY, cornerRadius);

				// Fill transfers in part
				ctx.fillStyle = transfersInColor;
				ctx.fill();

				// Fill transfers out part
				ctx.fillStyle = transfersOutColor;
				const transfersOutWidth = rectWidth * (outPercentage.value / 100);
				ctx.fillRect(rectX, rectY, transfersOutWidth, rectHeight);

				ctx.restore();

				ctx.save();

				// // Create rounded rectangle path
				// ctx.beginPath();
				// ctx.moveTo(rectX + cornerRadius, 0);
				// ctx.lineTo(rectX + rectWidth - cornerRadius, 0);
				// ctx.arcTo(
				// 	rectX + rectWidth,
				// 	0,
				// 	rectX + rectWidth,
				// 	rectHeight,
				// 	cornerRadius
				// );
				// ctx.lineTo(rectX + rectWidth, rectHeight - cornerRadius);
				// ctx.arcTo(
				// 	rectX + rectWidth,
				// 	rectHeight,
				// 	rectX + rectWidth - cornerRadius,
				// 	rectHeight,
				// 	cornerRadius
				// );
				// ctx.lineTo(rectX + cornerRadius, rectHeight);
				// ctx.arcTo(
				// 	rectX,
				// 	rectHeight,
				// 	rectX,
				// 	rectHeight - cornerRadius,
				// 	cornerRadius
				// );
				// ctx.lineTo(rectX, cornerRadius);
				// ctx.arcTo(rectX, 0, rectX + cornerRadius, 0, cornerRadius);

				// // Fill transfers in part
				// ctx.fillStyle = transfersInColor;
				// ctx.fill();

				// // Fill transfers out part
				// ctx.fillStyle = transfersOutColor;
				// const transfersOutWidth = rectWidth * (transfersOutPercentage / 100);
				// ctx.fillRect(rectX, 30, transfersOutWidth, rectHeight);

				// ctx.restore();

				// Create rounded rectangle path
				// ctx.beginPath();
				// ctx.moveTo(cornerRadius, 0);
				// ctx.lineTo(rectWidth - cornerRadius, 0);
				// ctx.arcTo(rectWidth, 0, rectWidth, rectHeight, cornerRadius);
				// ctx.lineTo(rectWidth, rectHeight - cornerRadius);
				// ctx.arcTo(
				// 	rectWidth,
				// 	rectHeight,
				// 	rectWidth - cornerRadius,
				// 	rectHeight,
				// 	cornerRadius
				// );
				// ctx.lineTo(cornerRadius, rectHeight);
				// ctx.arcTo(0, rectHeight, 0, rectHeight - cornerRadius, cornerRadius);
				// ctx.lineTo(0, cornerRadius);
				// ctx.arcTo(0, 0, cornerRadius, 0, cornerRadius);

				// // Fill transfers in part
				// ctx.fillStyle = transfersInColor;
				// ctx.fill();

				// // Fill transfers out part
				// ctx.fillStyle = transfersOutColor;
				// const transfersOutWidth = rectWidth * (transfersOutPercentage / 100);
				// ctx.fillRect(10, 20, transfersOutWidth, rectHeight);

				// ctx.restore();

				// Draw the rest of the content...
				ctx.font = "bold 72px Arial";
				ctx.fillStyle = "#2d3748";
				ctx.fillText(props.playerName, 50, 100);

				ctx.textAlign = "right";
				ctx.font = "bold 120px Arial";
				ctx.fillStyle = "#4a5568";
				ctx.fillText(props.playerPrice, 960, 210);
				ctx.font = "40px Arial";
				ctx.fillStyle = "#2d3748";
				ctx.fillText(props.gameweek?.toUpperCase(), 960, 80);

				// Draw team and position
				ctx.textAlign = "left";
				ctx.font = "38px Arial";
				ctx.fillStyle = "#2d3748";
				ctx.fillText(props.team, 170, 160);
				ctx.font = "48px Arial";
				ctx.fillText(props.position, 170, 210);

				// other stats
				ctx.textAlign = "right";
				// Points
				ctx.font = "48px Arial";
				ctx.fillStyle = "#2d3748";
				ctx.fillText("Points", 960, 360);
				ctx.font = "bold 48px Arial";
				ctx.fillText(props.points, 960, 410);
				// Form
				ctx.font = "48px Arial";
				ctx.fillStyle = "#2d3748";
				ctx.fillText("Form", 960, 480);
				ctx.font = "bold 48px Arial";
				ctx.fillText(props.form, 960, 530);

				// time played
				ctx.textAlign = "left";
				ctx.font = "44px Arial";
				ctx.fillStyle = "#2d3748";
				ctx.fillText("Played", 50, 410);
				ctx.font = "bold 72px Arial";
				ctx.fillText(shortenNumber(props.played), 50, 480);

				// fixture diffuculty
				const squareSize = 50;
				const gap = 30;
				const totalWidth = squareSize * 5 + gap * 4;
				const startX = (canvas.width - totalWidth) / 2;
				const startY = 730; // Adjust this value to position the squares vertically

				ctx.font = "28px Arial";
				ctx.textAlign = "center";
				ctx.fillStyle = "#FFF";
				ctx.fillText("Upcoming difficulty", canvas.width / 2, 830);

				for (let i = 0; i < 5; i++) {
					const difficultyColors = {
						1: "#007bff", // Blue for easy
						2: "#66b3ff", // Light Blue for medium
						3: "#ffc107", // Yellow for medium
						4: "#ff7f50", // Coral for hard
						5: "#dc3545", // Red for very hard
					};

					const difficulty = props.upcoming[i].difficulty;
					ctx.fillStyle = "#FFF";
					ctx.fillRect(
						startX - 6 + i * (squareSize + gap),
						startY - 6,
						squareSize + 12,
						squareSize + 12
					);
					ctx.fillStyle = difficultyColors[difficulty] || "#666"; // Default color if difficulty is not 1, 2, or 3
					ctx.fillRect(
						startX + i * (squareSize + gap),
						startY,
						squareSize,
						squareSize
					);
				}

				// transfers
				ctx.textAlign = "left";
				ctx.font = "bold 72px Arial";
				ctx.fillStyle = textColor;
				ctx.fillText(shortenNumber(props.transfersOut), 50, 880);

				// transfer rank
				ctx.textAlign = "center";
				ctx.font = "bold 32px Arial";
				ctx.fillStyle = "#2d3748";
				ctx.fillText("Most Transferred In", canvas.width / 2, 900);
				ctx.font = "bold 64px Arial";
				ctx.fillText(`#${props.index + 1}`, canvas.width / 2, 960);

				ctx.textAlign = "right";
				ctx.font = "bold 72px Arial";
				ctx.fillStyle = textColor;
				ctx.fillText(shortenNumber(props.transfersIn), 960, 880);
				ctx.font = "bold 44px Arial";
				ctx.textAlign = "left";
				ctx.fillText("Transfers Out", 50, 930);
				ctx.textAlign = "right";
				ctx.fillText("Transfers In", 960, 930);
				// ctx.fillText(JSON.stringify(outPercentage.value), 960, 930);
			};
		}
	});

	const inPercentage = computed(() =>
		totalTransfers.value === 0
			? 50
			: (props.transfersIn / totalTransfers.value) * 100
	);

	const outPercentage = computed(() =>
		totalTransfers.value === 0
			? 50
			: (props.transfersOut / totalTransfers.value) * 100
	);

	const totalTransfers = computed(() => props.transfersIn + props.transfersOut);
</script>

<style scoped>
	canvas {
		border-radius: 10px;
		background-color: #f0f4f8;
	}
</style>
