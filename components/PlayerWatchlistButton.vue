<template>
	<UButton
		type="button"
		:color="isSavedPlayer ? 'primary' : 'neutral'"
		:variant="props.iconOnly ? 'ghost' : isSavedPlayer ? 'solid' : 'soft'"
		:icon="isSavedPlayer ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark-plus'"
		:aria-pressed="isSavedPlayer"
		:aria-label="watchlistLabel"
		:title="watchlistLabel"
		:disabled="!normalizeWatchlistCode(player?.code)"
		:class="props.iconOnly ? 'size-10 shrink-0 justify-center p-0' : ''"
		@click.stop.prevent="togglePlayer"
	>
		<span v-if="!props.iconOnly">{{ isSavedPlayer ? "Remove from watchlist" : "Save to watchlist" }}</span>
	</UButton>
</template>

<script setup lang="ts">
import { normalizeWatchlistCode, type WatchlistCode } from "~/composables/useWatchlist";

const props = withDefaults(defineProps<{
	player: {
		code?: WatchlistCode;
		web_name?: string;
	};
	iconOnly?: boolean;
}>(), { iconOnly: true });

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
