import { type InstagramDesignId, type InstagramPalette } from '~/utils/instagram-designs'
import { instagramTemplates, normalizeInstagramPlayer, type InstagramDraft, type InstagramFixture, type InstagramStatKey, type InstagramTemplateId } from '~/utils/instagram-templates'

export function useInstagramEditor(data: Ref<any>, excludedPlayerCodes: Ref<number[]> = ref([])) {
  const players = computed(() => (data.value?.players ?? []).map((player: any) => normalizeInstagramPlayer(player, data.value.teams)))
  const designId = ref<InstagramDesignId>('club')
  const palette = ref<InstagramPalette>('club')
  const templateId = ref<InstagramTemplateId>('spotlight')
  const template = computed(() => instagramTemplates.find(item => item.id === templateId.value)!)
  const headline = ref<string>(template.value.headline)
  const selectedIds = ref<number[]>([])
  const statKeys = ref<InstagramStatKey[]>(['now_cost', 'form', 'total_points', 'selected_by_percent', 'goals_scored', 'minutes'])
  const shortlistMode = ref('form')
  const selectedPlayers = computed(() => selectedIds.value.slice(0, template.value.count).map(id => players.value.find(player => player.id === id)).filter(Boolean))
  const fixtures = ref<InstagramFixture[]>([])
  const fixturesLoading = ref(false)
  const fixturesError = ref('')
  const caption = ref('')
  const captionLoading = ref(false)
  const captionError = ref('')
  let captionRequest = 0
  let captionController: AbortController | undefined

  const candidates = computed(() => {
    let pool = players.value.filter(player => player.status === 'a' && (player.stats.minutes ?? 0) >= 90 && !excludedPlayerCodes.value.includes(player.code))
    if (templateId.value === 'shortlist' && shortlistMode.value === 'budget') pool = pool.filter(player => (player.stats.now_cost ?? Infinity) <= 60)
    if (templateId.value === 'shortlist' && shortlistMode.value === 'differentials') pool = pool.filter(player => (player.stats.selected_by_percent ?? 100) < 10)
    const metric = templateId.value === 'transfers' ? (player: typeof pool[number]) => (player.transfersIn ?? 0) - (player.transfersOut ?? 0) : (player: typeof pool[number]) => player.stats.form ?? 0
    return [...pool].sort((a, b) => metric(b) - metric(a) || (b.stats.total_points ?? 0) - (a.stats.total_points ?? 0))
  })
  function suggestPlayers() {
    selectedIds.value = candidates.value.slice(0, template.value.count).map(player => player.id)
  }
  watch(players, list => {
    if (!list.length || selectedIds.value.length) return
    const first = [...list].sort((a, b) => (b.stats.total_points ?? 0) - (a.stats.total_points ?? 0))[0]
    if (first) selectedIds.value = [first.id]
  }, { immediate: true })

  watch(templateId, (next, previous) => {
    if (next === 'shortlist' && statKeys.value.length > 3) statKeys.value = statKeys.value.slice(0, 3)
    const oldDefault = instagramTemplates.find(item => item.id === previous)?.headline
    if (headline.value === oldDefault) headline.value = instagramTemplates.find(item => item.id === next)!.headline
  })
  function togglePlayer(id: number) {
    const activeIndex = selectedIds.value.slice(0, template.value.count).indexOf(id)
    if (activeIndex !== -1) selectedIds.value = selectedIds.value.filter(value => value !== id)
    else if (template.value.count === 1) selectedIds.value = [id, ...selectedIds.value.filter(value => value !== id).slice(1)]
    else if (selectedPlayers.value.length < template.value.count) selectedIds.value = [...selectedIds.value.filter(value => value !== id), id]
  }
  function movePlayer(index: number, offset: number) {
    const target = index + offset
    if (target < 0 || target >= selectedPlayers.value.length) return
    const ids = [...selectedIds.value]
    ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
    selectedIds.value = ids
  }

  watch(() => selectedPlayers.value[0]?.id, async (id, _, onCleanup) => {
    fixtures.value = []
    fixturesError.value = ''
    fixturesLoading.value = false
    if (!id) return
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    fixturesLoading.value = true
    try {
      const result = await $fetch<any>(`/api/players/${id}`, { signal: controller.signal })
      if (controller.signal.aborted) return
      if (!Array.isArray(result?.fixtures)) throw new Error('Fixtures unavailable')
      fixtures.value = result.fixtures.slice(0, 5).map((fixture: any) => ({
        id: fixture.id, gameweek: fixture.event ?? null,
        opponent: data.value.teams.find((team: any) => team.id === (fixture.is_home ? fixture.team_a : fixture.team_h))?.short_name ?? 'TBC',
        venue: fixture.is_home ? 'Home' : 'Away', difficulty: fixture.difficulty ?? null,
      }))
    } catch {
      if (!controller.signal.aborted) fixturesError.value = 'Fixtures could not load. Select the player again to retry.'
    } finally {
      if (!controller.signal.aborted) fixturesLoading.value = false
    }
  }, { immediate: true })

  const draft = computed<InstagramDraft>(() => ({
    design: designId.value, palette: palette.value,
    template: templateId.value, headline: ['spotlight', 'transfers'].includes(templateId.value) ? selectedPlayers.value[0]?.fullName ?? '' : headline.value.trim(), players: selectedPlayers.value,
    season: (() => {
      const deadline = new Date(data.value?.currentGameweek?.deadline_time || '')
      if (!Number.isFinite(deadline.getTime())) return null
      const year = deadline.getUTCFullYear() - (deadline.getUTCMonth() < 6 ? 1 : 0)
      return `${year}/${String(year + 1).slice(-2)}`
    })(),
    stats: statKeys.value, gameweek: data.value?.currentGameweek?.id ?? null,
    fixtures: fixtures.value,
  }))
  const draftKey = computed(() => JSON.stringify(draft.value))
  watch(draftKey, () => {
    captionRequest++
    captionController?.abort()
    captionLoading.value = false
    caption.value = ''
    captionError.value = ''
  }, { flush: 'sync' })
  const validationMessage = computed(() => {
    if (selectedPlayers.value.length !== template.value.count) return `Select ${template.value.count} ${template.value.count === 1 ? 'player' : 'players'} for this template.`
    if (!headline.value.trim()) return 'Add a headline before exporting.'
    if (!statKeys.value.length && ['spotlight', 'comparison', 'shortlist'].includes(templateId.value)) return 'Choose at least one stat.'
    if (templateId.value === 'fixtures') {
      if (fixturesLoading.value) return 'Loading fixtures…'
      if (fixturesError.value) return fixturesError.value
      if (!fixtures.value.length) return 'No upcoming fixtures are available for this player.'
    }
    return ''
  })
  async function generateCaption(postDraft: InstagramDraft = draft.value) {
    if (captionLoading.value) return
    if (validationMessage.value) {
      captionError.value = validationMessage.value
      return
    }
    const request = ++captionRequest
    captionController = new AbortController()
    captionLoading.value = true
    captionError.value = ''
    let failureMessage = 'Caption generation failed. Try again shortly.'
    try {
      const response = await $fetch<any>('/api/get-response', {
        method: 'POST', signal: captionController.signal,
        body: { prompt: { task: 'Write one Instagram caption for this FPL post. Follow the supplied story captionFocus and lead with its evidence when present. Use only supplied facts and the selected stats. Transfer rankings are among eligible scheduler players, not all FPL players. Do not infer injuries, starting lineups, reasons for transfers, future returns or transfer periods. Total points, goals, assists and minutes are season totals; transfers are gameweek totals, never 24-hour totals. Include #FPL. Return caption text only.', ...postDraft } },
      })
      if (request !== captionRequest) return
      if (!response?.success) {
        const messages: Record<string, string> = {
          configuration: 'Caption generation is not configured on this server.',
          authorization: 'The caption service rejected its API key. Check the server configuration.',
          model_unavailable: 'The caption model is unavailable. Check the server model setting.',
          rate_limited: 'The caption service is rate limited or out of quota. Try again later.',
          provider_error: 'The caption service could not be reached. Try again shortly.',
        }
        captionError.value = messages[response?.error] || 'The caption service returned no caption. Try again.'
        return
      }
      if (typeof response.output !== 'string' || !response.output.trim()) {
        captionError.value = 'The caption service returned no caption. Try again.'
        return
      }
      caption.value = response.output.trim()
    } catch {
      if (request === captionRequest) captionError.value = failureMessage
    } finally {
      if (request === captionRequest) captionLoading.value = false
    }
  }
  onScopeDispose(() => captionController?.abort())
  return { players, designId, palette, templateId, template, headline, statKeys, selectedPlayers, shortlistMode, candidates, togglePlayer, movePlayer, suggestPlayers, fixturesLoading, fixturesError, draft, draftKey, validationMessage, caption, captionLoading, captionError, generateCaption }
}
