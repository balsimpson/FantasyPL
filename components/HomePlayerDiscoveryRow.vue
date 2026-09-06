<template>
  <li>
    <NuxtLink
      :to="getPlayerRoute(player)"
      :aria-label="`Open ${player.web_name} profile`"
      class="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 px-3 py-3.5 transition hover:bg-white/[0.05] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:grid-cols-[3.5rem_minmax(0,1fr)_5rem_8rem] sm:px-4"
    >
      <span class="relative flex h-14 w-14 items-end justify-center overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(circle_at_50%_0%,rgba(200,255,61,0.2),transparent_58%),linear-gradient(145deg,#1a2422,#0b1111)]">
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
          class="relative z-10 h-14 w-11 object-contain object-bottom drop-shadow-[0_10px_12px_rgba(0,0,0,0.45)] transition duration-300 group-hover:scale-105"
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
        <span class="block truncate text-base font-semibold text-white group-hover:text-primary">
          {{ player.web_name }}
        </span>
        <span class="mt-1 block truncate text-sm text-stone-400">
          {{ team?.name || "Team unavailable" }} · {{ positionLabel }}
        </span>
        <span class="mt-2 flex min-w-0 items-baseline justify-between gap-2 sm:hidden">
          <span class="shrink-0 text-sm font-semibold tabular-nums text-stone-200">{{ priceLabel }}</span>
          <span class="min-w-0 truncate text-right text-sm font-bold tabular-nums text-white">
            {{ metricValue }} <span class="font-medium text-stone-500">{{ metricLabel }}</span>
          </span>
        </span>
      </span>

      <span class="hidden text-right text-sm font-semibold tabular-nums text-stone-200 sm:block">
        {{ priceLabel }}
      </span>

      <span class="hidden min-w-0 text-right text-base font-bold tabular-nums text-white sm:block">
        {{ metricValue }}
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
