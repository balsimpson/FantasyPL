<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })
useSeoMeta({ title: 'Sharing | FPL Insights' })
const { data, pending, error, refresh } = await useFetch('/api/admin/manager-share-stats')
const format = (value: number) => new Intl.NumberFormat('en-GB').format(value)
</script>

<template>
  <section class="grid gap-6">
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">Manager sharing</h1>
        <p class="mt-1 text-sm text-muted">Last 30 days · UTC</p>
      </div>
      <UButton label="Refresh" icon="i-lucide-refresh-cw" color="neutral" variant="outline" :loading="pending" @click="refresh()" />
    </header>
    <UAlert v-if="error" color="error" title="Share statistics are unavailable." />
    <USkeleton v-else-if="pending && !data" class="h-24 w-full" />
    <template v-else-if="data">
      <dl class="grid grid-cols-2 gap-6 border-y border-default py-6">
        <div><dt class="text-sm text-muted">Share clicks</dt><dd class="mt-2 text-3xl font-bold tabular-nums text-highlighted">{{ format(data.clicks) }}</dd></div>
        <div><dt class="text-sm text-muted">Links copied</dt><dd class="mt-2 text-3xl font-bold tabular-nums text-highlighted">{{ format(data.copies) }}</dd></div>
      </dl>
      <div v-if="data.days.length" class="overflow-x-auto">
        <table class="w-full text-left text-sm tabular-nums">
          <thead><tr class="border-b border-default"><th class="py-3 font-medium">Date</th><th class="py-3 text-right font-medium">Share clicks</th><th class="py-3 text-right font-medium">Links copied</th></tr></thead>
          <tbody><tr v-for="day in data.days" :key="day.day" class="border-b border-default"><td class="py-3">{{ day.day }}</td><td class="py-3 text-right">{{ format(day.clicks) }}</td><td class="py-3 text-right">{{ format(day.copies) }}</td></tr></tbody>
        </table>
      </div>
    </template>
  </section>
</template>
