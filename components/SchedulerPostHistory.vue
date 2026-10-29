<script setup lang="ts">
import type { InstagramPlayer } from '~/utils/instagram-templates'
import { formatSchedulerPostTiming } from '~/utils/scheduler-history'
import SchedulerHistoryPostCard from '~/components/SchedulerHistoryPostCard.vue'
import { useSchedulerClock } from '~/composables/useSchedulerClock'
const props = defineProps<{ players: InstagramPlayer[]; platform: 'instagram' | 'x'; initialSearch?: string }>()
const emit = defineEmits<{ 'update:platform': [value: 'instagram' | 'x'] }>()
const search = useState(`scheduler-history-search-${props.platform}`, () => props.initialSearch || '')
const status = useState(`scheduler-history-status-${props.platform}`, () => 'all')
const { posts, loading, syncing, error, syncError, hasMore, hasOlder, load, sync, initialize, revision, deleting, deleteError, deleteEntry, retrying, retryError, retryX, retryInstagram, dismissSyncError } = useSchedulerPostList(search, status, props.platform)
const { overview, loading: overviewLoading, error: overviewError, load: loadOverview } = useSchedulerHistoryOverview(props.platform)
const now = useSchedulerClock()
const postTimings = computed(() => Object.fromEntries(posts.value.map(post => [post._id, formatSchedulerPostTiming(post, now.value)])))
const metrics = computed(() => [
  { label: 'Posted · 7 days', value: overview.value?.published7Days },
  { label: 'Posted · 30 days', value: overview.value?.published30Days },
  { label: 'Scheduled', value: overview.value?.scheduled },
  { label: 'Failed', value: overview.value?.failed },
])
const statuses = [{ label: 'All posts', value: 'all' }, { label: 'Scheduled', value: 'scheduled' }, { label: 'Published', value: 'published' }, { label: 'Failed', value: 'failed' }, { label: 'Check Buffer', value: 'unknown' }, { label: 'Drafts', value: 'draft' }]
const platforms = [{ label: 'Instagram', value: 'instagram' }, { label: 'X', value: 'x' }]
function linked() { revision.value++ }
onMounted(() => { void initialize(); void loadOverview() })
</script>

<template>
  <section aria-labelledby="post-history-heading" class="@container" :aria-busy="loading || syncing">
    <div class="w-full">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h2 id="post-history-heading" class="text-base font-semibold text-highlighted">History</h2>
        <USelect :model-value="platform" aria-label="History channel" :items="platforms" class="w-36" :ui="{ base: 'w-full' }" @update:model-value="emit('update:platform', $event as 'instagram' | 'x')" />
      </div>
      <div class="mb-4 grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_10rem] sm:gap-3">
        <UInput v-model="search" aria-label="Search posts" placeholder="Search posts" icon="i-lucide-search" class="w-full" :ui="{ base: 'w-full' }" />
        <USelect v-model="status" aria-label="Post status" :items="statuses" class="w-full" :ui="{ base: 'w-full' }" />
      </div>
      <dl class="mb-2 grid grid-cols-2 gap-x-6 gap-y-3 border-b border-default pb-3 sm:grid-cols-4" :aria-busy="overviewLoading">
        <div v-for="metric in metrics" :key="metric.label">
          <dt class="text-xs text-muted">{{ metric.label }}</dt>
          <dd class="mt-1 text-xl font-semibold text-highlighted tabular-nums">
            <USkeleton v-if="overviewLoading && !overview" class="h-7 w-10" />
            <span v-else>{{ metric.value ?? '—' }}</span>
          </dd>
        </div>
      </dl>
      <div class="mb-4 flex items-center gap-2 text-xs text-muted">
        <span>Saved history{{ overview?.undatedPublished ? ' · Undated posts excluded from posted counts' : '' }}</span>
        <UIcon v-if="overviewLoading && overview" name="i-lucide-loader-circle" class="size-3 animate-spin motion-reduce:animate-none" aria-label="Updating overview" />
      </div>
      <p v-if="overviewError" role="status" class="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">Overview unavailable. <UButton label="Retry" size="xs" color="neutral" variant="link" class="p-0" :loading="overviewLoading" @click="loadOverview(true)" /></p>
      <div v-if="syncError" role="status" class="mb-3 flex items-center gap-2 text-xs text-muted">
        <UIcon name="i-lucide-cloud-off" class="size-4 shrink-0" aria-hidden="true" />
        <p class="min-w-0 flex-1">{{ posts.length ? 'Showing saved history.' : 'Buffer refresh unavailable.' }} {{ syncError }}</p>
        <UButton icon="i-lucide-x" aria-label="Dismiss refresh notice" size="xs" color="neutral" variant="ghost" @click="dismissSyncError()" />
      </div>
      <UAlert v-if="error" color="error" title="History could not load" :description="error" class="mb-3" :actions="[{ label: 'Retry', onClick: () => load() }]" />
      <UAlert v-if="deleteError" color="error" title="Post could not be deleted" :description="deleteError" class="mb-3" />
      <UAlert v-if="retryError" color="error" title="Post could not be retried" :description="retryError" class="mb-3" />
      <div v-if="(loading || syncing) && !posts.length" role="status" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-muted motion-reduce:animate-none" aria-hidden="true" />
        <span class="sr-only">Loading history</span>
      </div>
      <p v-else-if="!posts.length && !error" class="py-10 text-center text-sm text-muted">{{ search || status !== 'all' ? 'No matching posts.' : 'No posts yet.' }}</p>
      <div v-else role="list" :aria-label="`${platform === 'x' ? 'X' : 'Instagram'} post history`" class="columns-1 gap-4 @[32rem]:columns-2 @[52rem]:columns-3 @[72rem]:columns-4">
        <SchedulerHistoryPostCard v-for="post in posts" :key="post._id" :post="post" :platform="platform" :players="players" :timing="postTimings[post._id]" :deleting="deleting === post._id" :retrying="retrying === post._id" :disabled="Boolean(deleting) || Boolean(retrying) || loading || syncing" @linked="linked" @delete="deleteEntry" @retry="retryX" @retry-instagram="retryInstagram" />
      </div>
      <div v-if="hasMore || hasOlder" class="mt-3 flex flex-wrap justify-center gap-2">
        <UButton v-if="hasMore" label="Load more" size="sm" color="neutral" variant="outline" :loading="loading" :disabled="syncing" @click="load(true)" />
        <UButton v-if="hasOlder" label="Older from Buffer" size="sm" color="neutral" variant="ghost" :loading="syncing" :disabled="loading" @click="sync(true)" />
      </div>
    </div>
  </section>
</template>
