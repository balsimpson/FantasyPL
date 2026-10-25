<template>
	<NuxtLink
		:to="getPlayerRoute(player)"
		class="group relative flex h-full min-w-0 flex-col justify-end overflow-hidden bg-gradient-to-br from-white/10 via-[#101216] to-[#101216] focus-visible:z-40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
		:class="align === 'right' ? 'border-l border-white/10 text-right' : 'text-left'"
	>
		<PlayerPortrait :player="player" :alt="player.name" :hover="true" fill-frame />
		<span class="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/55 via-25% to-transparent to-65%" aria-hidden="true" />
		<span class="relative z-30 w-full min-w-0 px-3 pb-4 pt-32 sm:px-4">
			<span class="block text-[0.6rem] font-bold uppercase leading-tight tracking-[0.12em]" :class="align === 'right' ? 'text-lime-200' : 'text-stone-300'">{{ label }}</span>
			<span class="mt-1 block text-xl font-black leading-tight tracking-tight text-white group-hover:text-primary [overflow-wrap:anywhere] sm:text-2xl">{{ player.name }}</span>
			<span class="mt-2 block text-xs leading-4 text-white/75 [overflow-wrap:anywhere]">{{ player.position }} · {{ player.team }}</span>
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
