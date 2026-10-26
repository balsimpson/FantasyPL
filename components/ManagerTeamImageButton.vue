<script setup>
const props = defineProps({ manager: { type: Object, required: true }, squad: { type: Object, required: true } });
const open = ref(false);
const artwork = ref(null);
const mounted = ref(false);
const { busy, sharing, error, imageUrl, canShare, create, download, share } = useManagerTeamImage(
  () => artwork.value,
  () => `fpl-team-${props.manager.id}-gw-${props.manager.current_event}.png`,
);
function showImage() {
  open.value = true;
  if (!imageUrl.value) {
    mounted.value = true;
    void create();
  }
}
</script>

<template>
  <UButton icon="i-lucide-image-down" label="Create team image" color="primary" variant="soft" size="sm" class="border border-lime-300/30 text-lime-300" @click="showImage" />
  <UModal v-model:open="open" title="Share your team" description="1080 × 1920 PNG with your published squad and manager details."
    :ui="{ content: 'max-w-lg bg-[#101216] text-white divide-white/10 ring-white/10', title: 'text-white', description: 'text-stone-400', body: 'flex min-h-0 flex-col items-center gap-4', footer: 'flex-wrap justify-end', overlay: 'bg-black/70', close: 'text-stone-300 hover:bg-lime-300/10 hover:text-lime-200' }">
    <template #body>
      <p v-if="busy" role="status" class="flex items-center gap-2 py-12 text-sm text-stone-300"><UIcon name="i-lucide-loader-circle" class="size-5 animate-spin motion-reduce:animate-none" />Creating team image…</p>
      <img v-if="imageUrl" :src="imageUrl" :alt="`${manager.name}, published squad for Gameweek ${manager.current_event}`" width="1080" height="1920" class="max-h-[55dvh] w-auto max-w-full rounded-lg object-contain" />
      <UAlert v-if="error" color="error" variant="soft" :description="error" class="w-full" />
      <UButton v-if="error && !imageUrl" label="Try again" icon="i-lucide-refresh-cw" :loading="busy" @click="create" />
    </template>
    <template #footer>
      <UButton v-if="imageUrl" icon="i-lucide-download" label="Download PNG" color="primary" @click="download" />
      <UButton v-if="imageUrl && canShare" icon="i-lucide-share-2" label="Share image" color="neutral" variant="outline" :loading="sharing" @click="share" />
    </template>
  </UModal>
  <Teleport to="body">
    <div v-if="mounted" aria-hidden="true" inert class="pointer-events-none fixed left-[-10000px] top-0">
      <div ref="artwork"><ManagerTeamShareCard :manager="manager" :squad="squad" /></div>
    </div>
  </Teleport>
</template>
