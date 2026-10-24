<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import { getInstagramClubTheme } from '~/utils/instagram-designs'
import { formatInstagramStat, instagramStatLabel, type InstagramDraft } from '~/utils/instagram-templates'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'
import SchedulerPlayerName from '~/components/SchedulerPlayerName.vue'
import SchedulerClubGraphics from '~/components/SchedulerClubGraphics.vue'
import { getInstagramStatSignals, getInstagramStatSignalColor } from '~/utils/instagram-designs'
const props = defineProps<{ draft: InstagramDraft }>()
const element = (id: string, label: string) => ({ id, label, layout: props.draft.layout, group: id === 'leading-stat' || (id.startsWith('stat-') && !id.endsWith('-label') && !id.endsWith('-value')) })
const player = computed(() => props.draft.players[0]!)
const theme = computed(() => getInstagramClubTheme(player.value.clubCode, props.draft.palette))
const sideStats = computed(() => props.draft.stats.slice(0, 4))
const bottomStats = computed(() => props.draft.stats.slice(4))
const signals = computed(() => getInstagramStatSignals(player.value, props.draft.stats))
</script>

<template>
  <div class="relative h-full w-full">
    <PlayerAge :player="player" artwork class="absolute right-12 top-4 z-30" />
    <SchedulerClubGraphics :colour="theme.primary" :dark="theme.dark" mode="pitch" class="absolute inset-0 opacity-25" />
    <div class="absolute top-0 left-12 z-20 flex items-center gap-4"><SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="h-[90px] w-[90px] shrink-0 text-[40px]" /><div><p class="text-[30px] font-bold">{{ player.club }}</p><p class="mt-1 text-[22px] tracking-[0.12em] uppercase">{{ player.position }}</p></div></div>
    <SchedulerPlayerName v-scheduler-element="element('player-name', 'Player name')" :player="player" :width="984" :max-size="175" :show-age="false" single-line class="absolute top-[125px] left-12 opacity-25" />
    <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute right-[190px] bottom-[140px] h-[650px] w-[700px] text-[70px]" />
    <div v-scheduler-element="element(`stat-${key.replaceAll('_', '-')}`, instagramStatLabel(key))" v-for="(key, index) in sideStats" :key="key" class="absolute z-10 w-[200px]" :class="index < 2 ? 'left-12 text-left' : 'right-12 text-right'" :style="{ top: `${310 + (index % 2) * 160}px` }"><p v-scheduler-element="element(`stat-${key.replaceAll('_', '-')}-label`, `${instagramStatLabel(key)} label`)" class="text-[22px] font-semibold tracking-[0.08em] uppercase opacity-80">{{ instagramStatLabel(key) }}</p><p v-scheduler-element="element(`stat-${key.replaceAll('_', '-')}-value`, `${instagramStatLabel(key)} value`)" class="mt-3 font-[FPLNumbers] text-[68px] font-bold leading-none tabular-nums">{{ formatInstagramStat(player, key) }}</p><span v-if="signals[key]" aria-hidden="true" class="mt-2 block h-[3px] w-8 rounded-full" :class="index < 2 ? '' : 'ml-auto'" :style="{ backgroundColor: getInstagramStatSignalColor(signals[key], theme.light) }" /></div>
    <dl data-layout-group="true" v-scheduler-element="element('stats', 'Bottom stats')" v-if="bottomStats.length" class="absolute right-12 bottom-5 left-12 z-20 flex h-[120px] items-center justify-around rounded-2xl border border-white/15 bg-black/25"><div v-scheduler-element="element(`stats-${key.replaceAll('_', '-')}`, instagramStatLabel(key))" data-layout-group="true" v-for="key in bottomStats" :key="key" :style="{ textAlign: draft.layout?.stats?.align, alignItems: draft.layout?.stats?.align === 'left' ? 'flex-start' : draft.layout?.stats?.align === 'right' ? 'flex-end' : undefined }" class="flex flex-col items-center text-center"><dt v-scheduler-element="element(`stats-${key.replaceAll('_', '-')}-label`, `${instagramStatLabel(key)} label`)" class="text-[22px] tracking-[0.1em] uppercase opacity-80">{{ instagramStatLabel(key) }}</dt><dd v-scheduler-element="element(`stats-${key.replaceAll('_', '-')}-value`, `${instagramStatLabel(key)} value`)" class="mt-2 font-[FPLNumbers] text-[59px] font-bold leading-none tabular-nums">{{ formatInstagramStat(player, key) }}</dd><span v-if="signals[key]" aria-hidden="true" class="mt-2 h-[3px] w-7 rounded-full" :style="{ backgroundColor: getInstagramStatSignalColor(signals[key], theme.light) }" /></div></dl>
  </div>
</template>
