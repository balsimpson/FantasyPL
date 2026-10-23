<script setup lang="ts">
import type { InstagramPlayer } from '~/utils/instagram-templates'
import SchedulerPlayerName from '~/components/SchedulerPlayerName.vue'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
withDefaults(defineProps<{ player?: InstagramPlayer, width?: number, compact?: boolean }>(), { width: 440, compact: false })
</script>

<template>
  <div class="flex h-full min-h-0 flex-col" data-comparison-portrait>
    <template v-if="player">
      <div class="relative z-10 shrink-0 px-5 pt-4">
        <SchedulerPlayerName :player="player" :width="width - 40" :max-size="compact ? 42 : 60" single-line />
        <div class="mt-3 flex min-h-[52px] items-center gap-3">
          <SchedulerArtworkAsset :src="player.crestUrl" :label="`${player.club} crest`" class="h-[48px] w-[48px] shrink-0 text-[24px]" />
          <div class="min-w-0 text-[21px] font-semibold leading-tight"><p>{{ player.club }}</p><p class="mt-1 text-[17px] uppercase opacity-75">{{ player.position }}</p></div>
        </div>
      </div>
      <div class="relative min-h-0 flex-1"><SchedulerPlayerPhoto :player="player" class="absolute inset-0 border-b-0! text-[42px]" /></div>
    </template>
    <p v-else class="m-auto px-5 text-center text-[26px] opacity-70">Choose a second player</p>
  </div>
</template>
