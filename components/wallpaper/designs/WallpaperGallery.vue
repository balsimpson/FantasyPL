<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { WallpaperArtworkModel } from '~/utils/wallpaper'
import WallpaperFitText from '~/components/wallpaper/WallpaperFitText.vue'
import WallpaperPortrait from '~/components/wallpaper/WallpaperPortrait.vue'
import WallpaperClubLogo from '~/components/wallpaper/WallpaperClubLogo.vue'
// Gallery: a museum label. A Didone numeral with an italic caption, a ruled ledger
// of supporting stats, and the portrait set against a disc centred on the head.
const props = defineProps<{ model: WallpaperArtworkModel }>()
const c = computed(() => props.model.colours)
const el = (id: string, label: string, extra: Record<string, unknown> = {}) => ({ id, label, layout: props.model.layout, ...extra })
const caption = computed(() => props.model.stats[0]?.key === 'total_points' ? 'points this season' : props.model.stats[0]?.label.toLowerCase() ?? '')
</script>

<template>
  <div v-if="model.stats[0]" v-scheduler-element="el('hero', 'Big number', { group: true })" class="absolute left-[60px] top-[620px]">
    <div v-scheduler-element="el('hero-value', 'Number')" class="tabular-nums">
      <WallpaperFitText :text="model.stats[0].value" :width="660" :max-size="600" :min-size="220" family="'Bodoni Moda'" weight="500" />
    </div>
    <p v-scheduler-element="el('hero-label', 'Label')" class="wp-italic mt-4 pl-3 text-[96px] leading-none">{{ caption }}</p>
  </div>

  <span v-scheduler-element="el('rule', 'Rule')" aria-hidden="true" class="absolute left-[72px] top-[1400px] block h-[3px] w-[440px]" :style="{ backgroundColor: c.ink }" />

  <div v-scheduler-element="el('stats', 'Stat lines', { group: true })" class="wp-numbers absolute left-[72px] top-[1430px] w-[440px] text-[40px] uppercase tracking-[0.2em]">
    <template v-for="slot in [3, 4]" :key="slot">
      <p v-if="model.stats[slot]" v-scheduler-element="el(`stat-${slot}`, model.stats[slot]!.label)" class="flex items-baseline justify-between border-b py-5" :style="{ borderColor: c.muted }">
        <span>{{ model.stats[slot]!.label }}</span>
        <span class="wp-serif text-[56px] font-semibold normal-case tracking-normal tabular-nums">{{ model.stats[slot]!.value }}</span>
      </p>
    </template>
    <p class="flex items-center gap-4 pt-6 text-[30px] font-semibold tracking-[0.18em]" :style="{ color: c.muted }">
      <WallpaperClubLogo :player="model.player" :layout="model.layout" class="size-[64px]!" />
      <span>{{ model.player.teamShort }} · {{ model.player.positionShort }}<template v-if="model.season"> · {{ model.season }}</template></span>
    </p>
  </div>

  <WallpaperPortrait :player="model.player" :layout="model.layout" class="absolute left-[250px] top-[1250px] h-[1150px] w-[1150px]" />
</template>
