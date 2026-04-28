<template>
  <div class="mx-auto mt-6 h-full w-full  ">
    <UCard :ui="{ body: 'p-4', root: 'ring-0' }"
      class="relative h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950 text-stone-50 shadow-2xl transition duration-300 hover:-translate-y-1">
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,255,61,0.14),transparent_30%),radial-gradient(circle_at_110%_18%,rgba(72,214,255,0.1),transparent_24%),linear-gradient(135deg,#111317_0%,#090a0d_100%)]">
      </div>
      <div
        class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:5px_5px] opacity-10">
      </div>

      <div class="relative z-10 flex h-full flex-col gap-4 p-3">
        <header class="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-stone-300">
                Gameweek
              </p>
              <span v-if="gameweek.is_current"
                class="inline-flex items-center rounded-full border border-lime-300/30 bg-lime-300/10 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.24em] text-lime-200">
                Current
              </span>
            </div>
            <h2 class="mt-1 text-[2rem] font-black leading-[0.92] tracking-tight text-white text-balance">
              {{ gameweek.name }}
            </h2>
          </div>

          <div class="shrink-0 text-right">
            <div class="text-[0.54rem] font-semibold uppercase tracking-[0.32em] text-stone-400">
              Transfers
            </div>
            <div class="mt-1 font-serif text-[1.9rem] font-black leading-none tracking-[-0.06em] text-white">
              {{ shortenNumber(gameweek.transfers_made) }}
            </div>
          </div>
        </header>


        <div class="flex justify-between">
          <div class="space-y-2 lg:pr-4">
            <p class="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-stone-400">
              Most Captained
            </p>
            <div class="relative w-full overflow-hidden rounded-[22px]">
              <div class="absolute inset-x-[8%] top-[16%] h-[72%] rounded-[999px] bg-lime-300/14 blur-3xl"></div>
              <img :src="captainImageSrc" :alt="`Most captained player: ${gameweek.mostCaptained}`"
                class="relative z-10 mx-auto h-44 w-full max-w-[24rem] object-contain drop-shadow-[0_24px_36px_rgba(0,0,0,0.5)] transition duration-300"
                loading="lazy" @error="(e) => handleImageError(e, gameweek.mostCaptainedPlayerCode)" />
            </div>
            <p class="text-[0.95rem] font-bold leading-tight text-white text-center text-balance">
              {{ gameweek.mostCaptained }}
            </p>
          </div>





          <div
            class="hidden px-8 md:flex flex-col justify-center gap-3 border-y border-white/10 py-4 lg:border-y-0 lg:border-x lg:px-4 lg:py-0">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-[0.54rem] font-semibold uppercase tracking-[0.32em] text-stone-500">
                  Deadline
                </p>
                <p class="mt-1 font-serif text-[1.35rem] font-black leading-none tracking-[-0.05em] text-white">
                  {{ getRemainingTime(gameweek.deadline_time) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-[0.54rem] font-semibold uppercase tracking-[0.32em] text-stone-500">
                  Transfers
                </p>
                <p class="mt-1 font-serif text-[1.35rem] font-black leading-none tracking-[-0.05em] text-white">
                  {{ shortenNumber(gameweek.transfers_made) }}
                </p>
              </div>
            </div>

            <div v-if="gameweek.chip_plays && gameweek.chip_plays.length">
              <div class="h-px w-full bg-white/10"></div>
              <div class="mt-3 flex flex-wrap gap-2">
                <span v-for="chip in gameweek.chip_plays" :key="chip.chip_name"
                  class="inline-flex items-center rounded-full border border-white/10 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-stone-300">
                  {{ chip.chip_name }}: {{ shortenNumber(chip.num_played) }}
                </span>
              </div>
            </div>
          </div>




          <div class="space-y-2 lg:pl-4">
            <p class="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-stone-400">
              Most Vice Captained
            </p>
            <div class="relative w-full overflow-hidden rounded-[22px]">
              <div class="absolute inset-x-[8%] top-[16%] h-[72%] rounded-[999px] bg-sky-300/14 blur-3xl"></div>
              <img :src="viceCaptainImageSrc" :alt="`Most vice-captained player: ${gameweek.mostViceCaptained}`"
                class="relative z-10 mx-auto h-44 w-full max-w-[24rem] object-contain drop-shadow-[0_24px_36px_rgba(0,0,0,0.5)] transition duration-300"
                loading="lazy" @error="(e) => handleImageError(e, gameweek.mostViceCaptainedPlayerCode)" />
            </div>
            <p class="text-[0.95rem] font-bold leading-tight text-white text-center text-balance">
              {{ gameweek.mostViceCaptained }}
            </p>
          </div>
        </div>

        <section class="md:hidden grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.12fr)_minmax(0,0.92fr)]">


          <div
            class="flex flex-col justify-center gap-3 border-y border-white/10 py-4 lg:border-y-0 lg:border-x lg:px-4 lg:py-0">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-[0.54rem] font-semibold uppercase tracking-[0.32em] text-stone-500">
                  Deadline
                </p>
                <p class="mt-1 font-serif text-[1.35rem] font-black leading-none tracking-[-0.05em] text-white">
                  {{ getRemainingTime(gameweek.deadline_time) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-[0.54rem] font-semibold uppercase tracking-[0.32em] text-stone-500">
                  Transfers
                </p>
                <p class="mt-1 font-serif text-[1.35rem] font-black leading-none tracking-[-0.05em] text-white">
                  {{ shortenNumber(gameweek.transfers_made) }}
                </p>
              </div>
            </div>

            <div v-if="gameweek.chip_plays && gameweek.chip_plays.length">
              <div class="h-px w-full bg-white/10"></div>
              <div class="mt-3 flex flex-wrap gap-2">
                <span v-for="chip in gameweek.chip_plays" :key="chip.chip_name"
                  class="inline-flex items-center rounded-full border border-white/10 px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-stone-300">
                  {{ chip.chip_name }}: {{ shortenNumber(chip.num_played) }}
                </span>
              </div>
            </div>
          </div>

        </section>
      </div>
    </UCard>
  </div>
</template>

<script setup>
const props = defineProps({
  gameweek: {
    type: Object,
    required: true,
  },
});

const captainImageSrc = computed(
  () =>
    `https://resources.premierleague.com/premierleague/photos/players/250x250/p${props.gameweek.mostCaptainedPlayerCode}.png`
);

const viceCaptainImageSrc = computed(
  () =>
    `https://resources.premierleague.com/premierleague/photos/players/250x250/p${props.gameweek.mostViceCaptainedPlayerCode}.png`
);

function handleImageError(e, code) {
  const img = e.target;
  img.onerror = null;
  img.src = `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`;
  img.style.transform = "scale(1.45)";
  img.style.objectFit = "contain";
}

function shortenNumber(n) {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function getRemainingTime(deadline) {
  if (!deadline) return "-";
  const now = Date.now();
  const then = new Date(deadline).getTime();
  if (isNaN(then)) return deadline;
  const diff = then - now;
  if (diff <= 0) return "Passed";
  const hrs = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hrs > 24) {
    const days = Math.floor(hrs / 24);
    return `${days}d ${hrs % 24}h`;
  }
  return `${hrs}h ${mins}m`;
}
</script>

<style scoped>
img {
  filter: drop-shadow(0 18px 20px rgba(0, 0, 0, 0.45));
  transform-origin: center;
  transition: transform 160ms ease;
}
</style>
