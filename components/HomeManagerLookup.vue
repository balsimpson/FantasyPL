<template>
  <section aria-labelledby="manager-lookup-title" class="min-w-0">
    <h2 id="manager-lookup-title" class="sr-only">Open a team</h2>
    <form class="w-full" novalidate @submit.prevent="submitManagerId">
      <UFormField
        label="Manager ID"
        :error="managerError || undefined"
        :ui="{ root: 'w-full', label: 'text-sm font-semibold text-stone-200', help: 'text-xs text-stone-400', error: 'mt-2 text-sm text-error' }"
      >
        <div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <UInput
          id="manager-id"
          v-model="managerId"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="e.g. 123456"
          :aria-invalid="Boolean(managerError)"
          class="w-full"
          :ui="{
            root: 'w-full',
            base: 'w-full rounded-xl border border-accented bg-default h-12 text-base font-medium text-highlighted placeholder:text-muted hover:bg-elevated focus:border-primary/60 focus:ring-2 focus:ring-primary/25'
          }"
          @input="managerError = ''"
        />
      <UButton
        type="submit"
        color="primary"
        :loading="isSubmitting"
        :disabled="isSubmitting || !managerId.trim()"
        class="h-12 justify-center px-4"
      >
        Open team
      </UButton>
        </div>
      </UFormField>
    </form>
    <p class="mt-1 text-xs text-stone-400">Find the ID in your FPL team URL, after /entry/.</p>
  </section>
</template>

<script setup>
const managerId = ref("");
const managerError = ref("");
const isSubmitting = ref(false);

onMounted(() => {
  managerId.value = localStorage.getItem("savedManagerId") || "";
});

const submitManagerId = async () => {
  const normalizedId = managerId.value.trim();

  if (!/^\d+$/.test(normalizedId) || Number(normalizedId) < 1) {
    managerError.value = "Enter a valid numeric Manager ID.";
    return;
  }

  isSubmitting.value = true;

  try {
    await navigateTo(`/manager/${normalizedId}`);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
