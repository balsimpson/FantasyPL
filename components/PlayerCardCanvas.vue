<template>
	<div class="flex flex-col items-center justify-center">
		<canvas ref="canvasRef" class="w-full max-w-[1024px] h-auto"></canvas>
	</div>
</template>

<script setup lang="ts">
	// Props to make the card dynamic
	const props = defineProps({
		playerName: { type: String },
		playerPrice: { type: String },
		playerImage: { type: String },
		team: { type: String },
		teamImage: { type: String },
		position: { type: String },
		transfersIn: { type: Number },
		transfersOut: { type: Number },
		points: { type: Number },
		goals: { type: Number },
		index: { type: Number },
		played: { type: String },
		form: { type: String },
		selectedBy: { type: String },
		upcoming: { type: Array },
		gameweek: { type: String },
		title: { type: String },
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

			loadImagesAndDraw(ctx);
		}
	});
	
	const totalTransfers = computed(() => props.transfersIn + props.transfersOut);
	const outPercentage = computed(() =>
		totalTransfers.value === 0
			? 50
			: (props.transfersOut / totalTransfers.value) * 100
	);


	function loadImagesAndDraw(ctx: CanvasRenderingContext2D | null) {
		const playerImg = new Image();
		playerImg.src = props.playerImage;

		const teamImg = new Image();
		teamImg.src = props.teamImage;

		teamImg.onload = () => drawTeamImage(ctx, teamImg);
		playerImg.onload = () => drawPlayerImageAndContent(ctx, playerImg);
	}

	// Helper to draw team image
	function drawTeamImage(
		ctx: CanvasRenderingContext2D | null,
		teamImg: HTMLImageElement
	) {
		ctx.drawImage(teamImg, 50, 120, 100, 100);
	}

	// Helper to draw player image and other content
	function drawPlayerImageAndContent(
		ctx: CanvasRenderingContext2D | null,
		playerImg: HTMLImageElement
	) {
		const centerX = 1024 / 2;
		let drawWidth = Math.min(800, 1024);
		let drawHeight = playerImg.height * (drawWidth / playerImg.width);
		const drawX = centerX - drawWidth / 2;

		ctx.drawImage(playerImg, drawX, 224, drawWidth, drawHeight);

		ctx.save();
		drawTransfersContent(ctx);
		drawTextContent(ctx);
		drawUpcomingDifficulty(ctx);
		ctx.restore();
	}

	// Helper to draw text content
	function drawTextContent(ctx: CanvasRenderingContext2D | null) {
		ctx.textAlign = "left";
		ctx.font = "bold 72px Arial";
		ctx.fillStyle = "#2d3748";
		ctx.fillText(props.playerName, 50, 100);

		ctx.textAlign = "right";
		ctx.font = "bold 120px Arial";
		ctx.fillText(props.playerPrice, 960, 210);
		ctx.font = "40px Arial";
		ctx.fillText(props.gameweek?.toUpperCase(), 960, 80);

		// Team and position
		ctx.textAlign = "left";
		ctx.font = "38px Arial";
		ctx.fillText(props.team, 170, 160);
		ctx.font = "48px Arial";
		ctx.fillText(props.position, 170, 210);

		// Points and form
		drawStat(ctx, "Points", props.points, 360);
		drawStat(ctx, "Form", props.form, 480);

		// Played time
		ctx.textAlign = "left";
		ctx.fillText("Played", 50, 410);
		ctx.font = "bold 72px Arial";
		ctx.fillText(shortenNumber(props.played), 50, 480);
	}

	// Helper to draw transfers content
	function drawTransfersContent(ctx: CanvasRenderingContext2D | null) {
		// Colors
		const transfersInColor = "#14b8a6"; // Green
		const transfersOutColor = "#ef4544"; // Red
		const textColor = "#f0f4f8";

		// Calculate dimensions for centered rectangle
		const rectWidth = 1024; // Subtract 20px for 10px padding on each side
		const rectHeight = 180; // Adjust as needed
		const cornerRadius = 0; // Adjust as needed
		const rectX = 0; // Start 10px from the left edge

		// Set y-coordinate dynamically
		let rectY = 800; // Example value, adjust as needed
		// Fill transfers out part
		// Fill transfers in part
		ctx.fillStyle = transfersInColor;
		ctx.fillRect(rectX, rectY, 1024, rectHeight);

		ctx.fillStyle = transfersOutColor;
		const transfersOutWidth = rectWidth * (outPercentage.value / 100);
		ctx.fillRect(rectX, rectY, transfersOutWidth, rectHeight);

		ctx.textAlign = "left";
		ctx.font = "bold 72px Arial";
		ctx.fillStyle = textColor;
		ctx.fillText(shortenNumber(props.transfersOut), 50, 890);

		ctx.textAlign = "center";
		ctx.font = "bold 32px Arial";
		ctx.fillText(props.title, 1024 / 2, 900);
		ctx.font = "bold 64px Arial";
		ctx.fillText(`#${props.index + 1}`, 1024 / 2, 960);

		ctx.textAlign = "right";
		ctx.fillText(shortenNumber(props.transfersIn), 960, 890);

		ctx.font = "bold 44px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Transfers Out", 50, 940);
		ctx.textAlign = "right";
		ctx.fillText("Transfers In", 960, 940);
	}

	// Helper to draw individual stats
	function drawStat(
		ctx: CanvasRenderingContext2D | null,
		label: string,
		value: number | string,
		y: number
	) {
		ctx.textAlign = "right";
		ctx.font = "48px Arial";
		ctx.fillStyle = "#2d3748";
		ctx.fillText(label, 960, y);
		ctx.font = "bold 48px Arial";
		ctx.fillText(value.toString(), 960, y + 50);
	}

	// Helper to draw upcoming difficulty
	function drawUpcomingDifficulty(ctx: CanvasRenderingContext2D | null) {
		const squareSize = 50;
		const gap = 30;
		const totalWidth = squareSize * 5 + gap * 4;
		const startX = (1024 - totalWidth) / 2;
		const startY = 730;

		ctx.font = "28px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Upcoming difficulty", 1024 / 2, 830);

		for (let i = 0; i < 5; i++) {
			const difficulty = props.upcoming[i].difficulty;
			const difficultyColors = getDifficultyColors(difficulty);

			ctx.fillStyle = "#FFF";
			ctx.fillRect(
				startX - 6 + i * (squareSize + gap),
				startY - 6,
				squareSize + 12,
				squareSize + 12
			);
			ctx.fillStyle = difficultyColors;
			ctx.fillRect(
				startX + i * (squareSize + gap),
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
</script>

<style scoped>
	canvas {
		border-radius: 10px;
		background-color: #f0f4f8;
	}
</style>

<!-- <template>
	<div class="flex flex-col items-center justify-center">
		<pre>Index: {{ index }}</pre>
		<canvas ref="canvasRef" class="w-full max-w-[1024px] h-auto"></canvas>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps({
		playerName: { type: String },
		playerPrice: { type: String },
		playerImage: { type: String },
		team: { type: String },
		teamImage: { type: String },
		position: { type: String },
		transfersIn: { type: Number },
		transfersOut: { type: Number },
		points: { type: Number },
		goals: { type: Number },
		index: { type: Number },
		played: { type: String },
		form: { type: String },
		selectedBy: { type: String },
		upcoming: { type: Array },
		gameweek: { type: String },
		title: { type: String },
	});

	const canvasRef = ref<HTMLCanvasElement | null>(null);
	const transfersInColor = "#14b8a6";
	const transfersOutColor = "#ef4544";
	const textColor = "#f0f4f8";

	const outPercentage = computed(() =>
		totalTransfers.value === 0
			? 50
			: (props.transfersOut / totalTransfers.value) * 100
	);

	const totalTransfers = computed(() => props.transfersIn + props.transfersOut);

	onMounted(() => {
		const canvas = canvasRef.value;
		if (canvas) {
			const ctx = canvas.getContext("2d");
			const canvasWidth = 1024;
			const canvasHeight = 1024;

			canvas.width = canvasWidth;
			canvas.height = canvasHeight;

			drawCanvasBackground(ctx, canvasWidth, canvasHeight);
			loadImagesAndDraw(ctx);
		}
	});

	// Helper to load images and draw content
	function loadImagesAndDraw(ctx: CanvasRenderingContext2D | null) {
		const playerImg = new Image();
		playerImg.src = props.playerImage;

		const teamImg = new Image();
		teamImg.src = props.teamImage;

		teamImg.onload = () => drawTeamImage(ctx, teamImg);
		playerImg.onload = () => drawPlayerImageAndContent(ctx, playerImg);
	}

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

	// Helper to draw team image
	function drawTeamImage(
		ctx: CanvasRenderingContext2D | null,
		teamImg: HTMLImageElement
	) {
		ctx.drawImage(teamImg, 50, 120, 100, 100);
	}

	// Helper to draw player image and other content
	function drawPlayerImageAndContent(
		ctx: CanvasRenderingContext2D | null,
		playerImg: HTMLImageElement
	) {
		const centerX = 1024 / 2;
		let drawWidth = Math.min(800, 1024);
		let drawHeight = playerImg.height * (drawWidth / playerImg.width);
		const drawX = centerX - drawWidth / 2;

		ctx.drawImage(playerImg, drawX, 224, drawWidth, drawHeight);

		ctx.save();
		drawTextContent(ctx);
		drawUpcomingDifficulty(ctx);
		drawTransfersContent(ctx);
		ctx.restore();
	}

	// Helper to draw text content
	function drawTextContent(ctx: CanvasRenderingContext2D | null) {
		ctx.font = "bold 72px Arial";
		ctx.fillStyle = "#2d3748";
		ctx.fillText(props.playerName, 50, 100);

		ctx.textAlign = "right";
		ctx.font = "bold 120px Arial";
		ctx.fillText(props.playerPrice, 960, 210);
		ctx.font = "40px Arial";
		ctx.fillText(props.gameweek?.toUpperCase(), 960, 80);

		// Team and position
		ctx.textAlign = "left";
		ctx.font = "38px Arial";
		ctx.fillText(props.team, 170, 160);
		ctx.font = "48px Arial";
		ctx.fillText(props.position, 170, 210);

		// Points and form
		drawStat(ctx, "Points", props.points, 360);
		drawStat(ctx, "Form", props.form, 480);

		// Played time
		ctx.textAlign = "left";
		ctx.fillText("Played", 50, 410);
		ctx.font = "bold 72px Arial";
		ctx.fillText(shortenNumber(props.played), 50, 480);
	}

	// Helper to draw individual stats
	function drawStat(
		ctx: CanvasRenderingContext2D | null,
		label: string,
		value: number | string,
		y: number
	) {
		ctx.textAlign = "right";
		ctx.font = "48px Arial";
		ctx.fillStyle = "#2d3748";
		ctx.fillText(label, 960, y);
		ctx.font = "bold 48px Arial";
		ctx.fillText(value.toString(), 960, y + 50);
	}

	// Helper to draw upcoming difficulty
	function drawUpcomingDifficulty(ctx: CanvasRenderingContext2D | null) {
		const squareSize = 50;
		const gap = 30;
		const totalWidth = squareSize * 5 + gap * 4;
		const startX = (1024 - totalWidth) / 2;
		const startY = 730;

		ctx.font = "28px Arial";
		ctx.textAlign = "center";
		ctx.fillText("Upcoming difficulty", 1024 / 2, 830);

		for (let i = 0; i < 5; i++) {
			const difficulty = props.upcoming[i].difficulty;
			const difficultyColors = getDifficultyColors(difficulty);

			ctx.fillStyle = "#FFF";
			ctx.fillRect(
				startX - 6 + i * (squareSize + gap),
				startY - 6,
				squareSize + 12,
				squareSize + 12
			);
			ctx.fillStyle = difficultyColors;
			ctx.fillRect(
				startX + i * (squareSize + gap),
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
	function drawTransfersContent(ctx: CanvasRenderingContext2D | null) {
		// Calculate dimensions for centered rectangle
		const rectWidth = ctx.width; // Subtract 20px for 10px padding on each side
		const rectHeight = 180; // Adjust as needed
		const cornerRadius = 0; // Adjust as needed
		const rectX = 0; // Start 10px from the left edge

		// Set y-coordinate dynamically
		let rectY = 800; // Example value, adjust as needed
		// Fill transfers out part
		ctx.fillStyle = transfersOutColor;
		const transfersOutWidth = rectWidth * (outPercentage.value / 100);
		ctx.fillRect(rectX, rectY, transfersOutWidth, rectHeight);

		ctx.textAlign = "left";
		ctx.font = "bold 72px Arial";
		ctx.fillStyle = textColor;
		ctx.fillText(shortenNumber(props.transfersOut), 50, 890);

		ctx.textAlign = "center";
		ctx.font = "bold 32px Arial";
		ctx.fillText(props.title, 1024 / 2, 900);
		ctx.font = "bold 64px Arial";
		ctx.fillText(`#${props.index + 1}`, 1024 / 2, 960);

		ctx.textAlign = "right";
		ctx.fillText(shortenNumber(props.transfersIn), 960, 890);

		ctx.font = "bold 44px Arial";
		ctx.textAlign = "left";
		ctx.fillText("Transfers Out", 50, 940);
		ctx.textAlign = "right";
		ctx.fillText("Transfers In", 960, 940);
	}
</script>

<style scoped>
	canvas {
		border-radius: 10px;
		background-color: #f0f4f8;
	}
</style> -->
