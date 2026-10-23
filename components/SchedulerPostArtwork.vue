<script setup lang="ts">
import { vSchedulerElement } from '~/utils/scheduler-element'
import type { InstagramDraft, InstagramPlayer, InstagramStatKey } from '~/utils/instagram-templates'
import { formatInstagramStat, instagramStatLabel, instagramFixtureColors } from '~/utils/instagram-templates'
import { getInstagramClubTheme, getInstagramStatSignals, getInstagramStatSignalColor } from '~/utils/instagram-designs'
import SchedulerPlayerDesign from '~/components/SchedulerPlayerDesign.vue'
import SchedulerComparisonDesign from '~/components/SchedulerComparisonDesign.vue'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
import SchedulerPlayerPhoto from '~/components/SchedulerPlayerPhoto.vue'
import SchedulerTransferBar from '~/components/SchedulerTransferBar.vue'
import SchedulerClubGraphics from '~/components/SchedulerClubGraphics.vue'
const props = defineProps<{ draft: InstagramDraft }>()
const element = (id: string, label: string) => ({ id, label, layout: props.draft.layout })
const main = computed(() => props.draft.players[0])
const theme = computed(() => getInstagramClubTheme(main.value?.clubCode ?? 0, props.draft.palette))
const dark = computed(() => ['matchday', 'night', 'analyst', 'hero'].includes(props.draft.design))
const colours = computed(() => ({
  backgroundColor: ['analyst', 'hero'].includes(props.draft.design) ? '#080e1b' : dark.value ? theme.value.dark : props.draft.design === 'editorial' ? '#f8f5ee' : props.draft.design === 'contrast' ? theme.value.complementary.paper : theme.value.paper,
  color: dark.value ? '#faf9f5' : props.draft.design === 'contrast' ? theme.value.complementary.ink : theme.value.ink,
  backgroundImage: props.draft.design === 'night'
    ? 'radial-gradient(ellipse 22% 14% at 5.5% 92%, rgba(255, 255, 255, 0.36), transparent 100%), radial-gradient(ellipse 22% 14% at 96.3% 92%, rgba(255, 255, 255, 0.36), transparent 100%)'
    : undefined,
}))
const transfers = computed(() => {
  const players = props.draft.players
  const sum = (key: 'transfersIn' | 'transfersOut') => players.length && players.every(player => player[key] != null) ? players.reduce((total, player) => total + player[key]!, 0) : null
  return { incoming: sum('transfersIn'), outgoing: sum('transfersOut') }
})
function statSignalColor(player: InstagramPlayer, key: InstagramStatKey) {
  const signal = getInstagramStatSignals(player, props.draft.stats)[key]
  return signal ? getInstagramStatSignalColor(signal, getInstagramClubTheme(player.clubCode, props.draft.palette).colour) : undefined
}
</script>

<template>
  <article class="relative flex h-[1080px] w-[1080px] flex-col overflow-hidden font-sans" :style="colours" :aria-label="`${main?.fullName ?? draft.headline} post preview`" data-post-artwork :data-post-format="draft.template" :data-club-code="main?.clubCode" :data-design-id="draft.design">
    <header class="relative z-20 flex h-[92px] shrink-0 items-center justify-between px-12 pt-1">
      <div class="flex items-center gap-5">
        <span v-scheduler-element="element('brand', 'Brand')" class="text-[20px] font-semibold tracking-tight opacity-55">FPL Insights</span>
        <span v-if="draft.story" class="text-[24px] font-semibold">{{ draft.story.label }}</span>
      </div>
      <span v-scheduler-element="element('gameweek', 'Gameweek')" class="font-[FPLNumbers] text-[26px] font-semibold">{{ draft.gameweek ? `GW ${draft.gameweek}` : 'FPL' }}</span>
    </header>

    <div class="relative h-[848px] shrink-0">
      <SchedulerPlayerDesign v-if="main && ['spotlight', 'transfers'].includes(draft.template)" :draft="draft" />

      <SchedulerComparisonDesign v-else-if="draft.template === 'comparison'" :draft="draft" />

      <template v-else-if="draft.template === 'shortlist'">
        <h2 class="mx-12 mb-8 font-[FPLNumbers] text-[62px] font-bold leading-tight">{{ draft.headline }}</h2>
        <div class="mx-12">
          <div v-for="(player, index) in draft.players" :key="player.code" class="flex h-[135px] items-center gap-4 border-t border-current/25">
            <span class="w-9 text-[33px]">{{ index + 1 }}</span><SchedulerPlayerPhoto :player="player" class="h-[120px] w-[105px] shrink-0 self-end text-[40px]" />
            <div class="min-w-0 flex-1"><div class="flex items-center gap-3"><SchedulerArtworkAsset :src="player.crestUrl" :label="`${player.club} crest`" class="h-[42px] w-[42px] shrink-0 text-[25px]" /><h3 class="truncate font-[FPLNumbers] text-[35px] font-bold">{{ player.name }}</h3></div><p class="mt-2 text-[20px]">{{ player.club }} · {{ player.position }}</p></div>
            <div v-for="key in draft.stats" :key="key" class="flex min-w-[110px] flex-col items-end text-right"><p class="font-[FPLNumbers] text-[32px] font-bold">{{ formatInstagramStat(player, key) }}</p><span v-if="statSignalColor(player, key)" aria-hidden="true" class="mt-1 h-[2px] w-6 rounded-full" :style="{ backgroundColor: statSignalColor(player, key) }" /><p class="mt-1 text-[18px]">{{ instagramStatLabel(key) }}</p></div>
          </div>
        </div>
      </template>

      <template v-else-if="draft.template === 'fixtures' && main">
        <h2 class="mx-12 font-[FPLNumbers] text-[62px] font-bold">{{ draft.headline }}</h2>
        <div class="relative mx-12 mt-6 h-[320px] overflow-hidden" :style="{ backgroundColor: theme.colour, color: theme.dark }"><SchedulerClubGraphics :colour="theme.light" :dark="theme.dark" class="absolute inset-0" /><div class="relative z-10 p-7"><SchedulerArtworkAsset :src="main.crestUrl" :label="`${main.club} crest`" class="h-[90px] w-[90px] text-[35px]" /><h3 class="mt-4 max-w-[520px] font-[FPLNumbers] text-[60px] font-bold leading-tight">{{ main.name }}</h3><p class="mt-3 text-[25px] font-semibold">{{ main.club }} · {{ main.position }}</p></div><SchedulerPlayerPhoto :player="main" class="absolute right-0 bottom-0 h-[340px] w-[400px] text-[55px]" /></div>
        <div class="mx-12 mt-6"><div v-for="fixture in draft.fixtures" :key="fixture.id" class="grid grid-cols-[140px_1fr_170px_150px] items-center gap-4 border-t border-current/25 py-3 text-[28px]"><span class="text-[24px]">{{ fixture.gameweek ? `GW ${fixture.gameweek}` : 'GW TBC' }}</span><span class="font-bold">{{ fixture.opponent }}</span><span class="text-[24px]">{{ fixture.venue }}</span><span class="rounded-md px-3 py-2 text-center text-[22px] font-bold" :class="instagramFixtureColors(fixture.difficulty)">FDR {{ fixture.difficulty ?? 'TBC' }}</span></div><p v-if="!draft.fixtures.length" class="py-8 text-[27px]">Upcoming fixtures are unavailable.</p></div>
      </template>
    </div>

    <footer class="relative z-20 mt-auto shrink-0 px-12 pb-4">
      <SchedulerTransferBar v-scheduler-element="element('transfers', 'Transfer bar')" :incoming="transfers.incoming" :outgoing="transfers.outgoing" :combined="draft.players.length > 1" :dark="dark" />
    </footer>
  </article>
</template>
