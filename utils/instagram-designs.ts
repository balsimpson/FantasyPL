import type { InstagramPlayer, InstagramStatKey } from '~/utils/instagram-templates'

export type InstagramDesignId = 'editorial' | 'matchday' | 'scout' | 'studio' | 'club' | 'contrast' | 'night' | 'profile' | 'analyst' | 'hero'
export type InstagramPalette = 'club' | 'complementary'
export type InstagramStatSignal = 'positive' | 'negative'

const statSignalPriorities: Partial<Record<InstagramStatKey, number>> = {
  form: 5,
  event_points: 4,
  goals_scored: 3,
  assists: 2,
  points_per_game: 1,
}

export function getInstagramStatSignals(player: InstagramPlayer, stats: InstagramStatKey[]): Partial<Record<InstagramStatKey, InstagramStatSignal>> {
  const candidates = stats.flatMap((key, order) => {
    const value = player.stats[key]
    if (value == null || !Number.isFinite(value)) return []
    let signal: InstagramStatSignal | null = null
    if (key === 'form') signal = value >= 6 ? 'positive' : value <= 3 ? 'negative' : null
    else if (key === 'event_points' && value >= 8) signal = 'positive'
    else if ((key === 'goals_scored' || key === 'assists') && value >= 1) signal = 'positive'
    else if (key === 'points_per_game' && value >= 5) signal = 'positive'
    return signal ? [{ key, signal, order, priority: statSignalPriorities[key] ?? 0 }] : []
  })
  return Object.fromEntries(candidates.sort((a, b) => b.priority - a.priority || a.order - b.order).slice(0, 2).map(({ key, signal }) => [key, signal]))
}

export function getInstagramStatSignalColor(signal: InstagramStatSignal | undefined, accent: string) {
  return signal === 'negative' ? '#ee8e90' : accent
}

export const instagramDesigns = [
  { id: 'editorial', letter: 'A', name: 'Editorial', description: 'Cream, bold type and clean rules.' },
  { id: 'matchday', letter: 'B', name: 'Matchday', description: 'Dark poster. Points take the lead.' },
  { id: 'scout', letter: 'C', name: 'Scout report', description: 'An open, easy-to-scan stat ledger.' },
  { id: 'studio', letter: 'D', name: 'Studio', description: 'Big portrait, strong colour blocks.' },
  { id: 'club', letter: 'E', name: 'Club edition', description: 'Club colours and stadium atmosphere.' },
  { id: 'contrast', letter: 'F', name: 'Warm contrast', description: 'Warm paper against the club kit.' },
  { id: 'night', letter: 'G', name: 'Night game', description: 'Floodlights and deep club colours.' },
  { id: 'profile', letter: 'H', name: 'Club profile', description: 'A stat ledger beside the portrait.' },
  { id: 'analyst', letter: 'I', name: 'Analyst', description: 'A dark stat ledger and a large portrait.' },
  { id: 'hero', letter: 'J', name: 'Hero', description: 'A central portrait with surrounding stats.' },
] as const

// Stable club codes, not the season-specific FPL team IDs.
const clubColours: Record<number, [string, string, string]> = {
  1: ['#cf2731', '#260d17', '#f9e9e8'], 2: ['#c9a832', '#142139', '#faf7e6'],
  3: ['#c72130', '#172840', '#fff1ed'], 4: ['#30343c', '#101923', '#eef0f2'],
  6: ['#263d70', '#101d39', '#f0f3fa'], 7: ['#79264b', '#301025', '#f7edf2'],
  8: ['#1754ad', '#0c2047', '#eef4ff'], 9: ['#75bcda', '#133b54', '#edf8fc'],
  11: ['#2857af', '#14284c', '#eef3ff'], 13: ['#2d57a2', '#162644', '#edf3fd'],
  14: ['#c92b32', '#381019', '#fff1ed'], 17: ['#c72b35', '#39131c', '#fff0ed'],
  20: ['#d02d37', '#291820', '#fff1ed'], 21: ['#762a45', '#301420', '#f5edf0'],
  31: ['#2453a7', '#152648', '#f0f3ff'], 35: ['#1759a4', '#122d50', '#edf5fe'],
  36: ['#2368ac', '#102e4a', '#eff7ff'], 39: ['#db9d23', '#2b2317', '#fff7e5'],
  40: ['#305eb3', '#17284c', '#f0f4ff'], 43: ['#78bce5', '#082642', '#eff8fc'],
  49: ['#c52535', '#2d1720', '#fff0ed'], 54: ['#32353b', '#171d28', '#f5f3ed'],
  56: ['#cc303a', '#291823', '#fff2ee'], 57: ['#2c55a6', '#132444', '#eef3fc'],
  88: ['#dfa72d', '#28221b', '#fff6e5'], 90: ['#7c304c', '#351627', '#f7eef2'],
  91: ['#bd2b37', '#291823', '#fbefee'], 94: ['#c82b36', '#301720', '#fff1ed'],
  97: ['#315ba4', '#152641', '#eef4fd'], 102: ['#d26829', '#312118', '#fff4e9'],
}

export function getInstagramClubTheme(code: number, palette: InstagramPalette = 'club') {
  const [primary, dark, light] = clubColours[code] ?? ['#547b91', '#142a38', '#f1f5f7']
  // The warm alternate is chosen to contrast with the shirt's home-club colour.
  const blueClub = [2, 6, 8, 9, 11, 13, 31, 35, 36, 40, 43, 57, 97].includes(code)
  const complementary = blueClub
    ? { colour: '#9e4933', ink: '#491b21', paper: '#fcf1e1' }
    : { colour: '#357b86', ink: '#123943', paper: '#eaf4f1' }
  return { primary, dark, light, colour: palette === 'complementary' ? complementary.colour : primary,
    ink: palette === 'complementary' ? complementary.ink : dark,
    paper: palette === 'complementary' ? complementary.paper : light, complementary }
}

export function getInstagramTransfers(incoming: number | null, outgoing: number | null) {
  const available = incoming != null && outgoing != null && Number.isFinite(incoming) && Number.isFinite(outgoing) && incoming >= 0 && outgoing >= 0
  const total = available ? incoming + outgoing : null
  return { total, inPercent: total ? incoming! / total * 100 : 0, outPercent: total ? outgoing! / total * 100 : 0 }
}
export function compactInstagramNumber(value: number | null) {
  if (value == null) return 'Unavailable'
  return new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(value).toUpperCase()
}
