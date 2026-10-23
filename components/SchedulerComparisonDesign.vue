<script setup lang="ts">
import type { InstagramDraft } from '~/utils/instagram-templates'
import { formatInstagramStat, instagramStatLabel } from '~/utils/instagram-templates'
import { getInstagramClubTheme } from '~/utils/instagram-designs'
import SchedulerComparisonPortrait from '~/components/SchedulerComparisonPortrait.vue'
import SchedulerComparisonStats from '~/components/SchedulerComparisonStats.vue'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'
import SchedulerPlayerName from '~/components/SchedulerPlayerName.vue'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
import SchedulerClubGraphics from '~/components/SchedulerClubGraphics.vue'
import SchedulerStatGrid from '~/components/SchedulerStatGrid.vue'
const props = defineProps<{ draft: InstagramDraft }>()
const themes = computed(() => [0, 1].map(index => getInstagramClubTheme(props.draft.players[index]?.clubCode ?? props.draft.players[0]?.clubCode ?? 0, props.draft.palette)))
const heroKey = computed(() => props.draft.stats.includes('total_points') ? 'total_points' : props.draft.stats[0])
const otherStats = computed(() => props.draft.stats.filter(key => key !== heroKey.value))
const accents = computed(() => themes.value.map(theme => theme.colour))
const headlineSize = computed(() => Math.min(45, 1500 / Math.max(1, props.draft.headline.length)))
</script>

<template>
  <div class="relative h-full w-full" data-comparison-design :data-comparison-layout="draft.design">
    <!-- A: an editorial spread, with a shared ledger under the portraits. -->
    <template v-if="draft.design === 'editorial'">
      <h2 class="mx-12 font-bold leading-tight tracking-tight" :style="{ fontSize: `${headlineSize}px` }">{{ draft.headline }}</h2>
      <div class="absolute inset-x-12 top-[80px] grid h-[370px] grid-cols-2 gap-10"><SchedulerComparisonPortrait v-for="index in [0, 1]" :key="index" :player="draft.players[index]" :width="472" /></div>
      <SchedulerComparisonStats :players="draft.players" :stats="draft.stats" :colours="accents" class="absolute inset-x-12 top-[450px] bottom-5" />
    </template>

    <!-- B: two club sweeps and a prominent pair of leading numbers. -->
    <template v-else-if="draft.design === 'matchday'">
      <div class="absolute inset-x-0 top-0 grid h-[455px] grid-cols-2"><div v-for="index in [0, 1]" :key="index" class="relative" :style="{ backgroundColor: themes[index]!.dark }"><SchedulerClubGraphics :colour="themes[index]!.primary" :dark="themes[index]!.dark" mode="sweep" class="absolute inset-0 opacity-60" /><SchedulerComparisonPortrait :player="draft.players[index]" :width="484" class="relative px-7" /></div></div>
      <div v-if="heroKey" class="absolute inset-x-12 top-[455px] grid h-[140px] grid-cols-[1fr_1.2fr_1fr] items-center border-t border-white/25 text-center"><p class="font-[FPLNumbers] text-[96px] font-bold leading-none text-[#bafa55]">{{ draft.players[0] ? formatInstagramStat(draft.players[0], heroKey) : '—' }}</p><h2 class="text-[27px] font-semibold">{{ instagramStatLabel(heroKey) }}</h2><p class="font-[FPLNumbers] text-[96px] font-bold leading-none text-[#bafa55]">{{ draft.players[1] ? formatInstagramStat(draft.players[1], heroKey) : '—' }}</p></div>
      <SchedulerComparisonStats :players="draft.players" :stats="otherStats" :colours="accents" mode="tiles" class="absolute inset-x-12 top-[605px] bottom-5" />
    </template>

    <!-- C: compact identities with most of the surface devoted to comparison bars. -->
    <template v-else-if="draft.design === 'scout'">
      <h2 class="mx-12 font-bold leading-tight" :style="{ fontSize: `${headlineSize}px` }">{{ draft.headline }}</h2>
      <div class="absolute inset-x-12 top-[80px] grid h-[245px] grid-cols-2 gap-12"><SchedulerComparisonPortrait v-for="index in [0, 1]" :key="index" :player="draft.players[index]" :width="468" compact /></div>
      <SchedulerComparisonStats :players="draft.players" :stats="draft.stats" :colours="accents" mode="bars" class="absolute inset-x-12 top-[340px] bottom-5" />
    </template>

    <!-- D: two tall portraits flanking a narrow studio ledger. -->
    <template v-else-if="draft.design === 'studio'">
      <SchedulerClubGraphics :colour="themes[0]!.colour" :dark="themes[0]!.ink" mode="sweep" class="absolute inset-0 opacity-15" />
      <h2 class="relative mx-12 max-w-[984px] font-bold leading-tight" :style="{ fontSize: `${headlineSize}px` }">{{ draft.headline }}</h2>
      <div v-for="index in [0, 1]" :key="index" class="absolute top-[100px] bottom-5 w-[330px]" :class="index === 0 ? 'left-0' : 'right-0'">
        <SchedulerComparisonPortrait :player="draft.players[index]" :width="330" />
      </div>
      <SchedulerComparisonStats :players="draft.players" :stats="draft.stats" :colours="accents" class="absolute top-[260px] bottom-12 left-[350px] w-[380px]" />
    </template>

    <!-- E: independent club-colour columns, with each stat kept on the same row. -->
    <template v-else-if="draft.design === 'club'">
      <div class="absolute inset-x-0 top-0 bottom-5 grid grid-cols-2">
        <div v-for="index in [0, 1]" :key="index" class="relative flex min-h-0 flex-col" :style="{ backgroundColor: themes[index]!.paper, color: themes[index]!.ink }">
          <div class="relative min-h-0 flex-1"><SchedulerClubGraphics :colour="themes[index]!.colour" :dark="themes[index]!.dark" class="absolute inset-0 opacity-45" /><SchedulerComparisonPortrait :player="draft.players[index]" :width="484" class="relative px-7" /></div>
          <div class="mx-12 h-[345px] shrink-0"><SchedulerStatGrid v-if="draft.players[index]" :player="draft.players[index]!" :stats="draft.stats" :columns="2" compact :accent="themes[index]!.colour" class="h-full" /></div>
        </div>
      </div>
    </template>

    <!-- F: two horizontal player stories in complementary paper colours. -->
    <template v-else-if="draft.design === 'contrast'">
      <h2 class="mx-12 font-bold leading-tight" :style="{ fontSize: `${headlineSize}px` }">{{ draft.headline }}</h2>
      <div class="absolute inset-x-12 top-[90px] bottom-5 grid grid-rows-2 gap-6">
        <div v-for="index in [0, 1]" :key="index" class="relative overflow-hidden" :style="{ backgroundColor: themes[index]!.complementary.paper, color: themes[index]!.complementary.ink }">
          <SchedulerClubGraphics :colour="themes[index]!.complementary.colour" :dark="themes[index]!.complementary.ink" mode="sweep" class="absolute inset-0 opacity-25" />
          <template v-if="draft.players[index]">
            <SchedulerPlayerPhoto :player="draft.players[index]!" class="absolute bottom-0 left-0 h-full w-[280px] border-b-0! text-[40px]" />
            <div class="absolute top-3 right-5 left-[300px] flex items-start gap-4"><SchedulerArtworkAsset :src="draft.players[index]!.crestUrl" :label="`${draft.players[index]!.club} crest`" class="h-[58px] w-[58px] shrink-0 text-[26px]" /><div><SchedulerPlayerName :player="draft.players[index]!" :width="570" :max-size="51" single-line /><p class="mt-2 text-[20px] font-semibold">{{ draft.players[index]!.club }} · {{ draft.players[index]!.position }}</p></div></div>
            <SchedulerStatGrid :player="draft.players[index]!" :stats="draft.stats" compact :accent="themes[index]!.complementary.colour" class="absolute top-[112px] right-5 bottom-2 left-[300px]" />
          </template><p v-else class="relative px-8 py-12 text-[26px]">Choose a second player</p>
        </div>
      </div>
    </template>

    <!-- G: a paired stadium poster and one shared stat deck. -->
    <template v-else-if="draft.design === 'night'">
      <SchedulerClubGraphics :colour="themes[0]!.primary" :dark="themes[0]!.dark" mode="night" class="absolute inset-0" />
      <div class="absolute inset-x-12 top-0 grid h-[495px] grid-cols-2 gap-8"><SchedulerComparisonPortrait v-for="index in [0, 1]" :key="index" :player="draft.players[index]" :width="476" class="relative" /></div>
      <div class="absolute inset-x-12 top-[495px] bottom-5 bg-black/30 px-7 py-5"><SchedulerComparisonStats :players="draft.players" :stats="draft.stats" :colours="accents" mode="tiles" /></div>
    </template>

    <!-- H: tall paired profiles above a compact six-column comparison ribbon. -->
    <template v-else-if="draft.design === 'profile'">
      <h2 class="mx-12 font-bold leading-tight" :style="{ fontSize: `${headlineSize}px` }">{{ draft.headline }}</h2>
      <div class="absolute inset-x-12 top-[85px] grid h-[530px] grid-cols-2 gap-12"><div v-for="index in [0, 1]" :key="index" class="relative"><div class="absolute inset-x-0 top-[185px] bottom-0" :style="{ backgroundColor: themes[index]!.colour, opacity: 0.15 }" /><SchedulerComparisonPortrait :player="draft.players[index]" :width="468" class="relative" /></div></div>
      <SchedulerComparisonStats :players="draft.players" :stats="draft.stats" :colours="accents" mode="ribbon" class="absolute inset-x-12 top-[640px] bottom-5" />
    </template>

    <!-- I: a neutral dark analyst table with portraits as its column headers. -->
    <template v-else-if="draft.design === 'analyst'">
      <h2 class="mx-12 font-bold leading-tight" :style="{ fontSize: `${headlineSize}px` }">{{ draft.headline }}</h2>
      <div class="absolute inset-x-12 top-[85px] grid h-[285px] grid-cols-2 gap-20"><SchedulerComparisonPortrait v-for="index in [0, 1]" :key="index" :player="draft.players[index]" :width="452" compact /></div>
      <div class="absolute inset-x-12 top-[370px] bottom-5 bg-white/5 px-8"><SchedulerComparisonStats :players="draft.players" :stats="draft.stats" :colours="accents" /></div>
    </template>

    <!-- J: two large cut-outs with names across the jerseys and a lower stat board. -->
    <template v-else>
      <h2 class="mx-12 font-bold leading-tight" :style="{ fontSize: `${headlineSize}px` }">{{ draft.headline }}</h2>
      <div class="absolute inset-x-0 top-[95px] grid h-[420px] grid-cols-2">
        <div v-for="index in [0, 1]" :key="index" class="relative" :style="{ backgroundColor: `${themes[index]!.primary}18` }">
          <template v-if="draft.players[index]"><SchedulerPlayerPhoto :player="draft.players[index]!" class="absolute inset-0 border-b-0! text-[45px]" /><SchedulerArtworkAsset :src="draft.players[index]!.crestUrl" :label="`${draft.players[index]!.club} crest`" class="absolute top-3 h-[65px] w-[65px] text-[28px]" :class="index === 0 ? 'left-6' : 'right-6'" /><div class="absolute inset-x-6 bottom-3 bg-[#080e1b]/90 px-4 py-3"><SchedulerPlayerName :player="draft.players[index]!" :width="460" :max-size="54" single-line /><p class="mt-2 text-[19px]">{{ draft.players[index]!.club }} · {{ draft.players[index]!.position }}</p></div></template><p v-else class="px-8 py-12 text-[26px]">Choose a second player</p>
        </div>
      </div>
      <SchedulerComparisonStats :players="draft.players" :stats="draft.stats" :colours="accents" mode="tiles" class="absolute inset-x-12 top-[540px] bottom-5" />
    </template>
  </div>
</template>
