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
        <h2 id="saved-teams-title" class="mb-1 text-sm font-semibold text-stone-200">Saved teams</h2>
        <ul class="-mx-5 max-h-64 overflow-y-auto divide-y divide-white/10">
          <li v-for="manager in savedManagers" :key="manager.id">
            <NuxtLink :to="`/manager/${manager.id}`" class="group box-border flex w-full items-center justify-between gap-3 rounded-md border border-transparent px-5 py-3.5 transition-colors hover:border-white/10 hover:bg-white/[0.08] focus-visible:border-lime-300 focus-visible:bg-white/[0.08] focus-visible:outline-none" @click="open = false">
              <div class="min-w-0">
                <span class="block text-sm font-semibold text-white [overflow-wrap:anywhere]">{{ manager.teamName }}</span>
                <span v-if="manager.managerName" class="mt-1 block text-xs text-stone-400 [overflow-wrap:anywhere]">{{ manager.managerName }}</span>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span class="rounded border border-white/15 px-1.5 py-1 text-[11px] leading-none text-stone-300 tabular-nums">ID {{ manager.id }}</span>
                <UIcon name="i-lucide-chevron-right" class="size-4 text-stone-500 group-hover:text-lime-300" aria-hidden="true" />
              </div>
            </NuxtLink>
          </li>
        </ul>
      </section>
      <HomeManagerLookup class="bg-[#101514] p-5" @opened="open = false" />
    </template>
  </UPopover>
</template>

<script setup lang="ts">
const open = ref(false);
const { savedManagers } = useSavedManagers();
const route = useRoute();
watch(() => route.fullPath, () => { open.value = false; });
</script>
