<template>
  <div :id="props.id">
    <div
      class="w-[1080px] h-[1080px] aspect-square bg-gray-200  overflow-hidden bg-gradient-to-br from-gray-100 text-gray-800 to-gray-300 relative"
    >
      <div class="absolute flex justify-between w-full px-20 pt-20">
        <!-- Player Info -->
        <div class="flex justify-between w-full">
          <div class="text-left">
            <h2 class="text-6xl font-bold">{{ player.web_name }}</h2>
            <div class="flex items-center mt-6 space-x-2">
              <img
                :src="`https://resources.premierleague.com/premierleague/badges/t${player.team_code}.png`"
                :alt="player.web_name"
                class="w-24 mr-3"
              />
              <div>
                <p class="text-3xl">{{ team }}</p>
                <p class="text-4xl font-bold">{{ elementType }}</p>
              </div>
            </div>

            <p class="mt-24 text-3xl">Played</p>
            <p class="text-6xl font-bold">{{ player.minutes }} min</p>
            <p class="mt-8 text-3xl">Selected by</p>
            <p class="text-6xl font-bold">
              {{ player.selected_by_percent }}<span class="opacity-50">%</span>
            </p>
            <p class="mt-8 text-3xl">Bonus</p>
            <p class="text-6xl font-bold">{{ player.bonus }}</p>
          </div>
          <!-- Player Stats -->
          <div class="text-right">
            <p class="text-5xl">GAMEWEEK {{ gameweek.id }}</p>
            <p class="pt-8 font-bold text-8xl">
              {{ player.now_cost / 10 }}<span class="opacity-50">m</span>
            </p>
            <p class="mt-24 text-3xl">Age</p>
            <p class="text-6xl font-bold">
              {{ getAge(player.birth_date) }}
            </p>
            <p class="mt-8 text-3xl">Points per game</p>
            <p class="text-6xl font-bold">{{ player.points_per_game }}</p>
            <p class="mt-8 text-3xl">Total points</p>
            <p class="text-6xl font-bold">{{ player.total_points }}</p>
          </div>
        </div>
      </div>

      <div
        class="relative flex flex-col items-center justify-end w-full h-full"
      >
        <div
          class="absolute left-1/2 -translate-x-1/2 z-50 py-2 bottom-[310px]"
        >
          <div
            class="w-[400px] bg-white/90 flex flex-col items-center justify-center rounded-lg pb-3"
          >
            <p class="mb-2 text-xl font-bold text-center text-black">
              Upcoming games difficulty
            </p>
            <!-- <pre>{{ upcoming }}</pre> -->
            <div
              v-if="upcoming"
              class="flex items-center justify-center mt-0 space-x-2"
            >
              <div
                v-for="item in upcoming"
                :key="item"
                class="flex items-center justify-center w-16 h-16 rounded-md"
                :class="`${getDifficultyColors(item.difficulty)}`"
              >
                <!-- <img
							:src="`https://resources.premierleague.com/premierleague/badges/t${!item.is_home ? item.team_h : item.team_a}.png`"
							:alt="!item.is_home ? item.team_h : item.team_a"
							class="w-12"
						/> -->
                <div class="relative text-center">
                  <div class="text-xl font-bold">{{ item.difficulty }}</div>
                  <div
                    class="absolute text-xs font-light -translate-x-1/2 left-1/2"
                  >
                    {{ item.is_home ? "Home" : "" }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Image -->
        <!-- style="max-width:1000px; max-height:1000px; width:900px; height:auto;" -->
        <div class="flex items-center justify-center w-full h-full pt-3">
		<img
			:src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`"
			alt=""
			class="object-contain scale-150"
			style="filter: drop-shadow(0 20px 25px rgba(0,0,0,0.45)); transform-origin: center;"
			@error="(e) => { e.target.onerror = null; e.target.src = `https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`; e.target.style.transform = 'scale(2.5)'; }"
		/>
        
        </div>

        <div class="absolute left-0 z-30 w-full bottom-24">
          <!-- Difficulty Bar -->

          <!-- Transfer Stats -->
          <div class="relative bottom-10">
            <!-- Transfers Out Dynamic Width Bar -->
            <div
              :style="{ width: transfersOutWidth + 'px' }"
              class="bg-red-600 h-[200px] z-20 absolute"
            ></div>

            <!-- Background Red Bar -->
            <div class="w-[1080px] h-[200px] bg-teal-500 z-10 relative"></div>

            <!-- Content Overlay with higher z-index -->
            <div
              class="absolute z-30 w-full flex justify-between items-center h-[100px] bottom-12 px-20 text-white"
            >
              <div class="text-left">
                <!-- <pre>{{ JSON.stringify(transfersOutWidth) }}</pre>
							<pre>{{ JSON.stringify(outPercentage) }}</pre> -->
                <p class="font-bold text-8xl">
                  {{ shortenNumber(player.transfers_out_event) }}
                </p>
                <p class="text-4xl">Transfers Out</p>
              </div>

              <div class="text-right">
                <p class="font-bold text-8xl">
                  {{ shortenNumber(player.transfers_in_event) }}
                </p>
                <p class="text-4xl">Transfers In</p>
              </div>
            </div>

            <div
              class="absolute left-0 right-0 z-50 flex items-center justify-center w-full bottom-10"
            >
              <div
                class="px-6 py-3 text-center text-black border rounded-lg bg-white/90"
              >
                <p class="text-6xl font-bold">
                  {{ player.form }}
                </p>
                <p class="text-4xl">Form</p>
              </div>
            </div>
          </div>
        </div>

        <div class="absolute w-full bottom-2">
          <div
            class="flex items-start justify-center gap-12 modern-stats-container"
          >
            <div
              v-for="item in getTopStatsByPosition(player)"
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
        </div>
      </div>
    </div>

    <!-- <pre>{{ getTopStatsByPosition(player) }}</pre> -->
  </div>
</template>

<script setup>
const props = defineProps(["player", "team", "upcoming", "gameweek", "id"]);

const totalTransfers = computed(
  () => props.player.transfers_in_event + props.player.transfers_out_event
);

const outPercentage = computed(() =>
  totalTransfers.value == 0
    ? 50
    : (props.player.transfers_out_event / totalTransfers.value) * 100
);

const transfersOutWidth = computed(() =>
  (1024 * (outPercentage.value / 100)).toString()
);

const elementTypeMap = {
  1: "Goalkeeper",
  2: "Defender",
  3: "Midfielder",
  4: "Forward",
};

const elementType = computed(
  () => elementTypeMap[props.player.element_type] || "Unknown"
);

// Helper to get difficulty colors
function getDifficultyColors(difficulty) {
  const colors = {
    1: "bg-teal-300",
    2: "bg-blue-300",
    3: "bg-yellow-300",
    4: "bg-orange-300",
    5: "bg-red-300",
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
</script>

<style></style>
