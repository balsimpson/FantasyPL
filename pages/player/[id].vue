<template>
	<div>Player {{ id }}</div>
	<!-- <div>Player {{ player }}</div> -->

	<div class="min-h-screen p-4 bg-gray-100">
		<div class="max-w-4xl mx-auto">
			<h1 class="mb-8 text-3xl font-bold text-center text-gray-800">
				Player Fixture and History
			</h1>

			<div class="mb-8">
				<h2 class="mb-4 text-2xl font-semibold text-gray-700">
					Upcoming Fixtures
				</h2>
				<div class="grid grid-cols-1 gap-4">
					<div
						v-for="fixture in player.fixtures"
						:key="fixture.id"
						class="p-4 bg-white rounded-lg shadow"
					>
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-xl font-semibold text-gray-800">
									{{ fixture.event_name }}
								</h3>
								<p class="text-gray-600">
									Date: {{ formatDate(fixture.kickoff_time) }}
								</p>
								<p class="text-gray-600">
									{{ fixture.is_home ? "Home" : "Away" }} vs Team
									{{ fixture.is_home ? fixture.team_a : fixture.team_h }}
								</p>
							</div>
							<div class="text-gray-700">
								<p>Difficulty: {{ fixture.difficulty }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div>
				<h2 class="mb-4 text-2xl font-semibold text-gray-700">
					Player History
				</h2>
				<div class="grid grid-cols-1 gap-4">
					<div
						v-for="history in player.history"
						:key="history.fixture"
						class="p-4 bg-white rounded-lg shadow"
					>
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-xl font-semibold text-gray-800">
									Fixture {{ history.fixture }}
								</h3>
								<p class="text-gray-600">
									Opponent Team: {{ history.opponent_team }}
								</p>
								<p class="text-gray-600">
									Date: {{ formatDate(history.kickoff_time) }}
								</p>
							</div>
							<div class="text-gray-700">
								<p>Points: {{ history.total_points }}</p>
								<p>Minutes Played: {{ history.minutes }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
            <div class="max-w-md m-4 mx-auto overflow-hidden bg-white shadow-md rounded-xl md:max-w-2xl">
  <div class="md:flex">
    <div class="md:flex-shrink-0">
      <!-- Placeholder for an optional image -->
    </div>
    <div class="p-8">
      <div class="text-sm font-semibold tracking-wide text-indigo-500 uppercase">Performance Summary</div>
      <p class="mt-2 text-gray-500">Start Cost: £55M - End Cost: £53M</p>
      <p class="mt-2 text-gray-500">Total Points: 44</p>
      <p class="mt-2 text-gray-500">Minutes Played: 913</p>
      <p class="mt-2 text-gray-500">Goals Scored: 0</p>
      <p class="mt-2 text-gray-500">Assists: 2</p>
      <p class="mt-2 text-gray-500">Clean Sheets: 4</p>
      <p class="mt-2 text-gray-500">Expected Goals: 0.10</p>
      <p class="mt-2 text-gray-500">Expected Assists: 1.77</p>
      <p class="mt-2 text-gray-500">Bonus Points: 1</p>
    </div>
  </div>
</div>

<div class="max-w-md m-4 mx-auto overflow-hidden bg-white shadow-md rounded-xl md:max-w-2xl">
  <div class="md:flex">
    <div class="md:flex-shrink-0">
      <!-- Placeholder for an optional image -->
    </div>
    <div class="p-8">
      <div class="text-sm font-semibold tracking-wide text-indigo-500 uppercase">Performance Summary</div>
      <p class="flex items-center mt-2">
        Start Cost: £55M 
        <span class="flex w-3 h-3 ml-2 bg-red-500 rounded-full"></span> <!-- Red indicator -->
      </p>
      <p class="flex items-center mt-2">
        End Cost: £53M 
        <span class="flex w-3 h-3 ml-2 bg-green-500 rounded-full"></span> <!-- Green indicator -->
      </p>
      <p class="mt-2 text-gray-500">Total Points: 44</p>
      <p class="mt-2 text-gray-500">Minutes Played: 913</p>
      <p class="mt-2 text-gray-500">Goals Scored: 0</p>
      <p class="mt-2 text-gray-500">Assists: 2</p>
      <p class="mt-2 text-gray-500">Clean Sheets: 4</p>
      <p class="mt-2 text-gray-500">Expected Goals: 0.10</p>
      <p class="mt-2 text-gray-500">Expected Assists: 1.77</p>
      <p class="mt-2 text-gray-500">Bonus Points: 1</p>
    </div>
  </div>
</div>

<div class="max-w-sm mx-auto overflow-hidden bg-white rounded-lg shadow-lg">
  <div class="px-6 py-4">
    <h2 class="text-xl font-bold text-gray-800">2023/24 Performance</h2>
    <div class="mt-4">
      <p class="text-gray-600"><strong>Start Cost:</strong> 55M</p>
      <p class="text-gray-600"><strong>End Cost:</strong> 53M</p>
      <p class="text-gray-600"><strong>Total Points:</strong> 44</p>
      <p class="text-gray-600"><strong>Minutes Played:</strong> 913</p>
      <p class="text-gray-600"><strong>Goals Scored:</strong> 0</p>
      <p class="text-gray-600"><strong>Assists:</strong> 2</p>
      <p class="text-gray-600"><strong>Clean Sheets:</strong> 4</p>
      <p class="text-gray-600"><strong>Expected Goals:</strong> 0.10</p>
      <p class="text-gray-600"><strong>Expected Assists:</strong> 1.77</p>
      <p class="text-gray-600"><strong>Bonus Points:</strong> 1</p>
    </div>

    <!-- Comparison Bars -->
    <div class="mt-6">
      <div>
        <p class="text-gray-600">Expected Goals:</p>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="bg-green-500 h-2.5 rounded-full" style="width: 10%;"></div>
        </div>
      </div>
      <div class="mt-4">
        <p class="text-gray-600">Expected Assists:</p>
        <div class="w-full bg-gray-200 rounded-full h-2.5">
          <div class="bg-blue-500 h-2.5 rounded-full" style="width: 45%;"></div>
        </div>
      </div>
    </div>
  </div>
</div>


			<div class="max-w-xl p-4 mx-auto">
				<div class="p-6 bg-white rounded-lg shadow-md">
					<div v-for="season in player.history_past.slice().reverse()" :key="season.id">
						<h2 class="mb-4 text-2xl font-semibold">
							{{ season.season_name }} Performance
						</h2>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="font-medium">Start Cost:</p>
								<p>{{ season.start_cost }}M</p>
							</div>
							<div>
								<p class="font-medium">End Cost:</p>
								<p>{{ season.end_cost }}M</p>
							</div>
							<div>
								<p class="font-medium">Total Points:</p>
								<p>{{ season.total_points }}</p>
							</div>
							<div>
								<p class="font-medium">Minutes Played:</p>
								<p>{{ season.minutes }}</p>
							</div>
							<div>
								<p class="font-medium">Goals Scored:</p>
								<p>{{ season.goals_scored }}</p>
							</div>
							<div>
								<p class="font-medium">Assists:</p>
								<p>{{ season.assists }}</p>
							</div>
							<div>
								<p class="font-medium">Clean Sheets:</p>
								<p>{{ season.clean_sheets }}</p>
							</div>
							<div>
								<p class="font-medium">Expected Goals:</p>
								<p>{{ season.expected_goals }}</p>
							</div>
							<div>
								<p class="font-medium">Expected Assists:</p>
								<p>{{ season.expected_assists }}</p>
							</div>
							<div>
								<p class="font-medium">Bonus Points:</p>
								<p>{{ season.bonus }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	const route = useRoute();
	const id = route.params.id;

	const BASE_URL = "https://fantasy.premierleague.com/api/element-summary";
	const { data: player, error } = await useAsyncData("player", () =>
		$fetch(`${BASE_URL}/${id}`)
	);

	const formatDate = (dateString) => {
		const options = {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "numeric",
			minute: "numeric",
		};
		return new Date(dateString).toLocaleDateString(undefined, options);
	};
</script>
