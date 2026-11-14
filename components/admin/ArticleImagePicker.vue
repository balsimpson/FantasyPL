<script setup lang="ts">
import type { ArticleImage } from '~/shared/article-images'

const open = defineModel<boolean>('open', { required: true })
const props = defineProps<{ mode: 'insert' | 'replace' | 'details'; initial?: ArticleImage | null; suggestedQuery?: string }>()
const emit = defineEmits<{ select: [image: ArticleImage] }>()

const tab = ref<'search' | 'upload'>('search')
const query = ref('')
const results = ref<ArticleImage[]>([])
const searching = ref(false)
const searchError = ref('')
const searchedFor = ref('')
const chosen = ref<ArticleImage | null>(null)
const alt = ref('')
const caption = ref('')
const credit = ref('')
const uploading = ref(false)
const uploadError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
let searchRequest = 0

const title = computed(() => props.mode === 'details' ? 'Photo caption' : props.mode === 'replace' ? 'Replace photo' : 'Add a photo')
const canConfirm = computed(() => !!chosen.value && !!alt.value.trim() && !uploading.value)

watch(open, value => {
  if (!value) return
  searchError.value = ''
  uploadError.value = ''
  chosen.value = props.mode === 'details' && props.initial ? { ...props.initial } : null
  alt.value = props.initial?.alt || ''
  caption.value = props.initial?.caption || ''
  credit.value = props.initial?.source === 'upload' ? props.initial.credit : ''
  if (props.mode !== 'details' && !results.value.length) {
    query.value ||= props.suggestedQuery || 'Premier League football'
    void search()
  }
}, { immediate: true })

async function search() {
  const term = query.value.trim()
  if (!term || searching.value) return
  const request = ++searchRequest
  searching.value = true
  searchError.value = ''
  try {
    const found = await $fetch<ArticleImage[]>('/api/admin/article-images/search', { query: { q: term } })
    if (request !== searchRequest) return
    results.value = found
    searchedFor.value = term
  } catch (cause: any) {
    if (request === searchRequest) searchError.value = cause.data?.statusMessage || 'Photos could not be loaded. Try again.'
  } finally { if (request === searchRequest) searching.value = false }
}

function choose(image: ArticleImage) {
  chosen.value = image
  if (!alt.value.trim() || results.value.some(result => result.alt === alt.value)) alt.value = image.alt
}

function imageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url) }
    img.onerror = () => { reject(new Error('This file could not be read as an image.')); URL.revokeObjectURL(url) }
    img.src = url
  })
}

async function upload(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (fileInput.value) fileInput.value.value = ''
  if (!file) return
  uploadError.value = ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    uploadError.value = 'Choose a JPEG, PNG or WebP image of up to 8 MB.'
    return
  }
  uploading.value = true
  try {
    const size = await imageSize(file)
    const { uploadUrl } = await $fetch<{ uploadUrl: string }>('/api/admin/article-images/upload-url', { method: 'POST' })
    const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
    if (!response.ok) throw new Error('The upload did not finish. Try again.')
    const { storageId } = await response.json() as { storageId: string }
    const { url } = await $fetch<{ url: string }>('/api/admin/article-images/resolve', { method: 'POST', body: { storageId } })
    chosen.value = { src: url, alt: '', caption: '', credit: '', creditUrl: '', license: '', licenseUrl: '', width: size.width, height: size.height, source: 'upload' }
    if (!alt.value.trim()) alt.value = file.name.replace(/\.[a-z]+$/i, '').replace(/[-_]+/g, ' ').slice(0, 300)
  } catch (cause: any) {
    uploadError.value = cause.data?.statusMessage || cause.message || 'The upload did not finish. Try again.'
  } finally { uploading.value = false }
}

function confirm() {
  if (!canConfirm.value || !chosen.value) return
  emit('select', { ...chosen.value, alt: alt.value.trim().slice(0, 300), caption: caption.value.trim().slice(0, 300), ...(chosen.value.source === 'upload' ? { credit: credit.value.trim().slice(0, 200) } : {}) })
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="mode === 'details' ? 'Describe the photo and add an optional caption.' : 'Search free-licence photos on Wikimedia Commons, or upload your own.'" :ui="{ content: mode === 'details' ? 'sm:max-w-lg rounded-none rounded-b-lg' : 'sm:max-w-3xl rounded-none rounded-b-lg' }">
    <template #body>
      <div v-if="mode !== 'details'">
        <div class="flex border-b border-default" role="tablist">
          <button v-for="item in [{ value: 'search', label: 'Free photos' }, { value: 'upload', label: 'Upload' }] as const" :key="item.value" type="button" role="tab" :aria-selected="tab === item.value" class="-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors" :class="tab === item.value ? 'border-primary text-highlighted' : 'border-transparent text-muted hover:text-default'" @click="tab = item.value">{{ item.label }}</button>
        </div>
        <div v-show="tab === 'search'" class="pt-4">
          <form class="flex gap-2" @submit.prevent="search">
            <UInput v-model="query" aria-label="Search photos" placeholder="Try “football bench” or “stadium at night”" icon="i-lucide-search" class="w-full" :maxlength="120" />
            <UButton type="submit" label="Search" color="neutral" variant="outline" :loading="searching" />
          </form>
          <div class="mt-4 h-80 overflow-y-auto pr-1">
            <p v-if="searchError" role="alert" class="text-sm text-error">{{ searchError }}</p>
            <p v-else-if="!searching && searchedFor && !results.length" class="text-sm text-muted">No landscape, free-licence photos for “{{ searchedFor }}”. Try simpler words.</p>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button v-for="image in results" :key="image.src" type="button" class="group text-left" :aria-pressed="chosen?.src === image.src" @click="choose(image)">
                <span class="block aspect-video overflow-hidden rounded-sm bg-elevated outline-2 outline-offset-2" :class="chosen?.src === image.src ? 'outline-primary' : 'outline-transparent group-hover:outline-default'">
                  <img :src="image.src" :alt="image.alt" loading="lazy" decoding="async" class="size-full object-cover">
                </span>
                <span class="mt-1 block truncate text-xs text-muted">{{ image.license }} · {{ image.credit }}</span>
              </button>
              <template v-if="searching && !results.length"><span v-for="index in 6" :key="index" class="aspect-video animate-pulse rounded-sm bg-elevated" /></template>
            </div>
          </div>
        </div>
        <div v-show="tab === 'upload'" class="pt-4">
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="upload">
          <button type="button" class="flex h-80 w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-sm border border-dashed border-default text-sm text-muted hover:border-primary" :disabled="uploading" @click="fileInput?.click()">
            <img v-if="chosen?.source === 'upload'" :src="chosen.src" alt="" class="max-h-full max-w-full object-contain">
            <template v-else>
              <UIcon :name="uploading ? 'i-lucide-loader-circle' : 'i-lucide-upload'" class="size-6" :class="uploading ? 'animate-spin' : ''" />
              <span>{{ uploading ? 'Uploading…' : 'Choose a JPEG, PNG or WebP (up to 8 MB)' }}</span>
            </template>
          </button>
          <p class="mt-2 h-5 text-sm" :class="uploadError ? 'text-error' : 'text-muted'" role="status">{{ uploadError || 'Only upload photos you have the right to publish.' }}</p>
        </div>
      </div>
      <ArticlesArticleImage v-else-if="chosen" :image="{ ...chosen, caption: '' }" eager class="!my-0" />
      <div class="mt-5 grid gap-4" :class="chosen?.source === 'upload' && mode !== 'details' ? 'sm:grid-cols-3' : chosen?.source === 'upload' ? '' : 'sm:grid-cols-2'">
        <UFormField label="Description" help="For screen readers and search." required class="w-full"><UInput v-model="alt" :maxlength="300" class="w-full" :disabled="!chosen" /></UFormField>
        <UFormField label="Caption" help="Optional, shown under the photo." class="w-full"><UInput v-model="caption" :maxlength="300" class="w-full" :disabled="!chosen" /></UFormField>
        <UFormField v-if="chosen?.source === 'upload'" label="Credit" help="Optional photographer or source." class="w-full"><UInput v-model="credit" :maxlength="200" class="w-full" /></UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex w-full items-center justify-between gap-3">
        <span class="text-xs text-muted">{{ chosen?.source === 'commons' && mode !== 'details' ? 'The author and licence are credited under the photo.' : '' }}</span>
        <div class="flex gap-2">
          <UButton label="Cancel" color="neutral" variant="ghost" @click="open = false" />
          <UButton :label="mode === 'details' ? 'Save caption' : mode === 'replace' ? 'Replace photo' : 'Insert photo'" :disabled="!canConfirm" @click="confirm" />
        </div>
      </div>
    </template>
  </UModal>
</template>
