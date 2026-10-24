<template>
  <section aria-label="Manager lookup" class="min-w-0">
    <form class="w-full space-y-4" novalidate @submit.prevent="submitManagerId">
      <UFormField
        label="Manager ID"
        :error="managerError || undefined"
        :ui="{ root: 'w-full', label: 'text-xs font-medium text-stone-300', error: 'mt-2 text-sm text-error' }"
      >
        <UInput
          id="manager-id"
          v-model="managerId"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="e.g. 123456"
          :aria-invalid="Boolean(managerError)"
          class="h-11 w-full"
          :ui="{
            root: 'h-11 w-full',
            base: 'h-11 w-full rounded-md border border-white/25 bg-[#181d1c] px-3 text-base font-medium text-white shadow-none ring-0 placeholder:text-stone-500 hover:border-white/40 hover:bg-[#202624] hover:text-white focus:border-lime-300 focus:bg-[#181d1c] focus:text-white focus:ring-2 focus:ring-lime-300/25'
          }"
          @input="managerError = ''"
        />
      </UFormField>
      <UButton
        type="submit"
        color="primary"
        variant="solid"
        trailing-icon="i-lucide-arrow-right"
        :loading="isSubmitting"
        :disabled="isSubmitting || !managerId.trim()"
        class="h-11 w-full justify-center rounded-md bg-lime-300 px-4 text-sm font-semibold text-zinc-950 hover:bg-lime-200 disabled:bg-lime-300/25 disabled:text-lime-100/60"
      >
        Open team
      </UButton>
    </form>
  </section>
</template>

<script setup>
const emit = defineEmits(["opened"]);
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
    managerError.value = "Enter a valid numeric Manager ID.";
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
