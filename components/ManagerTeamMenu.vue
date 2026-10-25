<template>
  <UPopover v-model:open="open" :content="{ align: 'end' }" :ui="{ content: 'w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/20 bg-[#181d1c] p-0 text-stone-100 ring-0' }">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-users-round"
      trailing-icon="i-lucide-chevron-down"
      :ui="{ leadingIcon: 'size-4', trailingIcon: 'size-3.5' }"
      class="gap-2 rounded-sm bg-transparent px-1.5 py-2 text-sm font-medium text-stone-300 transition-colors hover:bg-transparent hover:text-lime-300"
    >Teams</UButton>

    <template #content>
      <section v-if="savedManagers.length" aria-labelledby="saved-teams-title" class="border-b border-white/15 px-5 pt-4">
        <div class="mb-1 flex items-center justify-between gap-3">
          <h2 id="saved-teams-title" class="text-sm font-semibold text-stone-200">Saved teams</h2>
          <span class="text-xs text-stone-400">Season points</span>
        </div>
        <ol class="-mx-5 max-h-64 overflow-y-auto divide-y divide-white/10">
          <li v-for="manager in rankedManagers" :key="manager.id" class="flex items-center">
            <NuxtLink :to="`/manager/${manager.id}`" class="group box-border flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md border border-transparent py-3.5 pl-5 pr-2 transition-colors hover:border-white/10 hover:bg-white/[0.08] focus-visible:border-lime-300 focus-visible:bg-white/[0.08] focus-visible:outline-none" @click="open = false">
              <div class="min-w-0">
                <span class="block text-sm font-semibold text-white [overflow-wrap:anywhere]">{{ manager.teamName }}</span>
                <span v-if="manager.managerName" class="mt-1 block text-xs text-stone-400 [overflow-wrap:anywhere]">{{ manager.managerName }}</span>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span class="rounded border border-white/15 px-1.5 py-1 text-[11px] leading-none text-stone-300 tabular-nums">{{ manager.points !== null ? `${manager.points.toLocaleString('en-GB')} pts` : loadingPoints ? 'Loading…' : 'Unavailable' }}</span>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-stone-500 group-hover:text-lime-300" aria-hidden="true" />
              </div>
            </NuxtLink>
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              :aria-label="`Remove ${manager.teamName} from saved teams`"
              :title="`Remove ${manager.teamName}`"
              class="mr-2 size-9 shrink-0 justify-center text-stone-400 hover:bg-white/10 hover:text-white"
              @click="remove(manager.id)"
            />
          </li>
        </ol>
      </section>
      <HomeManagerLookup class="bg-[#101514] p-5" @opened="open = false" />
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const open = ref(false);
const { savedManagers, remove } = useSavedManagers();
const points = ref<Record<string, number | null>>({});
const loadingPoints = ref(false);
const rankedManagers = computed(() => savedManagers.value
  .map((manager) => ({ ...manager, points: points.value[manager.id] ?? null }))
  .sort((a, b) => {
    if (a.points === null) return b.points === null ? 0 : 1;
    if (b.points === null) return -1;
    return b.points - a.points;
  }));

watch(() => open.value ? savedManagers.value.map((manager) => manager.id).join(',') : null, async (ids, _, onCleanup) => {
  if (ids === null || !ids) return;
  let cancelled = false;
  onCleanup(() => { cancelled = true; });
  points.value = {};
  loadingPoints.value = true;
  const scores = await Promise.all(ids.split(',').map(async (id): Promise<[string, number | null]> => {
    try {
      const manager = await $fetch<{ id: number; summary_overall_points: number | null }>(`/api/managers/${id}`, { timeout: 12_000, retry: 0 });
      const score = manager.summary_overall_points;
      return [id, String(manager.id) === id && typeof score === 'number' && Number.isFinite(score) ? score : null];
    } catch {
      return [id, null];
    }
  }));
  if (cancelled) return;
  points.value = Object.fromEntries(scores);
  loadingPoints.value = false;
});
const route = useRoute();
watch(() => route.fullPath, () => { open.value = false; });
</script>
