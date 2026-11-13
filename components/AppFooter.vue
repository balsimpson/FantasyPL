<template>
  <footer aria-labelledby="footer-heading">
    <h2 id="footer-heading" class="sr-only">Footer</h2>

    <div class="site-content-rail py-12 pb-[calc(3rem+env(safe-area-inset-bottom))]">
      <div class="flex flex-wrap items-baseline justify-center gap-x-5 gap-y-2">
        <NuxtLink to="/manager" class="rounded-sm text-sm text-stone-400 hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">FPL Team Planner</NuxtLink>
		<span class="mt-2 text-sm font-light text-gray-500">
			Copyright © FPL Insights - 2026
		</span>
      </div>
    </div>
  </footer>
</template>
