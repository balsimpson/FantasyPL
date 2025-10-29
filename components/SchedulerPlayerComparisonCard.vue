<template>
  <div class="overflow-hidden relative group">
    <div class="transform scale-[0.35] origin-top">
      <InstaPlayerComparison :player1="player1" :player2="player2" :data="data" />
    </div>
    <button
      @click.prevent="handleSelected()"
      class="flex overflow-hidden absolute inset-x-0 bottom-12 left-1/2 z-50 gap-2 justify-center items-center px-4 py-2 mx-auto mt-3 mb-4 max-w-full text-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-yellow-400 rounded-full shadow-lg transition-transform duration-200 -translate-x-1/2 shrink-0 hover:scale-105 hover:from-pink-600 hover:to-yellow-500 active:scale-95"
    >
      <svg
        class="w-6 h-6 shrink-0"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        />
        <circle
          cx="12"
          cy="12"
          r="3.2"
          stroke="currentColor"
          stroke-width="2"
          fill="none"
        />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
      </svg>
      <span class="">Preview</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  player1: Object,
  player2: Object,
  data: Object,
});

const emit = defineEmits(["selected"]);

const handleSelected = () => {
  emit("selected", { player1: props.player1, player2: props.player2 });
};
</script>
