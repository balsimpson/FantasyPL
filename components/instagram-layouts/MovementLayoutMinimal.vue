<template>
  <div class="relative w-[1080px] h-[1080px] overflow-hidden bg-[#050816] text-white font-['Outfit',sans-serif]">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;400;700;900&display=swap" rel="stylesheet" />
    <!-- SHARED BACKGROUND SYSTEM -->
    <div class="absolute inset-0" :style="movementStyle.backdropStyle" />
    <div class="absolute inset-0" :style="movementStyle.patternStyle" />
    <div class="absolute inset-0 overflow-hidden">
      <div v-for="(glow, index) in movementStyle.glowLayers" :key="index" class="absolute rounded-full" :style="glow.style" />
    </div>

    <!-- MINIMALIST PREMIUM LAYOUT (MOBILE OPTIMIZED) -->
    <div class="relative z-10 flex h-full flex-col p-16">
      <!-- Top Header -->
      <header class="relative z-30 flex items-start justify-between">
        <div class="flex items-center gap-8">
          <div class="relative">
            <div class="absolute -inset-3 rounded-full bg-white/10 blur-xl" />
            <img :src="teamBadgeSrc" :alt="teamName" class="relative h-24 w-24 object-contain drop-shadow-2xl" crossorigin="anonymous" />
          </div>
          <div>
            <h2 class="text-4xl font-black tracking-tight text-white uppercase">{{ teamName }}</h2>
            <div class="flex items-center gap-3 mt-2">
              <span class="px-3 py-1 rounded-lg bg-white/10 text-[0.9rem] font-black tracking-[0.2em] text-white/80 uppercase">
                {{ positionLabel }}
              </span>
              <span class="text-[0.9rem] font-black tracking-[0.2em] text-white/40 uppercase">
                GW {{ gameweekLabel }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-end">
          <div class="text-[0.85rem] font-black uppercase tracking-[0.4em] text-white/40 mb-2">Market Price</div>
          <div class="text-7xl font-black tracking-tighter text-lime-300 drop-shadow-[0_0_30px_rgba(190,255,84,0.3)]">{{ formatCost(player.now_cost) }}</div>
        </div>
      </header>

      <!-- Centralised Big Name (BEHIND IMAGE) -->
      <div class="absolute inset-x-0 top-[16rem] -translate-y-1/2 z-10 flex flex-col items-center justify-center text-center px-8">
        <h1 class="font-black leading-[0.8] tracking-[-0.08em] uppercase whitespace-nowrap text-white/10"
            :style="{ fontSize: nameFontSize }">
          {{ player.web_name }}
        </h1>
        <!-- <div class="mt-[-1rem] text-[1.5rem] font-black tracking-[0.8em] text-lime-400/30 uppercase pl-[0.8em]">
          ELITE PERFORMANCE
        </div> -->
      </div>

      <!-- Player Image (IN FRONT OF NAME) -->
      <div class="absolute inset-0 flex items-center justify-center pt-24 z-20 pointer-events-none">
        <img :src="playerImageSrc" :alt="player.web_name"
          class="h-[85%] w-auto object-contain object-bottom drop-shadow-[0_60px_100px_rgba(0,0,0,0.95)]"
          crossorigin="anonymous" />
        <!-- Bottom Fade -->
        <div class="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#050816] to-transparent z-30" />
      </div>

      <!-- Stats Overlay (Optimized for Mobile) -->
      <div class="relative flex-1 flex mt-18 justify-between z-40 pointer-events-none pt-28">
        <!-- Left Stats -->
        <div class="flex flex-col gap-2 pointer-events-auto gap-y-6">
          <div v-for="stat in leftStats" :key="stat.label" 
            class="group flex flex-col ">
            <p class="text-4xl font-black uppercase tracking-[0.3em] text-white/40 mb-2">{{ stat.label }}</p>
            <div class="flex items-baseline gap-2">
              <span class="text-7xl font-black text-white">{{ stat.value }}</span>
              <span v-if="stat.suffix" class="text-4xl font-bold text-lime-300 uppercase tracking-widest">{{ stat.suffix }}</span>
            </div>
          </div>
        </div>

        <!-- Right Stats -->
        <div class="flex flex-col pointer-events-auto gap-y-6">
          <div v-for="stat in rightStats" :key="stat.label" 
            class="group flex flex-col items-end">
            <p class="text-4xl font-black uppercase tracking-[0.3em] text-white/40 mb-2 text-right">{{ stat.label }}</p>
            <div class="flex items-baseline gap-2">
              <span v-if="stat.prefix" class="text-4xl font-bold text-sky-300 uppercase tracking-widest">{{ stat.prefix }}</span>
              <span class="text-7xl font-black text-white text-right">{{ stat.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Dashboard (HIGH READABILITY) -->
      <footer class="relative z-50 mt-auto">
        <div class="grid grid-cols-4 gap-6 p-10 rounded-[45px] border-2 border-white/10 bg-black/80 backdrop-blur overflow-hidden ">
          <!-- Animated Background Element -->
          <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime-400/10 blur-[100px]" />
          
          <div v-for="item in dashboardItems" :key="item.label" class="flex flex-col gap-2 relative z-10 text-center">
            <p class="text-2xl font-black uppercase tracking-[0.3em] text-white/40">{{ item.label }}</p>
            <p class="text-7xl font-black tracking-tighter" :class="item.color || 'text-white'">{{ item.value }}</p>
          </div>
        </div>
        
        <!-- <div class="mt-8 flex items-center justify-between px-6">
          <div class="flex items-center gap-5">
            <div class="flex -space-x-1">
              <div v-for="i in 3" :key="i" class="h-2 w-2 rounded-full bg-lime-400" />
            </div>
            <span class="text-[0.8rem] font-black uppercase tracking-[0.5em] text-white/40">ELITE PERFORMANCE TRACKING</span>
          </div>
          <div class="flex items-center gap-6">
             <span class="text-[0.8rem] font-black uppercase tracking-[0.5em] text-white/20">FPL.PREMIUM</span>
             <div class="h-8 w-px bg-white/10" />
             <div class="text-[0.85rem] font-black text-lime-300 tracking-[0.2em]">AI VERIFIED</div>
          </div>
        </div> -->
      </footer>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  player: { type: Object, required: true },
  teamName: { type: String, required: true },
  teamBadgeSrc: { type: String, required: true },
  playerImageSrc: { type: String, required: true },
  gameweekLabel: { type: [Number, String], required: true },
  totalMovement: { type: Number, required: true },
  netMovement: { type: Number, required: true },
  movementStyle: { type: Object, required: true },
});

// Dynamic Font Scaling Logic
const nameFontSize = computed(() => {
  const nameLength = props.player?.web_name?.length || 10;
  // Base font size is 22rem for ~5 characters, scales down
  const size = Math.min(22, Math.max(12, 100 / (nameLength * 0.45)));
  return `${size}rem`;
});

const elementTypeMap = { 1: 'Goalkeeper', 2: 'Defender', 3: 'Midfielder', 4: 'Forward' };
const positionLabel = computed(() => (elementTypeMap[props.player?.element_type] || 'Player').toUpperCase());

const formatCompact = (value) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));
const formatCost = (value) => {
  const cost = Number(value || 0) / 10;
  return `£${cost.toFixed(1)}m`;
};
const formatSigned = (value) => {
  const number = Number(value || 0);
  const formatted = formatCompact(Math.abs(number));
  return number > 0 ? `+${formatted}` : number < 0 ? `-${formatted}` : formatted;
};

const leftStats = computed(() => [
  { label: 'FORM', value: props.player.form || '0.0' },
  { label: 'xG INDEX', value: props.player.expected_goals || '0.0', suffix: 'EXP' },
]);

const rightStats = computed(() => [
  { label: 'POINTS/G', value: props.player.points_per_game || '0.0' },
  { label: 'xA INDEX', value: props.player.expected_assists || '0.0', prefix: 'EXP' },
]);

const dashboardItems = computed(() => [
  { label: 'POINTS', value: props.player.total_points || '0' },
  { label: 'OWNED', value: `${props.player.selected_by_percent}%` },
  { label: 'TRANSFERS', value: formatSigned(props.netMovement), color: props.netMovement >= 0 ? 'text-lime-300' : 'text-rose-400' },
  { label: 'ICT RANK', value: `#${props.player.ict_index_rank || '—'}` },
]);
</script>

<style scoped>
@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
</style>

<style scoped>
@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
</style>

<style scoped>
@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(300%); }
}
</style>
