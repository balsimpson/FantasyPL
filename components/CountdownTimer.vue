<script setup lang="ts">
	const props = defineProps(["targetDate"]);

	const days = ref(0);
	const hours = ref(0);
	const minutes = ref(0);
	const seconds = ref(0);
	let timerInterval: NodeJS.Timer;

	const updateCountdown = () => {
		const eventTime = new Date(props.targetDate).getTime();
		const currentTime = new Date().getTime();
		const timeLeft = eventTime - currentTime;

		if (timeLeft > 0) {
			days.value = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
			hours.value = Math.floor(
				(timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
			);
			minutes.value = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
			seconds.value = Math.floor((timeLeft % (1000 * 60)) / 1000);
		} else {
			// @ts-ignore
			clearInterval(timerInterval);
		}
	};

	onMounted(() => {
		updateCountdown();
		timerInterval = setInterval(updateCountdown, 1000);
	});

	onBeforeUnmount(() => {
		// @ts-ignore
		clearInterval(timerInterval);
	});
</script>

<template>
	<div class="text-center text-gray-800">
		<div class="flex justify-center space-x-2 font-mono text-4xl">
			<div
				class="flex flex-col items-center p-4 rounded-lg shadow-lg bg-gradient-to-br from-purple-600 to-indigo-700"
			>
				<span class="text-4xl font-bold text-white">{{ days }}</span>
				<span class="text-sm text-purple-200 uppercase">Days</span>
			</div>
			<div
				class="flex flex-col items-center p-4 rounded-lg shadow-lg bg-gradient-to-br from-purple-600 to-indigo-700"
			>
				<span class="text-4xl font-bold text-white">{{ hours }}</span>
				<span class="text-sm text-purple-200 uppercase">hours</span>
			</div>
			<div
				class="flex flex-col items-center p-4 rounded-lg shadow-lg bg-gradient-to-br from-purple-600 to-indigo-700"
			>
				<span class="text-4xl font-bold text-white">{{ minutes }}</span>
				<span class="text-sm text-purple-200 uppercase">minutes</span>
			</div>
		</div>
	</div>
</template>
