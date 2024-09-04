<template>
	<div class="col-span-1 text-center">
		<div
			class="relative flex flex-col items-center col-span-1 text-center drop-shadow-md"
		>
			<div v-if="pick.multiplier > 1" class="absolute top-0 z-0 px-2 py-1 font-bold bg-teal-600 rounded right-2">
				<div class="text-xs text-white ">x{{ pick.multiplier }}</div>
			</div>
			<div class="absolute z-30 px-2 font-bold bg-white rounded bottom-3">
				<div class="pb-1 text-gray-600">{{ pick.element.now_cost / 10 }}m</div>
			</div>
			<div class="absolute z-0 font-bold bottom-16 right-2">
				<div
					class="flex items-center px-2 py-1 text-xs leading-3 text-white bg-purple-900 rounded"
				>
					{{ pick.element.total_points }}
				</div>
			</div>

			<!-- <div>{{ pick.element.points_per_game_rank }}</div> -->
			<img
				:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${pick.element.code}.png`"
				class="z-20 object-cover w-auto h-28"
				:alt="pick.element.web_name"
			/>
			<p
				class="absolute z-30 inline-block w-full px-2 py-1 text-xs font-semibold text-white bg-gray-700 rounded-lg -bottom-2"
			>
				{{ pick.element.web_name }}
			</p>

			<!-- <pre>{{ pick.element }}</pre> -->
			<div
				v-if="pick.is_captain"
				class="absolute z-30 px-1 text-xs font-semibold bg-yellow-300 rounded-lg shadow-lg right-2 left-2 bottom-9 -rotate-3"
			>
				Captain
			</div>
			<div
				v-if="pick.is_vice_captain"
				class="absolute z-30 px-1 text-xs font-semibold bg-yellow-300 rounded-lg shadow-lg right-2 left-2 bottom-9 -rotate-3"
			>
				V Captain
			</div>
		</div>
	</div>
</template>

<script setup>
	defineProps(["pick"]);
</script>
