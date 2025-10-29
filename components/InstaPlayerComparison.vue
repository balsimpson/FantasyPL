<template>
  <div
    class="w-[1080px] h-[1080px] overflow-hidden bg-gradient-to-b from-gray-200 text-gray-800 to-gray-400 relative"
  >
    <!-- Background container to prevent artifacts -->
    <!-- <div class="absolute inset-0 text-gray-800 bg-gray-200 bg-gradient-to-t from-gray-200 to-gray-400"></div> -->

    <div
      class="relative z-10 flex items-center justify-between h-full gap-4 px-12 pt-12"
    >
      <!-- Player 1 section -->
      <div class="relative w-1/2 h-full">
        <div class="relative z-50 p-8 text-left">
          <h2 class="text-6xl font-extrabold">{{ player1.web_name }}</h2>
          <div class="flex items-start mt-6 space-x-2">
            <img
              :src="`https://resources.premierleague.com/premierleague/badges/t${player1.team_code}.png`"
              :alt="player1.web_name"
              class="w-24 mr-3"
            />
            <div>
              <p class="text-3xl">{{ teamName1 }}</p>
              <p class="text-4xl font-extrabold">{{ elementType1 }}</p>
              <!-- <p class="mt-24 text-3xl">Age</p> -->
              <p class="text-3xl font-bold">
                {{ getAge(player1.birth_date) }}
                <span class="opacity-50">yrs</span>
              </p>
            </div>
          </div>
        </div>
        <!-- Player 1 image positioned without negative margins -->
        <div
          class="absolute -left-56 -bottom-8 h-[800px] w-[740px] overflow-hidden flex items-end justify-start"
        >
          <img
            :src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player1.code}.png`"
            alt=""
            class="block object-contain w-auto max-w-full h-full drop-shadow-[4px_8px_6px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>

      <!-- Player 2 section -->
      <div class="relative w-1/2 h-full">
        <div class="relative z-20 p-8 text-right">
          <h2 class="text-6xl font-extrabold">{{ player2.web_name }}</h2>
          <div class="flex items-start justify-end mt-6 space-x-2">
            <div class="pr-3">
              <p class="text-3xl">{{ teamName2 }}</p>
              <p class="text-4xl font-extrabold">{{ elementType2 }}</p>

              <p class="text-3xl font-bold">
                {{ getAge(player2.birth_date) }}
                <span class="opacity-50">yrs</span>
              </p>
            </div>
            <img
              :src="`https://resources.premierleague.com/premierleague/badges/t${player2.team_code}.png`"
              :alt="player2.web_name"
              class="w-24"
            />
          </div>
        </div>
        <!-- Player 2 image positioned without negative margins -->
        <div
          class="absolute -right-30 -bottom-10 h-[800px] w-[740px] overflow-hidden flex items-end justify-end z-50"
        >
          <img
            :src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player2.code}.png`"
            alt=""
            class="block object-contain w-auto max-w-full h-full drop-shadow-[-4px_8px_6px_rgba(0,0,0,0.4)] z-30"
          />
        </div>
      </div>
    </div>

    <div
      class="absolute left-0 right-0 top-[20%] z-20 max-w-md mx-auto space-y-4"
    >
      <div class="p-2 mx-auto rounded-lg w-min bg-black/30">
        <h2 class="text-4xl font-extrabold text-center text-white">Cost</h2>
        <div
          class="flex items-center justify-center px-4 py-2 mx-auto space-x-4 w-min rounded-xl bg-white/70"
        >
          <p
            class="text-6xl font-extrabold"
            :class="[
              player1.now_cost < player2.now_cost
                ? 'text-pink-600'
                : 'text-teal-600',
            ]"
          >
            {{ player1.now_cost / 10 }}<span class="opacity-50"></span>
          </p>
          <span class="text-6xl opacity-50">mil</span>
          <p
            class="text-6xl font-extrabold"
            :class="[
              player2.now_cost < player1.now_cost
                ? 'text-pink-600'
                : 'text-teal-600',
            ]"
          >
            {{ player2.now_cost / 10 }}
          </p>
        </div>
      </div>
      <div class="p-2 mx-auto rounded-lg w-min bg-black/30">
        <h2 class="pb-2 text-4xl font-extrabold text-center text-white">
          Played
        </h2>
        <div
          class="flex items-center justify-center px-4 py-2 mx-auto space-x-4 w-min rounded-xl bg-white/70"
        >
          <p
            class="text-6xl font-extrabold"
            :class="[
              player1.minutes < player2.minutes
                ? 'text-pink-600'
                : 'text-teal-600',
            ]"
          >
            {{ player1.minutes }}
          </p>
          <span class="text-6xl opacity-50">min</span>
          <p
            class="text-6xl font-extrabold"
            :class="[
              player2.minutes < player1.minutes
                ? 'text-pink-600'
                : 'text-teal-600',
            ]"
          >
            {{ player2.minutes }}
          </p>
        </div>
      </div>
      <div class="p-2 mx-auto rounded-lg w-min bg-black/30">
        <h2 class="pb-2 text-4xl font-extrabold text-center text-white">
          Form
        </h2>
        <div
          class="flex items-center justify-center px-4 py-2 mx-auto space-x-4 w-min rounded-xl bg-white/70"
        >
          <p
            class="text-6xl font-extrabold"
            :class="[
              Number(player1.form) <= Number(player2.form)
                ? 'text-pink-600'
                : 'text-teal-600',
            ]"
          >
            {{ player1.form }}
          </p>
          <p
            class="text-6xl font-extrabold"
            :class="[
              Number(player2.form) <= Number(player1.form)
                ? 'text-pink-600'
                : 'text-teal-600',
            ]"
          >
            {{ player2.form }}
          </p>
        </div>
      </div>
      <div class="p-2 mx-auto rounded-lg w-min bg-black/30">
        <h2 class="pb-2 text-4xl font-extrabold text-center text-white">
          Points
        </h2>
        <div
          class="flex items-center justify-center px-4 py-2 mx-auto space-x-4 w-min rounded-xl bg-white/70"
        >
          <p
            class="text-6xl font-extrabold"
            :class="[
              player1.total_points < player2.total_points
                ? 'text-pink-600'
                : 'text-teal-600',
            ]"
          >
            {{ player1.total_points }} <span class="opacity-50"></span>
          </p>
          <p
            class="text-6xl font-extrabold"
            :class="[
              player2.total_points < player1.total_points
                ? 'text-pink-600'
                : 'text-teal-600',
            ]"
          >
            {{ player2.total_points }} <span class="opacity-50"></span>
          </p>
        </div>
      </div>
      <div class="p-2 mx-auto rounded-lg w-min bg-black/30">
        <h2 class="pb-2 text-4xl font-extrabold text-center text-white">
          Selected by
        </h2>
        <div
          class="flex items-center justify-center px-4 py-2 mx-auto space-x-4 w-min rounded-xl bg-white/70"
        >
          <p
            class="text-6xl font-extrabold"
            :class="[
              Number(player1.selected_by_percent) <
              Number(player2.selected_by_percent)
                ? 'text-pink-500'
                : 'text-teal-600',
            ]"
          >
            {{ Number(player1.selected_by_percent).toFixed(0) }}
            <span class="opacity-50"></span>
          </p>
          <span class="text-6xl opacity-50">%</span>
          <p
            class="text-6xl font-extrabold"
            :class="[
              Number(player2.selected_by_percent) <
              Number(player1.selected_by_percent)
                ? 'text-pink-500'
                : 'text-teal-600',
            ]"
          >
            {{ Number(player2.selected_by_percent).toFixed(0) }}
            <span class="opacity-50"></span>
          </p>
        </div>
      </div>
    </div>

	<!-- <div class="absolute w-full top-2">
          <div
            class="flex items-start justify-center gap-12 modern-stats-container"
          >
            <div
              v-for="item in getTopStatsByPosition(player1)"
              :key="item.label"
              class="flex flex-col items-center px-6 rounded-xl modern-stat-item"
            >
              <div
                class="w-full pb-1 mx-auto mb-1 text-base font-black tracking-wider text-center text-black uppercase border-b border-gray-600 modern-rating-label"
              >
                {{ item.rating }}
              </div>

              <div
                class="mb-1 text-6xl font-extrabold leading-none text-black modern-value"
              >
                {{ item.value }}
              </div>

              <div
                class="w-full mx-auto text-xs font-bold tracking-wide text-center text-gray-500 uppercase modern-main-label"
              >
                {{ item.label }}
              </div>
            </div>
          </div>
        </div> -->
  </div>
</template>

<script setup>
const props = defineProps(["player1", "player2", "data"]);

const totalTransfers1 = computed(
  () => props.player1.transfers_in_event + props.player1.transfers_out_event
);
const totalTransfers2 = computed(
  () => props.player2.transfers_in_event + props.player2.transfers_out_event
);

const teamName1 = computed(() => {
  const team = props.data.teams.find((team) => team.id === props.player1.team);
  return team ? team.name : "Unknown Team";
});
const teamName2 = computed(() => {
  const team = props.data.teams.find((team) => team.id === props.player2.team);
  return team ? team.name : "Unknown Team";
});

const elementTypeMap = {
  1: "Goalkeeper",
  2: "Defender",
  3: "Midfielder",
  4: "Forward",
};

const elementType1 = computed(
  () => elementTypeMap[props.player1.element_type] || "Unknown"
);
const elementType2 = computed(
  () => elementTypeMap[props.player2.element_type] || "Unknown"
);

function getTopStatsByPosition(player) {
  function rateValue(stat, value) {
    value = parseFloat(value);
    if (isNaN(value)) return "N/A";

    switch (stat) {
      // ⚽️ Attacking metrics
      case "Goals Scored":
        if (value >= 10) return "Elite";
        if (value >= 5) return "High";
        if (value >= 2) return "Average";
        return "Low";

      case "Assists":
        if (value >= 5) return "Elite";
        if (value >= 3) return "High";
        if (value >= 1) return "Average";
        return "Low";

      case "Expected Goals (xG)":
        if (value >= 6) return "Elite";
        if (value >= 3) return "High";
        if (value >= 1.5) return "Average";
        return "Low";

      case "Expected Goal Involvements (xGI)":
        if (value >= 7) return "Elite";
        if (value >= 4) return "High";
        if (value >= 2) return "Average";
        return "Low";

      // 🎯 Creative metrics
      case "Creativity":
        if (value >= 250) return "Elite";
        if (value >= 150) return "High";
        if (value >= 80) return "Average";
        return "Low";

      // 💣 Threat & Impact
      case "Threat":
        if (value >= 400) return "Elite";
        if (value >= 250) return "High";
        if (value >= 150) return "Average";
        return "Low";

      case "Influence":
        if (value >= 400) return "Elite";
        if (value >= 250) return "High";
        if (value >= 150) return "Average";
        return "Low";

      // 🧱 Defensive / GK
      case "Clean Sheets":
        if (value >= 6) return "Elite";
        if (value >= 4) return "High";
        if (value >= 2) return "Average";
        return "Low";

      case "Goals Conceded":
        if (value <= 5) return "Elite";
        if (value <= 10) return "High";
        if (value <= 15) return "Average";
        return "Low";

      case "Saves":
        if (value >= 40) return "Elite";
        if (value >= 25) return "High";
        if (value >= 10) return "Average";
        return "Low";

      case "Expected Goals Conceded (xGC)":
        if (value <= 6) return "Elite";
        if (value <= 10) return "High";
        if (value <= 14) return "Average";
        return "Low";

      case "Recoveries":
        if (value >= 30) return "Elite";
        if (value >= 20) return "High";
        if (value >= 10) return "Average";
        return "Low";

      default:
        return "Average";
    }
  }

  const pos = player.element_type;
  let stats = [];

  switch (pos) {
    case 1: // Goalkeeper
      stats = [
        { label: "Clean Sheets", value: player.clean_sheets },
        { label: "Goals Conceded", value: player.goals_conceded },
        { label: "Saves", value: player.saves },
        {
          label: "Expected Goals Conceded (xGC)",
          value: player.expected_goals_conceded,
        },
        { label: "Influence", value: player.influence },
      ];
      break;

    case 2: // Defender
      stats = [
        { label: "Clean Sheets", value: player.clean_sheets },
        { label: "Goals Scored", value: player.goals_scored },
        { label: "Assists", value: player.assists },
        {
          label: "Goal Involvements (xGI)",
          value: player.expected_goal_involvements,
        },
        { label: "Threat", value: player.threat },
      ];
      break;

    case 3: // Midfielder
      stats = [
        { label: "Goals Scored", value: player.goals_scored },
        { label: "Assists", value: player.assists },
        {
          label: "Goal Involvements (xGI)",
          value: player.expected_goal_involvements,
        },
        { label: "Threat", value: player.threat },
        { label: "Creativity", value: player.creativity },
      ];
      break;

    case 4: // Forward
      stats = [
        { label: "Goals Scored", value: player.goals_scored },
        { label: "Assists", value: player.assists },
        { label: "Expected Goals (xG)", value: player.expected_goals },
        {
          label: "Goal Involvements (xGI)",
          value: player.expected_goal_involvements,
        },
        { label: "Threat", value: player.threat },
      ];
      break;

    default:
      stats = [];
  }

  return stats.map((s) => ({
    ...s,
    rating: rateValue(s.label, s.value),
  }));
}

// Helper to get difficulty colors
function getDifficultyColors(difficulty) {
  const colors = {
    1: "bg-blue-500",
    2: "bg-blue-600",
    3: "bg-yellow-500",
    4: "bg-orange-500",
    5: "bg-red-500",
  };
  return colors[difficulty];
}

const getAge = (birthDate) => {
  if (!birthDate) return 0;

  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  // If birthday hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};
</script>

<style scoped></style>
