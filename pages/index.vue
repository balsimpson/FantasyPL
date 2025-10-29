<template>
  <div class="w-full p-3 mx-auto max-w-7xl">
    <GameWeekCardNew v-if="bootstrap" :gameweek="currentGameweek" />

    <div
      v-if="bootstrap"
      class="flex flex-col items-center justify-center mt-3 bg-indigo-200 rounded-xl md:flex-row md:items-center sm:gap-x-4"
    >
      <div class="w-full p-4">
        <div class="pb-3 text-2xl leading-5 text-center">
          <span class="font-semibold">
            <span class="text-purple-600">{{ nextGameweek.name }}</span>
            <span class="font-bold uppercase"> deadline </span>
          </span>
        </div>
        <CountdownTimer :targetDate="nextGameweek.deadline_time" />
      </div>

      <!-- FPL Manager Stats -->
      <div class="w-full mx-auto overflow-hidden rounded-xl">
        <div class="w-full p-4 mx-auto text-center md:text-left">
          <div class="mx-auto sm:max-w-lg md:mx-0">
            <h1 class="text-4xl font-bold tracking-tight text-gray-900">
              Check Manager Stats
            </h1>
            <p class="text-xl text-gray-500">
              Check on yours or your friend's stats easily, including team and
              leagues.
            </p>
          </div>

          <form class="">
            <div class="flex justify-center mt-1 gap-x-4 md:justify-normal">
              <label for="manager-id" class="sr-only">Manager ID</label>
              <input
                v-model="managerID"
                id="manager-id"
                autocomplete="true"
                class="flex-auto px-3.5 py-2 min-w-0 rounded-md border ring-1 ring-inset shadow-sm ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 max-w-md"
                placeholder="Enter Manager ID"
              />
              <button
                @click.prevent="navigateTo(`/manager/${managerID}`)"
                class="flex-none px-3.5 py-2.5 text-sm font-semibold text-white bg-indigo-500 rounded-md shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                :class="[
                  managerID ? 'opacity-100' : 'opacity-50 pointer-events-none',
                ]"
              >
                View Stats
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- <LeagueInfoCard /> -->

    <div></div>

    <!-- section to display options when the user picks the position and specifies a budget with a slider -->
    <!-- <RecommendedPlayers /> -->
    <!-- </div> -->

    <!-- upcoming fixtures -->
    <div v-if="fixtures && fixtures.length" class="space-y-2">
      <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Upcoming
      </h1>
      <AppCarousel class="snap-x snap-mandatory">
        <LazyFixtureCard
          v-for="fixture in fixtures"
          :key="fixture.id"
          :fixture="fixture"
          :bootstrap="bootstrap"
          class="snap-start"
        />
      </AppCarousel>
    </div>

    <div v-if="bootstrap && bootstrap.elements" class="mt-12 space-y-12">
      <!-- Most Selected -->
      <div v-if="bootstrap && bootstrap.elements" class="w-full mt-4 max-w-7xl">
        <div class="mb-6">
			<div class="flex flex-col sm:flex-row sm:items-end justify-between">
				<h1
				  class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
				>
				  Most Selected Players
				</h1>

				<div class="sm:w-64 w-full shrink-0">
				  <label class="text-sm font-medium text-gray-700 shrink-0">Sort by</label>
				  <select
					v-model="sortMostSelected"
					class="block w-full px-3 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
				  >
					<option value="selected_by_percent">Selected by %</option>
					<option value="total_points">Total Points</option>
					<option value="form">Form</option>
					<option value="now_cost">Price</option>
				  </select>
				</div>
			</div>
        </div>
        <AppCarousel>
          <LazyPlayerCardNew
            v-for="item in sortedMostSelected"
            :key="item.id"
            :player="item"
            :data="bootstrap.teams"
            class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
          />
        </AppCarousel>
      </div>
      <!-- Most Transferred In -->
      <div v-if="bootstrap && bootstrap.elements" class="w-full mt-4 max-w-7xl">
        <div class="max-w-3xl mb-6">
          <h1
            class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          >
            Most Transferred In Players
          </h1>
          <div class="flex items-center gap-4 mt-4">
            <label class="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              v-model="sortTransferredIn"
              class="block w-full px-3 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="transfers_in">Transfers In</option>
              <option value="form">Form</option>
              <option value="total_points">Total Points</option>
              <option value="now_cost">Price</option>
            </select>
          </div>
        </div>
        <AppCarousel>
          <LazyPlayerCardNew
            v-for="item in sortedTransferredIn"
            :key="item.id"
            :player="item"
            :data="bootstrap.teams"
            class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
          />
        </AppCarousel>
      </div>
      <!-- Most Transferred Out -->
      <div class="w-full mt-4 max-w-7xl">
        <div class="max-w-3xl mb-6">
          <h1
            class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          >
            Most Transferred Out Players
          </h1>
          <div class="flex items-center gap-4 mt-4">
            <label class="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              v-model="sortTransferredOut"
              class="block w-full px-3 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="transfers_out">Transfers Out</option>
              <option value="form">Form</option>
              <option value="total_points">Total Points</option>
              <option value="now_cost">Price</option>
            </select>
          </div>
        </div>
        <AppCarousel>
          <LazyPlayerCardNew
            v-for="item in sortedTransferredOut"
            :key="item.id"
            :player="item"
            :data="bootstrap.teams"
            class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
          />
        </AppCarousel>
      </div>
      <!-- Top Forwards -->
      <div v-if="bootstrap && bootstrap.elements" class="w-full mt-4 max-w-7xl">
        <div class="max-w-3xl mb-2">
          <h1
            class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          >
            Top Forwards
          </h1>
          <div class="flex items-center gap-4 mt-4">
            <label class="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              v-model="sortForwards"
              class="block w-full px-3 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="total_points">Total Points</option>
              <option value="form">Form</option>
              <option value="goals_scored">Goals</option>
              <option value="now_cost">Price</option>
            </select>
          </div>
        </div>
        <AppCarousel v-if="bootstrap && bootstrap.elements">
          <LazyPlayerCardNew
            v-for="item in sortedForwards"
            :key="item"
            :player="item"
            :data="bootstrap.teams"
            class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
          />
        </AppCarousel>
      </div>
      <!-- Top Midfielders -->
      <div v-if="bootstrap && bootstrap.elements" class="w-full mt-4 max-w-7xl">
        <div class="max-w-3xl mb-2">
          <h1
            class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          >
            Top Midfielders
          </h1>
          <div class="flex items-center gap-4 mt-4">
            <label class="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              v-model="sortMidfielders"
              class="block w-full px-3 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="total_points">Total Points</option>
              <option value="form">Form</option>
              <option value="assists">Assists</option>
              <option value="goals_scored">Goals</option>
              <option value="now_cost">Price</option>
            </select>
          </div>
        </div>
        <AppCarousel v-if="bootstrap && bootstrap.elements">
          <LazyPlayerCardNew
            v-for="item in sortedMidfielders"
            :key="item"
            :player="item"
            :data="bootstrap.teams"
            class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
          />
        </AppCarousel>
      </div>
      <!-- Top Defenders -->
      <div v-if="bootstrap && bootstrap.elements" class="w-full mt-4 max-w-7xl">
        <div class="max-w-3xl mb-2">
          <h1
            class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          >
            Top Defenders
          </h1>
          <div class="flex items-center gap-4 mt-4">
            <label class="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              v-model="sortDefenders"
              class="block w-full px-3 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="total_points">Total Points</option>
              <option value="form">Form</option>
              <option value="clean_sheets">Clean Sheets</option>
              <option value="goals_conceded">Goals Conceded</option>
              <option value="now_cost">Price</option>
            </select>
          </div>
        </div>
        <AppCarousel>
          <LazyPlayerCardNew
            v-for="item in sortedDefenders"
            :key="item"
            :player="item"
            :data="bootstrap.teams"
            class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
          />
        </AppCarousel>
      </div>
      <!-- Top Goalkeepers -->
      <div v-if="bootstrap && bootstrap.elements" class="w-full mt-4 max-w-7xl">
        <div class="max-w-3xl mb-2">
          <h1
            class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl"
          >
            Top Goalkeepers
          </h1>
          <div class="flex items-center gap-4 mt-4">
            <label class="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              v-model="sortGoalkeepers"
              class="block w-full px-3 py-2 text-base border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="total_points">Total Points</option>
              <option value="form">Form</option>
              <option value="clean_sheets">Clean Sheets</option>
              <option value="saves">Saves</option>
              <option value="now_cost">Price</option>
            </select>
          </div>
        </div>
        <AppCarousel>
          <LazyPlayerCardNew
            v-for="item in sortedGoalkeepers"
            :key="item"
            :player="item"
            :data="bootstrap.teams"
            class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
          />
        </AppCarousel>
      </div>
    </div>
  </div>
</template>

<script setup>
// const recommendedPlayers = ref([]);

const allPlayers = useState("allPlayers", () => []);
const allTeams = useState("allTeams", () => []);
const allFixtures = useState("allFixtures", () => []);

const managerID = ref(null);

// const { data: bootstrap, error } = useFetch("/api/bootstrap-static");
// if (error.value) {
// 	console.error("Failed to fetch bootstrap data:", error.value);
// }

const { data: bootstrap, error } = await useLazyAsyncData("bootstrap", () =>
  $fetch("/api/bootstrap-static")
);

const { data: fixtures } = await useLazyAsyncData("fixtures", () =>
  $fetch("/api/fixtures")
);

const { data: predictions } = useLazyFetch(`/api/predictions`);

const currentGameweek = computed(() => {
  if (bootstrap.value && bootstrap.value.events) {
    let currentWeek = bootstrap.value.events.find((event) => event.is_current);

    if (currentWeek) {
      let most_captained = getPlayerInfo(
        currentWeek.most_captained,
        bootstrap.value
      );
      let most_captained_team = most_captained.team;
      let most_vice_captained = getPlayerInfo(
        currentWeek.most_vice_captained,
        bootstrap.value
      );
      let most_vice_captained_team = most_vice_captained.team;

      currentWeek.mostCaptained = `${most_captained.first_name} ${most_captained.second_name}`;

      currentWeek.mostCaptainedTeam = getTeamInfo(
        most_captained_team,
        bootstrap.value
      );

      currentWeek.mostViceCaptained = `${most_vice_captained.first_name} ${most_vice_captained.second_name}`;
      currentWeek.mostViceCaptainedTeam = getTeamInfo(
        most_vice_captained_team,
        bootstrap.value
      );

      // Add player and team codes for images
      currentWeek.mostCaptainedPlayerCode = most_captained.code;
      currentWeek.mostCaptainedTeamCode = currentWeek.mostCaptainedTeam.code;
      currentWeek.mostViceCaptainedPlayerCode = most_vice_captained.code;
      currentWeek.mostViceCaptainedTeamCode =
        currentWeek.mostViceCaptainedTeam.code;

      return currentWeek;
    }
  }
});

const nextGameweek = computed(() => {
  if (bootstrap.value && bootstrap.value.events) {
    return bootstrap.value.events.find((event) => event.is_next);
  }
});

const mostSelected = computed(() => {
  if (bootstrap.value && bootstrap.value.elements) {
    return getMostSelectedPlayers(bootstrap.value.elements, 20);
  }
  return [];
});

const mostTransferredIn = computed(() => {
  if (bootstrap.value && bootstrap.value.elements) {
    return getMostTransferredInPlayers(bootstrap.value.elements, 20);
  }
  return [];
});

const mostTransferredOut = computed(() => {
  if (bootstrap.value && bootstrap.value.elements) {
    return getMostTransferredOutPlayers(bootstrap.value.elements, 20);
  }
  return [];
});

onMounted(() => {
  const savedManagerId = localStorage.getItem("savedManagerId") ?? "";

  if (savedManagerId) {
    managerID.value = savedManagerId;
  }

  if (bootstrap.value) {
    allPlayers.value = bootstrap.value.elements;
    allTeams.value = bootstrap.value.teams;
  }
});

// Add new refs for sort selections
const sortMostSelected = ref("selected_by_percent");
const sortTransferredIn = ref("transfers_in");
const sortTransferredOut = ref("transfers_out");
const sortForwards = ref("total_points");
const sortMidfielders = ref("total_points");
const sortDefenders = ref("total_points");
const sortGoalkeepers = ref("total_points");

// Modify computed properties to include sorting
const sortedMostSelected = computed(() => {
  if (!mostSelected.value) return [];
  return [...mostSelected.value].sort(
    (a, b) => b[sortMostSelected.value] - a[sortMostSelected.value]
  );
});

const sortedTransferredIn = computed(() => {
  if (!mostTransferredIn.value) return [];
  return [...mostTransferredIn.value].sort(
    (a, b) => b[sortTransferredIn.value] - a[sortTransferredIn.value]
  );
});

const sortedTransferredOut = computed(() => {
  if (!mostTransferredOut.value) return [];
  return [...mostTransferredOut.value].sort(
    (a, b) => b[sortTransferredOut.value] - a[sortTransferredOut.value]
  );
});

const sortedForwards = computed(() => {
  if (!bootstrap.value?.elements) return [];
  return getTopPlayers(bootstrap.value.elements, 4, 20).sort(
    (a, b) => b[sortForwards.value] - a[sortForwards.value]
  );
});

const sortedMidfielders = computed(() => {
  if (!bootstrap.value?.elements) return [];
  return getTopPlayers(bootstrap.value.elements, 3, 20).sort(
    (a, b) => b[sortMidfielders.value] - a[sortMidfielders.value]
  );
});

const sortedDefenders = computed(() => {
  if (!bootstrap.value?.elements) return [];
  return getTopPlayers(bootstrap.value.elements, 2, 20).sort(
    (a, b) => b[sortDefenders.value] - a[sortDefenders.value]
  );
});

const sortedGoalkeepers = computed(() => {
  if (!bootstrap.value?.elements) return [];
  return getTopPlayers(bootstrap.value.elements, 1, 20).sort(
    (a, b) => b[sortGoalkeepers.value] - a[sortGoalkeepers.value]
  );
});

const playerId = "596047";
</script>

<style>
.PlayerCard {
  height: 100%; /* Make sure the card takes up the full height of its container */
}

.PlayerCard-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 300px; /* Set a fixed height for the card content */
}

.PlayerCard-content h1,
.PlayerCard-content p {
  margin-bottom: auto; /* Ensure text does not push the height */
}

select {
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  appearance: none;
}
</style>
