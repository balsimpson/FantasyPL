import type { InstagramDesignId, InstagramPalette } from './instagram-designs'
import type { SchedulerLayout } from './scheduler-layout'

export type InstagramTemplateId = 'spotlight' | 'comparison' | 'shortlist' | 'fixtures' | 'transfers'
export type InstagramStatKey = 'now_cost' | 'form' | 'total_points' | 'event_points' | 'selected_by_percent' | 'goals_scored' | 'assists' | 'minutes' | 'points_per_game' | 'transfers_in_event' | 'transfers_out_event'

export interface InstagramPostStory {
  id: string
  label: string
  evidence: string
  captionFocus: string
  scope?: string
}

export interface InstagramPlayer {
  id: number
  code: number
  name: string
  fullName: string
  firstName: string
  lastName: string
  birthDate?: string | null
  clubCode: number
  crestUrl: string
  club: string
  position: string
  team: number
  photoUrl: string
  status: string
  stats: Record<InstagramStatKey, number | null>
  transfersIn: number | null
  transfersOut: number | null
}
export interface InstagramFixture {
  id: number
  gameweek: number | null
  opponent: string
  venue: string
  difficulty: number | null
}
export interface InstagramDraft {
  story?: InstagramPostStory
  layout?: SchedulerLayout
  season?: string | null
  design: InstagramDesignId
  palette: InstagramPalette
  template: InstagramTemplateId
  headline: string
  players: InstagramPlayer[]
  stats: InstagramStatKey[]
  gameweek: number | null
  fixtures: InstagramFixture[]
}

export const instagramTemplates = [
  { id: 'spotlight', name: 'Player spotlight', description: 'One player. The key numbers.', count: 1, headline: 'Player spotlight' },
  { id: 'comparison', name: 'Player comparison', description: 'Two players, side by side.', count: 2, headline: 'Who gets your pick?' },
  { id: 'shortlist', name: 'Top five shortlist', description: 'Your picks, in your order.', count: 5, headline: 'Five for your watchlist' },
  { id: 'fixtures', name: 'Fixture outlook', description: 'The next five fixtures.', count: 1, headline: 'The fixtures ahead' },
  { id: 'transfers', name: 'Transfer watch', description: 'Who is moving in and out?', count: 1, headline: 'On the transfer radar' },
] as const

export const instagramStats: { value: InstagramStatKey, label: string }[] = [
  { value: 'now_cost', label: 'Price' }, { value: 'form', label: 'Form' },
  { value: 'total_points', label: 'Total points' }, { value: 'event_points', label: 'Gameweek points' },
  { value: 'selected_by_percent', label: 'Ownership' }, { value: 'goals_scored', label: 'Goals' },
  { value: 'assists', label: 'Assists' }, { value: 'minutes', label: 'Minutes' },
  { value: 'points_per_game', label: 'Points per game' },
  { value: 'transfers_in_event', label: 'GW transfers in' }, { value: 'transfers_out_event', label: 'GW transfers out' },
]
const numberOrNull = (value: unknown) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value)

export function normalizeInstagramPlayer(player: any, teams: any[]): InstagramPlayer {
  const photoCode = /^\d+\.(jpg|png)$/i.test(player.photo ?? '') ? player.photo.replace(/\.(jpg|png)$/i, '') : String(player.code)
  const clubCode = teams.find(team => team.id === player.team)?.code ?? player.team_code
  const crest = `https://resources.premierleague.com/premierleague/badges/t${clubCode}.png`
  const photo = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${photoCode}.png`
  return {
    id: player.id, code: player.code, name: player.web_name,
    fullName: `${player.first_name} ${player.second_name}`,
    firstName: player.first_name, lastName: player.second_name, clubCode,
    birthDate: typeof player.birth_date === 'string' ? player.birth_date : null,
    crestUrl: `/api/image-proxy/club-${clubCode}?url=${encodeURIComponent(crest)}&strict=1`,
    club: teams.find(team => team.id === player.team)?.name ?? 'Club unavailable',
    position: ({ 1: 'Goalkeeper', 2: 'Defender', 3: 'Midfielder', 4: 'Forward' } as Record<number, string>)[player.element_type] ?? 'Position unavailable',
    team: player.team, status: player.status,
    photoUrl: `/api/image-proxy/player-${photoCode}?url=${encodeURIComponent(photo)}&strict=1`,
    stats: Object.fromEntries(instagramStats.map(stat => [stat.value, numberOrNull(player[stat.value])])) as InstagramPlayer['stats'],
    transfersIn: numberOrNull(player.transfers_in_event), transfersOut: numberOrNull(player.transfers_out_event),
  }
}

export function formatInstagramStat(player: InstagramPlayer, key: InstagramStatKey): string {
  const value = player.stats[key]
  if (value == null) return 'Unavailable'
  if (key === 'now_cost') return `£${(value / 10).toFixed(1)}m`
  if (key === 'selected_by_percent') return `${value.toFixed(1)}%`
  if (key === 'form' || key === 'points_per_game') return value.toFixed(1)
  if (key === 'transfers_in_event' || key === 'transfers_out_event') return value.toLocaleString('en-GB', { notation: 'compact', maximumFractionDigits: 1 })
  return value.toLocaleString('en-GB')
}
export function instagramStatLabel(key: InstagramStatKey) {
  return instagramStats.find(stat => stat.value === key)?.label ?? key
}
export function formatInstagramCount(value: number | null) {
  return value == null ? 'Unavailable' : value.toLocaleString('en-GB')
}
export function instagramFixtureColors(difficulty: number | null) {
  return ({ 1: 'bg-green-200 text-green-950', 2: 'bg-green-200 text-green-950', 3: 'bg-slate-200 text-slate-950', 4: 'bg-rose-200 text-rose-950', 5: 'bg-rose-800 text-white' } as Record<number, string>)[difficulty ?? 0] ?? 'bg-slate-100 text-slate-700'
}
