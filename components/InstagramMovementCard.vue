<template>
  <div class="relative aspect-square w-full max-w-[1080px] overflow-hidden rounded-xl bg-[#050816] text-white">
    <img v-if="previewDataUrl" :id="id" :src="previewDataUrl" class="w-full h-auto block" alt="Instagram Card Preview" />
    <div v-else class="absolute inset-0 flex items-center justify-center bg-[#050816]">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-white/50" />
    </div>

    <div class="fixed left-[-9999px] top-[-9999px]">
      <div ref="cardSource" class="relative w-[1080px] h-[1080px] overflow-hidden bg-[#050816] text-white">
        <div class="absolute inset-0" :style="backgroundStyle" />
        <div class="absolute inset-0" :style="patternStyle" />
        <div class="absolute inset-0 overflow-hidden">
          <div v-for="(glow, index) in glowLayers" :key="index" class="absolute rounded-full" :style="glow.style" />
        </div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.22)_100%)]" />

        <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div class="h-[1080px] w-[1080px]">
            <div class="relative z-10 flex h-full flex-col px-12 py-10">
              <header class="flex items-center justify-between gap-4">
            <div class="flex min-w-0 items-center gap-4">
              <img :src="teamBadgeSrc" :alt="teamName"
                class="h-14 w-14 shrink-0 object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.45)]"
                crossorigin="anonymous" @error="handleImageError" />
              <p class=" text-2xl font-black leading-none tracking-[-0.06em] text-white sm:text-3xl">{{ teamName
              }}</p>
              <p class="text-sm font-medium uppercase tracking-[0.22em] text-white/55">{{ positionLabel }}</p>
            </div>

            <div class="flex items-center gap-5 text-white">
              <div class="space-y-1 text-right">
                <p class="text-[0.95rem] font-semibold uppercase tracking-[0.18em] text-white/38">Gameweek</p>
                <p class="text-[2.35rem] font-black leading-none tracking-[-0.07em] text-white">GW {{ gameweekLabel }}
                </p>
              </div>
              <div class="space-y-1 text-right">
                <p class="text-[0.95rem] font-semibold uppercase tracking-[0.18em] text-white/38">Price</p>
                <p class="text-[2.35rem] font-black leading-none tracking-[-0.07em] text-white">{{
                  formatCost(player.now_cost) }}</p>
              </div>
              <span v-if="showAvailabilityNotice" class="rounded-full border px-3 py-2 backdrop-blur"
                :class="statusClass">{{ statusLabel }}</span>
            </div>
          </header>

          <main class="mt-8 flex flex-1 gap-6 xl:gap-8">
            <section class="flex min-w-0 flex-1 basis-0 flex-col gap-5">
              <div
                class="flex shrink-0 items-center gap-3 whitespace-nowrap text-[1rem] font-semibold uppercase tracking-[0.16em] text-white/55">
                <!-- <span>{{ positionLabel }}</span>
                <span class="text-white/25">/</span>
                <span>{{ formatCost(player.now_cost) }}</span>
                <span class="text-white/25">/</span> -->
                <span>ICT #{{ formatCompact(player.ict_index_rank) }}</span>
                <span class="text-white/25">/</span>
                <span class="text-lime-200">Value {{ player.value_season || '—' }}</span>
              </div>

              <div class="space-y-2">
                <h1 class="max-w-xl text-7xl font-black leading-[0.88] tracking-[-0.08em] text-balance">
                  {{ player.web_name }}
                </h1>

              </div>

              <div class="grid grid-cols-3 gap-6 border-y border-white/10 py-5 items-end">
                <div v-for="item in primaryStats" :key="item.label" class="space-y-1">
                  <p class="text-[1rem] font-semibold uppercase tracking-[0.16em] text-white/38">{{ item.label }}</p>
                  <p class="text-[2.6rem] font-black leading-none tracking-[-0.07em]"
                    :class="item.className || 'text-white'">{{ item.value }}</p>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-6 border-b border-white/10 py-5 pt-0 items-end">
                <div v-for="item in supportStats" :key="item.label" class="space-y-1">
                  <p class="text-[1rem] font-semibold uppercase tracking-[0.16em] text-white/38">{{ item.label }}</p>
                  <p class="text-[1.65rem] font-black leading-none tracking-tighter"
                    :class="item.className || 'text-white'">{{ item.value }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-x-6 gap-y-2 pt-1 text-[1rem] leading-7 text-white/78 pt-6">
                <div v-for="item in signalStats" :key="item.label"
                  class="flex items-baseline justify-between gap-3 border-b border-white/8 py-1.5">
                  <span class="text-[0.92rem] font-semibold uppercase tracking-[0.14em] text-white/34">{{ item.label
                    }}</span>
                  <span class="font-bold tracking-[-0.02em]" :class="item.className || 'text-white'">{{ item.value
                  }}</span>
                </div>
              </div>


              <div class="mt-auto pb-4">
                <div class="mb-6 pt-1">
                  <div
                    class="flex items-center justify-between gap-3 text-[1rem] font-semibold uppercase tracking-[0.14em] text-white/42">
                    <span>Discipline</span>
                  </div>
                  <div class="mt-2 flex items-center gap-2">
                    <div v-for="item in cardMarks" :key="item.label" class="flex h-12 min-w-0 items-center gap-2 px-3"
                      :class="item.className">
                      <span class="h-6 w-4 rounded-sm" :class="item.swatchClass" />
                      <div class="min-w-0">
                        <div class="text-[0.92rem] font-semibold uppercase tracking-[0.14em] opacity-70">{{ item.label
                          }}
                        </div>
                        <div class="text-xl font-black leading-none tracking-tighter">{{ item.value }}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex items-end justify-between gap-4">
                  <div>
                    <p class="text-[0.95rem] font-semibold uppercase tracking-[0.16em] text-lime-100/55">Transfers in
                    </p>
                    <p class="mt-1 text-4xl font-black tracking-[-0.07em] text-lime-200">{{ formatCompact(transfersIn)
                    }}</p>
                  </div>
                  <div class="text-center">
                    <p class="text-[0.95rem] font-semibold uppercase tracking-[0.16em] text-white/40">Net</p>
                    <p class="mt-1 text-4xl font-black tracking-[-0.07em]" :class="netValueClass">{{
                      formatSigned(netMovement) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[0.95rem] font-semibold uppercase tracking-[0.16em] text-sky-100/55">Transfers out
                    </p>
                    <p class="mt-1 text-4xl font-black tracking-[-0.07em] text-sky-200">{{ formatCompact(transfersOut)
                    }}</p>
                  </div>
                </div>

                <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div class="h-full bg-lime-300" :style="{ width: `${transferInShare}%` }" />
                  <div class="h-full bg-sky-300" :style="{ width: `${transferOutShare}%` }" />
                </div>

                <div
                  class="mt-2 flex items-center justify-between text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-white/40">
                  <span>{{ formatCompact(totalMovement) }} total movement</span>
                  <span>Value {{ player.value_season || '—' }}</span>
                </div>
              </div>
            </section>

            <section
              class="relative flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden rounded-[40px] border border-white/10 bg-[#050816]/[0.03] shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
              <div
                class="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(190,255,84,0.18),transparent_26%),radial-gradient(circle_at_80%_12%,rgba(63,195,255,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.01)_48%,rgba(0,0,0,0.28)_100%)]" />
              <div class="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#050816]/50 to-transparent" />
              <div
                class="absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#050816] via-black/85 to-transparent" />

              <div class="relative z-10 flex h-full flex-col p-7">
                <div class="space-y-2">
                  <p class="text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-white/38">Selected player</p>
                  <p class="text-[1rem] font-medium uppercase tracking-[0.16em] text-white/55">GW {{ gameweekLabel }} /
                    {{
                      teamName }} / {{ positionLabel }}</p>
                </div>

                <div
                  class="relative mt-5 flex min-h-0 flex-1 items-end justify-center overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(8,12,24,0.12)_40%,rgba(0,0,0,0.95)_100%)]">
                  <div class="absolute inset-x-[14%] top-[10%] h-[52%] rounded-full bg-lime-300/18 blur-3xl" />
                  <div class="absolute inset-x-[22%] bottom-[12%] h-[24%] rounded-full bg-sky-400/10 blur-3xl" />
                  <div
                    class="absolute inset-x-[18%] bottom-0 h-2/5 bg-gradient-to-t from-black via-black/80 to-transparent" />
                  <img :src="playerImageSrc" :alt="player.web_name"
                    class="relative z-10 h-[97%] w-full object-contain object-bottom drop-shadow-[0_36px_48px_rgba(0,0,0,0.62)]"
                    crossorigin="anonymous" @error="handleImageError" />
                </div>

                <div v-if="showAvailabilityNotice"
                  class="mt-4 rounded-3xl border px-4 py-3 text-[1rem] font-semibold uppercase tracking-[0.16em] backdrop-blur"
                  :class="statusClass">
                  {{ statusLabel }}
                </div>

                <div class="mt-12 grid grid-cols-2 gap-3 text-white">
                  <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                    <p class="text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-white/38">Form</p>
                    <p class="mt-2 text-2xl font-black tracking-[-0.05em] text-white">{{ player.form || '—' }}</p>
                  </div>
                  <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                    <p class="text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-white/38">Ownership</p>
                    <p class="mt-2 text-2xl font-black tracking-[-0.05em] text-white">{{
                      formatPercent(player.selected_by_percent) }}</p>
                  </div>
                  <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                    <p class="text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-white/38">Minutes</p>
                    <p class="mt-2 text-2xl font-black tracking-[-0.05em] text-white">{{ formatCompact(player.minutes)
                    }}</p>
                  </div>
                  <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                    <p class="text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-white/38">Points</p>
                    <p class="mt-2 text-2xl font-black tracking-[-0.05em] text-white">{{
                      formatCompact(player.total_points) }}</p>
                  </div>
                </div>
              </div>
            </section>
          </main>

          <footer
            class="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[0.9rem] font-semibold uppercase tracking-[0.16em] text-white/40">
            <span>FantasyPL</span>
            <span>{{ formatCompact(totalMovement) }} total movement</span>
          </footer>
        </div>
      </div>
    </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { buildInstagramMovementStyle } from '~/composables/useInstagramMovementStyles';
import { toPng } from 'html-to-image';

const props = defineProps({
  id: {
    type: String,
    default: 'instagram-card',
  },
  player: {
    type: Object,
    required: true,
  },
  teamName: {
    type: String,
    default: '',
  },
  stylePreset: {
    type: String,
    default: 'aurora-grid',
  },
  styleSeed: {
    type: [String, Number],
    default: 0,
  },
  styleConfig: {
    type: Object,
    default: () => ({}),
  },
  gameweekLabel: {
    type: [Number, String],
    default: 'Current',
  },
  totalMovement: {
    type: Number,
    default: 0,
  },
  netMovement: {
    type: Number,
    default: 0,
  },
});

const elementTypeMap = {
  1: 'Goalkeeper',
  2: 'Defender',
  3: 'Midfielder',
  4: 'Forward',
};

const positionLabel = computed(() => elementTypeMap[props.player?.element_type] || 'Player');
const transfersIn = computed(() => Number(props.player?.transfers_in_event || 0));
const transfersOut = computed(() => Number(props.player?.transfers_out_event || 0));
const teamBadgeSrc = ref('/fallback.png');
const playerImageSrc = ref('/fallback.png');
const cardSource = ref(null);
const previewDataUrl = ref(null);
let renderTimeout = null;

const loadImage = (url) => {
  if (!url) return Promise.resolve('/fallback.png');
  if (!process.client) return Promise.resolve(url);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(url);
    img.onerror = () => resolve('/fallback.png');
    img.src = url;
  });
};

let loadSeq = 0;

const updateImages = async () => {
  if (!props.player) return;
  const currentSeq = ++loadSeq;
  
  const teamUrl = `/api/image-proxy/team/${props.player.team_code}?url=${encodeURIComponent(`https://resources.premierleague.com/premierleague/badges/t${props.player.team_code}.png`)}`;
  const playerUrl = `/api/image-proxy/player/${props.player.code}?url=${encodeURIComponent(`https://resources.premierleague.com/premierleague/photos/players/250x250/p${props.player.code}.png`)}`;

  const [teamRes, playerRes] = await Promise.all([
    loadImage(teamUrl),
    loadImage(playerUrl)
  ]);

  if (currentSeq === loadSeq) {
    teamBadgeSrc.value = teamRes;
    playerImageSrc.value = playerRes;
    triggerRender();
  }
};

const movementStyle = computed(() => buildInstagramMovementStyle({
  presetId: props.styleConfig?.presetId || props.stylePreset,
  seed: props.styleConfig?.seed ?? props.styleSeed,
  glowIntensity: props.styleConfig?.glowIntensity,
  lightSpread: props.styleConfig?.lightSpread,
  patternScale: props.styleConfig?.patternScale,
  patternOpacity: props.styleConfig?.patternOpacity,
  patternKind: props.styleConfig?.patternKind,
  patternRotation: props.styleConfig?.patternRotation,
}));

const generateImage = async () => {
  if (!process.client || !cardSource.value) return;

  try {
    const dataUrl = await toPng(cardSource.value, {
      canvasWidth: 1080,
      canvasHeight: 1080,
      pixelRatio: 1,
      cacheBust: true,
      skipFonts: true,
      useCORS: true,
      backgroundColor: '#050816',
      style: {
        transform: 'none',
      },
    });

    previewDataUrl.value = dataUrl;
  } catch (error) {
    console.error('Failed to generate preview image:', error);
  }
};

const triggerRender = () => {
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(generateImage, 300);
};

watch(() => props.player, () => {
  updateImages();
}, { deep: true, immediate: true });

watch(() => props.styleConfig, triggerRender, { deep: true });
watch(() => props.stylePreset, triggerRender);
watch(() => props.styleSeed, triggerRender);

onMounted(() => {
  triggerRender();
});

const backgroundStyle = computed(() => movementStyle.value.backdropStyle);
const patternStyle = computed(() => movementStyle.value.patternStyle);
const glowLayers = computed(() => movementStyle.value.glowLayers);
const statusLabels = {
  a: 'Available',
  d: 'Doubtful',
  i: 'Injured',
  s: 'Suspended',
  u: 'Unavailable',
};

const statusToneMap = {
  a: 'border-lime-300/20 bg-lime-300/10 text-lime-100',
  d: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  i: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
  s: 'border-violet-300/20 bg-violet-300/10 text-violet-100',
  u: 'border-white/10 bg-white/10 text-white/70',
};

const statusLabel = computed(() => statusLabels[props.player?.status] || 'Unknown');
const showAvailabilityNotice = computed(() => props.player?.status && props.player.status !== 'a');
const statusClass = computed(() => statusToneMap[props.player?.status] || 'border-white/10 bg-white/10 text-white/70');
const yellowCards = computed(() => Number(props.player?.yellow_cards || 0));
const redCards = computed(() => Number(props.player?.red_cards || 0));
const bookingsLabel = computed(() => {
  const total = yellowCards.value + redCards.value;
  return total ? `${total}` : '0';
});

const netValueClass = computed(() => (props.netMovement >= 0 ? 'text-lime-200' : 'text-rose-200'));
const totalTransfers = computed(() => transfersIn.value + transfersOut.value);
const transferInShare = computed(() => (totalTransfers.value === 0 ? 50 : (transfersIn.value / totalTransfers.value) * 100));
const transferOutShare = computed(() => (totalTransfers.value === 0 ? 50 : (transfersOut.value / totalTransfers.value) * 100));

const primaryStats = computed(() => [
  { label: 'Total points', value: formatCompact(props.player?.total_points) },
  { label: 'GW points', value: formatCompact(props.player?.event_points), className: 'text-lime-200' },
  { label: 'PPG', value: props.player?.points_per_game || '—' },
]);

const supportStats = computed(() => [
  { label: 'Form', value: props.player?.form || '—' },
  { label: 'Ownership', value: formatPercent(props.player?.selected_by_percent) },
  { label: 'Minutes', value: formatCompact(props.player?.minutes) },
]);

const signalStats = computed(() => [
  { label: 'Goals', value: formatCompact(props.player?.goals_scored) },
  { label: 'Assists', value: formatCompact(props.player?.assists) },
  { label: 'xG', value: formatNumber(props.player?.expected_goals) },
  { label: 'xA', value: formatNumber(props.player?.expected_assists) },
  { label: 'Bonus', value: formatCompact(props.player?.bonus) },
  { label: 'CS', value: formatCompact(props.player?.clean_sheets) },
]);

const cardMarks = computed(() => [
  {
    label: 'Yellow',
    value: formatCompact(yellowCards.value),
    className: yellowCards.value ? 'border-yellow-300/30 bg-yellow-300/10 text-yellow-100' : 'border-white/10 bg-white/[0.04] text-white/55',
    swatchClass: 'bg-yellow-300',
  },
  {
    label: 'Red',
    value: formatCompact(redCards.value),
    className: redCards.value ? 'border-rose-300/30 bg-rose-300/10 text-rose-100' : 'border-white/10 bg-white/[0.04] text-white/55',
    swatchClass: 'bg-rose-500',
  },
]);

const formatCompact = (value) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));

const formatCost = (value) => {
  const cost = Number(value || 0) / 10;
  return `${cost.toFixed(cost % 1 === 0 ? 0 : 1)}m`;
};

const formatNumber = (value) => {
  const number = Number(value || 0);
  return number >= 10 ? number.toFixed(0) : number.toFixed(1);
};

const formatPercent = (value) => {
  const number = Number(value || 0);
  return `${number % 1 === 0 ? number.toFixed(0) : number.toFixed(1)}%`;
};

const formatSigned = (value) => {
  const number = Number(value || 0);
  const formatted = formatCompact(Math.abs(number));

  return number > 0 ? `+${formatted}` : number < 0 ? `-${formatted}` : formatted;
};

const handleImageError = (event) => {
  const target = event?.target;

  if (!target) return;

  target.onerror = null;
  target.src = '/fallback.png';
};
</script>
