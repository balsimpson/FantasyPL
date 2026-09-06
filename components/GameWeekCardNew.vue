<template>
  <section aria-labelledby="gameweek-recap-title" class="overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_top_left,rgba(200,255,61,0.12),transparent_60%),linear-gradient(135deg,#111317,#090a0d)] p-5 sm:p-7">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <h2 id="gameweek-recap-title" class="text-3xl font-black tracking-tight text-white sm:text-4xl">{{ gameweek.name || 'Gameweek' }} recap</h2>
      <span class="rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-xs font-semibold text-lime-200">{{ gameweek.finished ? 'Completed' : 'Current' }}</span>
    </header>

    <dl aria-label="Gameweek statistics" class="my-5 grid grid-cols-2 gap-x-5 gap-y-3 border-y border-white/10 py-4 sm:grid-cols-4 lg:grid-cols-7">
      <div v-for="stat in summaryStats" :key="stat.label" class="min-w-0">
        <dt class="flex min-h-8 items-end text-xs leading-4 text-stone-300">{{ stat.label }}</dt>
        <dd class="mt-2 font-serif text-2xl font-bold tabular-nums text-lime-200 sm:text-3xl">{{ shortenNumber(stat.value) }}</dd>
      </div>
    </dl>

    <div class="grid gap-y-5 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
      <component :is="captain.player ? NuxtLink : 'div'" v-for="captain in captains" :key="captain.label"
        :to="captain.player ? getPlayerRoute(captain.player) : undefined"
        class="group relative grid min-h-40 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 overflow-hidden pt-4 first:pt-0 sm:pt-0 sm:odd:pr-6 sm:even:pl-6 focus-visible:outline-2 focus-visible:outline-lime-300">
        <div class="relative z-10 col-start-2 row-start-1 min-w-0 py-4">
          <p class="text-sm text-stone-300">{{ captain.label }}</p>
          <h3 class="mt-2 text-2xl font-black tracking-tight text-white group-hover:text-lime-200 sm:text-3xl">{{ captain.player?.web_name || captain.name || 'Unavailable' }}</h3>
          <p v-if="captain.player" class="mt-3 text-sm text-stone-300">{{ captain.player.selected_by_percent }}% selected</p>
        </div>
        <img v-if="captain.player" :src="`https://resources.premierleague.com/premierleague25/photos/players/110x140/${captain.player.code}.png`" :alt="captain.player.web_name" width="132" height="168" loading="lazy" decoding="async" class="col-start-1 row-start-1 h-40 w-24 self-end object-contain object-bottom sm:w-32" @error="imageFallback" />
        <dl v-if="captain.player" class="col-span-2 grid grid-cols-3 gap-3 border-t border-white/10 py-3">
          <div>
            <dt class="text-xs text-stone-400">Season points</dt>
            <dd class="mt-1 font-serif text-xl font-bold text-white">{{ captain.player.total_points ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-stone-400">Form</dt>
            <dd class="mt-1 font-serif text-xl font-bold text-lime-200">{{ captain.player.form ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-xs text-stone-400">Price</dt>
            <dd class="mt-1 font-serif text-xl font-bold text-white">{{ captain.player.now_cost == null ? '—' : `£${(Number(captain.player.now_cost) / 10).toFixed(1)}m` }}</dd>
          </div>
        </dl>
      </component>
    </div>

  </section>
</template>

<script setup>
import { NuxtLink } from '#components';
import { getPlayerRoute } from '~/composables/usePlayerRoute';
const props = defineProps({ gameweek: { type: Object, required: true } });
const summaryStats = computed(() => [
  { label: 'Average points', value: props.gameweek.average_entry_score },
  { label: 'Highest points', value: props.gameweek.highest_score },
  { label: 'Transfers made', value: props.gameweek.transfers_made },
  ...(props.gameweek.chip_plays || []).map(chip => ({
    label: `${chipNames[chip.chip_name] || chip.chip_name} plays`,
    value: chip.num_played,
  })),
]);
const captains = computed(() => [
  { label: 'Most captained', player: props.gameweek.captainedPlayer, name: props.gameweek.mostCaptained },
  { label: 'Most vice-captained', player: props.gameweek.viceCaptainedPlayer, name: props.gameweek.mostViceCaptained },
]);
const chipNames = { wildcard: 'Wildcard', freehit: 'Free Hit', bboost: 'Bench Boost', '3xc': 'Triple Captain', manager: 'Assistant Manager' };
const shortenNumber = (value) => value == null ? '—' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const imageFallback = (event) => { event.target.onerror = null; event.target.src = '/fallback.png'; };
</script>
