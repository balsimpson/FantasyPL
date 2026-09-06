<template>
  <section aria-labelledby="fixtures-title" class="grid min-w-0 w-full gap-5">
    <header class="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
      <div>
        <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-stone-400">
          Upcoming fixtures
        </p>
        <h2 id="fixtures-title" class="mt-2 text-2xl font-black leading-none tracking-[-0.03em] text-white sm:text-4xl">
          Next matches
        </h2>
        <p class="mt-2 max-w-xl text-sm leading-6 text-stone-300">
          Kickoff times are shown in your local time.
        </p>
      </div>
      <span v-if="visibleFixtures.length" class="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
        {{ visibleFixtures.length }} next
      </span>
    </header>

    <div v-if="loading" class="min-w-0 overflow-hidden" aria-live="polite">
      <div class="flex gap-3 py-2">
        <div v-for="index in 3" :key="index" class="w-[18rem] shrink-0 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:w-[22rem]">
          <div class="flex items-center justify-between gap-3">
            <USkeleton class="h-3 w-12" />
            <USkeleton class="h-3 w-20" />
          </div>
          <div class="mt-6 flex items-center justify-between gap-3">
            <USkeleton class="size-10 rounded-full" />
            <USkeleton class="h-3 w-6" />
            <USkeleton class="size-10 rounded-full" />
          </div>
          <div class="mt-6 flex justify-between border-t border-white/10 pt-3">
            <USkeleton class="h-3 w-16" />
            <USkeleton class="h-5 w-20" />
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="error" class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-error/25 bg-error/10 px-4 py-4">
      <p class="max-w-xl text-sm leading-6 text-stone-200">
        Fixture data is unavailable right now. The list will return when the source responds.
      </p>
      <UButton color="neutral" variant="outline" @click="$emit('retry')">Try again</UButton>
    </div>

    <div v-else-if="!visibleFixtures.length" class="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-5">
      <p class="text-sm text-stone-300">No upcoming fixtures are currently published.</p>
    </div>

    <div v-else class="min-w-0 overflow-hidden" aria-label="Upcoming fixture cards" role="region">
      <AppCarousel
        class="px-0! py-2!"
        role="list"
        aria-label="Upcoming fixtures"
      >
        <div
          v-for="fixture in visibleFixtures"
          :key="fixture.id"
          class="w-[18rem] shrink-0 snap-start sm:w-[22rem]"
          role="listitem"
        >
          <LazyFixtureCard elevated :fixture="fixture" :bootstrap="fixtureBootstrap" class="h-full" />
        </div>
      </AppCarousel>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  fixtures: {
    type: Array,
    default: () => [],
  },
  teams: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["retry"]);

const fixtureBootstrap = computed(() => ({ teams: props.teams }));

const visibleFixtures = computed(() =>
  [...props.fixtures]
    .filter((fixture) => fixture && fixture.id)
    .sort((a, b) => {
      const aTime = a.kickoff_time ? new Date(a.kickoff_time).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.kickoff_time ? new Date(b.kickoff_time).getTime() : Number.MAX_SAFE_INTEGER;
      return (a.event || Number.MAX_SAFE_INTEGER) - (b.event || Number.MAX_SAFE_INTEGER) || aTime - bTime;
    })
    .slice(0, 6),
);
</script>
