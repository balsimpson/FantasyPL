<template>
  <div class="h-full">
    <NuxtLink :to="getPlayerRoute(player)" class="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300" :aria-label="`Open ${player.web_name} profile`">
      <UCard
        :ui="{ body: 'h-full p-4', root: 'ring-0' }"
        class="relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 text-stone-50 transition duration-300 hover:-translate-y-1"
      >
        <div
          class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,255,61,0.14),transparent_30%),radial-gradient(circle_at_110%_18%,rgba(72,214,255,0.1),transparent_24%),linear-gradient(135deg,#111317_0%,#090a0d_100%)]"
        />

        <div class="relative z-10 flex h-full flex-1 flex-col" :class="compact ? 'gap-3' : 'gap-4'">
          <header class="flex items-start justify-between gap-4">
            <div class="min-w-0 space-y-3">
              <h2 class="font-black leading-none tracking-tight text-balance text-white" :class="compact ? 'text-[1.75rem]' : 'text-[2rem]'">
                {{ player.web_name }}
              </h2>
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 shrink-0">
                  <img
                    :src="`https://resources.premierleague.com/premierleague/badges/t${teamCode}.png`"
                    :alt="teamName"
                    width="40" height="40" loading="lazy" decoding="async"
                    class="h-full w-full object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]"
                  />
                </div>
                <p class="min-w-0 text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-stone-300">
                  {{ teamName }} <br /> {{ elementType }}
                </p>
              </div>
            </div>

            <div class="shrink-0 space-y-3 text-right">
              <div v-if="yellowCards || redCards" class="flex items-center justify-end gap-2 text-[0.68rem] uppercase tracking-[0.1em] text-stone-400">
                <span class="inline-flex h-8 w-6 items-center justify-center rounded-sm bg-yellow-300 font-black text-black">
                  {{ yellowCards }}
                </span>
                <span class="inline-flex h-8 w-6 items-center justify-center rounded-sm bg-rose-500 font-black text-white">
                  {{ redCards }}
                </span>
              </div>

              <div class="font-serif text-[1.9rem] font-black leading-none tracking-[-0.04em] text-white">
                £{{ formatCost(player.now_cost) }}<span class="ml-0.5 text-sm font-semibold tracking-[0.2em] text-stone-300">m</span>
              </div>
            </div>
          </header>

          <section class="grid gap-4">
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-2xl border border-white/10 bg-white/[0.05] px-2 py-2 text-center">
                <div class="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-stone-400">Points</div>
                <div class="mt-1 font-serif text-[1.3rem] font-black leading-none tracking-[-0.04em] text-white">
                  {{ playerPoints }}
                </div>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/[0.05] px-2 py-2 text-center">
                <div class="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-stone-400">Goals</div>
                <div class="mt-1 font-serif text-[1.3rem] font-black leading-none tracking-[-0.04em] text-white">
                  {{ player.goals_scored }}
                </div>
              </div>
              <div class="rounded-2xl border px-2 py-2 text-center transition-colors" :class="formTileClass">
                <div class="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-stone-400">Form</div>
                <div class="mt-1 font-serif text-[1.3rem] font-black leading-none tracking-[-0.04em]" :class="formValueClass">
                  {{ player.form }}
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-stone-400">
                <span>GW transfers</span>
                <span>{{ formatCompact(totalTransfers) }} total</span>
              </div>
              <div class="mt-2 flex h-2 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]">
                <div class="h-full bg-lime-300" :style="{ width: `${inPercentage}%` }"></div>
                <div class="h-full bg-rose-500" :style="{ width: `${outPercentage}%` }"></div>
              </div>
              <div class="mt-2 flex justify-between text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-stone-300">
                <span>In {{ formatCompact(player.transfers_in_event) }}</span>
                <span>Out {{ formatCompact(player.transfers_out_event) }}</span>
              </div>
            </div>
          </section>

          <div class="mt-auto">
          <div class="relative flex items-end justify-center overflow-hidden" :class="compact ? 'h-44 sm:h-52' : 'h-[22rem] sm:h-[24rem]'">
            <div class="absolute inset-x-[10%] top-[16%] h-[70%] rounded-[999px] bg-lime-300/14 blur-3xl"></div>
            <img
              :src="playerImageSrc"
              :alt="player.web_name"
              width="220" height="280" loading="lazy" decoding="async"
              class="relative z-10 h-full w-full max-w-[28rem] origin-bottom object-contain object-bottom drop-shadow-[0_24px_36px_rgba(0,0,0,0.5)] transition duration-300 group-hover:scale-[1.015]"
              @error="handleImageError"
            />
          </div>

          <footer class="grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-stone-300">
            <div class="space-y-1">
              <span class="block">Minutes</span>
              <span class="block font-serif text-[1.15rem] font-black leading-none tracking-[-0.04em] normal-case text-white">
                {{ player.minutes }}
              </span>
            </div>
            <div class="space-y-1">
              <span class="block">Selected</span>
              <span class="block font-serif text-[1.15rem] font-black leading-none tracking-[-0.04em] normal-case text-white">
                {{ formatPercent(player.selected_by_percent) }}
              </span>
            </div>
            <div class="space-y-1">
              <span class="block">Assists</span>
              <span class="block font-serif text-[1.15rem] font-black leading-none tracking-[-0.04em] normal-case text-white">
                {{ player.assists }}
              </span>
            </div>
          </footer>
          </div>
        </div>
      </UCard>
    </NuxtLink>
  </div>
</template>

<script setup>
import { getPlayerRoute } from "~/composables/usePlayerRoute";

const props = defineProps({
  compact: Boolean,
  player: {
    type: Object,
    required: true,
  },
  data: {
    type: Array,
    default: () => [],
  },
});

const teamCode = computed(() => props.player.team_code || props.data?.find((team) => team.id === props.player.team)?.code);

const teamName = computed(() => {
  const team = props.data?.find((item) => item.id === props.player.team);
  return team?.name || 'Unknown Team';
});

const elementTypeMap = {
  1: 'Goalkeeper',
  2: 'Defender',
  3: 'Midfielder',
  4: 'Forward',
};

const elementType = computed(() => elementTypeMap[props.player.element_type] || 'Unknown');

const yellowCards = computed(() => Number(props.player.yellow_cards || 0));
const redCards = computed(() => Number(props.player.red_cards || 0));

const playerPoints = computed(() => Number(props.player.total_points ?? props.player.event_points ?? 0));

const formValue = computed(() => Number(props.player.form || 0));

const formCategory = computed(() => {
  if (formValue.value >= 5) return 'good';
  if (formValue.value >= 3) return 'average';
  return 'bad';
});

const formTileClass = computed(() => {
  if (formCategory.value === 'good') return 'border-lime-300/40 bg-lime-400/10';
  if (formCategory.value === 'average') return 'border-amber-300/40 bg-amber-400/10';
  return 'border-rose-300/40 bg-rose-400/10';
});

const formValueClass = computed(() => {
  if (formCategory.value === 'good') return 'text-lime-200';
  if (formCategory.value === 'average') return 'text-amber-200';
  return 'text-rose-200';
});

const totalTransfers = computed(
  () => Number(props.player.transfers_in_event || 0) + Number(props.player.transfers_out_event || 0)
);

const inPercentage = computed(() =>
  totalTransfers.value === 0
    ? 50
    : (Number(props.player.transfers_in_event || 0) / totalTransfers.value) * 100
);

const outPercentage = computed(() =>
  totalTransfers.value === 0
    ? 50
    : (Number(props.player.transfers_out_event || 0) / totalTransfers.value) * 100
);

const playerImageSrc = computed(
  () => `https://resources.premierleague.com/premierleague25/photos/players/110x140/${props.player.code}.png`
);

const formatCompact = (value) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
};

const formatCost = (value) => {
  const number = Number(value || 0) / 10;

  return number % 1 === 0 ? number.toFixed(0) : number.toFixed(1);
};

const formatPercent = (value) => {
  const number = Number(value || 0);

  return number % 1 === 0 ? `${number.toFixed(0)}%` : `${number.toFixed(1)}%`;
};

const handleImageError = (event) => {
  const target = event?.target;

  if (!target) return;

  target.onerror = null;
  target.src = '/fallback.png';
};
</script>
