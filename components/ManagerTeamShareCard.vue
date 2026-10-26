<script setup>
import { plannerPlayerName } from '~/utils/manager-planner';
import { getManagerOgTheme } from '~/utils/manager-og-image';

const props = defineProps({
  manager: { type: Object, required: true },
  squad: { type: Object, required: true },
});
const managerName = computed(() => [props.manager.player_first_name, props.manager.player_last_name].filter(Boolean).join(' '));
const theme = computed(() => getManagerOgTheme(props.manager.id));
const positions = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'];
const formation = computed(() => ['Defender', 'Midfielder', 'Forward'].map(position => props.squad.groupedByType[position]?.length ?? 0).join('–'));
const number = value => value == null || value === '' || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('en-GB');
const stats = computed(() => [
  { label: 'Gameweek points', value: props.manager.summary_event_points },
  { label: 'Season points', value: props.manager.summary_overall_points },
  { label: 'Overall rank', value: props.manager.summary_overall_rank },
]);
</script>

<template>
  <div class="flex h-[960px] w-[540px] flex-col gap-4 bg-[var(--share-canvas)] p-6 font-sans text-[var(--share-ink)]" :style="{ '--share-canvas': theme.canvas, '--share-ink': theme.ink, '--share-paper': theme.paper }">
    <header class="shrink-0">
      <div class="mb-4 flex items-center justify-between text-sm font-semibold">
        <span class="font-black">FPL Insights</span>
        <span class="rounded-full bg-[var(--share-ink)] px-3 py-1 text-[var(--share-paper)]">GW {{ manager.current_event }}</span>
      </div>
      <h2 class="font-black leading-tight tracking-tight [overflow-wrap:anywhere]" :class="manager.name.length > 30 ? 'text-[28px]' : 'text-[38px]'">{{ manager.name }}</h2>
      <p class="mt-1 text-sm [overflow-wrap:anywhere]">{{ managerName }} · Manager ID {{ manager.id }}</p>
      <dl class="mt-4 grid grid-cols-3 items-end gap-3 border-y border-current/20 py-3">
        <div v-for="stat in stats" :key="stat.label">
          <dt class="text-[11px]">{{ stat.label }}</dt>
          <dd class="mt-1 font-black leading-none tracking-tight tabular-nums" :class="stat.label === 'Gameweek points' ? 'text-[42px]' : 'text-[26px]'">{{ number(stat.value) }}</dd>
        </div>
      </dl>
    </header>
    <section class="relative isolate grid min-h-0 flex-1 grid-rows-4 gap-2 pt-1 text-white">
      <ManagerPitchSurface compact />
      <div v-for="position in positions" :key="position" class="relative flex items-end justify-evenly gap-1" :class="position === 'Forward' ? 'mx-auto w-[90%]' : ''">
        <div v-for="pick in squad.groupedByType[position] || []" :key="pick.element.id" class="flex w-[90px] min-w-0 flex-col items-center">
          <div class="relative h-[82px] w-full">
            <PlayerPortrait :player="pick.element" exportable />
            <span v-if="pick.is_captain || pick.is_vice_captain" class="absolute right-0 top-1 grid size-5 place-items-center rounded-full text-[10px] font-black" :class="pick.is_captain ? 'bg-lime-300 text-lime-950' : 'bg-amber-200 text-stone-950'">{{ pick.is_captain ? 'C' : 'V' }}</span>
          </div>
          <p class="relative w-full rounded-t-md bg-[#0a1c16] px-1 py-1 text-center text-[11px] font-bold leading-[13px] [overflow-wrap:anywhere]">{{ plannerPlayerName(pick.element) }}</p>
          <p class="w-full rounded-b-md bg-[#07140f] py-1 text-center text-[10px] tabular-nums text-lime-300">{{ number(pick.element.total_points) }} pts</p>
        </div>
      </div>
    </section>
    <section class="shrink-0 border-t border-current/20 pt-3">
      <div class="mb-2 flex items-center justify-between text-[11px]"><h3 class="font-bold">Bench</h3><span>Season points under players · {{ formation }}</span></div>
      <div class="grid grid-cols-4 items-start gap-3">
        <div v-for="pick in squad.bench" :key="pick.element.id" class="min-w-0 text-center">
          <div class="h-[64px]"><PlayerPortrait :player="pick.element" exportable /></div>
          <p class="text-[11px] font-bold leading-[13px] [overflow-wrap:anywhere]">{{ plannerPlayerName(pick.element) }}</p>
          <p class="mt-1 text-[10px] tabular-nums">{{ number(pick.element.total_points) }} pts</p>
        </div>
      </div>
    </section>
    <footer class="flex shrink-0 items-center justify-between pt-1 text-[11px]"><span>Published squad · GW {{ manager.current_event }}</span><span class="font-black">sportsync.in</span></footer>
  </div>
</template>
