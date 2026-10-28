<script setup lang="ts">
import type { InstagramPlayer } from '~/utils/instagram-templates'
import type { SchedulerPostRecord, SchedulerPostStatus, formatSchedulerPostTiming } from '~/utils/scheduler-history'
import SchedulerInstagramPost from '~/components/SchedulerInstagramPost.vue'
import SchedulerHistoryPlayerLink from '~/components/SchedulerHistoryPlayerLink.vue'
import { splitInstagramCaption } from '~/utils/instagram-caption'

const props = defineProps<{
  post: SchedulerPostRecord
  platform: 'instagram' | 'x'
  players: InstagramPlayer[]
  timing: ReturnType<typeof formatSchedulerPostTiming>
  deleting: boolean
  retrying: boolean
  disabled: boolean
}>()
const emit = defineEmits<{ linked: []; delete: [post: SchedulerPostRecord]; retry: [post: SchedulerPostRecord, caption: string] }>()
const imageFailed = ref(false)
const editingRetry = ref(false)
const retryCaption = ref(props.post.caption)
const playerNames = computed(() => props.post.players.map(player => player.name).join(' · '))
const captionParts = computed(() => splitInstagramCaption(props.post.caption))
const playerLink = useTemplateRef<InstanceType<typeof SchedulerHistoryPlayerLink>>('playerLink')
const menuItems = computed(() => [
  ...(props.post.bufferPostId ? [{ label: 'Open in Buffer', icon: 'i-lucide-arrow-up-right', to: 'https://publish.buffer.com', target: '_blank' }] : []),
  ...(props.post.source === 'buffer' ? [{ label: props.post.players.length ? 'Edit player links' : 'Link players', icon: 'i-lucide-user-round-plus', onSelect: () => playerLink.value?.edit() }] : []),
  { label: 'Delete from history', icon: 'i-lucide-trash-2', color: 'error' as const, disabled: props.disabled, onSelect: () => emit('delete', props.post) },
])
const statusStyles = {
  submitting: { icon: 'i-lucide-send', color: 'text-info' },
  scheduled: { icon: 'i-lucide-clock', color: 'text-info' },
  published: { icon: 'i-lucide-check', color: 'text-success' },
  failed: { icon: 'i-lucide-circle-alert', color: 'text-error' },
  unknown: { icon: 'i-lucide-circle-help', color: 'text-warning' },
  draft: { icon: 'i-lucide-file-pen-line', color: 'text-muted' },
  cancelled: { icon: 'i-lucide-circle-slash', color: 'text-muted' },
} satisfies Record<SchedulerPostStatus, { icon: string; color: string }>
watch(() => props.post.imageUrl, () => { imageFailed.value = false })
</script>

<template>
  <SchedulerInstagramPost role="listitem" class="mb-4 break-inside-avoid" :show-actions="platform !== 'x'">
    <template v-if="platform === 'x'" #identity>X</template>
    <template #identity-status>
      <span class="inline-flex shrink-0" :class="timing.awaitingConfirmation ? 'text-warning' : statusStyles[post.status].color" role="img" :aria-label="timing.label" :title="timing.label"><UIcon :name="statusStyles[post.status].icon" class="size-3.5" aria-hidden="true" /></span>
    </template>
    <template #subtitle>
      <a v-if="post.bufferPostId" href="https://publish.buffer.com" target="_blank" rel="noopener" title="Open in Buffer" class="break-words underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary">{{ playerNames || 'View in Buffer' }}</a>
      <span v-else-if="playerNames" class="break-words">{{ playerNames }}</span>
    </template>
    <template #header-actions>
      <UDropdownMenu :items="menuItems">
        <UButton icon="i-lucide-ellipsis" color="neutral" variant="ghost" size="xs" :aria-label="`Post options for ${playerNames || 'Instagram post'}`" :loading="deleting" />
      </UDropdownMenu>
    </template>

    <a v-if="post.imageUrl && !imageFailed" :href="post.externalLink || post.imageUrl" :title="post.externalLink ? `Open on ${platform === 'x' ? 'X' : 'Instagram'}` : 'View full artwork'" target="_blank" rel="noopener" class="block aspect-square bg-elevated focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary">
      <img :src="post.imageUrl" :alt="playerNames ? `${playerNames} post artwork` : 'Post artwork'" class="size-full object-contain" loading="lazy" decoding="async" width="1080" height="1080" @error="imageFailed = true" />
    </a>
    <div v-else class="flex aspect-square items-center justify-center bg-elevated text-muted">
      <UIcon name="i-lucide-image-off" class="size-8" aria-hidden="true" />
      <span class="sr-only">{{ imageFailed ? 'Image unavailable' : 'No image' }}</span>
    </div>

    <template #caption>
      <p v-if="post.caption" class="whitespace-pre-wrap break-words text-xs leading-relaxed text-default"><span v-if="platform === 'instagram'" class="mr-1 font-semibold text-highlighted">fplinsights</span><span v-for="(part, index) in captionParts" :key="index" :class="part.hashtag ? 'text-blue-600 dark:text-blue-400' : ''">{{ part.text }}</span></p>
      <div class="mt-3 space-y-1.5">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
          <time :datetime="timing.datetime" :title="timing.title">{{ timing.timeLabel }}</time>
          <span v-if="post.gameweek || post.season"><span v-if="post.gameweek">GW {{ post.gameweek }}</span>{{ post.gameweek && post.season ? ' · ' : '' }}{{ post.season }}</span>
        </div>
        <p v-if="post.error" role="status" class="text-xs text-error">{{ post.error }}</p>
        <p v-if="post.status === 'unknown' || post.status === 'submitting'" class="text-xs text-muted">Check Buffer before scheduling again.</p>
        <template v-if="platform === 'x' && post.status === 'failed' && post.source === 'scheduler' && !post.bufferPostId">
          <UButton v-if="!editingRetry" label="Retry X post" size="xs" color="neutral" variant="soft" :disabled="disabled" @click="editingRetry = true" />
          <form v-else class="space-y-2" @submit.prevent="emit('retry', post, retryCaption)">
            <UFormField label="X caption" class="w-full"><UTextarea v-model="retryCaption" aria-label="X caption for retry" :rows="3" autoresize class="w-full" :ui="{ base: 'w-full' }" :disabled="retrying" /></UFormField>
            <div class="flex gap-2"><UButton type="submit" label="Retry X post" size="xs" :loading="retrying" :disabled="!retryCaption.trim() || disabled" /><UButton label="Cancel" size="xs" color="neutral" variant="ghost" :disabled="retrying" @click="editingRetry = false" /></div>
          </form>
        </template>
        <SchedulerHistoryPlayerLink v-if="post.source === 'buffer'" ref="playerLink" :show-trigger="false" :platform="platform" :post="post" :players="players" @saved="$emit('linked')" />
      </div>
    </template>
  </SchedulerInstagramPost>
</template>
