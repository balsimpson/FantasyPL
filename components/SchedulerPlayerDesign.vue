<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import { getSchedulerTextContrast } from '~/utils/scheduler-layout'
import type { InstagramDraft } from '~/utils/instagram-templates'
import { formatInstagramStat, instagramStatLabel } from '~/utils/instagram-templates'
import { getInstagramClubTheme, getInstagramStatSignals, getInstagramStatSignalColor } from '~/utils/instagram-designs'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'
import SchedulerPlayerName from '~/components/SchedulerPlayerName.vue'
import SchedulerStatGrid from '~/components/SchedulerStatGrid.vue'
import SchedulerClubGraphics from '~/components/SchedulerClubGraphics.vue'
import SchedulerAnalystDesign from '~/components/SchedulerAnalystDesign.vue'
import SchedulerHeroDesign from '~/components/SchedulerHeroDesign.vue'
const props = defineProps<{ draft: InstagramDraft }>()
const element = (id: string, label: string) => ({ id, label, layout: props.draft.layout, contrast: id === 'player-name' ? getSchedulerTextContrast(props.draft.design) : undefined, group: id === 'leading-stat' || (id.startsWith('stat-') && !id.endsWith('-label') && !id.endsWith('-value')) })
const player = computed(() => props.draft.players[0]!)
const theme = computed(() => getInstagramClubTheme(player.value.clubCode, props.draft.palette))
const heroKey = computed(() => props.draft.story ? props.draft.stats[0]! : props.draft.stats.includes('total_points') ? 'total_points' : props.draft.stats[0]!)
const otherStats = computed(() => props.draft.stats.filter(key => key !== heroKey.value))
const statSignals = computed(() => getInstagramStatSignals(player.value, props.draft.stats))
</script>

<template>
  <div class="relative h-full w-full" :data-design="draft.design">
    <!-- A: editorial cover with a large portrait and six-stat footer. -->
    <template v-if="draft.design === 'editorial'">
      <div class="absolute inset-x-0 top-0 bottom-0 flex flex-col">
        <div class="relative min-h-0 flex-1">
      <div class="absolute top-8 right-10 bottom-0 w-[490px]" :style="{ backgroundColor: theme.paper }"><SchedulerClubGraphics :colour="theme.colour" :dark="theme.dark" mode="pitch" /></div>
      <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute right-0 bottom-0 h-[560px] w-[600px] text-[60px]" />
      <SchedulerPlayerName v-scheduler-element="element('player-name', 'Player name')" :player="player" :width="560" :max-size="148" class="absolute top-4 left-12 z-10" />
      <div class="absolute top-[355px] left-12 z-10 flex items-center gap-4"><SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="h-[94px] w-[94px] shrink-0 text-[40px]" /><div v-scheduler-element="element('club-details', 'Club details')" class="max-w-[360px] text-[28px] font-bold"><p>{{ player.club }}</p><p class="mt-1 text-[23px] tracking-[0.09em] uppercase">{{ player.position }}</p></div></div>
        </div>
        <SchedulerStatGrid :layout="draft.layout" v-scheduler-element="element('stats', 'Stats')" :player="player" :stats="draft.stats" :accent="theme.colour" class="mx-12 shrink-0 [&>div]:pb-3" />
      </div>
    </template>

    <!-- B: a dark matchday poster, with one clear leading number. -->
    <template v-else-if="draft.design === 'matchday'">
      <SchedulerClubGraphics :colour="theme.primary" :dark="theme.dark" mode="sweep" class="absolute inset-0 opacity-80" />
      <div class="absolute inset-x-0 top-0 bottom-5 flex flex-col">
        <div class="relative min-h-0 flex-1">
      <SchedulerPlayerName v-scheduler-element="element('player-name', 'Player name')" :player="player" :width="560" :max-size="148" class="absolute top-3 left-12 z-10" />
      <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute right-0 bottom-0 h-[560px] border-b-0! w-[600px] text-[60px]" />
      <div class="absolute top-[355px] left-12 z-10 flex items-center gap-4"><SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="h-[100px] w-[100px] shrink-0 rounded-full bg-white p-1 text-[40px]" /><div v-scheduler-element="element('club-details', 'Club details')" class="max-w-[320px] text-[27px] font-bold"><p>{{ player.club }}</p><p class="mt-2 text-[22px] tracking-[0.12em] uppercase">{{ player.position }}</p></div></div>
        </div>
      <div class="mx-12 grid min-h-[260px] shrink-0 grid-cols-[310px_1fr] gap-7 bg-[#11151d] p-6">
        <div v-scheduler-element="element('leading-stat', 'Leading stat')" class="flex flex-col justify-center"><p v-scheduler-element="element('leading-stat-value', 'Stat value')" class="font-[FPLNumbers] text-[142px] font-bold leading-none tabular-nums text-[#bafa55]">{{ formatInstagramStat(player, heroKey) }}</p><p v-scheduler-element="element('leading-stat-label', 'Stat label')" class="mt-3 text-[29px]">{{ instagramStatLabel(heroKey) }}</p><span v-if="statSignals[heroKey]" aria-hidden="true" class="mt-3 h-[3px] w-10 rounded-full" :style="{ backgroundColor: getInstagramStatSignalColor(statSignals[heroKey], theme.light) }" /></div>
        <SchedulerStatGrid :layout="draft.layout" v-scheduler-element="element('stats', 'Stats')" :player="player" :stats="otherStats" :columns="3" compact class="self-center text-white [&>div:nth-child(-n+3)]:border-t-0" />
      </div>
      </div>
    </template>

    <!-- C: a spacious scouting ledger with a smaller portrait. -->
    <template v-else-if="draft.design === 'scout'">
      <SchedulerClubGraphics :colour="theme.colour" :dark="theme.dark" mode="pitch" class="absolute top-0 right-0 h-[390px] w-[530px] opacity-60" />
      <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute top-0 right-0 h-[420px] w-[450px] text-[50px]" />
      <SchedulerPlayerName v-scheduler-element="element('player-name', 'Player name')" :player="player" :width="570" :max-size="140" class="absolute top-2 left-12" />
      <div class="absolute top-[318px] left-12 flex items-center gap-3"><SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="h-[72px] w-[72px] shrink-0 text-[35px]" /><div v-scheduler-element="element('club-details', 'Club details')"><p class="max-w-[700px] text-[28px] font-bold">{{ player.club }} · {{ player.position }}</p></div></div>
      <SchedulerStatGrid :layout="draft.layout" v-scheduler-element="element('stats', 'Stats')" :player="player" :stats="draft.stats" :columns="2" :accent="theme.colour" class="absolute top-[420px] right-12 left-12" />
    </template>

    <!-- D: a studio colour field, portrait on the left, key number on the right. -->
    <template v-else-if="draft.design === 'studio'">
      <div class="absolute inset-x-0 top-0 bottom-5 flex flex-col">
        <div class="relative min-h-0 flex-1" :style="{ backgroundColor: theme.paper }">
          <SchedulerClubGraphics :colour="theme.colour" :dark="theme.ink" mode="sweep" class="absolute inset-0 opacity-25" />
          <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute bottom-0 left-0 z-20 h-full w-[620px] border-b-0! text-[60px]" />
        </div>
        <SchedulerStatGrid :layout="draft.layout" v-scheduler-element="element('stats', 'Stats')" :player="player" :stats="otherStats" :columns="3" class="mx-12 shrink-0" />
      </div>
      <SchedulerPlayerName v-scheduler-element="element('player-name', 'Player name')" :player="player" :width="984" :max-size="134" single-line class="absolute top-0 left-1/2 z-10 -translate-x-1/2 text-center" :style="{ color: theme.ink }" />
      <div class="absolute top-[155px] right-12 flex w-[390px] items-center gap-5" :style="{ color: theme.ink }">
        <SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="h-[90px] w-[90px] shrink-0 text-[40px]" />
        <div v-scheduler-element="element('club-details', 'Club details')" class="min-w-0 flex-1 text-right"><p class="text-[26px] font-bold leading-tight">{{ player.club }}</p><p class="mt-2 text-[23px] font-bold tracking-[0.1em] uppercase">{{ player.position }}</p></div>
      </div>
      <div v-scheduler-element="element('leading-stat', 'Leading stat')" class="absolute top-[300px] right-12 w-[390px] text-right" :style="{ color: theme.ink }"><p v-scheduler-element="element('leading-stat-value', 'Stat value')" class="font-[FPLNumbers] text-[190px] font-bold leading-none tabular-nums">{{ formatInstagramStat(player, heroKey) }}</p><p v-scheduler-element="element('leading-stat-label', 'Stat label')" class="mt-2 text-[30px] font-semibold">{{ instagramStatLabel(heroKey) }}</p><span v-if="statSignals[heroKey]" aria-hidden="true" class="ml-auto mt-3 block h-[3px] w-10 rounded-full" :style="{ backgroundColor: getInstagramStatSignalColor(statSignals[heroKey], theme.colour) }" /></div>
    </template>

    <!-- E: club identity and an abstract SVG stadium structure. -->
    <template v-else-if="draft.design === 'club'">
      <div class="absolute inset-x-0 top-0 bottom-5 flex flex-col">
        <div class="relative min-h-0 flex-1">
      <div class="absolute inset-0" :style="{ backgroundColor: theme.paper }"><SchedulerClubGraphics :colour="theme.colour" :dark="theme.dark" /></div>
      <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute right-0 bottom-0 h-[560px] border-b-0! w-[600px] text-[60px]" />
      <SchedulerPlayerName v-scheduler-element="element('player-name', 'Player name')" :player="player" :width="550" :max-size="148" class="absolute top-4 left-12 z-10" />
      <div v-scheduler-element="element('club-details', 'Club details')" class="absolute top-[355px] left-12 z-10 max-w-[470px] text-[29px] font-bold"><p>{{ player.club }}</p><p class="mt-2 text-[25px] tracking-[0.1em] uppercase">{{ player.position }}</p></div>
      <SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="absolute top-4 right-12 z-10 h-[120px] w-[120px] rounded-full bg-white/95 p-2 text-[40px]" />
        </div>
        <SchedulerStatGrid :layout="draft.layout" v-scheduler-element="element('stats', 'Stats')" :player="player" :stats="draft.stats" :accent="theme.colour" class="mx-12 shrink-0" />
      </div>
    </template>

    <!-- F: warm complementary paper, portrait left and title right. -->
    <template v-else-if="draft.design === 'contrast'">
      <div class="absolute inset-x-0 top-0 bottom-5 flex flex-col">
        <div class="relative min-h-0 flex-1">
      <SchedulerClubGraphics :colour="theme.complementary.colour" :dark="theme.complementary.ink" mode="sweep" class="absolute inset-0 opacity-60" />
      <SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="absolute top-0 left-12 z-10 h-[115px] w-[115px] text-[45px]" />
      <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute bottom-0 left-0 h-[560px] border-b-0! w-[530px] text-[60px]" />
      <SchedulerPlayerName v-scheduler-element="element('player-name', 'Player name')" :player="player" :width="520" :max-size="146" class="absolute top-12 right-12 z-10 text-right" />
      <div v-scheduler-element="element('club-details', 'Club details')" class="absolute top-[375px] right-12 z-10 max-w-[470px] px-5 py-3 text-right text-[26px] font-bold text-white" :style="{ backgroundColor: theme.complementary.ink }"><p>{{ player.club }}</p><p class="mt-1 text-[23px] tracking-[0.1em] uppercase">{{ player.position }}</p></div>
        </div>
        <SchedulerStatGrid :layout="draft.layout" v-scheduler-element="element('stats', 'Stats')" :player="player" :stats="draft.stats" :accent="theme.complementary.colour" class="mx-12 shrink-0" />
      </div>
    </template>

    <!-- G: night-game lights and a strong points panel. -->
    <template v-else-if="draft.design === 'night'">
      <SchedulerClubGraphics :colour="theme.primary" :dark="theme.dark" mode="night" class="absolute inset-0" />
      <div class="absolute inset-x-0 top-0 bottom-5 flex flex-col">
        <div class="relative min-h-0 flex-1">
      <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute bottom-0 left-[275px] h-[555px] border-b-0! w-[580px] text-[60px]" />
      <div class="absolute top-2 left-12 z-10 w-[230px]"><SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="mx-auto h-[132px] w-[132px] rounded-full bg-white p-2 text-[40px]" /><div v-scheduler-element="element('club-details', 'Club details')"><p :style="{ textAlign: draft.layout?.['club-details']?.align }" class="mt-4 text-center text-[27px] font-bold">{{ player.club }}</p><p :style="{ textAlign: draft.layout?.['club-details']?.align }" class="mt-3 text-center text-[23px] font-semibold tracking-[0.1em] uppercase">{{ player.position }}</p></div></div>
        </div>
      <div class="mx-12 grid min-h-[260px] shrink-0 grid-cols-[310px_1fr] gap-6 bg-black/35 px-5 py-6">
        <div v-scheduler-element="element('leading-stat', 'Leading stat')" class="self-center"><p v-scheduler-element="element('leading-stat-value', 'Stat value')" class="font-[FPLNumbers] text-[142px] font-bold leading-none tabular-nums" :style="{ color: theme.light }">{{ formatInstagramStat(player, heroKey) }}</p><p v-scheduler-element="element('leading-stat-label', 'Stat label')" class="mt-3 text-[29px]">{{ instagramStatLabel(heroKey) }}</p><span v-if="statSignals[heroKey]" aria-hidden="true" class="mt-3 block h-[3px] w-10 rounded-full" :style="{ backgroundColor: getInstagramStatSignalColor(statSignals[heroKey], theme.light) }" /></div><SchedulerStatGrid :layout="draft.layout" v-scheduler-element="element('stats', 'Stats')" :player="player" :stats="otherStats" :columns="3" compact class="self-center [&>div:nth-child(-n+3)]:border-t-0" />
      </div>
      </div>
      <SchedulerPlayerName v-scheduler-element="element('player-name', 'Player name')" :player="player" :width="970" :max-size="130" single-line class="absolute bottom-[285px] left-12 z-10" />
    </template>

    <!-- H: an independent portrait column and a six-stat ledger. -->
    <template v-else-if="draft.design === 'profile'">
      <div class="absolute top-[280px] right-0 bottom-4 w-[550px] overflow-hidden border-b border-current/25" :style="{ backgroundColor: theme.colour }"><SchedulerClubGraphics :colour="theme.paper" :dark="theme.dark" mode="sweep" /></div>
      <SchedulerPlayerPhoto v-scheduler-element="element('portrait', 'Player photo')" :player="player" class="absolute right-0 bottom-4 h-[810px] w-[660px] text-[60px]" />
      <SchedulerArtworkAsset v-scheduler-element="element('crest', 'Club crest')" :src="player.crestUrl" :label="`${player.club} crest`" class="absolute top-4 left-10 h-[110px] w-[110px] text-[40px]" />
      <SchedulerPlayerName v-scheduler-element="element('player-name', 'Player name')" :player="player" :width="350" :max-size="100" class="absolute top-1 left-[165px]" />
      <div v-scheduler-element="element('club-details', 'Club details')" class="absolute top-[255px] left-10 w-[475px] px-4 py-3 text-[25px] font-bold" :style="{ backgroundColor: theme.paper }">{{ player.club }} · {{ player.position }}</div>
      <SchedulerStatGrid :layout="draft.layout" v-scheduler-element="element('stats', 'Stats')" :player="player" :stats="draft.stats" :columns="2" compact :accent="theme.paper" class="absolute top-[355px] left-6 w-[400px]" />
    </template>
    <SchedulerAnalystDesign v-else-if="draft.design === 'analyst'" :draft="draft" />
    <SchedulerHeroDesign v-else-if="draft.design === 'hero'" :draft="draft" />
  </div>
</template>
