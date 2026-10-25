<template>
  <UModal
    v-model:open="isOpen"
    title="Search players"
    description="Search, filter and compare the full player list."
    fullscreen
    scrollable
    :content="modalContent"
    :ui="modalUi"
    @after:enter="focusPlayerSearch"
  >
    <template #body>
      <div class="site-content-rail mx-auto w-full py-2 sm:py-4">
        <slot />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { isOpen: searchOpen, origin } = usePlayerSearchSurface();
const active = ref(true);
onActivated(() => { active.value = true; });
onDeactivated(() => { active.value = false; });
const isOpen = computed({
  get: () => active.value && searchOpen.value,
  set: (value) => { searchOpen.value = value; },
});
const modalContent = computed(() => ({
  style: { transformOrigin: `${origin.value.x}px ${origin.value.y}px` },
}));
const modalUi = {
  content: "min-h-dvh bg-[#050608] text-stone-50",
  header: "sticky top-0 z-30 h-14 min-h-14 shrink-0 border-b border-white/10 bg-[#0b0d10] px-4 py-3 sm:px-6",
  body: "min-w-0 px-0 py-4 sm:py-6",
};
const focusPlayerSearch = () => {
  nextTick(() => document.getElementById("player-search")?.focus({ preventScroll: true }));
};
</script>
