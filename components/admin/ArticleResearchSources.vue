<script setup lang="ts">
interface PreferredSource {
  _id: string
  name: string
  hostname: string
  url: string
  rank: number
}

const { data: sources, error: loadError, refresh } = await useFetch<PreferredSource[]>('/api/admin/research/sources', { default: () => [] })
const name = ref('')
const url = ref('')
const saving = ref(false)
const busyId = ref('')
const message = ref('')
const actionError = ref('')

async function addSource() {
  if (saving.value) return
  saving.value = true
  message.value = ''
  actionError.value = ''
  try {
    await $fetch('/api/admin/research/sources', { method: 'POST', body: { name: name.value, url: url.value } })
    name.value = ''
    url.value = ''
    message.value = 'Source added to the end of the priority list.'
    await refresh()
  } catch (cause: any) {
    actionError.value = cause.data?.statusMessage || 'The source could not be added.'
  } finally { saving.value = false }
}

async function moveSource(source: PreferredSource, direction: 'up' | 'down') {
  if (busyId.value) return
  busyId.value = source._id
  message.value = ''
  actionError.value = ''
  try {
    await $fetch(`/api/admin/research/sources/${source._id}`, { method: 'PATCH', body: { direction } })
    await refresh()
  } catch (cause: any) {
    actionError.value = cause.data?.statusMessage || 'The source order could not be changed.'
  } finally { busyId.value = '' }
}

async function removeSource(source: PreferredSource) {
  if (busyId.value) return
  busyId.value = source._id
  message.value = ''
  actionError.value = ''
  try {
    await $fetch(`/api/admin/research/sources/${source._id}`, { method: 'DELETE' })
    message.value = `${source.name} was removed.`
    await refresh()
  } catch (cause: any) {
    actionError.value = cause.data?.statusMessage || 'The source could not be removed.'
  } finally { busyId.value = '' }
}
</script>

<template>
  <section aria-labelledby="research-sources-title" class="mt-10 border-t border-default pt-7">
    <div>
      <h2 id="research-sources-title" class="text-xl font-semibold tracking-tight text-highlighted">Preferred research sources</h2>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-muted">Research checks these publishers first, in order, and can still find relevant sources elsewhere. Each run keeps its own citations.</p>
    </div>

    <UAlert v-if="loadError || actionError" title="Source list could not be updated" :description="actionError || loadError?.data?.statusMessage || 'Please try again.'" color="error" variant="soft" class="mt-5" />
    <p v-if="message" role="status" class="mt-4 text-sm text-success">{{ message }}</p>

    <ol v-if="sources?.length" class="mt-5 divide-y divide-default">
      <li v-for="(source, index) in sources" :key="source._id" class="flex flex-wrap items-center gap-3 py-3 first:pt-0">
        <span class="w-7 shrink-0 text-sm tabular-nums text-muted">{{ index + 1 }}.</span>
        <div class="min-w-0 flex-1">
          <p class="break-words font-medium text-highlighted">{{ source.name }}</p>
          <a :href="source.url" target="_blank" rel="noopener noreferrer" class="break-all text-sm text-primary underline underline-offset-4">{{ source.hostname }}</a>
        </div>
        <div class="flex items-center gap-1">
          <UButton icon="i-lucide-arrow-up" color="neutral" variant="ghost" size="sm" :disabled="index === 0 || !!busyId" :aria-label="`Move ${source.name} up`" @click="moveSource(source, 'up')" />
          <UButton icon="i-lucide-arrow-down" color="neutral" variant="ghost" size="sm" :disabled="index === sources.length - 1 || !!busyId" :aria-label="`Move ${source.name} down`" @click="moveSource(source, 'down')" />
          <UButton icon="i-lucide-trash-2" color="neutral" variant="ghost" size="sm" :loading="busyId === source._id" :disabled="!!busyId" :aria-label="`Remove ${source.name}`" @click="removeSource(source)" />
        </div>
      </li>
    </ol>
    <p v-else class="mt-5 text-sm text-muted">No preferred publishers yet. Research will search broadly.</p>

    <form class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] sm:items-end" @submit.prevent="addSource">
      <UFormField label="Publisher name" class="w-full">
        <UInput v-model="name" class="w-full" maxlength="100" autocomplete="organization" required />
      </UFormField>
      <UFormField label="Website" class="w-full">
        <UInput v-model="url" class="w-full" type="url" autocomplete="url" required />
      </UFormField>
      <UButton type="submit" label="Add source" icon="i-lucide-plus" :loading="saving" />
    </form>
  </section>
</template>
