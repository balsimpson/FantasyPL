import type { ShortlistPlayer } from "~/utils/homepage-shortlist";

export const WATCHLIST_SORTS = [
	{ label: "Form", value: "form" },
	{ label: "Season points", value: "total_points" },
	{ label: "Price (high to low)", value: "now_cost" },
	{ label: "Selected by", value: "selected_by_percent" },
];

const numericValue = (value: unknown) => {
	if (value === null || value === undefined || value === "") return null;

	const number = Number(value);
	return Number.isFinite(number) ? number : null;
};

export function useWatchlistView(getPlayers: () => ShortlistPlayer[]) {
	const position = ref(0);
	const sortKey = ref("form");
	const filteredPlayers = computed(() => {
		const selectedPosition = Number(position.value);
		const key = sortKey.value;

		return getPlayers()
			.filter((player) => !selectedPosition || Number(player.element_type) === selectedPosition)
			.sort((left, right) => {
				const leftValue = numericValue(left[key]);
				const rightValue = numericValue(right[key]);

				if (leftValue === null && rightValue !== null) return 1;
				if (leftValue !== null && rightValue === null) return -1;
				if (leftValue !== null && rightValue !== null && leftValue !== rightValue) return rightValue - leftValue;

				const pointsDifference = (numericValue(right.total_points) ?? 0) - (numericValue(left.total_points) ?? 0);
				return pointsDifference || Number(left.id) - Number(right.id);
			});
	});

	return { position, sortKey, filteredPlayers };
}
