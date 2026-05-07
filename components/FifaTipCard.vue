<template>
  <div class="relative aspect-square w-full max-w-[1080px] overflow-hidden rounded-xl bg-[#050816] text-white">
    <img v-if="previewDataUrl" :id="id" :src="previewDataUrl" class="w-full h-auto block" alt="FIFA Card Preview" />
    <div v-else class="absolute inset-0 flex items-center justify-center bg-[#050816]">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-white/50" />
    </div>

    <!-- OFF-SCREEN CAPTURE AREA -->
    <div class="fixed left-[-9999px] top-[-9999px]">
      <div ref="cardSource">
        <component 
          :is="activeLayoutComponent"
          :platform="platform"
          :backgroundImage="backgroundImage"
          :tip-title="tipTitle"
          :tip-description="tipDescription"
          :buttons="buttons"
          :gradient-height="gradientHeight"
          :gradient-opacity="gradientOpacity"
          :image-zoom="imageZoom"
          :image-x="imageX"
          :image-y="imageY"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { toPng } from 'html-to-image';

// Import Layouts
import FifaLayoutClassic from './fifa-layouts/FifaLayoutClassic.vue';
import FifaLayoutLeft from './fifa-layouts/FifaLayoutLeft.vue';
import FifaLayoutRight from './fifa-layouts/FifaLayoutRight.vue';

const props = defineProps({
  id: {
    type: String,
    default: 'fifa-card',
  },
  layout: {
    type: String,
    default: 'classic', // 'classic' | 'left' | 'right'
  },
  platform: {
    type: String,
    default: 'xbox',
  },
  backgroundImage: {
    type: String,
    default: '',
  },
  tipTitle: {
    type: String,
    default: '',
  },
  tipDescription: {
    type: String,
    default: '',
  },
  buttons: {
    type: Array,
    default: () => [],
  },
  gradientHeight: {
    type: Number,
    default: 50,
  },
  gradientOpacity: {
    type: Number,
    default: 90,
  },
  imageZoom: {
    type: Number,
    default: 1,
  },
  imageX: {
    type: Number,
    default: 0,
  },
  imageY: {
    type: Number,
    default: 0,
  },
});

const layouts = {
  classic: FifaLayoutClassic,
  left: FifaLayoutLeft,
  right: FifaLayoutRight,
};

const activeLayoutComponent = computed(() => layouts[props.layout] || layouts.classic);

const cardSource = ref(null);
const previewDataUrl = ref(null);
let renderTimeout = null;

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
  renderTimeout = setTimeout(generateImage, 350);
};

// Watch for prop changes to re-render
watch(() => props, triggerRender, { deep: true });

onMounted(() => {
  triggerRender();
});
</script>
