<template>
  <section
    class="p-5 mt-6 bg-gradient-to-br from-[#4B0082] to-[#7300c5] rounded-lg shadow-lg"
  >
    <div class="flex items-center justify-center">
      <div class="hidden sm:block">
        <img
          :src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${gameweek.mostCaptainedPlayerCode}.png`"
          :alt="`Most captained player: ${gameweek.mostCaptained}`"
          class="object-contain w-full h-full rounded-md"
          loading="lazy"
          @error="(e) => handleImageError(e, gameweek.mostCaptainedPlayerCode)"
        />
        <div
          class="px-3 py-2 mb-2 text-center rounded-lg bg-white/80 backdrop-blur-sm"
        >
          <div class="text-xs font-semibold sm:text-sm text-slate-700">
            Most Captained
          </div>
          <div
            class="text-base font-bold leading-tight sm:text-xl text-slate-900"
          >
            {{ gameweek.mostCaptained }}
          </div>
        </div>
      </div>
      <!-- Center content -->
      <div class="text-center">
        <div class="flex flex-col items-center justify-center space-y-2">
          <h2
            class="text-lg font-extrabold tracking-tight text-purple-100 md:text-2xl lg:text-3xl"
          >
            {{ gameweek.name }}
          </h2>
          <span
            v-if="gameweek.is_current"
            class="px-3 py-1 text-xs font-semibold text-teal-800 bg-teal-200 rounded-full md:text-sm"
          >
            Current
          </span>
        </div>

        <div class="mt-4">
          <h3 class="text-sm tracking-wide uppercase md:text-lg text-slate-200">
            Transfers
          </h3>
          <div class="mt-1 text-2xl font-semibold md:text-3xl text-slate-100">
            {{ shortenNumber(gameweek.transfers_made) }}
          </div>
        </div>

        <div class="mt-4">
          <h3 class="text-sm tracking-wide uppercase md:text-lg text-slate-200">
            Deadline
          </h3>
          <div class="mt-1 text-2xl font-semibold md:text-3xl text-slate-100">
            {{ getRemainingTime(gameweek.deadline_time) }}
          </div>
        </div>

        <!-- Chip usage (centered, wraps) -->
        <div
          v-if="gameweek.chip_plays && gameweek.chip_plays.length"
          class="max-w-md mx-auto mt-4"
        >
          <h4 class="mb-2 text-sm font-semibold text-center text-purple-200">
            Chip Usage
          </h4>
          <div class="flex flex-wrap justify-center gap-2">
            <span
              v-for="chip in gameweek.chip_plays"
              :key="chip.chip_name"
              class="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded"
            >
              {{ chip.chip_name }}: {{ shortenNumber(chip.num_played) }}
            </span>
          </div>
        </div>
      </div>
      <div  class="hidden sm:block">
        <img
          :src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${gameweek.mostViceCaptainedPlayerCode}.png`"
          :alt="`Most vice-captained player: ${gameweek.mostViceCaptained}`"
          class="object-contain w-full h-full rounded-md"
          loading="lazy"
          @error="
            (e) => handleImageError(e, gameweek.mostViceCaptainedPlayerCode)
          "
        />
        <div
          class="px-3 py-2 mb-2 text-center rounded-lg bg-white/80 backdrop-blur-sm"
        >
          <div class="text-sm font-semibold text-slate-700">
            Most Vice Captained
          </div>
          <div
            class="text-lg font-bold leading-tight md:text-2xl text-slate-900"
          >
            {{ gameweek.mostViceCaptained }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  gameweek: {
    type: Object,
    required: true,
  },
});

/**
 * Fallback handler keeps logic out of template and allows reuse.
 * When remote 250x250 fails, try the smaller 110x140 and slightly scale.
 */
function handleImageError(e, code) {
  const img = e.target;
  img.onerror = null;
  img.src = `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`;
  // keep image contained but visually stronger on small fallback
  img.style.transform = "scale(1.6)";
  img.style.objectFit = "contain";
}

/**
 * Simple helpers — replace with your existing utilities if present.
 */
function shortenNumber(n) {
  if (n === null || n === undefined) return "-";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function getRemainingTime(deadline) {
  // if you already have a humanized function, use that.
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
/* tiny visual tweak for stronger drop shadow if you want */
img {
  filter: drop-shadow(0 18px 20px rgba(0, 0, 0, 0.45));
  transform-origin: center;
  transition: transform 160ms ease;
}
</style>
