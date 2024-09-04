<template>
	<div class="h-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-300">
		<div class="flex flex-col max-w-4xl mx-auto">
			<nav class="px-4 py-4">
				<NuxtLink
					to="/"
					class="flex items-center text-2xl font-extrabold tracking-tight text-[#4B0082] transition duration-200 ease-in-out hover:text-gray-600"
				>
					<!-- <img src="/favicon.ico" alt="" class="w-8 pr-2" /> -->
					Fantasy<span class="text-[#7300c5]">PL</span>
				</NuxtLink>
			</nav>
			<slot class="flex-grow">
				<!-- data goes here -->
			</slot>
		</div>
    <AppFooter />
	</div>
</template>