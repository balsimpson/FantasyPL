<template>
  <div v-if="loading" class="grid gap-6 lg:grid-cols-2" role="status" aria-label="Loading player fixtures and history">
    <USkeleton v-for="index in 2" :key="index" class="h-64 rounded-lg" />
  </div>
  <section v-else-if="error" aria-label="Player fixtures and history" class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-6">
    <p class="text-sm text-stone-400">Fixtures and match history are temporarily unavailable.</p>
    <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
  </section>
  <div v-else class="grid min-w-0 gap-x-10 gap-y-8 lg:grid-cols-2">
    <section aria-labelledby="profile-fixtures-title" class="min-w-0">
      <header class="flex items-baseline justify-between gap-3 border-b border-white/10 pb-4">
        <h2 id="profile-fixtures-title" class="text-xl font-semibold tracking-tight text-white sm:text-2xl">Next fixtures</h2>
        <span class="text-xs tabular-nums text-stone-400">{{ fixtures.length }} scheduled</span>
      </header>
      <div id="profile-fixtures" class="divide-y divide-white/10">
        <PlayerFixtureCard v-for="fixture in visibleFixtures" :key="fixture.id" :fixture="fixture" :bootstrap="bootstrap" />
      </div>
      <p v-if="!fixtures.length" class="py-6 text-sm text-stone-400">No upcoming fixtures available.</p>
      <UButton v-if="fixtures.length > 5" color="neutral" variant="link" class="min-h-11 px-0 text-lime-200" :aria-expanded="showAllFixtures" aria-controls="profile-fixtures" @click="showAllFixtures = !showAllFixtures">
        {{ showAllFixtures ? 'Show fewer fixtures' : `View all ${fixtures.length} fixtures` }}
        <UIcon :name="showAllFixtures ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4" aria-hidden="true" />
      </UButton>
    </section>
    <section aria-labelledby="profile-history-title" class="min-w-0">
      <header class="flex items-baseline justify-between gap-3 border-b border-white/10 pb-4">
        <h2 id="profile-history-title" class="text-xl font-semibold tracking-tight text-white sm:text-2xl">Recent matches</h2>
        <span class="text-xs tabular-nums text-stone-400">{{ history.length }} recorded</span>
      </header>
      <div id="profile-history" class="divide-y divide-white/10">
        <PlayerHistoryCard v-for="match in visibleHistory" :key="match.fixture" :history="match" :bootstrap="bootstrap" />
      </div>
      <p v-if="!history.length" class="py-6 text-sm text-stone-400">No recent match data available.</p>
      <UButton v-if="history.length > 5" color="neutral" variant="link" class="min-h-11 px-0 text-lime-200" :aria-expanded="showAllHistory" aria-controls="profile-history" @click="showAllHistory = !showAllHistory">
        {{ showAllHistory ? 'Show fewer matches' : `View all ${history.length} matches` }}
        <UIcon :name="showAllHistory ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="size-4" aria-hidden="true" />
      </UButton>
    </section>
    <section aria-labelledby="profile-seasons-title" class="min-w-0 lg:col-span-2">
      <h2 id="profile-seasons-title" class="border-b border-white/10 pb-4 text-xl font-semibold tracking-tight text-white sm:text-2xl">Previous seasons</h2>
      <div class="divide-y divide-white/10">
        <PlayerSeasonCard v-for="season in seasons" :key="season.season_name" :season="season" />
      </div>
      <p v-if="!seasons.length" class="py-6 text-sm text-stone-400">No past season data available.</p>
    </section>
  </div>
</template>

<script setup>
const props = defineProps({
  playerId: { type: [String, Number], required: true },
  details: { type: Object, default: null },
  bootstrap: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
});
defineEmits(["retry"]);
const showAllFixtures = ref(false);
const showAllHistory = ref(false);
watch(() => props.playerId, () => {
  showAllFixtures.value = false;
  showAllHistory.value = false;
});
const fixtures = computed(() => props.details?.fixtures || []);
const history = computed(() => [...(props.details?.history || [])].reverse());
const seasons = computed(() => [...(props.details?.history_past || [])].reverse());
const visibleFixtures = computed(() => showAllFixtures.value ? fixtures.value : fixtures.value.slice(0, 5));
const visibleHistory = computed(() => showAllHistory.value ? history.value : history.value.slice(0, 5));
</script>
