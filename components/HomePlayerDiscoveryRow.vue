<template>
  <li>
    <NuxtLink
      :to="getPlayerRoute(player)"
      :aria-label="`Open ${player.web_name} profile`"
      class="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-3 rounded-lg px-2 py-4 transition hover:bg-white/[0.05] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
    >
      <span class="relative flex size-12 items-end justify-center overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,61,0.2),transparent_58%),linear-gradient(145deg,#1a2422,#0b1111)]">
        <span class="absolute left-1.5 top-1.5 z-20 inline-flex min-w-5 items-center justify-center rounded-full border border-white/15 bg-black/50 px-1 py-0.5 text-[0.62rem] font-black tabular-nums text-white backdrop-blur-sm">
          {{ rank }}
        </span>
        <img
          :src="playerImageSrc"
          :alt="player.web_name"
          width="44"
          height="56"
          loading="lazy"
          decoding="async"
          class="relative z-10 h-12 w-10 object-contain object-bottom drop-shadow-[0_10px_12px_rgba(0,0,0,0.45)] transition duration-300 motion-safe:group-hover:scale-105"
          @error="handlePlayerImageError"
        />
        <img
          v-if="teamBadgeSrc"
          :src="teamBadgeSrc"
          :alt="team?.name || 'Team badge'"
          width="20"
          height="20"
          loading="lazy"
          decoding="async"
          class="absolute bottom-1 right-1 z-20 size-5 rounded-full border border-black/50 bg-black/60 p-0.5 object-contain"
          @error="handleTeamBadgeError"
        />
      </span>

      <span class="min-w-0">
        <span class="flex flex-wrap items-center gap-2 text-sm font-semibold leading-5 text-white [overflow-wrap:anywhere] group-hover:text-primary">
          <span>{{ player.web_name }}</span><PlayerAge :player="player" compact class="text-stone-300" />
          <PlayerDisciplineBadges :yellow-cards="player.yellow_cards" :red-cards="player.red_cards" compact />
        </span>
        <span class="mt-1 block text-xs leading-5 text-stone-400 [overflow-wrap:anywhere]">
          {{ team?.name || "Team unavailable" }}
        </span>
        <span class="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs leading-5">
          <span class="text-stone-400">{{ positionLabel }}</span>

          <span class="font-semibold tabular-nums text-stone-200">{{ priceLabel }}</span>
        </span>
      </span>

      <span class="pt-0.5 text-right text-sm font-bold leading-5 tabular-nums text-white">
        {{ metricValue }}
        <span class="sr-only">{{ metricLabel }}</span>
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
  metricLabel: {
    type: String,
    required: true,
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
