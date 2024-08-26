<template>
	<div class="flex space-x-4 overflow-x-auto snap-x scrollbar-hidden scroll-ps-12">
		<!-- <div class="flex-shrink-0 w-64 p-4 bg-gray-200 snap-start"> -->
			<!-- <p>Item 1</p>
			<img
				src="https://images.unsplash.com/photo-1604999565976-8913ad2ddb7c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=320&h=160&q=80"
                /> -->
                <slot />
		<!-- </div> -->
	</div>
</template>

<style>
	.scrollbar-hidden::-webkit-scrollbar {
		display: none; /* Chrome, Safari, and Opera */
	}

	.scrollbar-hidden {
		-ms-overflow-style: none; /* Internet Explorer and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>
