import { useSchedulerLayouts } from '~/composables/useSchedulerLayouts'
import {
  defaultWallpaperPrefs, defaultWallpaperStats, getWallpaperColours, getWallpaperDesign, isWallpaperDesign, normalizeWallpaperPlayers,
  parseWallpaperLayouts, parseWallpaperPrefs, wallpaperBackgroundText, wallpaperLayoutsKey, wallpaperPrefsKey, wallpaperStatView,
  type WallpaperArtworkModel, type WallpaperCatalogue, type WallpaperDesignId, type WallpaperPalette, type WallpaperPlayer, type WallpaperPrefs, type WallpaperStatKey,
} from '~/utils/wallpaper'
import type { WallpaperWidget } from '~/utils/wallpaper-devices'

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

function countdown(target: number, now: number) {
  const minutes = Math.floor((target - now) / 60_000)
  if (minutes < 0) return ''
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  return days ? `${days}d ${hours}h` : hours ? `${hours}h ${minutes % 60}m` : `${minutes % 60}m`
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
      prefs.value = { ...stored, playerCode: prefs.value.playerCode ?? stored.playerCode, design: isWallpaperDesign(queryDesign) ? queryDesign : stored.design }
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

  function modelFor(designId: WallpaperDesignId, withPlayer = player.value): WallpaperArtworkModel | undefined {
    if (!withPlayer) return
    const keys = prefs.value.stats[withPlayer.positionShort] ?? defaultWallpaperStats[withPlayer.positionShort]
    return {
      player: withPlayer,
      design: designId,
      colours: getWallpaperColours(designId, prefs.value.palettes[designId] ?? 'signature', withPlayer.clubCode),
      stats: Object.fromEntries(keys.map((key, slot) => [slot, wallpaperStatView(withPlayer, key, slot)])),
      text: wallpaperBackgroundText(designId, withPlayer, prefs.value.texts[designId]),
      season: data.value?.season ?? null,
      layout: designId === prefs.value.design ? layouts.layout.value : layouts.layouts.value[`wallpaper:${designId}`] ?? {},
    }
  }
  const model = computed(() => modelFor(prefs.value.design))

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
  const widgets = computed<WallpaperWidget[]>(() => {
    const result: WallpaperWidget[] = []
    const catalogue = data.value
    const current = player.value
    if (!catalogue || !current) return result
    const deadline = catalogue.deadline ? Date.parse(catalogue.deadline) : Number.NaN
    const remaining = Number.isFinite(deadline) ? countdown(deadline, now.value) : ''
    if (remaining) result.push({ id: 'deadline', icon: 'i-lucide-timer', title: catalogue.nextGameweek ? `GW${catalogue.nextGameweek}` : 'Deadline', value: remaining })
    const fixture = catalogue.nextFixtures.find(item => item.team === current.team)
    const opponent = fixture && catalogue.teams.find(team => team.id === fixture.opponent)
    if (fixture && opponent) {
      const kickoff = fixture.kickoff ? new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(fixture.kickoff)) : ''
      result.push({ id: 'fixture', icon: 'i-lucide-calendar-days', title: 'Next', value: `${opponent.short_name} (${fixture.home ? 'H' : 'A'})${kickoff ? ` ${kickoff}` : ''}` })
    }
    if (current.values.form != null) result.push({ id: 'form', icon: 'i-lucide-trending-up', title: 'Form', value: current.values.form.toFixed(1) })
    return result
  })

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

  return { request, data, players, player, featured, requestedMissing, prefs, prefsError, design, palette, stats, model, modelFor, layouts, interacting, now, widgets, setStat, resetStats }
}
