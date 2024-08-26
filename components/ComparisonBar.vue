<template>
	<div class="">
		<div class="flex items-center justify-between px-2 ">
			<div
				class="text-xs font-semibold text-center text-gray-600 uppercase"
				:class="[]"
			>
				{{ comparison.homeValue }}
			</div>
			<div
				class="inline-flex items-center text-xs text-center text-gray-600 uppercase"
			>
				<span v-if="comparison.homeWidth > comparison.awayWihomeWidth">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="flex-1 w-4 h-4 pr-1 text-teal-500"
					>
						<path
							fill-rule="evenodd"
							d="M10.72 11.47a.75.75 0 0 0 0 1.06l7.5 7.5a.75.75 0 1 0 1.06-1.06L12.31 12l6.97-6.97a.75.75 0 0 0-1.06-1.06l-7.5 7.5Z"
							clip-rule="evenodd"
						/>
						<path
							fill-rule="evenodd"
							d="M4.72 11.47a.75.75 0 0 0 0 1.06l7.5 7.5a.75.75 0 1 0 1.06-1.06L6.31 12l6.97-6.97a.75.75 0 0 0-1.06-1.06l-7.5 7.5Z"
							clip-rule="evenodd"
						/>
					</svg>
				</span>

				<div class="text-[8px]">
                    {{ label || comparison.label }}
                </div>

				<span v-if="comparison.homeWidth < comparison.awayWidth">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="flex-1 w-4 h-4 pl-1 text-teal-500"
					>
						<path
							fill-rule="evenodd"
							d="M13.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L11.69 12 4.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
							clip-rule="evenodd"
						/>
						<path
							fill-rule="evenodd"
							d="M19.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06L17.69 12l-6.97-6.97a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
							clip-rule="evenodd"
						/>
					</svg>
				</span>
			</div>
			<div class="text-xs font-semibold text-center text-gray-600 uppercase">
				{{ comparison.awayValue }}
			</div>
		</div>
		<div class="flex text-xs bg-blue-300">
			<div
				class="flex items-center justify-between h-4 px-3 font-semibold text-white bg-teal-500 rounded-l-full shadow-inner"
				:style="{ width: comparison.homeWidth + '%' }"
			>
				<div class="text-[9px]">{{ comparison.homeTitle }}</div>
				<!-- <div>{{ Math.round(comparison.homeWidth) }}</div> -->
			</div>
			<div
				class="flex items-center justify-end h-4 px-3 font-semibold text-white bg-red-500 rounded-r-full"
				:style="{ width: comparison.awayWidth + '%' }"
			>
				<!-- <div>{{ Math.round(comparison.awayWidth) }}</div> -->
				<div class="text-[9px]">{{ comparison.awayTitle }}</div>
			</div>
		</div>

	</div>
</template>

<script setup>
	const props = defineProps({
		comparison: {
			type: Object,
			required: true,
		},
		label: {
			type: String,
			required: true,
		},
	});
</script>
