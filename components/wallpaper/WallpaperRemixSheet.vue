<script setup lang="ts">
import type { useWallpaperStudio } from '~/composables/useWallpaperStudio'
import { describeRemix, generateRemix, type RemixDepthMode, type WallpaperRecipe } from '~/utils/wallpaper-remix'
import WallpaperThumb from '~/components/wallpaper/WallpaperThumb.vue'

// Preview-only contact sheet: nine generated remixes for one real player,
// three per depth mode, rendered by the same artwork component as the editor.
const props = defineProps<{ studio: ReturnType<typeof useWallpaperStudio> }>()
const { player, remixModelFor, remixContext } = props.studio
const route = useRoute()
const router = useRouter()
const base = computed(() => {
  const value = Number(route.query.sheet)
  return Number.isInteger(value) && value > 1 ? value : 20261113
})
const modes: Array<{ id: RemixDepthMode; label: string }> = [
  { id: 'flat', label: 'Flat' },
  { id: 'layered', label: 'Layered' },
  { id: 'sculpted', label: 'Sculpted' },
]
const rows = computed(() => {
  const current = player.value
  if (!current) return []
  let previous: WallpaperRecipe | null = null
  return modes.map((mode, row) => ({
    ...mode,
    items: Array.from({ length: 3 }, (_, column) => {
      // One in three uses the player's club colours.
      const context = { ...remixContext(current), palette: column === 1 ? 'club' as const : 'signature' as const }
      const recipe: WallpaperRecipe = generateRemix({ ...context, seed: base.value + row * 101 + column * 7, depth: mode.id, previous })
      previous = recipe
      return { recipe, model: remixModelFor(recipe, current, {}), label: describeRemix(recipe) }
    }),
  }))
})
function shuffle() {
  void router.replace({ query: { ...route.query, sheet: String(Math.floor(Math.random() * 1e9) + 2) } })
}
const editorLink = (code: string) => ({ path: '/wallpaper', query: { player: String(player.value?.code ?? ''), remix: code } })
</script>

<template>
  <div class="site-content-rail py-8">
    <header class="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Preview</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-white">Remix contact sheet</h1>
        <p class="mt-1 text-sm text-stone-400">{{ player?.fullName }} · sheet {{ base }}</p>
      </div>
      <UButton label="Shuffle sheet" icon="i-lucide-dices" color="primary" variant="soft" @click="shuffle" />
    </header>
    <section v-for="row in rows" :key="row.id" class="mb-10" :aria-label="row.label">
      <h2 class="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">{{ row.label }}</h2>
      <div class="grid grid-cols-3 gap-5" data-remix-sheet-row>
        <figure v-for="item in row.items" :key="item.recipe.code" class="min-w-0">
          <div class="overflow-hidden rounded-[18px] ring-1 ring-white/10"><WallpaperThumb :model="item.model" /></div>
          <figcaption class="mt-2 text-xs leading-relaxed text-stone-400">
            <span class="block text-stone-200">{{ item.label }}</span>
            <NuxtLink :to="editorLink(item.recipe.code)" class="font-mono text-[11px] text-[#c8ff3d] hover:underline">{{ item.recipe.code }}</NuxtLink>
          </figcaption>
        </figure>
      </div>
    </section>
  </div>
</template>
