<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import { getInstagramClubTheme } from '~/utils/instagram-designs'
import type { InstagramDraft } from '~/utils/instagram-templates'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'
import SchedulerStatGrid from '~/components/SchedulerStatGrid.vue'
import SchedulerClubGraphics from '~/components/SchedulerClubGraphics.vue'
const props = defineProps<{ draft: InstagramDraft }>()
const element = (id: string, label: string) => ({ id, label, layout: props.draft.layout, group: id === 'leading-stat' || (id.startsWith('stat-') && !id.endsWith('-label') && !id.endsWith('-value')) })
const player = computed(() => props.draft.players[0]!)
const theme = computed(() => getInstagramClubTheme(player.value.clubCode, props.draft.palette))
const nameSize = computed(() => Math.min(86, 820 / Math.max(1, player.value.fullName.length)))
</script>

<template>
  <div class="relative h-full w-full">
    <SchedulerClubGraphics :colour="theme.primary" :dark="theme.dark" mode="pitch" class="absolute inset-0 opacity-30" />
    <div class="absolute top-2 left-12 z-10 flex items-center gap-5">
      <SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="h-[95px] w-[95px] shrink-0 text-[40px]" />
      <div v-scheduler-element="element('club-details', 'Club details')" ><p class="text-[31px] font-bold">{{ player.club }}</p><p class="mt-2 text-[22px] tracking-[0.12em] uppercase">{{ player.position }}</p></div>
    </div>
    <h2 v-scheduler-element="element('player-name', 'Player name')" class="absolute top-[170px] left-12 max-w-[455px] font-bold leading-[1.05] tracking-tight break-words" :style="{ fontSize: `${nameSize}px` }">{{ player.fullName }}<br /><PlayerAge :player="player" artwork class="mt-2" /></h2>
    <SchedulerStatGrid :layout="draft.layout" v-scheduler-element="element('stats', 'Stats')" :player="player" :stats="draft.stats" :columns="2" :accent="theme.light" class="absolute top-[345px] left-6 w-[475px]" />
    <div class="absolute top-[120px] right-6 bottom-[58px] w-[535px] rounded-t-[40px] border border-white/15 bg-white/5" />
    <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute right-6 bottom-[58px] h-[730px] w-[550px] text-[65px]" />
  </div>
</template>
