<template>
	<div class="col-span-1 text-center">
		<div
			class="relative flex flex-col items-center justify-end col-span-1 text-center drop-shadow-md w-36 h-36 "

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
						<p v-if="pick.element.news"
							class="absolute px-2 py-1 text-xs font-semibold text-gray-800 bg-yellow-200 rounded bottom-8 right-1 left-1"
						>
							{{ pick.element.news }}
						</p>
						<p
							class="absolute px-2 py-1 text-xs font-semibold text-gray-800 bg-teal-200 rounded sm:text-xs bottom-3 right-1 left-1"
						>
							{{ pick.element.now_cost / 10 }}m
						</p>
						<p
							class="absolute left-0 right-0 z-40 px-1 py-1 text-xs font-semibold text-gray-100 bg-gray-800 rounded -top-4 "
						>
							{{ pick.element.web_name }}
						</p>
						<p
							class="absolute top-0 z-0 px-1 py-1 text-xs font-bold text-gray-800 bg-gray-400 rounded-b left-4 right-4"
						>
							<!-- <div class="hidden text-xs text-gray-400 sm:visible">Predicted Points</div> -->
							<div class="flex flex-wrap items-center justify-center mt-2 space-x-1">
								<div v-for="item in pick.predictions" :key="item" class="px-1 text-xs bg-gray-200 rounded">{{ Math.round(item.predicted_pts.toFixed(1)) }}</div>
							</div>
						</p>
						
					</div>
				</div>
			</div>

			<div class="relative">
				<div class="absolute font-bold right-3 top-10 -z-10 ">
					<div
						class="flex items-end py-1 pl-3 pr-1 leading-3 text-right text-white bg-purple-900 rounded sm:pl-5"
					>
						{{ pick.element.total_points }}
					</div>
				</div>

				<div
					v-if="pick.multiplier > 1"
					class="absolute font-bold -z-10 top-10 left-5"
				>
					<div
						class="flex items-end py-1 pl-1 pr-3 text-xs leading-3 text-right text-white bg-teal-900 rounded"
					>
						<span class="opacity-50">x</span> {{ pick.multiplier }}
					</div>
				</div>
				<img
					:src="`https://resources.premierleague.com/premierleague/photos/players/110x140/p${pick.element.code}.png`"
					class="object-cover w-full z-70 h-36"
					:alt="pick.element.web_name"
				/>
				<div
					v-if="pick.is_captain"
					class="absolute text-xs font-semibold bg-teal-500/80 rounded-lg -top-2 text-[8px] -z-30 left-0 right-0 h-36 text-white"
				>
					Captain
				</div>
				<div
					v-if="pick.is_vice_captain"
					class="absolute text-xs font-semibold bg-yellow-300/80 rounded-lg  -top-2 text-[8px] -z-30 left-0 right-0 h-36"
				>
					Vice Captain
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	defineProps(["pick"]);
</script>
