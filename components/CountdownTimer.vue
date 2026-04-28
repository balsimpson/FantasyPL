<template>
	<div class="mx-auto w-full max-w-[28rem]">
		<UCard :ui="{ body: 'p-4', root: 'ring-0' }"
			class="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950 text-stone-50 shadow-2xl transition duration-300 hover:-translate-y-1">
			<div
				class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,255,61,0.14),transparent_30%),radial-gradient(circle_at_110%_18%,rgba(72,214,255,0.1),transparent_24%),linear-gradient(135deg,#111317_0%,#090a0d_100%)]">
			</div>
			<div
				class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:5px_5px] opacity-10">
			</div>

			<div class="relative z-10 flex flex-col gap-4">
				<header class="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
					<div class="min-w-0">
						<p class="text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
							Next Deadline
						</p>
						<h3 class="mt-2 text-[2rem] font-black leading-[0.92] tracking-tight text-white text-balance">
							{{ countdownTitle }}
						</h3>
						<p class="mt-2 text-sm leading-6 text-stone-300">
							{{ statusText }}
						</p>
					</div>

					<div class="shrink-0 text-right">
						<div class="text-[0.54rem] font-semibold uppercase tracking-[0.32em] text-stone-400">
							Target
						</div>
						<div class="mt-1 font-serif text-[1.4rem] font-black leading-none tracking-[-0.06em] text-white">
							{{ targetTimeLabel }}
						</div>
						<div class="mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-stone-300">
							{{ targetDateLabel }}
						</div>
					</div>
				</header>

				<section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div v-for="segment in segments" :key="segment.label"
						class="rounded-[22px] border border-white/10 bg-white/[0.04] px-3 py-4 text-center backdrop-blur-sm">
						<div class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
							{{ segment.label }}
						</div>
						<div class="mt-2 font-serif text-[2rem] font-black leading-none tracking-[-0.06em] text-white">
							{{ segment.value }}
						</div>
					</div>
				</section>

				<footer class="flex items-center justify-between border-t border-white/10 pt-4">
					<div class="inline-flex items-center gap-2 text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-stone-300">
						<span class="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_0_6px_rgba(200,255,61,0.12)]"></span>
						Live Countdown
					</div>
					<div class="text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-stone-400">
						{{ targetStatusLabel }}
					</div>
				</footer>
			</div>
		</UCard>
	</div>
</template>

<script setup lang="ts">
type Props = {
	targetDate: string | Date;
};

const props = defineProps<Props>();

const days = ref(0);
const hours = ref(0);
const minutes = ref(0);
const seconds = ref(0);
const isExpired = ref(false);

let timerInterval: ReturnType<typeof setInterval> | undefined;

const targetDateValue = computed(() => new Date(props.targetDate));

const formatTwoDigits = (value: number) => String(Math.max(0, value)).padStart(2, '0');

const updateCountdown = () => {
	const eventTime = targetDateValue.value.getTime();
	const currentTime = Date.now();
	const timeLeft = eventTime - currentTime;

	if (Number.isNaN(eventTime)) {
		isExpired.value = true;
		days.value = 0;
		hours.value = 0;
		minutes.value = 0;
		seconds.value = 0;
		if (timerInterval) clearInterval(timerInterval);
		return;
	}

	if (timeLeft > 0) {
		isExpired.value = false;
		days.value = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
		hours.value = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
		minutes.value = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
		seconds.value = Math.floor((timeLeft % (1000 * 60)) / 1000);
		return;
	}

	isExpired.value = true;
	days.value = 0;
	hours.value = 0;
	minutes.value = 0;
	seconds.value = 0;
	if (timerInterval) clearInterval(timerInterval);
};

const segments = computed(() => [
	{ label: 'Days', value: formatTwoDigits(days.value) },
	{ label: 'Hours', value: formatTwoDigits(hours.value) },
	{ label: 'Mins', value: formatTwoDigits(minutes.value) },
	{ label: 'Secs', value: formatTwoDigits(seconds.value) },
]);

const countdownTitle = computed(() => (isExpired.value ? 'Deadline passed' : 'Deadline countdown'));

const statusText = computed(() =>
	isExpired.value ? 'The next deadline has already passed.' : 'The clock is ticking to the next gameweek.'
);

const targetDateLabel = computed(() => {
	if (Number.isNaN(targetDateValue.value.getTime())) return 'Invalid date';

	return targetDateValue.value.toLocaleDateString(undefined, {
		weekday: 'short',
		month: 'short',
		day: 'numeric',
	});
});

const targetTimeLabel = computed(() => {
	if (Number.isNaN(targetDateValue.value.getTime())) return '-';

	return targetDateValue.value.toLocaleTimeString(undefined, {
		hour: 'numeric',
		minute: '2-digit',
	});
});

const targetStatusLabel = computed(() => (isExpired.value ? 'Expired' : 'Counting down'));

onMounted(() => {
	updateCountdown();
	timerInterval = setInterval(updateCountdown, 1000);
});

onBeforeUnmount(() => {
	if (timerInterval) clearInterval(timerInterval);
});
</script>
