<script setup lang="ts">
import type { InstagramPlayer } from '~/utils/instagram-templates'
import type { SchedulerPostRecord } from '~/utils/scheduler-history'
import { schedulerClientError } from '~/composables/useSchedulerPostList'
const props = defineProps<{ post: SchedulerPostRecord; players: InstagramPlayer[] }>()
const emit = defineEmits<{ saved: [] }>()
const open = ref(false)
const codes = ref<number[]>(props.post.players.map(player => player.code))
const gameweek = ref(props.post.gameweek?.toString() ?? '')
const season = ref(props.post.season ?? '')
const busy = ref(false)
const error = ref('')
const items = computed(() => props.players.map(player => ({ label: `${player.fullName} · ${player.club}`, value: player.code })))
async function save() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/scheduler/link-players', { method: 'POST', body: { postId: props.post._id, season: season.value.trim() || null, gameweek: gameweek.value.trim() ? Number(gameweek.value) : null, players: codes.value.map(code => ({ code, name: props.players.find(player => player.code === code)?.fullName || props.post.players.find(player => player.code === code)?.name })) }, retry: 0 })
    open.value = false
    emit('saved')
  } catch (cause) { error.value = schedulerClientError(cause) }
  finally { busy.value = false }
}
</script>

<template>
  <div>
    <UButton v-if="!open" size="xs" color="neutral" variant="ghost" icon="i-lucide-user-round-plus" :label="post.players.length ? 'Edit linked players' : 'Link players'" @click="open = true" />
    <form v-else class="mt-3 space-y-3" @submit.prevent="save">
      <UFormField label="Players in this post" class="w-full"><USelectMenu v-model="codes" :items="items" multiple value-key="value" class="w-full" :ui="{ base: 'w-full' }" :disabled="busy" /></UFormField>
      <UFormField label="Season" description="Use the season this post covered, such as 2026/27." class="w-full"><UInput v-model="season" class="w-full" :ui="{ base: 'w-full' }" :disabled="busy" /></UFormField>
      <UFormField label="Gameweek" description="Leave blank if you do not know the gameweek." class="w-full"><UInput v-model="gameweek" type="number" min="1" max="100" class="w-full" :ui="{ base: 'w-full' }" :disabled="busy" /></UFormField>
      <p v-if="error" role="alert" class="text-sm text-error">{{ error }}</p>
      <div class="flex gap-2"><UButton type="submit" label="Save players" size="sm" :disabled="!codes.length || codes.length > 5" :loading="busy" /><UButton label="Cancel" size="sm" color="neutral" variant="ghost" :disabled="busy" @click="open = false" /></div>
    </form>
  </div>
</template>
