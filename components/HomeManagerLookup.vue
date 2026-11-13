<template>
  <div :role="homepage ? undefined : 'region'" :aria-label="homepage ? undefined : 'Manager lookup'" class="min-w-0">
    <template v-if="!homepage">
      <h2 class="text-base font-semibold text-white">Your team and friends</h2>
      <p class="mt-2 text-sm leading-6 text-stone-300">See your squad, gaps and suggested transfers. Open each manager once to save their team and compare season points here.</p>
    </template>
    <form class="w-full" :class="homepage ? undefined : 'mt-4'" novalidate @submit.prevent="submitManagerId">
      <UFormField
        :label="homepage ? 'FPL Team ID' : 'Manager ID'"
        :error="managerError || undefined"
        :ui="{ root: 'w-full', label: 'text-xs font-medium text-stone-300', error: 'mt-2 text-sm text-error' }"
      >
        <div class="flex w-full items-center gap-2">
          <UInput
            v-model="managerId"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            :placeholder="homepage ? undefined : 'e.g. 123456'"
            :aria-describedby="managerError ? undefined : helpId"
            class="h-11 min-w-0 flex-1"
            :ui="{
              root: 'h-11 w-full min-w-0 flex-1',
              base: 'h-11 w-full rounded-md border border-white/25 bg-[#181d1c] px-3 text-base font-medium text-white shadow-none ring-0 placeholder:text-stone-500 hover:border-white/40 hover:bg-[#202624] hover:text-white focus:border-lime-300 focus:bg-[#181d1c] focus:text-white focus:ring-2 focus:ring-lime-300/25'
            }"
            @input="managerError = ''"
          />
          <UButton
            type="submit"
            color="primary"
            variant="solid"
            :icon="homepage ? undefined : 'i-lucide-arrow-right'"
            :trailing-icon="homepage ? 'i-lucide-arrow-right' : undefined"
            :label="homepage ? 'Open team' : undefined"
            aria-label="Open team"
            title="Open team"
            :loading="isSubmitting"
            :disabled="isSubmitting || !managerId.trim()"
            class="h-11 shrink-0 justify-center rounded-md bg-lime-300 text-zinc-950 hover:bg-lime-200 disabled:bg-lime-300/25 disabled:text-lime-100/60"
            :class="homepage ? 'whitespace-nowrap px-3 sm:px-4' : 'w-11'"
          />
        </div>
      </UFormField>
      <p :id="helpId" class="mt-2 text-xs leading-5 text-stone-400">
        <a href="https://fantasy.premierleague.com/en/my-team" target="_blank" rel="noopener" class="rounded-sm font-semibold text-lime-300 underline underline-offset-2 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">Open Fantasy Premier League</a>
        to sign in. Select <strong class="font-semibold text-stone-200">Points</strong> and copy the number after <code>/entry/</code> in the address bar.
      </p>
    </form>
  </div>
</template>

<script setup>
const props = defineProps({ homepage: Boolean });
const emit = defineEmits(["opened"]);
const helpId = `${useId()}-manager-help`;
const managerId = ref("");
const managerError = ref("");
const isSubmitting = ref(false);

onMounted(() => {
  try {
    managerId.value = localStorage.getItem("savedManagerId") || "";
  } catch {
    managerId.value = "";
  }
});

const submitManagerId = async () => {
  const normalizedId = managerId.value.trim().replace(/^0+(?=\d)/, "");

  if (!/^\d+$/.test(normalizedId) || !Number.isSafeInteger(Number(normalizedId)) || Number(normalizedId) < 1) {
    managerError.value = props.homepage ? "Enter a valid FPL Team ID using digits only." : "Enter a valid numeric Manager ID.";
    return;
  }

  isSubmitting.value = true;

  try {
    await navigateTo(`/manager/${normalizedId}`);
    emit("opened");
  } finally {
    isSubmitting.value = false;
  }
};
</script>
