<!-- <template>
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
			<img
				:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${pick.element.code}.png`"
				class="z-20 object-cover w-auto h-16 sm:h-28"
				:alt="pick.element.web_name"
			/>
			<p
				class="absolute z-30 inline-block w-full px-2 py-1 text-xs font-semibold text-white bg-gray-700 rounded-lg -bottom-2"
			>
				{{ pick.element.web_name }}
			</p>
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
</script> -->

<template>
	<div class="col-span-1 text-center">
		<div
			class="relative flex flex-col items-center justify-end col-span-1 text-center h-18 drop-shadow-md w-14 sm:w-36 sm:h-48 md:w-44 md:h-56 lg:w-52 lg:h-64"
		>
			<!-- footer -->
			<div class="absolute bottom-0 left-0 right-0 z-20">
				<div class="relative">
					<!-- cost -->
					<!-- <div
						class="z-30 w-auto px-1 -m-1 font-bold bg-white rounded pb-1 text-gray-600 text-[8px] sm:text-xs"
					>
						{{ pick.element.now_cost / 10 }}m
					</div> -->

					<div class="relative w-full">
						<p
							class="px-2 py-1 font-semibold text-gray-800 bg-teal-200 rounded text-[8px] sm:text-xs absolute bottom-3 right-1 left-1"
						>
							{{ pick.element.now_cost / 10 }}m
						</p>
						<p
							class="absolute -top-4 px-1 py-1 font-semibold text-gray-100 bg-gray-800 rounded text-[8px] sm:text-xs left-0 right-0"
						>
							{{ pick.element.web_name }}
						</p>
					</div>
				</div>
			</div>

			<div class="relative">
				<div class="absolute font-bold -right-1 top-2 -z-10">
					<div
						class="flex items-end py-1 pl-3 pr-1 text-xs leading-3 text-right text-white bg-purple-900 rounded"
					>
						{{ pick.element.total_points }}
					</div>
				</div>

				<div
					v-if="pick.multiplier > 1"
					class="absolute font-bold -left-1 top-2 -z-10"
				>
					<div
						class="flex items-end py-1 pl-1 pr-3 text-xs leading-3 text-right text-white bg-teal-900 rounded"
					>
						<span class="opacity-50">x</span> {{ pick.multiplier }}
					</div>
				</div>
				<img
					:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${pick.element.code}.png`"
					class="object-cover w-auto h-16 z-70 sm:h-28 md:h-36 lg:h-44"
					:alt="pick.element.web_name"
				/>
				<div
					v-if="pick.is_captain"
					class="absolute px-1 text-xs font-semibold bg-yellow-300 rounded-lg shadow -top-2 text-[8px] -z-30"
				>
					Captain
				</div>
				<div
					v-if="pick.is_vice_captain"
					class="absolute px-1 text-xs font-semibold bg-yellow-300 rounded-lg shadow -top-2 text-[8px] -z-30"
				>
					V.Captain
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	defineProps(["pick"]);
</script>
