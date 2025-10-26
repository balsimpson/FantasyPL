<template>
	<div
		class="flex flex-col min-h-screen bg-gradient-to-tl from-gray-50 to-gray-300"
	>
		<div class="flex flex-col w-full mx-auto max-w-7xl">
			<nav class="flex items-center justify-between px-4 py-4">
				<NuxtLink
					to="/"
					class="flex items-center text-2xl font-extrabold tracking-tight text-[#4B0082] transition duration-200 ease-in-out hover:text-gray-600"
				>
					Fantasy<span class="text-[#7300c5]">PL</span>
				</NuxtLink>
				<!-- <NuxtLink
					to="/watchlist"
					class="flex items-center text-2xl font-extrabold tracking-tight text-[#4B0082] transition duration-200 ease-in-out hover:text-gray-600"
				>
					Watchlist
				</NuxtLink> -->
			</nav>
		</div>
		<div class="flex-grow w-full mx-auto max-w-7xl">
			<slot />
		</div>
		<AppFooter />
	</div>
</template>
