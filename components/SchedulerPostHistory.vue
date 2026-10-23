<script setup lang="ts">
import type { InstagramPlayer } from '~/utils/instagram-templates'
import { formatSchedulerPostTiming, type SchedulerPostStatus } from '~/utils/scheduler-history'
import SchedulerHistoryPlayerLink from '~/components/SchedulerHistoryPlayerLink.vue'
const props = defineProps<{ players: InstagramPlayer[]; initialSearch?: string }>()
const search = useState('scheduler-history-search', () => props.initialSearch || '')
const status = useState('scheduler-history-status', () => 'all')
const expanded = ref<string[]>([])
const { posts, loading, syncing, error, syncError, hasMore, hasOlder, load, sync, initialize, revision, deleting, deleteError, deleteFailed, dismissSyncError } = useSchedulerPostList(search, status)
const { overview, loading: overviewLoading, error: overviewError, load: loadOverview } = useSchedulerHistoryOverview()
const postTimings = computed(() => Object.fromEntries(posts.value.map(post => [post._id, formatSchedulerPostTiming(post)])))
const metrics = computed(() => [
  { label: 'Posted · 7 days', value: overview.value?.published7Days },
  { label: 'Posted · 30 days', value: overview.value?.published30Days },
  { label: 'Scheduled', value: overview.value?.scheduled },
  { label: 'Failed', value: overview.value?.failed },
])
const statuses = [{ label: 'All posts', value: 'all' }, { label: 'Scheduled', value: 'scheduled' }, { label: 'Published', value: 'published' }, { label: 'Failed', value: 'failed' }, { label: 'Check Buffer', value: 'unknown' }, { label: 'Drafts', value: 'draft' }]
const statusStyles = {
  submitting: { icon: 'i-lucide-send', color: 'text-info' },
  scheduled: { icon: 'i-lucide-clock', color: 'text-info' },
  published: { icon: 'i-lucide-check', color: 'text-success' },
  failed: { icon: 'i-lucide-circle-alert', color: 'text-error' },
  unknown: { icon: 'i-lucide-circle-help', color: 'text-warning' },
  draft: { icon: 'i-lucide-file-pen-line', color: 'text-muted' },
  cancelled: { icon: 'i-lucide-circle-slash', color: 'text-muted' },
} satisfies Record<SchedulerPostStatus, { icon: string; color: string }>
function toggle(id: string) { expanded.value = expanded.value.includes(id) ? expanded.value.filter(value => value !== id) : [...expanded.value, id] }
function linked() { revision.value++ }
onMounted(() => { void initialize(); void loadOverview() })
</script>

<template>
  <section aria-labelledby="post-history-heading" :aria-busy="loading || syncing">
    <div class="mx-auto w-full max-w-5xl">
      <div class="mb-4 grid grid-cols-[minmax(0,1fr)_8rem_auto] items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)_10rem_auto] sm:gap-3">
        <h2 id="post-history-heading" class="col-span-3 text-base font-semibold text-highlighted sm:col-span-1 sm:mr-3">History</h2>
        <UInput v-model="search" aria-label="Search posts" placeholder="Search posts" icon="i-lucide-search" class="w-full" :ui="{ base: 'w-full' }" />
        <USelect v-model="status" aria-label="Post status" :items="statuses" class="w-full" :ui="{ base: 'w-full' }" />
        <UButton icon="i-lucide-refresh-cw" aria-label="Refresh from Buffer" title="Refresh from Buffer" color="neutral" variant="ghost" :loading="loading || syncing" :disabled="loading || syncing || Boolean(deleting)" @click="sync()" />
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
      <div v-if="(loading || syncing) && !posts.length" role="status" class="flex justify-center py-12">
        <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-muted motion-reduce:animate-none" aria-hidden="true" />
        <span class="sr-only">Loading history</span>
      </div>
      <p v-else-if="!posts.length && !error" class="py-10 text-center text-sm text-muted">{{ search || status !== 'all' ? 'No matching posts.' : 'No posts yet.' }}</p>
      <div v-else class="divide-y divide-default border-y border-default">
        <article v-for="post in posts" :key="post._id" class="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] items-start gap-3 py-3 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-4">
          <a v-if="post.imageUrl" :href="post.imageUrl" target="_blank" rel="noopener" class="block overflow-hidden rounded bg-elevated focus-visible:outline-2 focus-visible:outline-primary"><img :src="post.imageUrl" :alt="post.players.length ? `${post.players.map(player => player.name).join(', ')} post artwork` : 'Instagram post artwork'" class="aspect-square w-full object-contain" loading="lazy" width="96" height="96" /></a>
          <div v-else class="flex aspect-square items-center justify-center rounded bg-elevated text-muted"><UIcon name="i-lucide-image-off" class="size-5" aria-hidden="true" /><span class="sr-only">No image</span></div>
          <div class="min-w-0 space-y-1.5">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span class="inline-flex max-w-full items-start gap-1.5 text-xs font-medium" :class="statusStyles[post.status].color">
                <UIcon :name="statusStyles[post.status].icon" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                <time :datetime="postTimings[post._id]?.datetime" :title="postTimings[post._id]?.title">{{ postTimings[post._id]?.label }}</time>
              </span>
              <span v-if="post.gameweek" class="text-xs text-muted">GW {{ post.gameweek }}{{ post.season ? ` · ${post.season}` : '' }}</span>
            </div>
            <a v-if="post.bufferPostId" href="https://publish.buffer.com" target="_blank" rel="noopener" title="Open in Buffer" class="inline-flex items-center gap-1 text-sm font-semibold text-highlighted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-primary">{{ post.players.map(player => player.name).join(' · ') || 'View in Buffer' }}<UIcon name="i-lucide-arrow-up-right" class="size-3 shrink-0 text-muted" aria-hidden="true" /></a>
            <p v-else-if="post.players.length" class="text-sm font-semibold text-highlighted">{{ post.players.map(player => player.name).join(' · ') }}</p>
            <p v-if="post.caption" class="whitespace-pre-wrap break-words text-sm leading-5" :class="expanded.includes(post._id) ? '' : 'line-clamp-2'">{{ post.caption }}</p>
            <UButton v-if="post.caption.length > 100 || post.caption.split('\n').length > 2" size="xs" color="neutral" variant="link" class="p-0" :label="expanded.includes(post._id) ? 'Less' : 'More'" :aria-label="expanded.includes(post._id) ? 'Collapse caption' : 'Expand caption'" :aria-expanded="expanded.includes(post._id)" @click="toggle(post._id)" />
            <p v-if="post.error" role="status" class="text-xs text-error">{{ post.error }}</p>
            <p v-if="post.status === 'unknown' || post.status === 'submitting'" class="text-xs text-muted">Check Buffer before scheduling again.</p>
            <div v-if="post.externalLink || post.source === 'buffer' || post.status === 'failed'" class="flex flex-wrap items-center gap-x-3 gap-y-1">
              <UButton v-if="post.externalLink" :to="post.externalLink" target="_blank" rel="noopener" label="Instagram" icon="i-lucide-external-link" color="neutral" variant="link" size="xs" class="p-0" />
              <SchedulerHistoryPlayerLink v-if="post.source === 'buffer'" :post="post" :players="players" @saved="linked" />
              <UButton v-if="post.status === 'failed'" label="Delete" icon="i-lucide-trash-2" title="Delete from history only" aria-label="Delete failed post from history" size="xs" color="error" variant="link" class="p-0" :loading="deleting === post._id" :disabled="Boolean(deleting) || loading || syncing" @click="deleteFailed(post)" />
            </div>
          </div>
        </article>
      </div>
      <div v-if="hasMore || hasOlder" class="mt-3 flex flex-wrap justify-center gap-2">
        <UButton v-if="hasMore" label="Load more" size="sm" color="neutral" variant="outline" :loading="loading" :disabled="syncing" @click="load(true)" />
        <UButton v-if="hasOlder" label="Older from Buffer" size="sm" color="neutral" variant="ghost" :loading="syncing" :disabled="loading" @click="sync(true)" />
      </div>
    </div>
  </section>
</template>
