import { useSchedulerLayouts } from '~/composables/useSchedulerLayouts'
import {
  defaultWallpaperPrefs, defaultWallpaperStats, getWallpaperColours, getWallpaperDesign, isWallpaperDesign, normalizeWallpaperPlayers, wallpaperDesigns,
  parseWallpaperLayouts, parseWallpaperPrefs, wallpaperBackgroundText, wallpaperLayoutsKey, wallpaperPrefsKey, wallpaperStatView,
  type WallpaperArtworkModel, type WallpaperCatalogue, type WallpaperDesignId, type WallpaperPalette, type WallpaperPlayer, type WallpaperPrefs, type WallpaperStatKey,
} from '~/utils/wallpaper'

// A clock that ticks on each minute boundary, for the preview only.
function useMinuteClock() {
  const now = ref(Date.now())
  let timeout: ReturnType<typeof setTimeout> | undefined
  function tick() {
    now.value = Date.now()
    timeout = setTimeout(tick, 60_000 - (Date.now() % 60_000) + 50)
  }
  onMounted(tick)
  onBeforeUnmount(() => { if (timeout) clearTimeout(timeout) })
  return now
}

export function useWallpaperStudio() {
  const route = useRoute()
  const router = useRouter()
  const request = useFetch<WallpaperCatalogue>('/api/wallpaper/players', { key: 'wallpaper-players' })
  const { data } = request

  const players = computed(() => data.value?.players ? normalizeWallpaperPlayers(data.value.players, data.value.teams) : [])
  const byCode = computed(() => new Map(players.value.map(player => [player.code, player])))
  const featured = computed(() => [...players.value].sort((a, b) => (b.values.total_points ?? -1) - (a.values.total_points ?? -1) || a.id - b.id)[0])

  // The URL wins over saved choices so shared links open the same player and design.
  const queryCode = Number(route.query.player)
  const queryDesign = route.query.design
  const prefs = ref<WallpaperPrefs>({ ...defaultWallpaperPrefs(), ...(Number.isInteger(queryCode) && queryCode > 0 ? { playerCode: queryCode } : {}), ...(isWallpaperDesign(queryDesign) ? { design: queryDesign } : {}) })
  const prefsError = ref('')
  const ready = ref(false)
  onMounted(() => {
    try {
      const stored = parseWallpaperPrefs(localStorage.getItem(wallpaperPrefsKey))
      const design = isWallpaperDesign(queryDesign) ? queryDesign : stored.design
      prefs.value = { ...stored, playerCode: prefs.value.playerCode ?? stored.playerCode, design, backdrop: design === stored.design ? stored.backdrop : null }
    } catch {
      prefsError.value = 'Saved choices couldn’t load. Anything you change now is still kept.'
    }
    ready.value = true
  })
  watch(prefs, value => {
    if (!ready.value) return
    try {
      localStorage.setItem(wallpaperPrefsKey, JSON.stringify(value))
      prefsError.value = ''
    } catch {
      prefsError.value = 'This browser blocked saving. Your wallpaper stays until you leave the page.'
    }
  }, { deep: true })

  const requestedMissing = computed(() => Boolean(players.value.length && prefs.value.playerCode != null && !byCode.value.has(prefs.value.playerCode)))
  const player = computed<WallpaperPlayer | undefined>(() => (prefs.value.playerCode != null ? byCode.value.get(prefs.value.playerCode) : undefined) ?? featured.value)
  const design = computed(() => getWallpaperDesign(prefs.value.design))
  const palette = computed<WallpaperPalette>(() => prefs.value.palettes[prefs.value.design] ?? 'signature')
  const stats = computed<WallpaperStatKey[]>(() => player.value ? prefs.value.stats[player.value.positionShort] ?? defaultWallpaperStats[player.value.positionShort] : defaultWallpaperStats.MID)

  watch(() => [player.value?.code, prefs.value.design] as const, ([code, designId]) => {
    if (!ready.value || !code) return
    if (String(route.query.player) === String(code) && route.query.design === designId) return
    void router.replace({ query: { ...route.query, player: String(code), design: designId } })
  })

  const layoutKey = computed(() => `wallpaper:${prefs.value.design}`)
  const layouts = useSchedulerLayouts(layoutKey, { storageKey: wallpaperLayoutsKey, parse: parseWallpaperLayouts, savedNotice: 'Saved' })
  const canResetTemplate = computed(() => {
    const current = player.value
    if (!current) return false
    const defaults = defaultWallpaperStats[current.positionShort]
    return Object.keys(layouts.layout.value).length > 0 || prefs.value.backdrop !== null || palette.value !== 'signature'
      || Boolean(prefs.value.texts[prefs.value.design]) || stats.value.some((key, slot) => key !== defaults[slot])
  })

  function resetTemplate() {
    const current = player.value
    if (!current || !canResetTemplate.value) return
    const { design, backdrop, palettes, texts, stats } = prefs.value
    const position = current.positionShort
    function restoreAppearance(backdrop: WallpaperPrefs['backdrop'], palette?: WallpaperPalette, text?: string, stats?: WallpaperStatKey[]) {
      prefs.value = {
        ...prefs.value,
        backdrop,
        palettes: { ...prefs.value.palettes, [design]: palette },
        texts: { ...prefs.value.texts, [design]: text },
        stats: { ...prefs.value.stats, [position]: stats },
      }
    }
    layouts.change({}, {
      undo: () => restoreAppearance(backdrop, palettes[design], texts[design], stats[position]),
      redo: () => restoreAppearance(null),
    })
    if (layouts.dirty.value) layouts.save()
  }

  function modelFor(designId: WallpaperDesignId, withPlayer = player.value): WallpaperArtworkModel | undefined {
    if (!withPlayer) return
    const keys = prefs.value.stats[withPlayer.positionShort] ?? defaultWallpaperStats[withPlayer.positionShort]
    return {
      player: withPlayer,
      design: designId,
      colours: getWallpaperColours(designId, prefs.value.palettes[designId] ?? 'signature', withPlayer.clubCode, prefs.value.background),
      stats: Object.fromEntries(keys.map((key, slot) => [slot, wallpaperStatView(withPlayer, key, slot)])),
      text: wallpaperBackgroundText(designId, withPlayer, prefs.value.texts[designId]),
      season: data.value?.season ?? null,
      layout: layouts.layouts.value[`wallpaper:${designId}`] ?? {},
    }
  }
  const model = computed(() => {
    const artwork = modelFor(prefs.value.design)
    return artwork && prefs.value.backdrop ? { ...artwork, backdrop: prefs.value.backdrop } : artwork
  })

  function remix() {
    const current = prefs.value
    const layouts = wallpaperDesigns.filter(design => design.id !== current.design)
    const design = layouts[Math.floor(Math.random() * layouts.length)]!.id
    const previousBackdrop = current.backdrop ?? current.design
    const backdrops = wallpaperDesigns.filter(item => item.id !== design && item.id !== previousBackdrop)
    const backdrop = backdrops[Math.floor(Math.random() * backdrops.length)]!.id
    const palette = current.palettes[current.design] === 'custom' ? 'custom' : current.palettes[design] ?? 'signature'
    prefs.value = { ...current, design, backdrop, palettes: { ...current.palettes, [design]: palette } }
  }

  // Layout edits save themselves shortly after a gesture ends.
  const interacting = ref(false)
  let saveTimer: ReturnType<typeof setTimeout> | undefined
  watch([() => layouts.dirty.value, interacting, () => layouts.layout.value], () => {
    if (saveTimer) clearTimeout(saveTimer)
    if (!layouts.dirty.value || interacting.value) return
    saveTimer = setTimeout(() => layouts.save(), 450)
  }, { deep: true })
  onBeforeUnmount(() => {
    if (saveTimer) clearTimeout(saveTimer)
    if (layouts.dirty.value) layouts.save()
  })

  const now = useMinuteClock()
  function setStat(slot: number, key: WallpaperStatKey) {
    const current = player.value
    if (!current) return
    const next = [...stats.value]
    next[slot] = key
    prefs.value.stats = { ...prefs.value.stats, [current.positionShort]: next }
  }
  function resetStats() {
    const current = player.value
    if (!current) return
    const { [current.positionShort]: _removed, ...rest } = prefs.value.stats
    prefs.value.stats = rest
  }

  return { request, data, players, player, featured, requestedMissing, prefs, prefsError, design, palette, stats, model, modelFor, layouts, interacting, now, remix, setStat, resetStats, canResetTemplate, resetTemplate }
}
