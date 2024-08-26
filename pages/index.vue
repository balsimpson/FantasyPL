<template>
	<div class="w-full max-w-3xl p-3 mx-auto">
		<NuxtLink
			to="/"
			class="flex items-center text-2xl font-extrabold tracking-tight text-[#4B0082] transition duration-200 ease-in-out hover:text-gray-600"
		>
			<!-- <img src="/favicon.ico" alt="" class="w-8 pr-2" /> -->
			Fantasy<span class="text-[#7300c5]">PL</span>
		</NuxtLink>

		<div class="space-y-12">
			<!-- Most Transferred In -->
			<div v-if="bootstrap && bootstrap.elements" class="w-full max-w-3xl mt-4">
				<div class="max-w-3xl mb-6">
					<h1
						class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
					>
						Most Transferred In Players
					</h1>
					<p class="mt-4 text-sm text-gray-500">
						These are the rising stars, currently in high demand by managers
						looking to strengthen their squads.
					</p>
				</div>
				<AppCarousel v-if="bootstrap && bootstrap.elements">
					<!-- <div class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"> -->
					<PlayerCardNew
						v-for="item in getMostTransferredInPlayers(bootstrap.elements, 20)"
						:key="item"
						:player="item"
						:data="bootstrap.teams"
						class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
					/>
					<!-- </div> -->
				</AppCarousel>
			</div>

		</div>
	</div>
</template>

<script setup>

	const selectedPosition = ref(1);
	const topPlayers = ref([]);

	const {
		status,
		data: bootstrap,
		refresh,
		error,
	} = useLazyAsyncData("bootstrap", () => $fetch("/api/bootstrap-static"));
	// store.value = bootstrap.value;
</script>

<style>
	.PlayerCard {
		height: 100%; /* Make sure the card takes up the full height of its container */
	}

	.PlayerCard-content {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 300px; /* Set a fixed height for the card content */
	}

	.PlayerCard-content h1,
	.PlayerCard-content p {
		margin-bottom: auto; /* Ensure text does not push the height */
	}
</style>
