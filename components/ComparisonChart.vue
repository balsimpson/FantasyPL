<template>
	<div class="mb-4">
		<!-- <div class="mb-2 font-semibold text-gray-700">Strength Comparison</div> -->

		<!-- <pre>{{ team }}</pre> -->

		<ComparisonChartBar :label="comparisons[0].label" :comparison="comparisons[0]"/>
		<ComparisonChartBar :label="comparisons[1].label" :comparison="comparisons[1]"/>
		<ComparisonChartBar :label="comparisons[2].label" :comparison="comparisons[2]"/>


	</div>
</template>

<script setup>
	const props = defineProps({
		team: {
			type: Object,
			required: true,
		},
	});

	const maxStrength = 1500;
	const normalizeValue = (value) => (value / maxStrength) * 100;

	// Calculate normalized values
	const overallHome = normalizeValue(
		props.team.strength_overall_home,
		maxStrength
	);
	const overallAway = normalizeValue(
		props.team.strength_overall_away,
		maxStrength
	);
	const attackHome = normalizeValue(
		props.team.strength_attack_home,
		maxStrength
	);
	const attackAway = normalizeValue(
		props.team.strength_attack_away,
		maxStrength
	);
	const defenceHome = normalizeValue(
		props.team.strength_defence_home,
		maxStrength
	);
	const defenceAway = normalizeValue(
		props.team.strength_defence_away,
		maxStrength
	);

	const createComparison = (label, homeKey, awayKey) => {
		const homeValue = normalizeValue(props.team[homeKey]);
		const awayValue = normalizeValue(props.team[awayKey]);
		const total = homeValue + awayValue;
		return {
			label,
			homeValue,
			awayValue,
			homeWidth: (homeValue / total) * 100,
			awayWidth: (awayValue / total) * 100,
		};
	};

	const comparisons = computed(() => [
		createComparison(
			"Overall",
			"strength_overall_home",
			"strength_overall_away"
		),
		createComparison("Attack", "strength_attack_home", "strength_attack_away"),
		createComparison(
			"Defence",
			"strength_defence_home",
			"strength_defence_away"
		),
	]);
</script>
