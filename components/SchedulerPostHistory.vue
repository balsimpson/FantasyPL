<script setup lang="ts">
import type { InstagramPlayer } from '~/utils/instagram-templates'
import { instagramTemplates } from '~/utils/instagram-templates'
import { instagramDesigns } from '~/utils/instagram-designs'
import { formatSchedulerDate, schedulerStatusLabels, type SchedulerPostStatus } from '~/utils/scheduler-history'
import SchedulerHistoryPlayerLink from '~/components/SchedulerHistoryPlayerLink.vue'
const props = defineProps<{ players: InstagramPlayer[]; initialSearch?: string }>()
const search = ref(props.initialSearch || '')
const status = ref('all')
const expanded = ref<string[]>([])
const { posts, loading, syncing, error, syncError, hasMore, hasOlder, load, sync, revision } = useSchedulerPostList(search, status)
const statuses = [{ label: 'All posts', value: 'all' }, { label: 'Scheduled', value: 'scheduled' }, { label: 'Published', value: 'published' }, { label: 'Failed', value: 'failed' }, { label: 'Check Buffer', value: 'unknown' }, { label: 'Drafts', value: 'draft' }]
const colors = { submitting: 'info', scheduled: 'primary', published: 'success', failed: 'error', unknown: 'warning', draft: 'neutral', cancelled: 'neutral' } as const
function color(value: SchedulerPostStatus) { return colors[value] }
function toggle(id: string) { expanded.value = expanded.value.includes(id) ? expanded.value.filter(value => value !== id) : [...expanded.value, id] }
async function linked() { revision.value++; await load() }
onMounted(() => sync())
</script>

<template>
  <section aria-labelledby="post-history-heading">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 id="post-history-heading" class="text-xl font-semibold text-highlighted">Post history</h2>
      <UButton icon="i-lucide-refresh-cw" label="Refresh from Buffer" color="neutral" variant="outline" size="sm" :loading="syncing" :disabled="loading" @click="sync()" />
    </div>
    <div class="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
      <UFormField label="Search posts" class="w-full"><UInput v-model="search" placeholder="Search by player or caption" icon="i-lucide-search" class="w-full" :ui="{ base: 'w-full' }" /></UFormField>
      <UFormField label="Status" class="w-full"><USelect v-model="status" :items="statuses" class="w-full" /></UFormField>
    </div>
    <UAlert v-if="syncError" color="warning" title="Buffer could not refresh" :description="`${syncError} Saved history is shown below when available.`" class="mb-4" />
    <UAlert v-if="error" color="error" title="Post history could not load" :description="error" class="mb-4" :actions="[{ label: 'Try again', onClick: () => load() }]" />
    <p v-if="(loading || syncing) && !posts.length" role="status" class="py-12 text-center text-muted">Loading post history…</p>
    <div v-else-if="!posts.length && !error" class="py-14 text-center"><UIcon name="i-lucide-images" class="mb-3 size-7 text-muted" /><p class="font-medium text-highlighted">{{ search || status !== 'all' ? 'No posts match these filters.' : 'No posts recorded yet.' }}</p><p class="mt-2 text-sm text-muted">{{ search || status !== 'all' ? 'Try another player name, caption, or status.' : 'Posts you schedule here will appear with their image, caption, and players.' }}</p></div>
    <div v-else class="divide-y divide-default border-y border-default" :aria-busy="loading || syncing">
      <article v-for="post in posts" :key="post._id" class="grid min-w-0 gap-5 py-6 sm:grid-cols-[180px_minmax(0,1fr)]">
        <a v-if="post.imageUrl" :href="post.imageUrl" target="_blank" rel="noopener" class="block w-full max-w-72 overflow-hidden rounded-lg bg-elevated focus-visible:outline-2 focus-visible:outline-primary"><img :src="post.imageUrl" :alt="post.players.length ? `${post.players.map(player => player.name).join(', ')} post artwork` : 'Instagram post artwork'" class="aspect-square w-full object-contain" loading="lazy" /></a>
        <div v-else class="flex aspect-square w-full max-w-72 items-center justify-center rounded-lg bg-elevated text-sm text-muted">No image on this post</div>
        <div class="min-w-0 space-y-3">
          <div class="flex flex-wrap items-center gap-2"><UBadge :color="color(post.status)" variant="subtle" :label="schedulerStatusLabels[post.status]" /><span v-if="post.gameweek" class="text-xs text-muted">GW {{ post.gameweek }}{{ post.season ? ` · ${post.season}` : '' }}</span><span v-if="post.template" class="text-xs text-muted">{{ instagramTemplates.find(item => item.id === post.template)?.name || post.template }}</span><span v-if="post.design" class="text-xs text-muted">{{ instagramDesigns.find(item => item.id === post.design)?.name || post.design }}</span></div>
          <p v-if="post.players.length" class="font-semibold text-highlighted">{{ post.players.map(player => player.name).join(' · ') }}</p>
          <p v-else class="text-sm text-muted">Players not linked yet</p>
          <p class="max-w-prose whitespace-pre-wrap break-words text-sm leading-relaxed" :class="expanded.includes(post._id) ? '' : 'line-clamp-4'">{{ post.caption || 'No caption on this post.' }}</p>
          <UButton v-if="post.caption.length > 180 || post.caption.split('\n').length > 4" size="xs" color="neutral" variant="link" :label="expanded.includes(post._id) ? 'Show less' : 'Show full caption'" :aria-expanded="expanded.includes(post._id)" @click="toggle(post._id)" />
          <p class="text-xs text-muted">{{ post.status === 'published' && post.sentAt ? `Published ${formatSchedulerDate(post.sentAt)}` : post.dueAt ? `Scheduled ${formatSchedulerDate(post.dueAt)}` : `Created ${formatSchedulerDate(post.createdAt)}` }} IST</p>
          <p v-if="post.error" role="status" class="text-sm text-error">{{ post.error }}</p>
          <p v-if="post.status === 'unknown' || post.status === 'submitting'" class="text-sm text-muted">Check the Buffer queue before scheduling this post again.</p>
          <div class="flex flex-wrap gap-2">
            <UButton v-if="post.externalLink" :to="post.externalLink" target="_blank" rel="noopener" label="View on Instagram" icon="i-lucide-external-link" color="neutral" variant="ghost" size="xs" />
            <UButton v-if="post.bufferPostId" to="https://publish.buffer.com" target="_blank" rel="noopener" label="Open Buffer" icon="i-lucide-external-link" color="neutral" variant="ghost" size="xs" />
          </div>
          <SchedulerHistoryPlayerLink v-if="post.source === 'buffer'" :post="post" :players="players" @saved="linked" />
        </div>
      </article>
    </div>
    <div class="mt-6 flex flex-wrap justify-center gap-3"><UButton v-if="hasMore" label="Load more posts" color="neutral" variant="outline" :loading="loading" :disabled="syncing" @click="load(true)" /><UButton v-if="hasOlder" label="Load older posts from Buffer" color="neutral" variant="ghost" :loading="syncing" :disabled="loading" @click="sync(true)" /></div>
  </section>
</template>
