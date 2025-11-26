<template>
  <div class="flex overflow-hidden relative flex-col group">
    <!-- content -->
    <div v-if="label"
      class="absolute top-0 left-0 z-20 px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-br-lg shadow-md uppercase tracking-wider">
      {{ label }}
    </div>
    <div class="z-10 flex-grow">
      <!-- <pre>{{ player }}</pre> -->
      <div class="flex flex-col order-1 p-3 sm:order-1">
        <div class="flex justify-between items-center">
          <h2 class="w-full text-2xl font-bold leading-5">
            {{ player.web_name }}
          </h2>
          <div>
            <div class="text-4xl font-black text-slate-500">
              {{ player.now_cost / 10 }}<span class="text-slate-400">m</span>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center mb-3 leading-3">
          <!-- cards issued -->
          <div class="flex items-center">
            <img :src="`https://resources.premierleague.com/premierleague/badges/t${player.team_code}.png`" alt=""
              class="bottom-1 pr-1 w-8 sm:z-0 sm:top-1 sm:right-1" />

            <div class="pr-3 leading-5">
              <div class="text-sm font-semibold">{{ teamName }}</div>
              <div class="text-xs uppercase text-slate-500">
                {{ elementType }}
              </div>
            </div>
          </div>
          <section v-if="player.yellow_cards > 0 || player.red_cards > 0">
            <!-- <div class="mt-2 text-sm font-semibold">Cards</div> -->
            <div class="flex items-center">
              <div v-if="player.yellow_cards > 0" class="mr-1 w-4 h-6 bg-yellow-400" :title="`${player.yellow_cards} Yellow Card${player.yellow_cards > 1 ? 's' : ''
                }`" />
              <div v-if="player.red_cards > 0" class="w-4 h-6 bg-red-600 rounded-[2px]" :title="`${player.red_cards} Red Card${player.red_cards > 1 ? 's' : ''
                }`" />
              <span v-if="player.yellow_cards === 0 && player.red_cards === 0" class="text-sm">
                None
              </span>
            </div>
          </section>
        </div>

        <!-- transfers -->
        <div class="w-full">
          <ComparisonBar :comparison="{
            label: 'Transfers',
            homeWidth: inPercentage,
            homeTitle: 'In',
            homeValue: shortenNumber(player.transfers_in_event),
            awayWidth: outPercentage,
            awayTitle: 'Out',
            awayValue: shortenNumber(player.transfers_out_event),
          }" />
        </div>
      </div>
    </div>

    <div class="flex z-0 justify-center drop-shadow-lg">
      <!-- image -->
      <!-- <img
					:src="`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`"
					class="object-cover w-64 h-auto transition-transform duration-300 sm:z-20 sm:w-auto group-hover:scale-105"
					:alt="player.web_name"
					@error="console.log('error')"
				/> -->
      <img :src="`https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`"
        :alt="player.web_name"
        class="object-cover w-64 h-auto transition-transform duration-300 sm:z-20 sm:w-auto group-hover:scale-105"
        @error="
          (e) => {
            e.target.onerror = null;
            e.target.src = '/fallback.png';
          }
        " />
    </div>
    <div class="absolute right-2 bottom-2 left-2 z-30 px-4 py-2 rounded-lg shadow-lg text-slate-800 bg-slate-100/95">
      <div class="flex justify-evenly pb-1 border-b border-slate-300">
        <div class="text-xs text-right uppercase">
          <div class="opacity-50">Points</div>
          <div class="font-semibold lowercase">
            {{ player.event_points }}
          </div>
        </div>

        <div class="text-xs text-left uppercase">
          <div class="opacity-50">Goals</div>
          <div class="font-semibold lowercase">
            {{ player.goals_scored }}
          </div>
        </div>
      </div>
      <div class="flex justify-between pt-1">
        <div class="text-xs text-left uppercase">
          <div class="opacity-50">Played</div>
          <div class="font-semibold lowercase">{{ player.minutes }} min</div>
        </div>
        <div class="text-xs text-center uppercase">
          <div class="opacity-50">Form</div>
          <div class="font-semibold lowercase" :class="['form-value', getFormCategory(player.form)]">
            {{ player.form }}
          </div>
        </div>
        <div class="text-xs text-right uppercase">
          <div class="opacity-50">Selected by</div>
          <div class="font-semibold lowercase">
            {{ player.selected_by_percent }}%
          </div>
        </div>
      </div>
    </div>

    <button @click.prevent="handleSelected()"
      class="flex overflow-hidden absolute inset-x-0 bottom-12 left-1/2 z-50 gap-2 justify-center items-center px-4 py-2 mx-auto mt-3 mb-4 max-w-full text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-yellow-400 rounded-full shadow-lg transition-transform duration-200 -translate-x-1/2 shrink-0 hover:scale-105 hover:from-pink-600 hover:to-yellow-500 active:scale-95">
      <svg class="w-6 h-6 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"
        aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="2" fill="none" />
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="2" fill="none" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      </svg>
      <span class="">Preview</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  player: Object,
  data: Object,
  label: String,
});

const emit = defineEmits(["selected"]);

const handleSelected = () => {
  let playerData = props.player;
  playerData.team = teamName.value;
  emit("selected", playerData);
};

const teamName = computed(() => {
  const team = props.data.find((team) => team.id === props.player.team);
  return team ? team.name : "Unknown Team";
});

const inPercentage = computed(() =>
  totalTransfers.value === 0
    ? 50
    : (props.player.transfers_in_event / totalTransfers.value) * 100
);

const outPercentage = computed(() =>
  totalTransfers.value === 0
    ? 50
    : (props.player.transfers_out_event / totalTransfers.value) * 100
);

const totalTransfers = computed(
  () => props.player.transfers_in_event + props.player.transfers_out_event
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

const getFormCategory = (form) => {
  const formValue = parseFloat(form);
  if (formValue >= 5) return "good";
  if (formValue >= 3) return "average";
  return "bad";
};
</script>

<style scoped>
.form-value {
  padding: 2px 6px;
  border-radius: 4px;
}

.good {
  background-color: #4caf50;
  color: white;
}

.average {
  background-color: #ffa500;
  color: black;
}

.bad {
  background-color: #f44336;
  color: white;
}
</style>
