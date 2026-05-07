<template>
  <div class="relative w-[1080px] h-[1080px] overflow-hidden bg-[#050816] text-white font-['Outfit',sans-serif]">
    
    <!-- Background Image -->
    <div v-if="backgroundImage" class="absolute inset-0">
      <img 
        :src="backgroundImage" 
        class="w-full h-full object-cover" 
        :style="{ 
          transform: `scale(${imageZoom}) translate(${imageX}px, ${imageY}px)` 
        }"
        alt="Background" 
        crossorigin="anonymous" 
      />
      <!-- Dynamic Left-to-right Gradient -->
      <div 
        class="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-black via-black/80 to-transparent" 
        :style="{ 
          width: `${gradientHeight}%`,
          opacity: gradientOpacity / 100
        }"
      />
    </div>
    <div v-else class="absolute inset-0 bg-gradient-to-br from-[#050816] to-[#1a1f35]" />

    <!-- Main Content Layout -->
    <div class="relative z-10 flex h-full flex-col justify-center p-20 max-w-[800px]">
      
      <div class="space-y-10">
        <h1 class="text-9xl font-black leading-[0.9] tracking-tighter text-white uppercase drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
          {{ tipTitle || 'Unstoppable Attack' }}
        </h1>

        <p class="text-4xl font-medium leading-relaxed text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
          {{ tipDescription || 'Master the new precision passing mechanics to slice through any defense with ease.' }}
        </p>

        <!-- Controller Button Overlay -->
        <div v-if="buttons && buttons.length" class="flex flex-wrap gap-6 pt-6">
          <div v-for="(btn, idx) in buttons" :key="idx" class="flex items-center gap-6">
            <FifaControllerButton 
              :platform="platform" 
              :type="btn.type" 
              size="lg" 
            />
            <div v-if="idx < buttons.length - 1" class="text-4xl font-black text-white/30">+</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  backgroundImage: String,
  platform: {
    type: String,
    default: 'xbox',
  },
  tipTitle: String,
  tipDescription: String,
  buttons: Array,
  gradientHeight: Number,
  gradientOpacity: Number,
  imageZoom: Number,
  imageX: Number,
  imageY: Number,
});
</script>
