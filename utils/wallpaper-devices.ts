import type { SchedulerBox, SchedulerGuide } from './scheduler-layout'
import { IPHONE_CROP, WALLPAPER_HEIGHT, WALLPAPER_WIDTH } from './wallpaper'

export type WallpaperDevice = 'iphone' | 'android'

export interface DeviceZone extends SchedulerBox { id: string; label: string }

// Approximate system UI zones, in artboard px (1080 × 2400). They are estimates from
// typical recent lock and home screens and vary by model, OEM and user settings.
// Keep every adjustment here so one file can be corrected after device checks.
const zones: Record<WallpaperDevice, DeviceZone[]> = {
  iphone: [{ id: 'clock', label: 'Date and time', x: 90, y: 150, width: 900, height: 420 }],
  android: [{ id: 'clock', label: 'Date and time', x: 90, y: 155, width: 900, height: 365 }],
}

export const getDeviceZones = (device: WallpaperDevice) => zones[device]

// Zone edges become snap targets so items line up just clear of the date and time.
export function getDeviceGuides(device: WallpaperDevice): SchedulerGuide[] {
  const guides: SchedulerGuide[] = zones[device].flatMap(zone => [{ axis: 'y' as const, value: zone.y }, { axis: 'y' as const, value: zone.y + zone.height }])
  if (device === 'iphone') guides.push({ axis: 'y', value: IPHONE_CROP }, { axis: 'y', value: WALLPAPER_HEIGHT - IPHONE_CROP })
  return guides
}

export const deviceScreen = (device: WallpaperDevice) => ({
  width: WALLPAPER_WIDTH,
  height: device === 'iphone' ? WALLPAPER_HEIGHT - IPHONE_CROP * 2 : WALLPAPER_HEIGHT,
  offset: device === 'iphone' ? IPHONE_CROP : 0,
})

export const overlaps = (a: SchedulerBox, b: SchedulerBox) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
