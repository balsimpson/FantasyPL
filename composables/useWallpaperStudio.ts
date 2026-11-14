import { useSchedulerLayouts } from '~/composables/useSchedulerLayouts'
import {
  REMIX_TEXT_MAX, defaultWallpaperPrefs, defaultWallpaperStats, getWallpaperColours, getWallpaperDesign, isRemixCodeFormat, isWallpaperDesign, normalizeWallpaperPlayers,
  parseWallpaperLayouts, parseWallpaperPrefs, wallpaperBackgroundText, wallpaperDesigns, wallpaperLayoutsKey, wallpaperPrefsKey, wallpaperStatView,
  type WallpaperArtworkModel, type WallpaperCatalogue, type WallpaperDesign, type WallpaperDesignId, type WallpaperPalette, type WallpaperPlayer, type WallpaperPrefs, type WallpaperStatKey, type WallpaperStyleKey,
} from '~/utils/wallpaper'
import { describeRemix, generateRemix, randomSeed, recipeFromCode, remixStatSlots, remixWordText, type RemixAspect, type WallpaperRecipe } from '~/utils/wallpaper-remix'

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
  const queryDesign = isWallpaperDesign(route.query.design) ? route.query.design : undefined
  const queryRemix = isRemixCodeFormat(route.query.remix) ? route.query.remix : null
  const prefs = ref<WallpaperPrefs>({ ...defaultWallpaperPrefs(), ...(Number.isInteger(queryCode) && queryCode > 0 ? { playerCode: queryCode } : {}), ...(queryDesign ? { design: queryDesign } : {}), remix: queryRemix })
  const freshVisit = route.query.player == null && route.query.design == null && route.query.remix == null && route.query.sheet == null
  let openingSelection: Pick<WallpaperPrefs, 'playerCode' | 'design' | 'remix'> | undefined
  if (freshVisit) {
    const rollOpening = () => ({ player: Math.random(), style: Math.random(), remix: randomSeed() })
    const openingRoll = useState('wallpaper-opening-roll', rollOpening)
    const roll = import.meta.client && !useNuxtApp().isHydrating ? rollOpening() : openingRoll.value
    // Apply the same selection on the server and during hydration, or after a successful retry.
    watch(players, catalogue => {
      if (openingSelection || !catalogue.length) return
      const shortlist = catalogue.filter(candidate => candidate.positionRank != null && candidate.positionRank <= 3 && (candidate.values.total_points ?? 0) > 0)
      const current = shortlist[Math.floor(roll.player * shortlist.length)] ?? featured.value!
      const style = Math.floor(roll.style * wallpaperDesigns.length * 2)
      const design = wallpaperDesigns[style % wallpaperDesigns.length]!.id
      const remix = style >= wallpaperDesigns.length ? generateRemix({ player: current, palette: 'signature', seed: roll.remix }).code : null
      openingSelection = { playerCode: current.code, design, remix }
      prefs.value = { ...prefs.value, ...openingSelection, backdrop: null }
    }, { immediate: true, flush: 'sync' })
  }
  const prefsError = ref('')
  const ready = ref(false)
  onMounted(() => {
    try {
      const stored = parseWallpaperPrefs(localStorage.getItem(wallpaperPrefsKey))
      const design = freshVisit ? prefs.value.design : queryDesign ?? stored.design
      // A link with a design (and no remix) opens that fixed design.
      const remix = freshVisit ? prefs.value.remix : queryRemix ?? (queryDesign ? null : stored.remix)
      const playerCode = freshVisit ? prefs.value.playerCode : prefs.value.playerCode ?? stored.playerCode
      prefs.value = { ...stored, playerCode, design, remix, backdrop: !freshVisit && design === stored.design ? stored.backdrop : null }
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
  // ---- Remix ----
  const remixContext = (withPlayer: WallpaperPlayer) => ({ player: withPlayer, palette: prefs.value.palettes.remix ?? 'signature', background: prefs.value.background })
  const recipe = computed<WallpaperRecipe | null>(() => prefs.value.remix && player.value ? recipeFromCode(prefs.value.remix, remixContext(player.value)) : null)
  const styleKey = computed<WallpaperStyleKey>(() => recipe.value ? 'remix' : prefs.value.design)
  const remixDesign = computed<WallpaperDesign | null>(() => {
    const current = recipe.value
    if (!current) return null
    const slots = remixStatSlots(current)
    const allSlots = current.skeleton.hero ? [0, ...slots] : slots
    const sourceLabel = { surname: 'Surname', rank: 'Position rank', fpl: 'FPL', club: 'Club code' }[current.wordSource]
    return {
      id: prefs.value.design,
      name: 'Remix',
      description: describeRemix(current),
      slots: allSlots,
      slotNames: Object.fromEntries(allSlots.map(slot => [slot, slot === 0 && current.skeleton.hero ? 'Big number' : 'Stat'])),
      text: current.skeleton.word ? { label: 'Lettering', auto: sourceLabel, maxLength: REMIX_TEXT_MAX } : undefined,
      dataIds: ['hero', 'stats'],
    }
  })
  const design = computed(() => remixDesign.value ?? getWallpaperDesign(prefs.value.design))
  const palette = computed<WallpaperPalette>(() => prefs.value.palettes[styleKey.value] ?? 'signature')
  const stats = computed<WallpaperStatKey[]>(() => player.value ? prefs.value.stats[player.value.positionShort] ?? defaultWallpaperStats[player.value.positionShort] : defaultWallpaperStats.MID)

  watch(() => [player.value?.code, prefs.value.design, prefs.value.remix] as const, ([code, designId, remixCode]) => {
    if (!ready.value || !code) return
    // Keep the landing URL clean until the visitor changes the player or design.
    if (openingSelection && route.query.player == null && code === openingSelection.playerCode && designId === openingSelection.design && remixCode === openingSelection.remix) return
    const { design: _design, remix: _remix, ...rest } = route.query
    const wantDesign = remixCode ? undefined : designId
    const wantRemix = remixCode ?? undefined
    if (String(route.query.player) === String(code) && route.query.design === wantDesign && route.query.remix === wantRemix) return
    void router.replace({ query: { ...rest, player: String(code), ...(wantRemix ? { remix: wantRemix } : { design: wantDesign }) } })
  })

  const layoutKey = computed(() => prefs.value.remix ? `wallpaper:remix-${prefs.value.remix}` : `wallpaper:${prefs.value.design}`)
  const layouts = useSchedulerLayouts(layoutKey, { storageKey: wallpaperLayoutsKey, parse: parseWallpaperLayouts, savedNotice: 'Saved' })
  const canResetTemplate = computed(() => {
    const current = player.value
    if (!current) return false
    const defaults = defaultWallpaperStats[current.positionShort]
    return Object.keys(layouts.layout.value).length > 0 || (!recipe.value && prefs.value.backdrop !== null) || palette.value !== 'signature'
      || Boolean(prefs.value.texts[styleKey.value]) || stats.value.some((key, slot) => key !== defaults[slot])
  })

  function resetTemplate() {
    const current = player.value
    if (!current || !canResetTemplate.value) return
    const design = styleKey.value
    const { backdrop, palettes, texts, stats } = prefs.value
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
  // Builds the artwork model for a generated remix, with the selected stats and lettering.
  function remixModelFor(withRecipe: WallpaperRecipe, withPlayer: WallpaperPlayer, layout = layouts.layouts.value[`wallpaper:remix-${withRecipe.code}`] ?? {}): WallpaperArtworkModel {
    const keys = prefs.value.stats[withPlayer.positionShort] ?? defaultWallpaperStats[withPlayer.positionShort]
    const custom = prefs.value.texts.remix?.trim()
    return {
      player: withPlayer,
      design: prefs.value.design,
      colours: withRecipe.colours,
      stats: Object.fromEntries(keys.map((key, slot) => [slot, wallpaperStatView(withPlayer, key, slot)])),
      text: custom ? { text: custom, custom: true } : { text: remixWordText(withRecipe, withPlayer), custom: false },
      season: data.value?.season ?? null,
      layout,
      recipe: withRecipe,
    }
  }

  const model = computed(() => {
    if (recipe.value && player.value) return remixModelFor(recipe.value, player.value, layouts.layout.value)
    const artwork = modelFor(prefs.value.design)
    return artwork && prefs.value.backdrop ? { ...artwork, backdrop: prefs.value.backdrop } : artwork
  })

  // The dice generates a new remix. Locked aspects keep the current remix's seeds.
  const history = ref<string[]>([])
  function remix() {
    const current = player.value
    if (!current) return
    const palettes = { ...prefs.value.palettes }
    if (!prefs.value.remix && palettes[prefs.value.design] === 'custom') palettes.remix = 'custom'
    prefs.value.palettes = palettes
    const next = generateRemix({ ...remixContext(current), previous: recipe.value, locks: prefs.value.locks })
    if (prefs.value.remix) history.value = [...history.value.slice(-29), prefs.value.remix]
    prefs.value = { ...prefs.value, remix: next.code }
  }
  const canGoBack = computed(() => history.value.length > 0)
  function previousRemix() {
    const code = history.value.at(-1)
    if (!code) return
    history.value = history.value.slice(0, -1)
    prefs.value = { ...prefs.value, remix: code }
  }
  function toggleLock(aspect: RemixAspect) {
    const locks = prefs.value.locks
    prefs.value.locks = locks.includes(aspect) ? locks.filter(item => item !== aspect) : [...locks, aspect]
  }
  function leaveRemix() {
    if (prefs.value.remix) history.value = [...history.value.slice(-29), prefs.value.remix]
    prefs.value = { ...prefs.value, remix: null }
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

  return { request, data, players, player, featured, requestedMissing, prefs, prefsError, design, palette, stats, model, modelFor, layouts, interacting, now, remix, setStat, resetStats, canResetTemplate, resetTemplate,
    recipe, styleKey, remixModelFor, remixContext, canGoBack, previousRemix, toggleLock, leaveRemix }
}
