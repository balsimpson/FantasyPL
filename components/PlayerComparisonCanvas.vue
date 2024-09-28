<template>
	<div class="flex flex-col items-center justify-center">
		<!-- <pre>{{ player1 }}</pre> -->
		<canvas ref="canvasRef" class="w-full max-w-[1024px] h-auto"></canvas>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		canvasKey: Number,
		player1: Object,
		player2: Object,
		bootstrap: Object
	});

	const canvasRef = ref<HTMLCanvasElement | null>(null);
	const textColor = "#f0f4f8";

	onMounted(() => {
		const canvas = canvasRef.value;7
		if (canvas) {
			const ctx = canvas.getContext("2d");
			const canvasWidth = 1024;
			const canvasHeight = 1024;

			canvas.width = canvasWidth;
			canvas.height = canvasHeight;

			// Draw background for the whole canvas
			drawCanvasBackground(ctx, canvasWidth, canvasHeight);

			// Divide canvas into two halves for Player 1 and Player 2
			drawPlayerSide(ctx, props.player1, -350, canvasWidth / 2, "left");
			drawPlayerSide(
				ctx,
				props.player2,
				canvasWidth - 450,
				canvasWidth / 2,
				"right"
			);
		}
	});

	// Helper to draw canvas background
	function drawCanvasBackground(
		ctx: CanvasRenderingContext2D | null,
		width: number,
		height: number
	) {
		ctx.fillStyle = "#e2e8f0";
		ctx.fillRect(0, 0, width, height);
		ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
		ctx.shadowBlur = 80;
		ctx.shadowOffsetX = 5;
		ctx.shadowOffsetY = 15;
	}

	// Helper to draw player data on one side of the canvas
	function drawPlayerSide(
		ctx: CanvasRenderingContext2D | null,
		player: any,
		startX: number,
		width: number,
		alignment: string
	) {
		const image = new Image();

		if (player) {
			image.src = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`;
		}

		image.onload = () => {
			let drawWidth = Math.min(800, 1024);
			let drawHeight = image.height * (drawWidth / image.width);

			ctx.drawImage(image, startX, 230, drawWidth, drawHeight);

			// Player name
			ctx.textAlign = alignment == "left" ? "right" : "left";
			ctx.font = "bold 72px Arial";
			ctx.fillStyle = "#2d3748";
			ctx.fillText(
				player.web_name,
				startX + (alignment === "left" ? 800 : width - 550),
				100
			);

			// Team and position
			ctx.font = "38px Arial";
			ctx.fillText(
				getTeamInfo(player.team, bootstrap),
				startX + (alignment === "left" ? 50 : width - 50),
				160
			);
			ctx.font = "48px Arial";
			ctx.fillText(
				player.position,
				startX + (alignment === "left" ? 50 : width - 50),
				210
			);

			// Price
			ctx.font = "bold 120px Arial";
			ctx.fillText(
				player.now_cost/10 + "m",
				startX + (alignment === "left" ? 800 : width - 550),
				290
			);

			// // Points
			drawStat(ctx, player.points, "Points", startX, 360, width, alignment);

			// // Form
			drawStat(ctx, player.form, "Form", startX + (alignment == "left" ? 600 : width - 850), 480, width, alignment);

			// // Upcoming difficulty
			drawUpcomingDifficulty(ctx, player.upcoming, startX, width);

			// // Transfers in/out
			drawTransfersContent(
				ctx,
				player.transfersIn,
				player.transfersOut,
				startX,
				width,
				alignment
			);
		};
	}

	// Helper to draw stats like Points, Form
	function drawStat(
		ctx: CanvasRenderingContext2D | null,
		value: number | string,
		label: string,
		startX: number,
		y: number,
		width: number,
		alignment: string
	) {
		ctx.textAlign = alignment === "left" ? "left" : "right";
		ctx.font = "48px Arial";
		ctx.fillText(label, startX + (alignment === "left" ? 50 : width - 50), y);
		ctx.font = "bold 48px Arial";
		ctx.fillText(
			value.toString(),
			startX + (alignment === "left" ? 50 : width - 50),
			y + 50
		);
	}

	// Helper to draw upcoming difficulty
	function drawUpcomingDifficulty(
		ctx: CanvasRenderingContext2D | null,
		upcoming: Array<any>,
		startX: number,
		width: number
	) {
		const squareSize = 50;
		const gap = 30;
		const totalWidth = squareSize * 5 + gap * 4;
		const offsetX = (width - totalWidth) / 2 + startX;
		const startY = 730;

		ctx.font = "28px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Upcoming difficulty", startX + width / 2, 830);

		for (let i = 0; i < 5; i++) {
			const difficultyColors = getDifficultyColors(upcoming[i].difficulty);

			ctx.fillStyle = "#FFF";
			ctx.fillRect(
				offsetX - 6 + i * (squareSize + gap),
				startY - 6,
				squareSize + 12,
				squareSize + 12
			);
			ctx.fillStyle = difficultyColors;
			ctx.fillRect(
				offsetX + i * (squareSize + gap),
				startY,
				squareSize,
				squareSize
			);
		}
	}

	// Helper to get difficulty colors
	function getDifficultyColors(difficulty: number) {
		const colors = {
			1: "#007bff",
			2: "#66b3ff",
			3: "#ffc107",
			4: "#ff7f50",
			5: "#dc3545",
		};
		return colors[difficulty] || "#666";
	}

	// Helper to draw transfers content
	function drawTransfersContent(
		ctx: CanvasRenderingContext2D | null,
		transfersIn: number,
		transfersOut: number,
		startX: number,
		width: number,
		alignment: string
	) {
		ctx.textAlign = alignment === "left" ? "left" : "right";
		ctx.font = "bold 72px Arial";
		ctx.fillStyle = textColor;
		ctx.fillText(
			shortenNumber(transfersOut),
			startX + (alignment === "left" ? 50 : width - 50),
			890
		);

		ctx.textAlign = "center";
		ctx.font = "bold 32px Arial";
		ctx.fillText("Transfers", startX + width / 2, 900);

		ctx.textAlign = alignment === "left" ? "left" : "right";
		ctx.fillText(
			shortenNumber(transfersIn),
			startX + (alignment === "left" ? 50 : width - 50),
			940
		);
	}

	// Helper to shorten numbers
	function shortenNumber(number: number | string) {
		// Logic to shorten numbers (e.g. 1.2k)
		return number;
	}
</script>

<style scoped>
	canvas {
		border-radius: 10px;
		background-color: #f0f4f8;
	}
</style>
