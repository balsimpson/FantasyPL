import { normalizeInstagramPlayer, type InstagramPlayer } from './instagram-templates'
import { getInstagramClubTheme } from './instagram-designs'
import { parseLayoutElements, type ArtboardSpec, type SchedulerLayout } from './scheduler-layout'
import type { RemixAspect, WallpaperRecipe } from './wallpaper-remix'

// One tall artboard serves both platforms. iPhone exports a centred 19.5:9 crop of it.
export const WALLPAPER_WIDTH = 1080
export const WALLPAPER_HEIGHT = 2400
export const IPHONE_CROP = 30
export const wallpaperArtboard: ArtboardSpec = { width: WALLPAPER_WIDTH, height: WALLPAPER_HEIGHT, margin: 72 }

export type WallpaperDesignId = 'royal' | 'poster' | 'gallery' | 'halftone' | 'floodlit' | 'split'
export type WallpaperPalette = 'signature' | 'club' | 'custom'
// Palette and text choices are kept per fixed design, plus one set for remixes.
export type WallpaperStyleKey = WallpaperDesignId | 'remix'
// Mirrors encodeRemix in wallpaper-remix.ts (kept here to avoid a runtime import cycle).
export const isRemixCodeFormat = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-z]{1,7}(-[0-9a-z]{1,7}){3}$/.test(value)
const remixLockValues = ['layout', 'palette', 'type', 'depth'] as const
export type WallpaperPosition = 'GK' | 'DEF' | 'MID' | 'FWD'
export type WallpaperStatKey = 'total_points' | 'event_points' | 'form' | 'points_per_game' | 'goals_scored' | 'assists'
  | 'clean_sheets' | 'saves' | 'bonus' | 'minutes' | 'now_cost' | 'selected_by_percent'

export const wallpaperStatKeys: WallpaperStatKey[] = ['total_points', 'event_points', 'form', 'points_per_game', 'goals_scored', 'assists', 'clean_sheets', 'saves', 'bonus', 'minutes', 'now_cost', 'selected_by_percent']

const statLabels: Record<WallpaperStatKey, { label: string; short: string }> = {
  total_points: { label: 'Points', short: 'Pts' },
  event_points: { label: 'GW points', short: 'GW' },
  form: { label: 'Form', short: 'Form' },
  points_per_game: { label: 'Pts per game', short: 'PPG' },
  goals_scored: { label: 'Goals', short: 'Goals' },
  assists: { label: 'Assists', short: 'Assists' },
  clean_sheets: { label: 'Clean sheets', short: 'CS' },
  saves: { label: 'Saves', short: 'Saves' },
  bonus: { label: 'Bonus', short: 'Bonus' },
  minutes: { label: 'Minutes', short: 'Mins' },
  now_cost: { label: 'Price', short: 'Price' },
  selected_by_percent: { label: 'Owned', short: 'Owned' },
}
export const wallpaperStatLabel = (key: WallpaperStatKey) => statLabels[key]?.label ?? key

export interface WallpaperPlayer extends InstagramPlayer {
  positionShort: WallpaperPosition
  teamShort: string
  values: Record<WallpaperStatKey, number | null>
  // Rank by total points within the player's position, from the current catalogue.
  positionRank: number | null
}

export interface WallpaperTeam { id: number; code: number; name: string; short_name: string }
export interface WallpaperCatalogue {
  players: Record<string, any>[]
  teams: WallpaperTeam[]
  currentGameweek: number | null
  season: string | null
  fetchedAt: string
}

const positions: Record<number, WallpaperPosition> = { 1: 'GK', 2: 'DEF', 3: 'MID', 4: 'FWD' }
const numberOrNull = (value: unknown) => value == null || value === '' || !Number.isFinite(Number(value)) ? null : Number(value)

export function normalizeWallpaperPlayers(raw: Record<string, any>[], teams: WallpaperTeam[]): WallpaperPlayer[] {
  const players = raw.filter(player => positions[player.element_type]).map(player => {
    const base = normalizeInstagramPlayer(player, teams)
    return {
      ...base,
      positionShort: positions[player.element_type]!,
      teamShort: teams.find(team => team.id === player.team)?.short_name ?? '',
      values: Object.fromEntries(wallpaperStatKeys.map(key => [key, numberOrNull(player[key])])) as WallpaperPlayer['values'],
      positionRank: null as number | null,
    }
  })
  for (const position of ['GK', 'DEF', 'MID', 'FWD'] as const) {
    players.filter(player => player.positionShort === position && player.values.total_points != null)
      .sort((a, b) => b.values.total_points! - a.values.total_points! || a.id - b.id)
      .forEach((player, index) => { player.positionRank = index + 1 })
  }
  return players
}

export function formatWallpaperStat(player: WallpaperPlayer, key: WallpaperStatKey): string {
  const value = player.values[key]
  // A missing value stays visibly unavailable; it never becomes zero.
  if (value == null) return '–'
  if (key === 'now_cost') return `£${(value / 10).toFixed(1)}m`
  if (key === 'selected_by_percent') return `${value.toFixed(1)}%`
  if (key === 'form' || key === 'points_per_game') return value.toFixed(1)
  return value.toLocaleString('en-GB')
}

// Five stat slots: 0 is the lead number, 1–2 support it, 3–4 are small footnotes.
export const defaultWallpaperStats: Record<WallpaperPosition, WallpaperStatKey[]> = {
  GK: ['total_points', 'clean_sheets', 'saves', 'form', 'bonus'],
  DEF: ['total_points', 'clean_sheets', 'assists', 'form', 'bonus'],
  MID: ['total_points', 'goals_scored', 'assists', 'form', 'bonus'],
  FWD: ['total_points', 'goals_scored', 'assists', 'form', 'bonus'],
}

export interface WallpaperDesign {
  id: WallpaperDesignId
  name: string
  description: string
  slots: number[]
  slotNames: Record<number, string>
  // Background lettering the visitor can replace. Max length is enforced in the input.
  text?: { label: string; auto: string; maxLength: number }
  // Items that carry information. A clock overlapping them triggers a gentle warning.
  dataIds: string[]
}

export const wallpaperDesigns: WallpaperDesign[] = [
  { id: 'royal', name: 'Royal', description: 'Giant points on a deep blue field.', slots: [0, 1, 2], slotNames: { 0: 'Big number', 1: 'Footer stat', 2: 'Footer stat' }, text: { label: 'Background word', auto: 'Surname', maxLength: 10 }, dataIds: ['hero', 'stats', 'player-name'] },
  { id: 'poster', name: 'Name poster', description: 'The surname as a poster, three stats below.', slots: [0, 1, 2], slotNames: { 0: 'Stat', 1: 'Stat', 2: 'Stat' }, dataIds: ['stats'] },
  { id: 'gallery', name: 'Gallery', description: 'Editorial serif numerals, quiet stat lines.', slots: [0, 3, 4], slotNames: { 0: 'Big number', 3: 'Line', 4: 'Line' }, dataIds: ['hero', 'stats', 'player-name'] },
  { id: 'halftone', name: 'Halftone', description: 'Printed numerals and a stacked stat column.', slots: [0, 1, 2], slotNames: { 0: 'Stat', 1: 'Stat', 2: 'Stat' }, text: { label: 'Big numerals', auto: 'Position rank', maxLength: 3 }, dataIds: ['stats', 'player-name'] },
  { id: 'floodlit', name: 'Floodlit', description: 'A night glow with points centre stage.', slots: [0, 1, 2], slotNames: { 0: 'Big number', 1: 'Stat', 2: 'Stat' }, dataIds: ['hero', 'stats', 'player-name'] },
  { id: 'split', name: 'Split', description: 'Diagonal colour blocks and a stat column.', slots: [0, 1, 2, 3, 4], slotNames: { 0: 'Stat', 1: 'Stat', 2: 'Stat', 3: 'Footer', 4: 'Footer' }, dataIds: ['stats', 'footer-stats', 'player-name'] },
]
export const isWallpaperDesign = (value: unknown): value is WallpaperDesignId => wallpaperDesigns.some(design => design.id === value)
export const getWallpaperDesign = (id: WallpaperDesignId) => wallpaperDesigns.find(design => design.id === id) ?? wallpaperDesigns[0]!

// ---- Colour ----
export interface WallpaperColours { field: string; alt: string; ink: string; accent: string; muted: string; clock: string; lettering?: string }

function rgb(hex: string) {
  const value = hex.replace('#', '')
  const full = value.length === 3 ? value.split('').map(char => char + char).join('') : value
  return [0, 2, 4].map(index => Number.parseInt(full.slice(index, index + 2), 16)) as [number, number, number]
}
export function mixColour(a: string, b: string, amount: number) {
  const [ar, ag, ab] = rgb(a)
  const [br, bg, bb] = rgb(b)
  const mix = (x: number, y: number) => Math.round(x + (y - x) * amount).toString(16).padStart(2, '0')
  return `#${mix(ar, br)}${mix(ag, bg)}${mix(ab, bb)}`
}
export function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map(channel => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}
export const readableInk = (background: string, dark = '#0b0b0c', light = '#ffffff') => luminance(background) > 0.36 ? dark : light
export const isWallpaperColour = (value: unknown): value is string => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)

export function customWallpaperColours(design: WallpaperDesignId, field: string): WallpaperColours {
  const ink = luminance(field) >= 0.179 ? '#000000' : '#ffffff'
  const tint = mixColour(field, ink, 0.12)
  const alt = design === 'poster' || design === 'halftone' ? ink : tint
  return { field, alt, ink, accent: ink, muted: ink, clock: ink, lettering: ink }
}

const signature: Record<WallpaperDesignId, WallpaperColours> = {
  royal: { field: '#1c2bd4', alt: '#2c3ef0', ink: '#ffffff', accent: '#ffffff', muted: '#c9cffd', clock: '#ffffff' },
  poster: { field: '#c9f230', alt: '#0b0b0c', ink: '#0b0b0c', accent: '#0b0b0c', muted: '#2c3a07', clock: '#0b0b0c' },
  gallery: { field: '#dcd2f6', alt: '#c7b9f0', ink: '#141018', accent: '#141018', muted: '#4a4160', clock: '#141018' },
  halftone: { field: '#f7ebde', alt: '#d6262f', ink: '#d6262f', accent: '#d6262f', muted: '#9c3a32', clock: '#2a1414' },
  floodlit: { field: '#110a1c', alt: '#7b2cf2', ink: '#ffffff', accent: '#ffffff', muted: '#cbbcf0', clock: '#ffffff' },
  split: { field: '#ff5b1d', alt: '#1d3ed6', ink: '#ffffff', accent: '#ffffff', muted: '#ffe1d2', clock: '#ffffff' },
}

export function getWallpaperColours(design: WallpaperDesignId, palette: WallpaperPalette, clubCode: number, background?: string): WallpaperColours {
  if (palette === 'custom' && background) return customWallpaperColours(design, background)
  if (palette === 'custom') return signature[design]
  if (palette === 'signature') return signature[design]
  const theme = getInstagramClubTheme(clubCode, 'club')
  const primary = theme.primary
  const onPrimary = readableInk(primary)
  switch (design) {
    case 'royal': return { field: primary, alt: mixColour(primary, onPrimary, 0.12), ink: onPrimary, accent: onPrimary, muted: mixColour(primary, onPrimary, 0.7), clock: onPrimary }
    case 'poster': return { field: primary, alt: theme.dark, ink: onPrimary === '#ffffff' ? '#ffffff' : theme.dark, accent: theme.dark, muted: mixColour(primary, onPrimary, 0.7), clock: onPrimary }
    case 'gallery': return { field: theme.light, alt: mixColour(theme.light, primary, 0.16), ink: theme.dark, accent: theme.dark, muted: mixColour(theme.dark, theme.light, 0.35), clock: theme.dark }
    case 'halftone': {
      const ink = luminance(primary) > 0.3 ? theme.dark : primary
      return { field: theme.light, alt: ink, ink, accent: ink, muted: mixColour(ink, theme.light, 0.3), clock: theme.dark }
    }
    case 'floodlit': return { field: mixColour(theme.dark, '#000000', 0.45), alt: primary, ink: '#ffffff', accent: '#ffffff', muted: mixColour('#ffffff', primary, 0.35), clock: '#ffffff' }
    case 'split': return { field: primary, alt: theme.dark, ink: '#ffffff', accent: '#ffffff', muted: mixColour('#ffffff', primary, 0.2), clock: '#ffffff' }
  }
}

// ---- Draft and storage ----
export interface WallpaperPrefs {
  version: 1
  playerCode: number | null
  design: WallpaperDesignId
  palettes: Partial<Record<WallpaperStyleKey, WallpaperPalette>>
  stats: Partial<Record<WallpaperPosition, WallpaperStatKey[]>>
  texts: Partial<Record<WallpaperStyleKey, string>>
  backdrop: WallpaperDesignId | null
  // The active remix code, or null when a fixed design is shown.
  remix: string | null
  locks: RemixAspect[]
  background?: string
  device: 'iphone' | 'android'
}
export const wallpaperPrefsKey = 'fpl-wallpaper-prefs-v1'
export const wallpaperLayoutsKey = 'fpl-wallpaper-layouts-v1'
export const defaultWallpaperPrefs = (): WallpaperPrefs => ({ version: 1, playerCode: null, design: 'royal', palettes: {}, stats: {}, texts: {}, backdrop: null, remix: null, locks: [], device: 'iphone' })
export const REMIX_TEXT_MAX = 10

export function cleanWallpaperText(value: string, maxLength: number) {
  return value.replace(/[^\p{L}\p{N} .'’-]/gu, '').slice(0, maxLength)
}

// Invalid fields fall back one by one, so a damaged entry never wipes the rest.
export function parseWallpaperPrefs(raw: string | null): WallpaperPrefs {
  const prefs = defaultWallpaperPrefs()
  if (!raw) return prefs
  const parsed: any = JSON.parse(raw)
  if (!parsed || parsed.version !== 1) return prefs
  if (Number.isInteger(parsed.playerCode)) prefs.playerCode = parsed.playerCode
  if (isWallpaperDesign(parsed.design)) prefs.design = parsed.design
  if (isWallpaperDesign(parsed.backdrop)) prefs.backdrop = parsed.backdrop
  if (isWallpaperColour(parsed.background)) prefs.background = parsed.background
  for (const design of wallpaperDesigns) {
    if (['signature', 'club', 'custom'].includes(parsed.palettes?.[design.id])) prefs.palettes[design.id] = parsed.palettes[design.id]
    if (design.text && typeof parsed.texts?.[design.id] === 'string') prefs.texts[design.id] = cleanWallpaperText(parsed.texts[design.id], design.text.maxLength)
  }
  if (isRemixCodeFormat(parsed.remix)) prefs.remix = parsed.remix
  if (Array.isArray(parsed.locks)) prefs.locks = remixLockValues.filter(lock => parsed.locks.includes(lock))
  if (['signature', 'club', 'custom'].includes(parsed.palettes?.remix)) prefs.palettes.remix = parsed.palettes.remix
  if (typeof parsed.texts?.remix === 'string') prefs.texts.remix = cleanWallpaperText(parsed.texts.remix, REMIX_TEXT_MAX)
  for (const position of ['GK', 'DEF', 'MID', 'FWD'] as const) {
    const stats = parsed.stats?.[position]
    if (Array.isArray(stats) && stats.length === 5 && stats.every(key => wallpaperStatKeys.includes(key))) prefs.stats[position] = stats
  }
  if (['iphone', 'android'].includes(parsed.device)) prefs.device = parsed.device
  return prefs
}

export function parseWallpaperLayouts(raw: string | null): Record<string, SchedulerLayout> {
  if (!raw) return {}
  const parsed: any = JSON.parse(raw)
  if (!parsed || parsed.version !== 1 || !parsed.layouts || typeof parsed.layouts !== 'object') throw new Error('Invalid saved wallpaper layouts')
  const result: Record<string, SchedulerLayout> = {}
  for (const [key, layout] of Object.entries(parsed.layouts)) {
    if (!/^wallpaper:(royal|poster|gallery|halftone|floodlit|split|player-only|remix-[0-9a-z]{1,7}(-[0-9a-z]{1,7}){3})$/.test(key)) continue
    const elements = parseLayoutElements(layout, wallpaperArtboard, true)
    if (!elements) continue
    for (const [id, element] of Object.entries(elements)) {
      const saved = (layout as SchedulerLayout)[id]!
      if (typeof saved.opacity === 'number' && saved.opacity >= 0 && saved.opacity <= 1) element.opacity = saved.opacity
      if (isWallpaperColour(saved.textColour)) element.textColour = saved.textColour
    }
    result[key] = elements
  }
  return result
}

export function wallpaperBackgroundText(design: WallpaperDesignId, player: WallpaperPlayer, custom?: string) {
  if (custom?.trim()) return { text: custom.trim(), custom: true }
  if (design === 'halftone') return { text: player.positionRank ? String(player.positionRank).padStart(2, '0') : '', custom: false }
  return { text: player.lastName || player.name, custom: false }
}

export const wallpaperFilename = (player: WallpaperPlayer, design: string, device: string) =>
  `fpl-wallpaper-${player.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'player'}-${design}-${device}.png`

// ---- Artwork model shared by every design ----
export interface WallpaperStatView { key: WallpaperStatKey; slot: number; label: string; lines: string[]; value: string }
export interface WallpaperArtworkModel {
  player: WallpaperPlayer
  backdrop?: WallpaperDesignId
  design: WallpaperDesignId
  colours: WallpaperColours
  stats: Record<number, WallpaperStatView>
  text: { text: string; custom: boolean }
  season: string | null
  layout: SchedulerLayout
  // Present when the artwork is a generated remix rather than a fixed design.
  recipe?: WallpaperRecipe
}

export function wallpaperStatView(player: WallpaperPlayer, key: WallpaperStatKey, slot: number): WallpaperStatView {
  const label = wallpaperStatLabel(key)
  const lines = key === 'total_points' ? ['FPL', 'Points'] : key === 'event_points' ? ['GW', 'Points'] : label.split(' ').length > 1 ? [label.split(' ').slice(0, -1).join(' '), label.split(' ').at(-1)!] : [label]
  return { key, slot, label, lines, value: formatWallpaperStat(player, key) }
}

export function positionName(position: WallpaperPosition) {
  return ({ GK: 'goalkeeper', DEF: 'defender', MID: 'midfielder', FWD: 'forward' } as const)[position]
}
