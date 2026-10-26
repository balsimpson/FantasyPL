<template>
  <section aria-labelledby="manager-planner-title" class="min-w-0 space-y-2 xl:sticky xl:top-24">
    <header class="flex items-center justify-between gap-2">
      <h2 id="manager-planner-title" class="text-base font-bold text-white">{{ gameweeks.length === 1 ? 'Next gameweek' : `Next ${gameweeks.length || 5} gameweeks` }}</h2>
      <span class="text-xs text-stone-400">GW {{ publishedGameweek }} squad</span>
    </header>
    <div v-if="pending && !plans.length" role="status"><USkeleton class="h-20 w-full rounded-xl" /><span class="sr-only">Loading fixtures</span></div>
    <div v-else-if="error" class="space-y-2">
      <p class="text-sm text-stone-300">Fixtures could not load.</p>
      <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" @click="$emit('retry')">Retry fixtures</UButton>
    </div>
    <p v-else-if="!gameweeks.length" class="text-sm text-stone-400">No upcoming gameweeks.</p>
    <template v-else-if="selectedPlan">
      <div class="flex min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1 xl:flex-col xl:overflow-visible" role="group" aria-label="Choose a gameweek to preview on the pitch">
        <div v-for="plan in plans" :key="plan.gameweek" class="relative min-w-36 flex-1 shrink-0 snap-start xl:w-full xl:min-w-0">
        <button type="button"
          class="block w-full rounded-lg border px-3 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300 motion-reduce:transition-none"
          :class="selectedPlan.gameweek === plan.gameweek ? 'border-lime-300/60 bg-lime-300/10 text-lime-300' : 'border-white/10 text-stone-300'"
          :aria-pressed="selectedPlan.gameweek === plan.gameweek" :aria-label="`Preview GW ${plan.gameweek}. ${plan.hardFixtures} tough matchups. ${plan.rotations} lineup changes.`" @click="$emit('select', plan.gameweek)">
          <span class="block text-sm font-bold">GW {{ plan.gameweek }}</span>
          <span class="my-2 flex h-3 gap-0.5" :aria-label="`${plan.hardFixtures} published starters face tough opponents`"><span v-for="(tone, index) in weekBands[plan.gameweek] || []" :key="index" class="min-w-0 flex-1 rounded-sm" :class="bandColors[tone]" aria-hidden="true" /></span>
          <span class="mt-1 flex items-center gap-1 whitespace-nowrap pr-5 text-[0.65rem] leading-4 text-stone-400"><span>{{ plan.hardFixtures }} tough</span><span aria-hidden="true">·</span><span>{{ plan.canPreview ? `${plan.rotations} ${plan.rotations === 1 ? 'change' : 'changes'}` : 'Review squad' }}</span></span>
        </button>
        <button type="button" class="absolute bottom-1 right-1 grid size-7 place-items-center rounded text-stone-400 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-lime-300"
          :aria-label="`${fixturesOpen && selectedPlan.gameweek === plan.gameweek ? 'Hide' : 'Show'} GW ${plan.gameweek} fixtures`" :aria-expanded="fixturesOpen && selectedPlan.gameweek === plan.gameweek" aria-controls="manager-upcoming-fixtures" @click="toggleFixtures(plan.gameweek)">
          <UIcon name="i-lucide-chevron-down" class="size-3.5 transition-transform motion-reduce:transition-none" :class="fixturesOpen && selectedPlan.gameweek === plan.gameweek ? 'rotate-180' : ''" aria-hidden="true" />
        </button>
        </div>
      </div>
      <ManagerUpcomingFixtures :gameweek="selectedPlan.gameweek" :rows="rows" :expanded="fixturesOpen">
        <UButton color="neutral" variant="ghost" size="sm" icon="i-lucide-calendar-days" class="w-full justify-center" @click="tableOpen = true">Compare all 5 weeks</UButton>
      </ManagerUpcomingFixtures>
      <UModal v-model:open="tableOpen" title="Squad fixtures" :description="`GW ${gameweeks[0]}–${gameweeks.at(-1)}`" :ui="{ content: 'max-w-5xl bg-[#101216]', title: 'text-white', description: 'text-stone-400', overlay: 'bg-black/70' }">
        <template #body>
      <div id="manager-fixture-table" class="min-w-0 space-y-3">
        <p class="text-xs leading-5 text-stone-400">Scroll across to compare all five gameweeks. Difficulty runs from 1, easiest, to 5, hardest.</p>
        <div tabindex="0" role="region" aria-label="Squad fixtures for the next five gameweeks" class="max-h-[36rem] overflow-auto rounded-xl border border-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">
          <table class="w-full min-w-[52rem] border-separate border-spacing-0 text-left text-xs">
            <caption class="sr-only">All published squad players, their next five gameweek opponents and official fixture difficulty.</caption>
            <thead>
              <tr>
                <th scope="col" class="sticky left-0 top-0 z-30 w-44 border-b border-white/10 bg-[#101216] p-3 font-semibold text-stone-300">Player</th>
                <th v-for="week in gameweeks" :key="week" scope="col" class="sticky top-0 z-20 border-b border-white/10 bg-[#101216] p-3">
                  <button type="button" class="rounded px-1 py-1 font-semibold hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-lime-300" :class="selectedPlan.gameweek === week ? 'text-lime-300' : 'text-stone-300'" :aria-label="`Preview GW ${week} on the pitch`" @click="$emit('select', week)">GW {{ week }}</button>
                </th>
                <th scope="col" class="sticky top-0 z-20 border-b border-white/10 bg-[#101216] p-3 font-semibold text-stone-300">Run average</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.pick.element.id">
                <th scope="row" class="sticky left-0 z-10 border-b border-white/5 bg-[#101216] p-3 align-top font-normal">
                  <NuxtLink :to="getPlayerRoute(row.pick.element)" class="block font-semibold leading-5 text-white hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-lime-300 [overflow-wrap:anywhere]">{{ plannerPlayerName(row.pick.element) }}</NuxtLink>
                  <span class="mt-1 block text-[0.65rem] leading-4 text-stone-400">{{ row.pick.element_type }} · {{ row.pick.position > 11 ? 'Bench' : 'Starting XI' }}</span>
                </th>
                <td v-for="week in row.run" :key="week.gameweek" class="border-b border-white/5 p-2 align-top" :class="selectedPlan.gameweek === week.gameweek ? 'bg-white/[0.03]' : ''">
                  <p v-if="!week.matches.length" class="p-1 leading-5 text-stone-400">No scheduled match</p>
                  <ul v-else class="space-y-1">
                    <li v-for="match in week.matches" :key="match.id" class="rounded-md px-2 py-1.5" :class="difficultyClass(match.difficulty)" :title="`${match.opponent}, ${match.venue.toLowerCase()}. ${match.difficulty === null ? 'Difficulty unavailable' : `Difficulty ${match.difficulty} out of 5`}.`">
                      <span class="flex items-center justify-between gap-2 font-semibold leading-4"><span>{{ match.shortName }}</span><span class="tabular-nums">{{ match.difficulty === null ? '—' : match.difficulty }}<span class="sr-only"> out of 5 difficulty</span></span></span>
                      <span class="mt-0.5 block text-[0.65rem] opacity-80">{{ match.venue }}</span>
                    </li>
                  </ul>
                </td>
                <td class="border-b border-white/5 p-3 align-top tabular-nums text-stone-300">
                  {{ row.summary.averageDifficulty === null ? 'Unrated' : `${row.summary.averageDifficulty.toFixed(1)}/5` }}
                  <span class="mt-1 block text-[0.65rem] leading-4 text-stone-400">{{ row.summary.matches }} matches<span v-if="row.summary.blanks"> · {{ row.summary.blanks }} without a fixture</span></span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
        </template>
      </UModal>
    </template>
  </section>
</template>

<script setup>
import { getPlayerRoute } from '~/composables/usePlayerRoute';
import { plannerPlayerName } from '~/utils/manager-planner';
const props = defineProps({
  publishedGameweek: { type: Number, required: true }, gameweeks: { type: Array, default: () => [] },
  plans: { type: Array, default: () => [] }, rows: { type: Array, default: () => [] }, selectedPlan: { type: Object, default: null },
  pending: { type: Boolean, default: false }, error: { type: [Boolean, Object], default: false },
});
const emit = defineEmits(['select', 'retry']);
const tableOpen = ref(false);
const fixturesOpen = ref(false);
const toggleFixtures = (gameweek) => {
  fixturesOpen.value = props.selectedPlan?.gameweek === gameweek ? !fixturesOpen.value : true;
  emit('select', gameweek);
};
const bandColors = ['bg-lime-300', 'bg-amber-200', 'bg-rose-400', 'bg-stone-500', 'bg-sky-300'];
const weekBands = computed(() => Object.fromEntries(props.plans.map((plan) => [plan.gameweek,
  props.rows.filter((row) => Number(row.pick.position) <= 11).map((row) => {
    const matches = row.run.find((week) => week.gameweek === plan.gameweek)?.matches ?? [];
    if (!matches.length) return 3;
    if (matches.some((match) => match.difficulty === null)) return 4;
    if (matches.every((match) => match.difficulty <= 2)) return 0;
    return matches.every((match) => match.difficulty >= 4) ? 2 : 1;
  }).sort((a, b) => a - b),
])));
const difficultyClass = (difficulty) => difficulty === null ? 'bg-white/5 text-stone-300' : difficulty <= 2 ? 'bg-lime-300/10 text-lime-200' : difficulty === 3 ? 'bg-amber-200/10 text-amber-100' : 'bg-rose-300/10 text-rose-200';
</script>
