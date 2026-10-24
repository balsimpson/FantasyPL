<template>
  <div class="min-w-0 w-full">
    <UFormField
      label="Search players or clubs"
      :ui="{ root: 'min-w-0 w-full', label: 'text-xs font-semibold text-stone-300' }"
    >
      <UInput
        id="player-search"
        v-model="playerQuery"
        type="search"
        variant="none"
        icon="i-lucide-search"
        placeholder="Haaland or Arsenal"
        autocomplete="off"
        class="w-full"
        :ui="{
          root: 'w-full',
          base: 'h-10 w-full rounded-lg border border-[#303640] bg-[#0c0f13] text-sm font-medium text-stone-100 ring-0 placeholder:text-stone-500 hover:border-[#48515f] hover:bg-[#1b2028] hover:text-stone-100 focus:border-lime-300/60 focus-visible:ring-2 focus-visible:ring-lime-300/50',
          leadingIcon: 'text-stone-400'
        }"
      />
    </UFormField>
  </div>
</template>

<script setup lang="ts">
const playerQuery = defineModel<string>({ default: "" });
</script>
