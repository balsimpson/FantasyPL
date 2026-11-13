<script setup lang="ts">
import type { WallpaperDevice, WallpaperScreen, WallpaperWidget } from '~/utils/wallpaper-devices'
// Preview-only system UI. It approximates recent phones and is never part of the export.
// Sizes use container query units, so the overlay scales with the preview.
const props = defineProps<{ device: WallpaperDevice; screen: WallpaperScreen; colour: string; now: number; widgets: WallpaperWidget[]; playerName: string; showWidgets: boolean }>()

const date = computed(() => new Date(props.now))
const time = computed(() => {
  const parts = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).formatToParts(date.value)
  return { hour: parts.find(part => part.type === 'hour')?.value ?? '', minute: parts.find(part => part.type === 'minute')?.value ?? '' }
})
const longDate = computed(() => new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' }).format(date.value))
const shortDate = computed(() => new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(date.value))
const tint = (amount: number) => `color-mix(in srgb, ${props.colour} ${amount}%, transparent)`
const system = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, system-ui, sans-serif'
const visibleWidgets = computed(() => props.showWidgets ? props.widgets.slice(0, 3) : [])

const apps = [
  ['i-lucide-calendar', 'Calendar'], ['i-lucide-image', 'Photos'], ['i-lucide-camera', 'Camera'], ['i-lucide-mail', 'Mail'],
  ['i-lucide-clock', 'Clock'], ['i-lucide-map', 'Maps'], ['i-lucide-cloud-sun', 'Weather'], ['i-lucide-notebook-pen', 'Notes'],
  ['i-lucide-music', 'Music'], ['i-lucide-podcast', 'Podcasts'], ['i-lucide-shopping-bag', 'Store'], ['i-lucide-heart-pulse', 'Health'],
  ['i-lucide-wallet', 'Wallet'], ['i-lucide-settings', 'Settings'], ['i-lucide-tv', 'TV'], ['i-lucide-book-open', 'Books'],
] as const
const dock = ['i-lucide-phone', 'i-lucide-globe', 'i-lucide-message-circle', 'i-lucide-music'] as const
</script>

<template>
  <div class="pointer-events-none absolute inset-0 select-none overflow-hidden text-white" :style="{ fontFamily: system }" aria-hidden="true">
    <!-- Status bar -->
    <div class="absolute inset-x-0 flex items-center justify-between" :style="{ top: device === 'iphone' ? '2.1%' : '1.2%', paddingInline: device === 'iphone' ? '9%' : '6%', color: screen === 'lock' ? colour : '#fff', fontSize: '3.6cqw', fontWeight: 600 }">
      <span>{{ screen === 'home' || device === 'android' ? `${time.hour}:${time.minute}` : '' }}</span>
      <span class="flex items-center" :style="{ gap: '1.4cqw' }">
        <svg viewBox="0 0 18 12" :style="{ width: '4.4cqw' }"><rect x="0" y="8" width="3" height="4" rx="1" fill="currentColor" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="currentColor" /><rect x="10" y="3" width="3" height="9" rx="1" fill="currentColor" /><rect x="15" y="0" width="3" height="12" rx="1" fill="currentColor" /></svg>
        <svg viewBox="0 0 16 12" :style="{ width: '4cqw' }"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0Zm-4.2-4.3a6 6 0 0 1 8.4 0l1.4-1.4a8 8 0 0 0-11.2 0Zm-2.8-2.8a10 10 0 0 1 14 0L16.4 3a12 12 0 0 0-16.8 0Z" fill="currentColor" /></svg>
        <svg viewBox="0 0 27 13" :style="{ width: '6.4cqw' }"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity="0.45" /><rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" /><rect x="24.6" y="4.2" width="1.8" height="4.6" rx="0.9" fill="currentColor" opacity="0.45" /></svg>
      </span>
    </div>

    <!-- iPhone lock screen -->
    <template v-if="device === 'iphone' && screen === 'lock'">
      <p class="absolute inset-x-0 text-center" :style="{ top: '6.6%', color: colour, fontSize: '5cqw', fontWeight: 600, letterSpacing: '0.01em' }">{{ longDate }}</p>
      <p class="absolute inset-x-0 text-center tabular-nums" :style="{ top: '8.3%', color: colour, fontSize: '25cqw', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.035em' }">{{ time.hour }}:{{ time.minute }}</p>
      <div v-if="visibleWidgets.length" class="absolute inset-x-0 flex justify-center" :style="{ top: '24.4%', gap: '2.4cqw' }">
        <div v-for="widget in visibleWidgets" :key="widget.id" class="flex flex-col justify-center" :style="{ width: '25cqw', height: '13cqw', padding: '0 3cqw', borderRadius: '4cqw', background: tint(18), color: colour }">
          <span class="flex items-center font-semibold uppercase opacity-80" :style="{ gap: '1cqw', fontSize: '2.5cqw', letterSpacing: '0.04em' }"><UIcon :name="widget.icon" :style="{ width: '3cqw', height: '3cqw' }" />{{ widget.title }}</span>
          <span class="truncate font-bold" :style="{ fontSize: '4.2cqw', marginTop: '0.6cqw' }">{{ widget.value }}</span>
        </div>
      </div>
      <div class="absolute inset-x-0 flex justify-between" :style="{ bottom: '4.6%', paddingInline: '11%' }">
        <span v-for="icon in ['i-lucide-flashlight', 'i-lucide-camera']" :key="icon" class="flex items-center justify-center rounded-full" :style="{ width: '13cqw', height: '13cqw', background: 'rgba(0,0,0,0.32)' }"><UIcon :name="icon" :style="{ width: '5.4cqw', height: '5.4cqw' }" /></span>
      </div>
    </template>

    <!-- iPhone home screen -->
    <template v-else-if="device === 'iphone'">
      <div class="absolute grid grid-cols-4" :style="{ top: '7.6%', left: '6.5%', right: '6.5%', columnGap: '6.6cqw', rowGap: '5.6cqw' }">
        <div v-if="visibleWidgets.length" class="col-span-2 row-span-2 flex flex-col justify-between" :style="{ aspectRatio: '1', borderRadius: '6cqw', padding: '4.2cqw', background: 'rgba(20,20,24,0.55)' }">
          <span class="font-semibold uppercase opacity-70" :style="{ fontSize: '2.8cqw', letterSpacing: '0.06em' }">FPL</span>
          <div>
            <p class="font-bold leading-tight" :style="{ fontSize: '4.6cqw' }">{{ playerName }}</p>
            <p v-for="widget in visibleWidgets.slice(0, 2)" :key="widget.id" class="opacity-80" :style="{ fontSize: '3cqw', marginTop: '0.8cqw' }">{{ widget.title }} · {{ widget.value }}</p>
          </div>
        </div>
        <div v-for="[icon, label] in apps.slice(0, visibleWidgets.length ? 12 : 16)" :key="label" class="flex flex-col items-center">
          <span class="flex w-full items-center justify-center" :style="{ aspectRatio: '1', borderRadius: '4.4cqw', background: 'rgba(255,255,255,0.26)' }"><UIcon :name="icon" :style="{ width: '7cqw', height: '7cqw' }" /></span>
          <span class="mt-[1.2cqw] w-full truncate text-center font-medium [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]" :style="{ fontSize: '2.7cqw' }">{{ label }}</span>
        </div>
      </div>
      <div class="absolute left-1/2 flex -translate-x-1/2 items-center rounded-full font-semibold" :style="{ bottom: '15.4%', gap: '1.2cqw', padding: '1.6cqw 4cqw', fontSize: '3.2cqw', background: 'rgba(255,255,255,0.24)' }"><UIcon name="i-lucide-search" :style="{ width: '3.4cqw', height: '3.4cqw' }" />Search</div>
      <div class="absolute grid grid-cols-4" :style="{ bottom: '1.9%', left: '3.6%', right: '3.6%', height: '11.6%', borderRadius: '9cqw', padding: '0 3.4cqw', columnGap: '6cqw', alignItems: 'center', background: 'rgba(255,255,255,0.2)' }">
        <span v-for="icon in dock" :key="icon" class="flex items-center justify-center" :style="{ aspectRatio: '1', borderRadius: '4.4cqw', background: 'rgba(255,255,255,0.3)' }"><UIcon :name="icon" :style="{ width: '7cqw', height: '7cqw' }" /></span>
      </div>
    </template>

    <!-- Android lock screen -->
    <template v-else-if="screen === 'lock'">
      <p class="absolute font-medium" :style="{ top: '7%', left: '8%', color: colour, fontSize: '4.2cqw' }">{{ shortDate }}</p>
      <div class="absolute inset-x-0 text-center tabular-nums" :style="{ top: '11%', color: colour, fontSize: '30cqw', lineHeight: 0.86, fontWeight: 300, letterSpacing: '-0.02em' }">
        <p>{{ time.hour.padStart(2, '0') }}</p><p>{{ time.minute }}</p>
      </div>
      <div v-if="visibleWidgets.length" class="absolute inset-x-0 flex flex-wrap justify-center" :style="{ top: '38.5%', gap: '2cqw', color: colour }">
        <span v-for="widget in visibleWidgets" :key="widget.id" class="flex items-center font-medium" :style="{ gap: '1.2cqw', fontSize: '3.4cqw', padding: '1.4cqw 3cqw', borderRadius: '99px', background: tint(16) }"><UIcon :name="widget.icon" :style="{ width: '3.6cqw', height: '3.6cqw' }" />{{ widget.title }} {{ widget.value }}</span>
      </div>
      <div class="absolute inset-x-0 flex justify-between" :style="{ bottom: '3.4%', paddingInline: '8%' }">
        <span v-for="icon in ['i-lucide-wallet', 'i-lucide-camera']" :key="icon" class="flex items-center justify-center rounded-full" :style="{ width: '12cqw', height: '12cqw', background: 'rgba(0,0,0,0.3)' }"><UIcon :name="icon" :style="{ width: '5cqw', height: '5cqw' }" /></span>
      </div>
    </template>

    <!-- Android home screen -->
    <template v-else>
      <div class="absolute" :style="{ top: '6.5%', left: '7%' }">
        <p class="font-normal [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]" :style="{ fontSize: '6.6cqw' }">{{ shortDate }}</p>
        <p v-if="visibleWidgets[0]" class="opacity-90 [text-shadow:0_1px_4px_rgba(0,0,0,0.45)]" :style="{ fontSize: '3.4cqw', marginTop: '0.6cqw' }">{{ visibleWidgets[0].title }} {{ visibleWidgets[0].value }}</p>
      </div>
      <div v-if="visibleWidgets.length" class="absolute flex items-center" :style="{ top: '19%', left: '5%', right: '5%', height: '17cqw', borderRadius: '8.5cqw', padding: '0 6cqw', gap: '4cqw', background: 'rgba(18,18,22,0.6)' }">
        <UIcon name="i-lucide-trophy" :style="{ width: '7cqw', height: '7cqw' }" />
        <div class="min-w-0">
          <p class="truncate font-semibold" :style="{ fontSize: '4.4cqw' }">{{ playerName }}</p>
          <p class="truncate opacity-75" :style="{ fontSize: '3.1cqw' }">{{ visibleWidgets.slice(1).map(widget => `${widget.title} ${widget.value}`).join(' · ') || visibleWidgets[0]?.value }}</p>
        </div>
      </div>
      <div class="absolute grid grid-cols-5" :style="{ bottom: '19.5%', left: '6%', right: '6%', columnGap: '5cqw' }">
        <span v-for="[icon, label] in apps.slice(0, 5)" :key="label" class="flex items-center justify-center rounded-full" :style="{ aspectRatio: '1', background: 'rgba(255,255,255,0.3)' }"><UIcon :name="icon" :style="{ width: '6.4cqw', height: '6.4cqw' }" /></span>
      </div>
      <div class="absolute grid grid-cols-5" :style="{ bottom: '11%', left: '6%', right: '6%', columnGap: '5cqw' }">
        <span v-for="icon in [...dock, 'i-lucide-camera']" :key="icon" class="flex items-center justify-center rounded-full" :style="{ aspectRatio: '1', background: 'rgba(255,255,255,0.3)' }"><UIcon :name="icon" :style="{ width: '6.4cqw', height: '6.4cqw' }" /></span>
      </div>
      <div class="absolute flex items-center justify-between rounded-full" :style="{ bottom: '4%', left: '6%', right: '6%', height: '12cqw', padding: '0 5cqw', background: 'rgba(255,255,255,0.26)' }">
        <UIcon name="i-lucide-search" :style="{ width: '5cqw', height: '5cqw' }" />
        <UIcon name="i-lucide-mic" :style="{ width: '5cqw', height: '5cqw' }" />
      </div>
    </template>

    <!-- Home indicator / gesture bar -->
    <span class="absolute left-1/2 -translate-x-1/2 rounded-full" :style="{ bottom: device === 'iphone' ? '0.7%' : '0.9%', width: device === 'iphone' ? '36%' : '30%', height: '1.3cqw', background: screen === 'lock' ? colour : '#fff' }" />
  </div>
</template>
