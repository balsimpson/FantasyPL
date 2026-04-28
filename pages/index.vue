<template>
  <div class="relative min-h-screen overflow-hidden text-stone-50">



    <div class="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section v-if="bootstrap" class="grid gap-6">

        <div class="flex gap-6 flex-col md:flex-row">
          <div class="md:w-1/2">
            <p class="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
              Fantasy Premier League
            </p>
            <h1 class="mt-3 text-4xl font-black leading-[0.92] tracking-tight text-balance text-white sm:text-6xl">
              Track stats, fixtures, and form
            </h1>
            <p class="mt-4 max-w-xl text-sm leading-6 text-stone-300 sm:text-base">
              Follow the next deadline, compare player ownership, and find the numbers that matter most without the
              clutter.
            </p>

            <div class="mt-6">
              <p class="text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-stone-500">
                Find a manager
              </p>
              <p class="max-w-md text-sm leading-6 text-stone-300">
                Open your own team or a rival's stats with a manager ID.
              </p>

              <form class="flex flex-col gap-3 sm:flex-row" @submit.prevent="navigateTo(`/manager/${managerID}`)">
                <label for="manager-id" class="sr-only">Manager ID</label>
                <input id="manager-id" v-model="managerID" autocomplete="off" inputmode="numeric"
                  class="min-w-0 flex-1 appearance-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-stone-100 shadow-sm outline-none transition placeholder:text-stone-500 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/20"
                  placeholder="Enter Manager ID" />
                <button type="submit"
                  class="rounded-2xl bg-lime-300 px-4 py-3 text-sm font-semibold text-black shadow-[0_16px_30px_rgba(200,255,61,0.16)] transition hover:-translate-y-0.5 hover:bg-lime-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300"
                  :class="[managerID ? 'opacity-100' : 'pointer-events-none opacity-50']">
                  Open team
                </button>
              </form>
            </div>
          </div>

          <CountdownTimer v-if="nextGameweek" :targetDate="nextGameweek.deadline_time" />
        </div>

        <GameWeekCardNew v-if="currentGameweek" :gameweek="currentGameweek" />

      </section>

      <section v-if="fixtures && fixtures.length" class="">
        <div class="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div class="max-w-xl">
            <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
              Upcoming fixtures
            </p>
            <h2 class="mt-2 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
              Next matches
            </h2>
            <p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
              A quick look at the schedule ahead, with the focus on the fixtures themselves.
            </p>
          </div>
        </div>
        <AppCarousel >
          <LazyFixtureCard v-for="fixture in fixtures" :key="fixture.id" :fixture="fixture" :bootstrap="bootstrap"
            :class="carouselCardClass" />
        </AppCarousel>
      </section>

      <section v-if="bootstrap && bootstrap.elements" class="">


        <div class="space-y-3 py-6 pb-12 max-w-xl mx-auto">
          <div class="flex items-center justify-between gap-3">
            <p class="text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-stone-500">
              Search FPL players
            </p>
            <span class="text-[0.58rem] font-semibold uppercase tracking-[0.28em] text-stone-400">
              Player search
            </span>
          </div>

          <UInput
            v-model="playerQuery"
            type="search"
            icon="i-lucide-search"
            placeholder="Search players by name"
            autocomplete="off"
            size="md"
            color="neutral"
            variant="none"
            :highlight="false"
            class="w-full"
            :ui="{
              base: 'w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm font-medium text-stone-100 shadow-sm outline-none transition placeholder:text-stone-500 focus:border-lime-300/40 focus:ring-2 focus:ring-lime-300/20',
              leading: 'pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4',
              leadingIcon: 'size-4 text-stone-500'
            }"
            @keydown.enter.prevent="goToFirstPlayerResult"
          />

          <div v-if="playerQuery.trim() && playerSearchResults.length" class="grid gap-2">
            <button v-for="player in playerSearchResults" :key="player.id" type="button"
              class="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left transition hover:border-lime-300/40 hover:bg-white/[0.07]"
              @click="goToPlayer(player)">
              <div>
                <div class="text-sm font-semibold text-white">
                  {{ player.first_name }} {{ player.second_name }}
                </div>
                <div class="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {{ player.web_name }}
                </div>
              </div>

              <div class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                {{ getTeamInfo(player.team, bootstrap).name }}
              </div>
            </button>
          </div>

          <p v-else-if="playerQuery.trim()" class="text-sm text-stone-500">
            No players match that search.
          </p>
        </div>



        <div class="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div class="max-w-2xl">
            <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
              Player ownership
            </p>
            <h2 class="mt-2 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
              Most-owned players
            </h2>
            <p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
              Compare the most-owned players and sort by the stat that matters most to your team.
            </p>
          </div>

            <div class="w-full max-w-xs">
              <label class="mb-2 block text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-stone-400">
                {{ sortSelectLabel }}
              </label>
              <USelect
                v-model="sortMostSelected"
                :items="mostSelectedSortOptions"
                v-bind="sortSelectProps"
                class="w-full"
              />
            </div>
        </div>

        <AppCarousel ref="mostSelectedCarousel" class="pt-5">
          <LazyPlayerCardNew v-for="item in sortedMostSelected" :key="item.id" :player="item" :data="bootstrap.teams"
            :class="carouselCardClass" />
        </AppCarousel>
      </section>

      <section v-if="bootstrap && bootstrap.elements" class="grid gap-6 xl:grid-cols-2">
        <div class="min-w-0 space-y-4">
          <div class="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="max-w-2xl">
              <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
                Transfers in form
              </p>
              <h2 class="mt-2 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
                Most transferred in
              </h2>
              <p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
                The players being added fastest, with a sort order tailored to current momentum.
              </p>
            </div>

            <div class="w-full max-w-xs">
              <label class="mb-2 block text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-stone-400">
                {{ sortSelectLabel }}
              </label>
              <USelect
                v-model="sortTransferredIn"
                :items="transferredInSortOptions"
                v-bind="sortSelectProps"
                class="w-full"
              />
            </div>
          </div>

          <AppCarousel ref="transferredInCarousel" class="pt-5">
            <LazyPlayerCardNew v-for="item in sortedTransferredIn" :key="item.id" :player="item" :data="bootstrap.teams"
              :class="carouselCardClass" />
          </AppCarousel>
        </div>

        <div class="min-w-0 space-y-4">
          <div class="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="max-w-2xl">
              <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
                Transfers out form
              </p>
              <h2 class="mt-2 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
                Most transferred out
              </h2>
              <p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
                Spot the exits and see which names managers are moving away from.
              </p>
            </div>

            <div class="w-full max-w-xs">
              <label class="mb-2 block text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-stone-400">
                {{ sortSelectLabel }}
              </label>
              <USelect
                v-model="sortTransferredOut"
                :items="transferredOutSortOptions"
                v-bind="sortSelectProps"
                class="w-full"
              />
            </div>
          </div>

          <AppCarousel ref="transferredOutCarousel" class="pt-5">
            <LazyPlayerCardNew v-for="item in sortedTransferredOut" :key="item.id" :player="item"
              :data="bootstrap.teams" :class="carouselCardClass" />
          </AppCarousel>
        </div>
      </section>

      <section v-if="bootstrap && bootstrap.elements" class="space-y-10">
        <div class="space-y-4">
          <div class="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div class="max-w-2xl">
              <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
                Position leaders
              </p>
              <h2 class="mt-2 text-3xl font-black leading-none tracking-tight text-white sm:text-5xl">
                Top forwards
              </h2>
              <p class="mt-3 max-w-xl text-sm leading-6 text-stone-300">
                The highest-upside forwards, ranked by the stat that matters most.
              </p>
            </div>

            <div class="w-full max-w-xs">
              <label class="mb-2 block text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-stone-400">
                {{ sortSelectLabel }}
              </label>
              <USelect
                v-model="sortForwards"
                :items="forwardsSortOptions"
                v-bind="sortSelectProps"
                class="w-full"
              />
            </div>
          </div>

          <AppCarousel ref="forwardsCarousel" class="pt-5">
            <LazyPlayerCardNew v-for="item in sortedForwards" :key="item.id" :player="item" :data="bootstrap.teams"
              :class="carouselCardClass" />
          </AppCarousel>
        </div>

        <div class="grid gap-6 xl:grid-cols-3">
          <div class="min-w-0 space-y-4">
            <div class="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-stone-400">
                  Position leaders
                </p>
                <h3 class="mt-2 text-2xl font-black tracking-tight text-white">
                  Top midfielders
                </h3>
              </div>
              <USelect
                v-model="sortMidfielders"
                :items="midfieldersSortOptions"
                v-bind="sortSelectProps"
                class="w-full sm:max-w-[12rem]"
              />
            </div>
            <AppCarousel ref="midfieldersCarousel" class="pt-4">
              <LazyPlayerCardNew v-for="item in sortedMidfielders" :key="item.id" :player="item" :data="bootstrap.teams"
                :class="carouselCardClass" />
            </AppCarousel>
          </div>

          <div class="min-w-0 space-y-4">
            <div class="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-stone-400">
                  Position leaders
                </p>
                <h3 class="mt-2 text-2xl font-black tracking-tight text-white">
                  Top defenders
                </h3>
              </div>
              <USelect
                v-model="sortDefenders"
                :items="defendersSortOptions"
                v-bind="sortSelectProps"
                class="w-full sm:max-w-[12rem]"
              />
            </div>
            <AppCarousel ref="defendersCarousel" class="pt-4">
              <LazyPlayerCardNew v-for="item in sortedDefenders" :key="item.id" :player="item" :data="bootstrap.teams"
                :class="carouselCardClass" />
            </AppCarousel>
          </div>

          <div class="min-w-0 space-y-4">
            <div class="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-stone-400">
                  Position leaders
                </p>
                <h3 class="mt-2 text-2xl font-black tracking-tight text-white">
                  Top goalkeepers
                </h3>
              </div>
              <USelect
                v-model="sortGoalkeepers"
                :items="goalkeepersSortOptions"
                v-bind="sortSelectProps"
                class="w-full sm:max-w-[12rem]"
              />
            </div>
            <AppCarousel ref="goalkeepersCarousel" class="pt-4">
              <LazyPlayerCardNew v-for="item in sortedGoalkeepers" :key="item.id" :player="item" :data="bootstrap.teams"
                :class="carouselCardClass" />
            </AppCarousel>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  keepalive: true,
});

useSeoMeta({
  title: 'Fantasy Premier League stats, fixtures and player form',
  description:
    'Track Fantasy Premier League player stats, fixtures, ownership, transfers and form in one place.',
  ogTitle: 'Fantasy Premier League stats, fixtures and player form',
  ogDescription:
    'Track Fantasy Premier League player stats, fixtures, ownership, transfers and form in one place.',
});

const allPlayers = useState("allPlayers", () => []);
const allTeams = useState("allTeams", () => []);

const managerID = ref(null);
const playerQuery = ref("");
const mostSelectedCarousel = ref(null);
const transferredInCarousel = ref(null);
const transferredOutCarousel = ref(null);
const forwardsCarousel = ref(null);
const midfieldersCarousel = ref(null);
const defendersCarousel = ref(null);
const goalkeepersCarousel = ref(null);

const playersStore = usePlayersStore();
const { bootstrap } = storeToRefs(playersStore);

await useAsyncData("bootstrap", () => playersStore.fetchPlayers());

const { data: fixtures } = await useLazyAsyncData("fixtures", () =>
  $fetch("/api/fixtures")
);

const carouselCardClass = "shrink-0  snap-start";
const sortSelectLabel = "Sort By";
const sortSelectProps = {
  color: "neutral",
  variant: "subtle",
  size: "md",
  highlight: false,
};
const playerSortKeyMap = {
  transfers_in: "transfers_in_event",
  transfers_out: "transfers_out_event",
};

const getSortableValue = (player, key) => {
  const resolvedKey = playerSortKeyMap[key] ?? key;
  const value = player?.[resolvedKey];
  return Number(value) || 0;
};

const sortPlayersByStat = (players, key) => {
  return [...players].sort(
    (a, b) => getSortableValue(b, key) - getSortableValue(a, key)
  );
};

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

const sortMostSelected = ref("selected_by_percent");
const sortTransferredIn = ref("transfers_in_event");
const sortTransferredOut = ref("transfers_out_event");
const sortForwards = ref("total_points");
const sortMidfielders = ref("total_points");
const sortDefenders = ref("total_points");
const sortGoalkeepers = ref("total_points");

const scrollCarouselToStart = async (carouselRef) => {
  await nextTick();
  carouselRef.value?.scrollToStart?.();
};

watch(sortMostSelected, () => scrollCarouselToStart(mostSelectedCarousel));
watch(sortTransferredIn, () => scrollCarouselToStart(transferredInCarousel));
watch(sortTransferredOut, () => scrollCarouselToStart(transferredOutCarousel));
watch(sortForwards, () => scrollCarouselToStart(forwardsCarousel));
watch(sortMidfielders, () => scrollCarouselToStart(midfieldersCarousel));
watch(sortDefenders, () => scrollCarouselToStart(defendersCarousel));
watch(sortGoalkeepers, () => scrollCarouselToStart(goalkeepersCarousel));

const mostSelectedSortOptions = [
  { label: "Selected by %", value: "selected_by_percent" },
  { label: "Total Points", value: "total_points" },
  { label: "Form", value: "form" },
  { label: "Price", value: "now_cost" },
];

const transferredInSortOptions = [
  { label: "Transfers In", value: "transfers_in_event" },
  { label: "Form", value: "form" },
  { label: "Total Points", value: "total_points" },
  { label: "Price", value: "now_cost" },
];

const transferredOutSortOptions = [
  { label: "Transfers Out", value: "transfers_out_event" },
  { label: "Form", value: "form" },
  { label: "Total Points", value: "total_points" },
  { label: "Price", value: "now_cost" },
];

const forwardsSortOptions = [
  { label: "Total Points", value: "total_points" },
  { label: "Form", value: "form" },
  { label: "Goals Scored", value: "goals_scored" },
  { label: "Price", value: "now_cost" },
];

const midfieldersSortOptions = [
  { label: "Total Points", value: "total_points" },
  { label: "Form", value: "form" },
  { label: "Assists", value: "assists" },
  { label: "Goals Scored", value: "goals_scored" },
  { label: "Price", value: "now_cost" },
];

const defendersSortOptions = [
  { label: "Total Points", value: "total_points" },
  { label: "Form", value: "form" },
  { label: "Clean Sheets", value: "clean_sheets" },
  { label: "Goals Conceded", value: "goals_conceded" },
  { label: "Price", value: "now_cost" },
];

const goalkeepersSortOptions = [
  { label: "Total Points", value: "total_points" },
  { label: "Form", value: "form" },
  { label: "Clean Sheets", value: "clean_sheets" },
  { label: "Saves", value: "saves" },
  { label: "Price", value: "now_cost" },
];

const mostSelectedSortKey = computed(() => {
  return sortMostSelected.value;
});

const sortedMostSelected = computed(() => {
  if (!mostSelected.value) return [];
  return sortPlayersByStat(mostSelected.value, mostSelectedSortKey.value);
});

const sortedTransferredIn = computed(() => {
  if (!mostTransferredIn.value) return [];
  return sortPlayersByStat(mostTransferredIn.value, sortTransferredIn.value);
});

const sortedTransferredOut = computed(() => {
  if (!mostTransferredOut.value) return [];
  return sortPlayersByStat(mostTransferredOut.value, sortTransferredOut.value);
});

const sortedForwards = computed(() => {
  if (!bootstrap.value?.elements) return [];
  return sortPlayersByStat(getTopPlayers(bootstrap.value.elements, 4, 20), sortForwards.value);
});

const sortedMidfielders = computed(() => {
  if (!bootstrap.value?.elements) return [];
  return sortPlayersByStat(getTopPlayers(bootstrap.value.elements, 3, 20), sortMidfielders.value);
});

const sortedDefenders = computed(() => {
  if (!bootstrap.value?.elements) return [];
  return sortPlayersByStat(getTopPlayers(bootstrap.value.elements, 2, 20), sortDefenders.value);
});

const sortedGoalkeepers = computed(() => {
  if (!bootstrap.value?.elements) return [];
  return sortPlayersByStat(getTopPlayers(bootstrap.value.elements, 1, 20), sortGoalkeepers.value);
});

const playerSearchResults = computed(() => {
  const query = playerQuery.value.trim().toLowerCase();

  if (!query || !bootstrap.value?.elements) {
    return [];
  }

  return [...bootstrap.value.elements]
    .filter((player) => {
      const searchableText = [
        player.first_name,
        player.second_name,
        player.web_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    })
    .sort((a, b) => {
      const aName = `${a.first_name} ${a.second_name}`.toLowerCase();
      const bName = `${b.first_name} ${b.second_name}`.toLowerCase();
      const aStartsWith = aName.startsWith(query) || (a.web_name ?? "").toLowerCase().startsWith(query);
      const bStartsWith = bName.startsWith(query) || (b.web_name ?? "").toLowerCase().startsWith(query);

      if (aStartsWith !== bStartsWith) {
        return aStartsWith ? -1 : 1;
      }

      return (b.total_points ?? 0) - (a.total_points ?? 0);
    })
    .slice(0, 6);
});

const goToPlayer = async (player) => {
  await navigateTo(`/player/${player.id}`);
};

const goToFirstPlayerResult = async () => {
  if (!playerSearchResults.value.length) {
    return;
  }

  await goToPlayer(playerSearchResults.value[0]);
};

</script>
