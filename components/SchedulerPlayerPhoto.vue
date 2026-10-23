<script setup lang="ts">
import type { InstagramPlayer } from '~/utils/instagram-templates'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
defineProps<{ player: InstagramPlayer }>()
</script>

<template>
  <SchedulerArtworkAsset class="border-b border-transparent" :key="`${player.id}:${player.code}:${player.photoUrl}`" :src="player.photoUrl" :label="player.fullName" :data-player-code="player.code" />
</template>
