<template>
  <div class="relative aspect-square w-full max-w-[1080px] overflow-hidden rounded-xl bg-[#050816] text-white">
    <img v-if="previewDataUrl" :id="id" :src="previewDataUrl" class="w-full h-auto block" alt="Instagram Card Preview" />
    <div v-else class="absolute inset-0 flex items-center justify-center bg-[#050816]">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-white/50" />
    </div>

    <!-- OFF-SCREEN CAPTURE AREA -->
    <div class="fixed left-[-9999px] top-[-9999px]">
      <div ref="cardSource">
        <component 
          :is="activeLayoutComponent"
          :player="player"
          :team-name="teamName"
          :team-badge-src="teamBadgeSrc"
          :player-image-src="playerImageSrc"
          :gameweek-label="gameweekLabel"
          :total-movement="totalMovement"
          :net-movement="netMovement"
          :movement-style="movementStyle"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { buildInstagramMovementStyle } from '~/composables/useInstagramMovementStyles';
import { toPng } from 'html-to-image';

// Import Layouts
import MovementLayoutClassic from './instagram-layouts/MovementLayoutClassic.vue';
import MovementLayoutMinimal from './instagram-layouts/MovementLayoutMinimal.vue';

const props = defineProps({
  id: {
    type: String,
    default: 'instagram-card',
  },
  layout: {
    type: String,
    default: 'classic', // 'classic' | 'minimal'
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

const layouts = {
  classic: MovementLayoutClassic,
  minimal: MovementLayoutMinimal,
};

const activeLayoutComponent = computed(() => layouts[props.layout] || layouts.classic);

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
  renderTimeout = setTimeout(generateImage, 350); // Slightly longer timeout for components to settle
};

watch(() => props.player, () => {
  updateImages();
}, { deep: true, immediate: true });

watch(() => props.styleConfig, triggerRender, { deep: true });
watch(() => props.stylePreset, triggerRender);
watch(() => props.styleSeed, triggerRender);
watch(() => props.layout, triggerRender);

onMounted(() => {
  triggerRender();
});
</script>
