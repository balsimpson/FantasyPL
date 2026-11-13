<template>
  <section
    aria-labelledby="home-team-planner-title"
    class="grid overflow-hidden rounded-xl border border-lime-300/20 bg-[#141b18]"
    :class="landing || players.length ? 'md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]' : undefined"
  >
    <div class="min-w-0" :class="landing ? 'self-center px-5 py-8 sm:p-12' : 'px-4 py-5 sm:p-7'">
      <component
        :is="landing ? 'h1' : 'h2'"
        id="home-team-planner-title"
        class="font-bold tracking-tight text-white"
        :class="landing ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'"
      >
        {{ gameweek ? 'Plan for ' : 'Plan your FPL team' }}<span v-if="gameweek" class="text-lime-300">Gameweek {{ gameweek }}</span>
      </component>
      <p class="mt-2 text-sm leading-5 text-stone-300">Check your squad’s fixtures and see suggested lineups and transfers.</p>
      <HomeManagerLookup homepage class="mt-5 max-w-lg" />
    </div>

    <div
      v-if="landing || players.length"
      aria-hidden="true"
      class="pointer-events-none relative isolate overflow-hidden bg-linear-to-t from-lime-950 to-[#141b18] md:h-auto"
      :class="landing ? 'h-44 md:min-h-88' : 'h-29'"
    >
      <div class="absolute inset-x-[8%] top-[20%] bottom-[-65%] rotate-[-12deg] rounded-2xl border border-lime-300/20 bg-[repeating-linear-gradient(90deg,transparent_0_12.5%,#bef2640d_12.5%_25%)]">
        <div class="absolute inset-y-0 left-1/2 w-px bg-lime-300/20" />
        <div class="absolute left-1/2 top-1/3 size-20 -translate-x-1/2 rounded-full border border-lime-300/20 md:size-32" />
      </div>
      <div class="absolute inset-0 bg-linear-to-r from-[#141b18] via-transparent to-transparent" />
      <div v-if="players.length" class="absolute inset-0 flex items-end justify-center -space-x-6 md:-space-x-11">
        <PlayerPortrait v-if="players[1]" :player="players[1]" class="md:h-[80%] md:w-[36%]" :class="landing ? 'h-[84%] w-[29%]' : 'h-25 w-24'" />
        <PlayerPortrait :player="players[0]" class="z-10 md:h-[96%] md:w-[40%]" :class="landing ? 'h-full w-[34%]' : 'h-29 w-28'" />
        <PlayerPortrait v-if="players[2]" :player="players[2]" class="md:h-[80%] md:w-[36%]" :class="landing ? 'h-[84%] w-[29%]' : 'h-25 w-24'" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import HomeManagerLookup from "~/components/HomeManagerLookup.vue";
import PlayerPortrait from "~/components/PlayerPortrait.vue";
import type { ShortlistPlayer } from "~/utils/homepage-shortlist";

defineProps<{ gameweek?: number; players: ShortlistPlayer[]; landing?: boolean }>();
</script>
