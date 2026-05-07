<template>
  <div class="fifa-button flex items-center justify-center" :class="[sizeClasses, colorClasses]">
    <!-- PlayStation Icons -->
    <template v-if="platform === 'playstation'">
      <svg v-if="type === 'a'" viewBox="0 0 24 24" class="fill-current w-full h-full">
        <!-- Cross -->
        <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
      </svg>
      <svg v-else-if="type === 'b'" viewBox="0 0 24 24" class="fill-current w-full h-full p-1">
        <!-- Circle -->
        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4Z" />
      </svg>
      <svg v-else-if="type === 'x'" viewBox="0 0 24 24" class="fill-current w-full h-full p-1.5">
        <!-- Square -->
        <path d="M3,3V21H21V3H3M5,5H19V19H5V5Z" />
      </svg>
      <svg v-else-if="type === 'y'" viewBox="0 0 24 24" class="fill-current w-full h-full p-1">
        <!-- Triangle -->
        <path d="M1,21L12,2L23,21H1M5.19,19H18.81L12,7.5L5.19,19Z" />
      </svg>
      <span v-else class="text-[0.6em] font-black uppercase tracking-tighter">{{ type }}</span>
    </template>

    <!-- Xbox Icons -->
    <template v-else>
      <span v-if="['a', 'b', 'x', 'y'].includes(type)" class="text-[0.8em] font-black uppercase leading-none">{{ type }}</span>
      <span v-else class="text-[0.6em] font-black uppercase tracking-tighter">{{ type }}</span>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  platform: {
    type: String,
    default: 'xbox', // 'xbox' | 'playstation'
  },
  type: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'md', // 'sm' | 'md' | 'lg'
  },
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-20 h-20 border-[4px]',
  };
  return sizes[props.size] || sizes.md;
});

const colorClasses = computed(() => {
  if (props.platform === 'playstation') {
    switch (props.type) {
      case 'a': return 'text-[#5a77cc] border-[#5a77cc]/50 bg-[#5a77cc]/10 rounded-full'; // Cross
      case 'b': return 'text-[#ee4f4f] border-[#ee4f4f]/50 bg-[#ee4f4f]/10 rounded-full'; // Circle
      case 'x': return 'text-[#cd71b2] border-[#cd71b2]/50 bg-[#cd71b2]/10 rounded-[20%]'; // Square
      case 'y': return 'text-[#26b9a1] border-[#26b9a1]/50 bg-[#26b9a1]/10 rounded-[25%]'; // Triangle
      default: return 'text-white border-white/30 bg-black/40 rounded-xl px-2'; // LB, RB, etc.
    }
  } else {
    // Xbox
    switch (props.type) {
      case 'a': return 'text-[#107c10] border-[#107c10]/50 bg-[#107c10]/10 rounded-full';
      case 'b': return 'text-[#e81123] border-[#e81123]/50 bg-[#e81123]/10 rounded-full';
      case 'x': return 'text-[#0078d7] border-[#0078d7]/50 bg-[#0078d7]/10 rounded-full';
      case 'y': return 'text-[#fff100] border-[#fff100]/50 bg-[#fff100]/10 rounded-full';
      default: return 'text-white border-white/30 bg-black/40 rounded-xl px-2';
    }
  }
});
</script>

<style scoped>
.fifa-button {
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
</style>
