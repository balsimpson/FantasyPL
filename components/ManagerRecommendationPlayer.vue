<template>
	<NuxtLink
		:to="getPlayerRoute(player)"
		class="group relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-gradient-to-br from-white/10 via-[#101216] to-[#101216] focus-visible:z-40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
		:class="align === 'right' ? 'text-right after:pointer-events-none after:absolute after:inset-0 after:z-30 after:border-2 after:border-lime-300' : 'text-left'"
	>
		<PlayerPortrait :player="player" :alt="player.name" fill-frame frame-position="center top" />
		<span class="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/95 via-black/50 via-25% to-transparent to-65%" aria-hidden="true" />
		<span class="relative z-30 mt-auto w-full min-w-0 shrink-0" :class="compact ? 'px-2 pb-3 pt-2 sm:px-3' : 'px-3 pb-4 pt-32 sm:px-4'">
			<span v-if="label" class="block text-[0.6rem] font-bold uppercase leading-tight tracking-[0.12em]" :class="align === 'right' ? 'text-lime-200' : 'text-stone-300'">{{ label }}</span>
			<span class="mt-1 block font-black leading-tight tracking-tight text-white group-hover:text-primary [overflow-wrap:anywhere]" :class="compact ? 'text-sm sm:text-base' : 'text-xl sm:text-2xl'">{{ player.name }}</span>
			<span class="block leading-4 text-white/75 [overflow-wrap:anywhere]" :class="compact ? 'mt-1 text-[0.65rem]' : 'mt-2 text-xs'">{{ player.position }} · {{ player.team }}</span>
		</span>
	</NuxtLink>
</template>

<script setup>
import { getPlayerRoute } from "~/composables/usePlayerRoute";

defineProps({
	player: { type: Object, required: true },
	label: { type: String, default: "Player" },
	align: { type: String, default: "left" },
	compact: { type: Boolean, default: false },
});
</script>
