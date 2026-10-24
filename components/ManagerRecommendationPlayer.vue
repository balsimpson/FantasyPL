<template>
	<NuxtLink
		:to="getPlayerRoute(player)"
		class="group flex min-w-0 items-center gap-2 rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:flex-col lg:gap-2"
		:class="align === 'right' ? 'lg:items-end lg:text-right' : 'lg:items-start lg:text-left'"
	>
		<span class="relative block h-14 w-11 shrink-0 sm:h-16 sm:w-12 lg:h-36 lg:w-28">
			<PlayerPortrait :player="player" :hover="true" class="h-full w-full" />
		</span>
		<span class="min-w-0 lg:w-full">
			<span class="block text-[0.6rem] font-semibold uppercase leading-tight tracking-[0.08em] text-stone-400 sm:text-[0.65rem]">{{ label }}</span>
			<span class="mt-0.5 block break-words text-xs font-bold leading-tight text-white group-hover:text-primary [overflow-wrap:anywhere] sm:text-sm">{{ player.name }}</span>
			<span class="mt-0.5 block break-words text-[0.65rem] leading-4 text-stone-300 [overflow-wrap:anywhere] sm:text-xs">{{ player.position }} · {{ player.team }}</span>
		</span>
	</NuxtLink>
</template>

<script setup>
import { getPlayerRoute } from "~/composables/usePlayerRoute";

defineProps({
	player: { type: Object, required: true },
	label: { type: String, default: "Player" },
	align: { type: String, default: "left" },
});
</script>
