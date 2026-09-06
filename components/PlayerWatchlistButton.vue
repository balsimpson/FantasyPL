<template>
	<UButton
		type="button"
		:color="isSavedPlayer ? 'primary' : 'neutral'"
		:variant="isSavedPlayer ? 'solid' : 'soft'"
		:icon="isSavedPlayer ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark-plus'"
		:aria-pressed="isSavedPlayer"
		:aria-label="watchlistLabel"
		@click="togglePlayer"
	>
		{{ isSavedPlayer ? "Remove from watchlist" : "Save to watchlist" }}
	</UButton>
</template>

<script setup lang="ts">
import type { WatchlistCode } from "~/composables/useWatchlist";

const props = defineProps<{
	player: {
		code?: WatchlistCode;
		web_name?: string;
	};
}>();

const { isSaved, toggle } = useWatchlist();

const isSavedPlayer = computed(() => isSaved(props.player?.code));
const playerName = computed(() => props.player?.web_name || "this player");
const watchlistLabel = computed(() =>
	isSavedPlayer.value
		? `Remove ${playerName.value} from your watchlist`
		: `Save ${playerName.value} to your watchlist`,
);

const togglePlayer = () => {
	toggle(props.player?.code);
};
</script>
