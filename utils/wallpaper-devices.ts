import type { SchedulerBox, SchedulerGuide } from './scheduler-layout'
import { IPHONE_CROP, WALLPAPER_HEIGHT, WALLPAPER_WIDTH } from './wallpaper'

export type WallpaperDevice = 'iphone' | 'android'
export type WallpaperScreen = 'lock' | 'home'

export interface DeviceZone extends SchedulerBox { id: string; label: string }

// Approximate system UI zones, in artboard px (1080 × 2400). They are estimates from
// typical recent lock and home screens and vary by model, OEM and user settings.
// Keep every adjustment here so one file can be corrected after device checks.
const zones: Record<WallpaperDevice, Record<WallpaperScreen, DeviceZone[]>> = {
  iphone: {
    lock: [
      { id: 'clock', label: 'Clock', x: 90, y: 150, width: 900, height: 420 },
      { id: 'widgets', label: 'Widgets', x: 110, y: 580, width: 860, height: 150 },
      { id: 'controls', label: 'Lock screen buttons', x: 0, y: 2130, width: 1080, height: 240 },
    ],
    home: [
      { id: 'status', label: 'Status bar', x: 0, y: 30, width: 1080, height: 130 },
      { id: 'dock', label: 'Dock', x: 0, y: 2080, width: 1080, height: 290 },
    ],
  },
  android: {
    lock: [
      { id: 'clock', label: 'Clock', x: 90, y: 230, width: 900, height: 640 },
      { id: 'controls', label: 'Lock screen shortcuts', x: 0, y: 2170, width: 1080, height: 230 },
    ],
    home: [
      { id: 'status', label: 'Status bar', x: 0, y: 0, width: 1080, height: 110 },
      { id: 'dock', label: 'Dock and search', x: 0, y: 1960, width: 1080, height: 440 },
    ],
  },
}

export const getDeviceZones = (device: WallpaperDevice, screen: WallpaperScreen) => zones[device][screen]

// Zone edges become snap targets so items line up just clear of the clock and dock.
export function getDeviceGuides(device: WallpaperDevice, screen: WallpaperScreen): SchedulerGuide[] {
  const guides: SchedulerGuide[] = zones[device][screen].flatMap(zone => [{ axis: 'y' as const, value: zone.y }, { axis: 'y' as const, value: zone.y + zone.height }])
  if (device === 'iphone') guides.push({ axis: 'y', value: IPHONE_CROP }, { axis: 'y', value: WALLPAPER_HEIGHT - IPHONE_CROP })
  return guides
}

export const deviceScreen = (device: WallpaperDevice) => ({
  width: WALLPAPER_WIDTH,
  height: device === 'iphone' ? WALLPAPER_HEIGHT - IPHONE_CROP * 2 : WALLPAPER_HEIGHT,
  offset: device === 'iphone' ? IPHONE_CROP : 0,
})

export const overlaps = (a: SchedulerBox, b: SchedulerBox) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y

// Preview widgets show real FPL data only; a widget without data is left out.
export interface WallpaperWidget { id: string; icon: string; title: string; value: string }
