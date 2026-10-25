<template>
  <li>
    <NuxtLink
      :to="getPlayerRoute(player)"
      :aria-label="`Open ${player.web_name} profile`"
      class="group grid rounded-lg px-2 transition hover:bg-white/[0.05] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      :class="compact ? 'items-center grid-cols-[4.5rem_minmax(0,1fr)_auto] gap-3 py-2.5' : 'items-start grid-cols-[3rem_minmax(0,1fr)_auto] gap-3 py-4'"
    >
      <span class="relative flex items-end justify-center overflow-visible" :class="compact ? 'h-[4.75rem] w-[4.25rem]' : 'size-12'">
        <span class="relative flex h-full w-full items-end justify-center overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,61,0.2),transparent_58%),linear-gradient(145deg,#1a2422,#0b1111)]">
          <span v-if="compact" aria-hidden="true" class="absolute inset-x-2 top-2 h-px bg-gradient-to-r from-transparent via-lime-200/60 to-transparent" />
          <span v-else class="absolute left-1.5 top-1.5 z-20 inline-flex min-w-5 items-center justify-center rounded-full border border-white/15 bg-black/50 px-1 py-0.5 text-[0.62rem] font-black tabular-nums text-white backdrop-blur-sm">
            {{ rank }}
          </span>
          <img
            :src="playerImageSrc"
            :alt="player.web_name"
            :width="compact ? 68 : 44"
            :height="compact ? 76 : 56"
            loading="lazy"
            decoding="async"
            class="relative z-10 h-full w-full object-contain object-bottom drop-shadow-[0_10px_12px_rgba(0,0,0,0.45)] transition duration-300 motion-safe:group-hover:scale-105"
            @error="handlePlayerImageError"
          />
        </span>
        <PlayerDisciplineBadges
          v-if="compact"
          :yellow-cards="player.yellow_cards"
          :red-cards="player.red_cards"
          compact
          class="absolute -right-1 -top-1 z-30"
        />
        <span v-if="compact" class="absolute -left-1 -top-1 z-30 inline-flex size-5 items-center justify-center rounded-full border border-white/30 bg-[#101615] text-[0.62rem] font-black tabular-nums text-white shadow-sm">
          {{ rank }}
        </span>
        <img
          v-if="teamBadgeSrc"
          :src="teamBadgeSrc"
          :alt="team?.name || 'Team badge'"
          width="20"
          height="20"
          loading="lazy"
          decoding="async"
          class="absolute z-30 object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.55)]"
          :class="compact ? '-bottom-1 -right-1 size-8 bg-transparent p-0.5' : 'bottom-1 right-1 size-5 rounded-full border border-black/50 bg-black/60 p-0.5'"
          @error="handleTeamBadgeError"
        />
      </span>

      <span class="min-w-0">
        <span class="flex flex-wrap items-center gap-2 text-sm font-semibold leading-5 text-white [overflow-wrap:anywhere] group-hover:text-primary">
          <span>{{ player.web_name }}</span><PlayerAge :player="player" compact class="text-stone-300" />
          <PlayerDisciplineBadges v-if="!compact" :yellow-cards="player.yellow_cards" :red-cards="player.red_cards" compact />
        </span>
        <span v-if="compact" class="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs leading-5 [overflow-wrap:anywhere]">
          <span class="text-stone-400">{{ team?.name || "Team unavailable" }}</span>
          <span aria-hidden="true" class="text-stone-600">·</span>
          <span :class="positionColorClass">{{ positionLabel }}</span>
        </span>
        <span v-else>
          <span class="mt-1 block text-xs leading-5 text-stone-400 [overflow-wrap:anywhere]">
            {{ team?.name || "Team unavailable" }}
          </span>
          <span class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs leading-5">
            <span class="inline-flex items-center text-stone-400">{{ positionLabel }}</span>
            <span class="font-semibold tabular-nums text-stone-200">{{ priceLabel }}</span>
          </span>
        </span>
      </span>

      <span :title="metricTitle || undefined" class="font-sans" :class="compact ? 'min-w-[3.75rem] text-center' : 'pt-0.5 text-right text-lg font-bold leading-6 tabular-nums text-white'">
        <span v-if="compact" class="flex items-center justify-end gap-1 border-b border-lime-100/25 pb-1 text-lg leading-6 text-lime-100">
          <span class="font-bold tabular-nums">{{ metricValue }}</span>
          <span v-if="metricUnit" class="text-[0.62rem] font-semibold">{{ metricUnit }}</span>
        </span>
        <span v-else class="block font-bold tabular-nums">{{ metricValue }}</span>
        <span v-if="compact" class="mt-1 block text-sm font-semibold leading-5 tabular-nums text-white">{{ priceLabel }}</span>
        <span v-else class="sr-only">{{ metricLabel }}</span>
      </span>
    </NuxtLink>
  </li>
</template>

<script setup>
import { getPlayerRoute } from "~/composables/usePlayerRoute";

const props = defineProps({
  player: {
    type: Object,
    required: true,
  },
  team: {
    type: Object,
    default: null,
  },
  rank: {
    type: Number,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  metricLabel: {
    type: String,
    required: true,
  },
  metricUnit: {
    type: String,
    default: "",
  },
  metricTitle: {
    type: String,
    default: "",
  },
  metricValue: {
    type: String,
    required: true,
  },
});

const positionLabel = computed(() => {
  const labels = {
    1: "Goalkeeper",
    2: "Defender",
    3: "Midfielder",
    4: "Forward",
  };

  return labels[props.player.element_type] || "Position unavailable";
});

const positionColorClass = computed(() => ({
  1: "text-amber-300",
  2: "text-sky-300",
  3: "text-lime-300",
  4: "text-rose-300",
}[props.player.element_type] || "text-stone-400"));

const priceLabel = computed(() => `£${(Number(props.player.now_cost || 0) / 10).toFixed(1)}m`);

const playerImageSrc = computed(() =>
  props.player.code
    ? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${props.player.code}.png`
    : "/fallback.png",
);

const teamBadgeSrc = computed(() =>
  props.team?.code ? `https://resources.premierleague.com/premierleague/badges/t${props.team.code}.png` : null,
);

const handlePlayerImageError = (event) => {
  const target = event?.target;
  if (!target || target.src.endsWith("/fallback.png")) return;
  target.onerror = null;
  target.src = "/fallback.png";
};

const handleTeamBadgeError = (event) => {
  const target = event?.target;
  if (!target) return;
  target.onerror = null;
  target.remove();
};
</script>
