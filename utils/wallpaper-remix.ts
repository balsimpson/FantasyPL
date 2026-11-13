import { getInstagramClubTheme } from './instagram-designs'
import { luminance, mixColour, type WallpaperColours, type WallpaperPalette, type WallpaperPlayer } from './wallpaper'

// ---------------------------------------------------------------------------
// Wallpaper remix generator
//
// The dice builds a new wallpaper from a kit of parts instead of picking one of
// the six fixed designs. A remix has four independent aspects, each with its own
// seed, so a remix code reproduces exactly and any aspect can be locked while
// the others reroll:
//
//   layout  – skeleton (zones for portrait, lettering, hero number, stats),
//             backdrop shape, stat arrangement, lettering source, accents
//   palette – curated or club-derived colour set and surface finish
//   type    – font pairing and lettering treatment
//   depth   – flat, layered (pop-out, cast shadow, rim light, echo)
//             or sculpted (extrusion, 3D stat tiles, perspective floor, emboss)
//
// Each dice press scores a batch of candidates against design rules (contrast,
// one dominant element, depth that suits the layout, variety) and keeps the best.
// Every depth effect is plain layers, text/box shadows, masks or SVG, because the
// PNG export (html-to-image) does not reliably capture CSS 3D transforms or blend modes.
// ---------------------------------------------------------------------------

export type RemixAspect = 'layout' | 'palette' | 'type' | 'depth'
export const remixAspects: RemixAspect[] = ['layout', 'palette', 'type', 'depth']
export const remixAspectLabels: Record<RemixAspect, string> = { layout: 'Layout', palette: 'Colours', type: 'Type', depth: 'Depth' }

export type RemixDepthMode = 'flat' | 'layered' | 'sculpted'
export type SkeletonId = 'stage' | 'headline' | 'tower' | 'editorial' | 'column' | 'monument' | 'corner' | 'split'
export type BackdropKind = 'flat' | 'rings' | 'glow' | 'beams' | 'diagonal' | 'halftone' | 'sunburst' | 'stripes' | 'arc'
export type StatArrangement = 'row' | 'column' | 'lines' | 'pair'
export type WordSource = 'surname' | 'rank' | 'fpl' | 'club'
export type WordTreatment = 'solid' | 'outline' | 'halftone' | 'ghost'
export type FontId = 'anton' | 'archivo' | 'bodoni' | 'unbounded' | 'instrument' | 'oswald'
export type Light = 'left' | 'right' | 'top'

export interface RemixFont { family: string; weight: number; style: 'normal' | 'italic'; uppercase: boolean; width: number }
// `width` is the font's rough advance per character in em, used to avoid very long words in wide faces.
export const remixFonts: Record<FontId, RemixFont> = {
  anton: { family: 'FPLDisplay', weight: 400, style: 'normal', uppercase: true, width: 0.5 },
  archivo: { family: '\'Archivo Black\'', weight: 400, style: 'normal', uppercase: true, width: 0.78 },
  bodoni: { family: '\'Bodoni Moda\'', weight: 600, style: 'normal', uppercase: false, width: 0.62 },
  unbounded: { family: 'Unbounded', weight: 800, style: 'normal', uppercase: true, width: 0.92 },
  instrument: { family: '\'Instrument Serif\'', weight: 400, style: 'italic', uppercase: false, width: 0.45 },
  oswald: { family: 'FPLNumbers', weight: 700, style: 'normal', uppercase: true, width: 0.5 },
}

// ---- Skeletons --------------------------------------------------------------
// Coordinates are artboard px on the 1080 × 2400 board. The clock sits at
// roughly y 150–570, so only atmosphere (lettering, backdrop, the top of the
// head) goes there. Data lives between ~600 and ~2200; below that stays quiet.

export interface SkeletonSpec {
  id: SkeletonId
  name: string
  portrait: { x: number; y: number; size: number; fade: number }
  word?: { x: number; y: number; length: number; vertical?: boolean; maxSize: number; minSize: number; popOut: boolean; front?: boolean; sources: WordSource[] }
  hero?: { x: number; y: number; width: number; align: 'left' | 'center' | 'right'; maxSize: number; label: 'below' | 'beside' }
  stats: { x: number; y: number; width: number; align: 'left' | 'center' | 'right'; arrangements: StatArrangement[] }
  crest: { x: number; y: number }
  season?: { x: number; y: number; align: 'left' | 'right' }
  ticker?: boolean
  glow: { x: number; y: number }
  backdrops: BackdropKind[]
  // Depth effects this composition was designed around get a scoring bonus.
  signature: Array<'popOut' | 'extrudeHero' | 'extrudeWord' | 'rim' | 'shadow' | 'tiles' | 'floor'>
}

export const remixSkeletons: SkeletonSpec[] = [
  {
    id: 'stage', name: 'Centre stage',
    portrait: { x: 60, y: 560, size: 960, fade: 30 },
    word: { x: -20, y: 290, length: 1120, maxSize: 600, minSize: 220, popOut: false, sources: ['surname', 'fpl', 'club'] },
    hero: { x: 72, y: 1440, width: 936, align: 'center', maxSize: 430, label: 'below' },
    stats: { x: 72, y: 1990, width: 936, align: 'center', arrangements: ['row', 'pair'] },
    crest: { x: 72, y: 870 }, season: { x: 1008, y: 894, align: 'right' }, ticker: true,
    glow: { x: 540, y: 900 }, backdrops: ['rings', 'glow', 'sunburst', 'arc', 'beams'], signature: ['rim', 'extrudeHero', 'tiles'],
  },
  {
    id: 'headline', name: 'Headline',
    portrait: { x: 40, y: 600, size: 1000, fade: 22 },
    word: { x: -30, y: 1060, length: 1140, maxSize: 560, minSize: 220, popOut: true, sources: ['surname'] },
    hero: { x: 72, y: 1660, width: 560, align: 'left', maxSize: 300, label: 'beside' },
    stats: { x: 72, y: 1990, width: 936, align: 'center', arrangements: ['row', 'lines'] },
    crest: { x: 920, y: 1720 }, season: { x: 72, y: 664, align: 'left' }, ticker: true,
    glow: { x: 540, y: 940 }, backdrops: ['flat', 'stripes', 'diagonal', 'halftone', 'beams', 'sunburst'], signature: ['popOut', 'shadow', 'extrudeWord'],
  },
  {
    id: 'tower', name: 'Vertical name',
    portrait: { x: 300, y: 1080, size: 940, fade: 34 },
    word: { x: 36, y: 600, length: 1600, vertical: true, maxSize: 430, minSize: 200, popOut: true, sources: ['surname'] },
    hero: { x: 420, y: 620, width: 588, align: 'right', maxSize: 340, label: 'below' },
    stats: { x: 420, y: 2030, width: 588, align: 'right', arrangements: ['pair', 'lines'] },
    crest: { x: 920, y: 1060 },
    glow: { x: 770, y: 1360 }, backdrops: ['flat', 'diagonal', 'halftone', 'rings', 'stripes'], signature: ['popOut', 'extrudeWord', 'shadow'],
  },
  {
    id: 'editorial', name: 'Editorial',
    portrait: { x: 250, y: 1250, size: 1150, fade: 0 },
    hero: { x: 64, y: 620, width: 640, align: 'left', maxSize: 540, label: 'below' },
    stats: { x: 72, y: 1500, width: 520, align: 'left', arrangements: ['lines'] },
    crest: { x: 72, y: 1820 }, season: { x: 1008, y: 664, align: 'right' },
    glow: { x: 820, y: 1620 }, backdrops: ['flat', 'arc', 'glow', 'halftone'], signature: ['shadow', 'rim', 'extrudeHero'],
  },
  {
    id: 'column', name: 'Print column',
    portrait: { x: -60, y: 1250, size: 1150, fade: 0 },
    word: { x: 16, y: 620, length: 700, maxSize: 900, minSize: 300, popOut: false, sources: ['rank', 'club'] },
    stats: { x: 716, y: 640, width: 300, align: 'right', arrangements: ['column'] },
    crest: { x: 920, y: 1580 },
    glow: { x: 420, y: 1660 }, backdrops: ['flat', 'halftone', 'diagonal', 'stripes'], signature: ['extrudeWord', 'shadow', 'tiles'],
  },
  {
    id: 'monument', name: 'Monument',
    portrait: { x: 130, y: 600, size: 820, fade: 0 },
    word: { x: -20, y: 250, length: 1120, maxSize: 520, minSize: 200, popOut: false, sources: ['fpl', 'club', 'surname'] },
    hero: { x: 72, y: 1250, width: 936, align: 'center', maxSize: 640, label: 'below' },
    stats: { x: 72, y: 1990, width: 936, align: 'center', arrangements: ['row', 'pair'] },
    crest: { x: 72, y: 640 }, season: { x: 1008, y: 664, align: 'right' },
    glow: { x: 540, y: 980 }, backdrops: ['glow', 'beams', 'rings', 'sunburst'], signature: ['extrudeHero', 'floor', 'rim'],
  },
  {
    id: 'corner', name: 'Off-centre',
    portrait: { x: 300, y: 880, size: 1000, fade: 0 },
    word: { x: -20, y: 1860, length: 1120, maxSize: 420, minSize: 200, popOut: false, front: true, sources: ['surname'] },
    hero: { x: 64, y: 620, width: 560, align: 'left', maxSize: 460, label: 'below' },
    stats: { x: 72, y: 1230, width: 300, align: 'left', arrangements: ['column', 'lines'] },
    crest: { x: 920, y: 640 },
    glow: { x: 800, y: 1280 }, backdrops: ['flat', 'sunburst', 'diagonal', 'arc', 'stripes'], signature: ['shadow', 'extrudeHero', 'rim'],
  },
  {
    id: 'split', name: 'Split field',
    portrait: { x: -120, y: 1100, size: 1120, fade: 0 },
    word: { x: 36, y: 620, length: 640, maxSize: 380, minSize: 180, popOut: false, sources: ['club', 'fpl'] },
    stats: { x: 708, y: 640, width: 300, align: 'center', arrangements: ['column'] },
    crest: { x: 72, y: 1000 }, ticker: true,
    glow: { x: 420, y: 1500 }, backdrops: ['diagonal', 'stripes'], signature: ['tiles', 'shadow'],
  },
]
export const getRemixSkeleton = (id: SkeletonId) => remixSkeletons.find(item => item.id === id) ?? remixSkeletons[0]!

// ---- Palettes ---------------------------------------------------------------

export interface RemixColours extends WallpaperColours {
  field2: string
  word: string
  deep: string
  glow: string
  name: string
}

interface PaletteSeed { name: string; field: string; field2?: string; alt: string; word: string; ink: string; accent: string; glow?: string }
const curated: PaletteSeed[] = [
  { name: 'Royal', field: '#1c2bd4', field2: '#0d1680', alt: '#3b4cff', word: '#ffffff', ink: '#ffffff', accent: '#c8ff3d' },
  { name: 'Acid', field: '#c9f230', field2: '#a9d61a', alt: '#0b0b0c', word: '#0b0b0c', ink: '#0b0b0c', accent: '#0b0b0c' },
  { name: 'Lilac', field: '#dcd2f6', field2: '#c2b3f0', alt: '#b4a0ee', word: '#141018', ink: '#141018', accent: '#5b2be0' },
  { name: 'Newsprint', field: '#f4e9dc', field2: '#eadbc8', alt: '#d6262f', word: '#d6262f', ink: '#2a1414', accent: '#d6262f' },
  { name: 'Nightglow', field: '#0e0818', field2: '#1d0d3a', alt: '#7b2cf2', word: '#ffffff', ink: '#ffffff', accent: '#c9b6ff', glow: '#8f4bff' },
  { name: 'Blaze', field: '#ff5b1d', field2: '#e8410a', alt: '#1d3ed6', word: '#ffffff', ink: '#0b0b0c', accent: '#0b0b0c' },
  { name: 'Pitch', field: '#0c3b2a', field2: '#062419', alt: '#1f7a4f', word: '#c8ff3d', ink: '#f1f7e6', accent: '#c8ff3d', glow: '#2fbf71' },
  { name: 'Ice', field: '#e9f0f7', field2: '#cfe0ef', alt: '#9cc3e6', word: '#0b1d33', ink: '#0b1d33', accent: '#e8312a' },
  { name: 'Carbon', field: '#111214', field2: '#1f2126', alt: '#30333a', word: '#f2f2f2', ink: '#f2f2f2', accent: '#ff3dbb', glow: '#ff3dbb' },
  { name: 'Bubblegum', field: '#ff8fc7', field2: '#ff6fb5', alt: '#ff4fa3', word: '#2a0a1c', ink: '#2a0a1c', accent: '#2a0a1c' },
  { name: 'Mint', field: '#c3f4de', field2: '#9debc8', alt: '#5be3a8', word: '#062a1c', ink: '#062a1c', accent: '#062a1c' },
  { name: 'Noir gold', field: '#0d0c0a', field2: '#1f1a12', alt: '#c9a227', word: '#e9cf7a', ink: '#f6ecd0', accent: '#c9a227', glow: '#c9a227' },
  { name: 'Cobalt cream', field: '#f1ece2', field2: '#e6dfd1', alt: '#1b3fd6', word: '#1b3fd6', ink: '#10204f', accent: '#1b3fd6' },
  { name: 'Crimson', field: '#8e0f1e', field2: '#560812', alt: '#c8102e', word: '#fff5e6', ink: '#fff5e6', accent: '#ffd23f', glow: '#ff3045' },
  { name: 'Deep teal', field: '#063b45', field2: '#03252c', alt: '#0fa3a3', word: '#ffd23f', ink: '#ffffff', accent: '#ffd23f', glow: '#18c6c6' },
  { name: 'Ultraviolet', field: '#2a0d8a', field2: '#12053f', alt: '#ff2e88', word: '#ffffff', ink: '#ffffff', accent: '#ff2e88', glow: '#ff2e88' },
]

function clubPalettes(clubCode: number): PaletteSeed[] {
  const { primary, dark, light } = getInstagramClubTheme(clubCode, 'club')
  const night = mixColour(dark, '#000000', 0.45)
  return [
    { name: 'Club kit', field: primary, field2: mixColour(primary, dark, 0.45), alt: mixColour(primary, dark, 0.3), word: luminance(primary) > 0.4 ? dark : '#ffffff', ink: '#ffffff', accent: light },
    { name: 'Club night', field: night, field2: mixColour(night, '#000000', 0.5), alt: primary, word: mixColour(primary, '#ffffff', 0.2), ink: '#ffffff', accent: mixColour(primary, '#ffffff', 0.35), glow: primary },
    { name: 'Club paper', field: light, field2: mixColour(light, primary, 0.12), alt: primary, word: primary, ink: dark, accent: primary },
    { name: 'Club duotone', field: dark, field2: mixColour(dark, '#000000', 0.4), alt: mixColour(dark, primary, 0.5), word: light, ink: light, accent: primary, glow: primary },
  ]
}

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}
// Picks black or white, whichever reads better on both ends of the field gradient.
const bestInk = (field: string, field2: string) => Math.min(contrast('#ffffff', field), contrast('#ffffff', field2)) >= Math.min(contrast('#0b0b0c', field), contrast('#0b0b0c', field2)) ? '#ffffff' : '#0b0b0c'

export function finishPalette(seed: PaletteSeed): RemixColours {
  const field2 = seed.field2 ?? seed.field
  const worst = (colour: string) => Math.min(contrast(colour, seed.field), contrast(colour, field2))
  // Data text must reach 4.5:1 on the whole field; accents and big numbers 3:1.
  const ink = worst(seed.ink) >= 4.5 ? seed.ink : bestInk(seed.field, field2)
  const accent = worst(seed.accent) >= 3 ? seed.accent : ink
  const word = worst(seed.word) >= 1.6 ? seed.word : ink
  const dark = luminance(seed.field) < 0.2
  return {
    name: seed.name,
    field: seed.field,
    field2,
    alt: seed.alt,
    ink,
    accent,
    word,
    lettering: word,
    muted: mixColour(ink, seed.field, 0.32),
    clock: ink,
    deep: dark ? mixColour(seed.field, '#000000', 0.7) : mixColour(seed.field, '#000000', 0.5),
    glow: seed.glow ?? (dark ? mixColour(seed.alt, '#ffffff', 0.1) : mixColour(seed.field, '#ffffff', 0.55)),
  }
}

export function remixPaletteList(mode: WallpaperPalette, clubCode: number, custom?: string): PaletteSeed[] {
  if (mode === 'club') return clubPalettes(clubCode)
  if (mode === 'custom' && custom) {
    const ink = luminance(custom) >= 0.179 ? '#0b0b0c' : '#ffffff'
    return [
      { name: 'Custom', field: custom, field2: mixColour(custom, '#000000', 0.18), alt: mixColour(custom, ink, 0.16), word: ink, ink, accent: ink },
      { name: 'Custom tone', field: custom, field2: mixColour(custom, ink, 0.1), alt: mixColour(custom, ink, 0.35), word: mixColour(custom, ink, 0.22), ink, accent: ink },
    ]
  }
  return curated
}

// ---- Type pairings ----------------------------------------------------------

export interface TypePairing { id: string; name: string; word: FontId; hero: FontId; stat: FontId }
export const typePairings: TypePairing[] = [
  { id: 'poster', name: 'Poster', word: 'anton', hero: 'archivo', stat: 'archivo' },
  { id: 'block', name: 'Block', word: 'archivo', hero: 'archivo', stat: 'archivo' },
  { id: 'didone', name: 'Didone', word: 'bodoni', hero: 'bodoni', stat: 'bodoni' },
  { id: 'wide', name: 'Wide', word: 'unbounded', hero: 'unbounded', stat: 'unbounded' },
  { id: 'italic', name: 'Italic serif', word: 'instrument', hero: 'bodoni', stat: 'oswald' },
  { id: 'condensed', name: 'Condensed', word: 'anton', hero: 'anton', stat: 'anton' },
  { id: 'contrast', name: 'Contrast', word: 'anton', hero: 'bodoni', stat: 'oswald' },
  { id: 'stencil', name: 'Wide and narrow', word: 'unbounded', hero: 'anton', stat: 'anton' },
]

// ---- Recipe -----------------------------------------------------------------

export interface RemixSeeds { layout: number; palette: number; type: number; depth: number }

export interface RemixDepth {
  mode: RemixDepthMode
  light: Light
  popOut: boolean
  shadow: 'none' | 'offset' | 'soft'
  rim: boolean
  echo: boolean
  extrude: 'none' | 'word' | 'hero'
  extrudeStyle: 'block' | 'long'
  tiles: boolean
  floor: boolean
  emboss: boolean
}

export interface WallpaperRecipe {
  code: string
  seeds: RemixSeeds
  skeleton: SkeletonSpec
  backdrop: { kind: BackdropKind; variant: number; angle: number }
  arrangement: StatArrangement
  wordSource: WordSource
  accents: { season: boolean; ticker: boolean; frame: boolean }
  colours: RemixColours
  finish: 'none' | 'grain'
  type: TypePairing
  wordTreatment: WordTreatment
  skew: boolean
  depth: RemixDepth
  score: number
}

// Small, fast, deterministic PRNG.
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
type Rng = () => number
const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length) % items.length]!
const chance = (rng: Rng, p: number) => rng() < p
const SEED_MAX = 0x7fffffff
export const randomSeed = () => Math.floor(Math.random() * SEED_MAX)

export const encodeRemix = (seeds: RemixSeeds) => remixAspects.map(aspect => seeds[aspect].toString(36)).join('-')
export function decodeRemix(code: unknown): RemixSeeds | null {
  if (typeof code !== 'string' || !/^[0-9a-z]{1,7}(-[0-9a-z]{1,7}){3}$/.test(code)) return null
  const values = code.split('-').map(part => Number.parseInt(part, 36))
  if (values.some(value => !Number.isInteger(value) || value < 0 || value > SEED_MAX)) return null
  return { layout: values[0]!, palette: values[1]!, type: values[2]!, depth: values[3]! }
}
export const isRemixCode = (code: unknown): code is string => decodeRemix(code) !== null

export interface RemixContext {
  player: WallpaperPlayer
  palette: WallpaperPalette
  background?: string
}

function layoutAspect(seed: number) {
  const rng = mulberry32(seed ^ 0x1a2b3c)
  const skeleton = pick(rng, remixSkeletons)
  return {
    skeleton,
    backdrop: { kind: pick(rng, skeleton.backdrops), variant: Math.floor(rng() * 4), angle: Math.round(-24 + rng() * 48) },
    arrangement: pick(rng, skeleton.stats.arrangements),
    wordSource: skeleton.word ? pick(rng, skeleton.word.sources) : 'surname' as WordSource,
    accents: { season: Boolean(skeleton.season) && chance(rng, 0.8), ticker: Boolean(skeleton.ticker) && chance(rng, 0.4), frame: chance(rng, 0.22) },
  }
}

function paletteAspect(seed: number, context: RemixContext) {
  const rng = mulberry32(seed ^ 0x5eed11)
  const list = remixPaletteList(context.palette, context.player.clubCode, context.background)
  return { colours: finishPalette(pick(rng, list)), finish: chance(rng, 0.35) ? 'grain' as const : 'none' as const }
}

function typeAspect(seed: number) {
  const rng = mulberry32(seed ^ 0x7e7e7e)
  return {
    type: pick(rng, typePairings),
    wordTreatment: pick(rng, ['solid', 'solid', 'outline', 'halftone', 'ghost'] as const) as WordTreatment,
    skew: chance(rng, 0.3),
  }
}

export function depthAspect(seed: number): RemixDepth {
  const rng = mulberry32(seed ^ 0xd3e9)
  const roll = rng()
  const mode: RemixDepthMode = roll < 0.3 ? 'flat' : roll < 0.65 ? 'layered' : 'sculpted'
  const light = pick(rng, ['left', 'right', 'top'] as const)
  const base: RemixDepth = { mode, light, popOut: false, shadow: 'none', rim: false, echo: false, extrude: 'none', extrudeStyle: 'block', tiles: false, floor: false, emboss: false }
  if (mode === 'layered') {
    return { ...base, popOut: chance(rng, 0.85), shadow: pick(rng, ['offset', 'soft', 'soft', 'none'] as const), rim: chance(rng, 0.7), echo: chance(rng, 0.45) }
  }
  if (mode === 'sculpted') {
    return {
      ...base,
      extrude: pick(rng, ['hero', 'word', 'hero'] as const),
      extrudeStyle: chance(rng, 0.35) ? 'long' : 'block',
      tiles: chance(rng, 0.6),
      floor: chance(rng, 0.5),
      emboss: chance(rng, 0.6),
      shadow: chance(rng, 0.5) ? 'soft' : 'none',
      rim: chance(rng, 0.35),
      popOut: chance(rng, 0.4),
    }
  }
  return base
}

// Makes the aspects agree with each other, so every combination renders sensibly.
function resolve(seeds: RemixSeeds, context: RemixContext): Omit<WallpaperRecipe, 'score'> {
  const layout = layoutAspect(seeds.layout)
  const palette = paletteAspect(seeds.palette, context)
  const type = typeAspect(seeds.type)
  const depth = { ...depthAspect(seeds.depth) }
  const { skeleton } = layout
  let wordSource = layout.wordSource
  if (wordSource === 'rank' && !context.player.positionRank) wordSource = skeleton.word?.sources.find(source => source !== 'rank') ?? 'club'
  if (depth.extrude === 'hero' && !skeleton.hero) depth.extrude = skeleton.word ? 'word' : 'none'
  if (depth.extrude === 'word' && !skeleton.word) depth.extrude = skeleton.hero ? 'hero' : 'none'
  if (!skeleton.word?.popOut) depth.popOut = false
  // One sculpted object at a time: an extruded hero number makes the echo redundant.
  if (depth.extrude === 'hero') depth.echo = false
  let wordTreatment = type.wordTreatment
  if (depth.extrude === 'word' || depth.popOut) wordTreatment = wordTreatment === 'halftone' ? 'solid' : wordTreatment
  if (depth.extrude === 'word' && wordTreatment !== 'solid') wordTreatment = 'solid'
  // A pop-out needs a word strong enough to read in front of the body.
  if (depth.popOut && wordTreatment === 'ghost') wordTreatment = 'solid'
  return { code: encodeRemix(seeds), seeds, ...layout, wordSource, ...palette, ...type, wordTreatment, depth }
}

function wordText(recipe: Pick<WallpaperRecipe, 'wordSource'>, player: WallpaperPlayer) {
  if (recipe.wordSource === 'rank') return player.positionRank ? String(player.positionRank).padStart(2, '0') : ''
  if (recipe.wordSource === 'fpl') return 'FPL'
  if (recipe.wordSource === 'club') return player.teamShort || player.club
  return player.lastName || player.name
}

// Rules: hard failures return -Infinity; the rest prefers good matches and variety.
function scoreRecipe(recipe: Omit<WallpaperRecipe, 'score'>, context: RemixContext, previous?: WallpaperRecipe | null) {
  const { colours, skeleton, depth, type, backdrop } = recipe
  const dark = luminance(colours.field) < 0.2
  const light = luminance(colours.field) > 0.5
  let score = 0
  if (skeleton.word && recipe.wordTreatment === 'solid' && contrast(colours.word, colours.field) < 1.6) return -Infinity
  // Long surnames in wide faces shrink to unreadable sizes.
  const text = wordText(recipe, context.player)
  const wordFont = remixFonts[type.word]
  if (skeleton.word && text.length * wordFont.width * skeleton.word.minSize > skeleton.word.length * 1.15) score -= 4
  // Backdrops that need light or dark fields.
  if (['glow', 'beams', 'sunburst'].includes(backdrop.kind)) score += dark ? 2 : light ? -2 : 0
  if (backdrop.kind === 'halftone') score += light ? 2 : -1
  if (dark && depth.rim) score += 1.5
  if (light && depth.shadow === 'soft') score += 1
  if (depth.shadow === 'offset' && !dark) score += 1
  // Depth the composition was designed around.
  const signatureHit = skeleton.signature.some(effect =>
    (effect === 'popOut' && depth.popOut) || (effect === 'extrudeHero' && depth.extrude === 'hero') || (effect === 'extrudeWord' && depth.extrude === 'word')
    || (effect === 'rim' && depth.rim) || (effect === 'shadow' && depth.shadow !== 'none') || (effect === 'tiles' && depth.tiles) || (effect === 'floor' && depth.floor))
  if (signatureHit) score += 2
  // Type that suits the layout.
  if (skeleton.id === 'editorial' && ['didone', 'italic', 'contrast'].includes(type.id)) score += 2
  if (skeleton.id === 'column' && ['condensed', 'poster', 'stencil'].includes(type.id)) score += 1.5
  if (skeleton.id === 'tower' && ['condensed', 'poster', 'block'].includes(type.id)) score += 1.5
  if (skeleton.id === 'monument' && ['block', 'wide', 'poster'].includes(type.id)) score += 1
  // Variety: avoid repeating the last result.
  if (previous) {
    if (previous.skeleton.id === skeleton.id) score -= 3
    if (previous.colours.name === colours.name) score -= 2
    if (previous.type.id === type.id) score -= 1.5
    if (previous.depth.mode === depth.mode) score -= 0.5
  }
  return score
}

export interface GenerateRemixOptions extends RemixContext {
  seed?: number
  previous?: WallpaperRecipe | null
  locks?: RemixAspect[]
  depth?: RemixDepthMode
  candidates?: number
}

export function generateRemix(options: GenerateRemixOptions): WallpaperRecipe {
  const rng = mulberry32(options.seed ?? randomSeed())
  const locks = new Set(options.previous ? options.locks ?? [] : [])
  // The dice first picks which composition and depth to show, so every layout and
  // depth mode keeps turning up; the candidate search then tunes everything else.
  const skeletons = remixSkeletons.filter(item => item.id !== options.previous?.skeleton.id)
  const targetSkeleton = locks.has('layout') ? null : pick(rng, skeletons).id
  const roll = rng()
  const targetDepth: RemixDepthMode | null = locks.has('depth') ? null : options.depth ?? (roll < 0.28 ? 'flat' : roll < 0.64 ? 'layered' : 'sculpted')
  let best: WallpaperRecipe | null = null
  const tries = options.candidates ?? 24
  let hits = 0
  for (let attempt = 0; attempt < 4000 && hits < tries; attempt++) {
    const seeds = Object.fromEntries(remixAspects.map(aspect => [aspect, locks.has(aspect) ? options.previous!.seeds[aspect] : Math.floor(rng() * SEED_MAX)])) as unknown as RemixSeeds
    if (targetSkeleton && layoutAspect(seeds.layout).skeleton.id !== targetSkeleton) continue
    if (targetDepth && depthAspect(seeds.depth).mode !== targetDepth) continue
    hits++
    const candidate = resolve(seeds, options)
    const score = scoreRecipe(candidate, options, options.previous) + rng() * 1.2
    if (score > (best?.score ?? -Infinity)) best = { ...candidate, score }
  }
  return best ?? { ...resolve({ layout: 1, palette: 1, type: 1, depth: 1 }, options), score: 0 }
}

// Rebuilds a recipe from its code (a shared link or a saved choice).
export function recipeFromCode(code: string, context: RemixContext): WallpaperRecipe | null {
  const seeds = decodeRemix(code)
  return seeds ? { ...resolve(seeds, context), score: 0 } : null
}

export const remixWordText = wordText

export function describeRemix(recipe: WallpaperRecipe) {
  const depth = recipe.depth.mode === 'flat' ? 'Flat' : recipe.depth.mode === 'layered' ? 'Layered' : 'Sculpted'
  return `${recipe.skeleton.name} · ${recipe.colours.name} · ${recipe.type.name} · ${depth}`
}

// Stat slots: 0 is the lead number. With a hero number, the stat block shows supporting slots.
export function remixStatSlots(recipe: WallpaperRecipe) {
  if (!recipe.skeleton.hero) return [0, 1, 2]
  return recipe.arrangement === 'column' ? [1, 2, 3] : [1, 2]
}

// Offsets along the light direction: shadows and extrusions fall away from the light.
export function lightVector(light: Light) {
  return light === 'left' ? { x: 1, y: 0.8 } : light === 'right' ? { x: -1, y: 0.8 } : { x: 0, y: 1 }
}
