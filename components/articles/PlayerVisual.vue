<script setup lang="ts">
import type { ArticleLivePlayerData, ArticlePlayerSnapshot } from '~/shared/article-visuals'
import { getPlayerRoute } from '~/composables/usePlayerRoute'
import { getInstagramClubTheme } from '~/utils/instagram-designs'
import SchedulerTransferBar from '~/components/SchedulerTransferBar.vue'
import SchedulerArtworkAsset from '~/components/SchedulerArtworkAsset.vue'
import SchedulerClubGraphics from '~/components/SchedulerClubGraphics.vue'
import { useArticleLivePlayer } from '~/composables/useArticleLivePlayer'
const props = defineProps<{ player: ArticlePlayerSnapshot; fixturesOnly?: boolean }>()
const livePlayer = shallowRef<ArticleLivePlayerData | null>(null)
const liveCapturedAt = ref<string | null>(null)
const liveTeams = shallowRef<{ code: number; name: string }[]>([])
const liveStatus = ref<'loading' | 'ready' | 'unavailable'>('loading')
const displayPlayer = computed(() => livePlayer.value ? { ...props.player, ...livePlayer.value } : props.player)
const name = computed(() => `${displayPlayer.value.first_name} ${displayPlayer.value.second_name}`.trim())
const captured = computed(() => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(props.player.capturedAt)))
const liveCaptured = computed(() => liveCapturedAt.value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(liveCapturedAt.value)) : '')
const theme = computed(() => getInstagramClubTheme(displayPlayer.value.teamCode))
const playerPhotoUrl = computed(() => {
  const source = `https://resources.premierleague.com/premierleague/photos/players/250x250/p${displayPlayer.value.photoCode}.png`
  return `/api/image-proxy/player-${displayPlayer.value.photoCode}?url=${encodeURIComponent(source)}&strict=1`
})
const clubCrestUrl = computed(() => {
  const source = `https://resources.premierleague.com/premierleague/badges/t${displayPlayer.value.teamCode}.png`
  return `/api/image-proxy/club-${displayPlayer.value.teamCode}?url=${encodeURIComponent(source)}&strict=1`
})
const opponentCrestUrl = (code: number) => {
  const source = `https://resources.premierleague.com/premierleague/badges/t${code}.png`
  return `/api/image-proxy/club-${code}?url=${encodeURIComponent(source)}&strict=1`
}
onMounted(async () => {
  const result = await useArticleLivePlayer(props.player.id)
  liveTeams.value = result.teams
  if (props.fixturesOnly) return
  if (!result.player || result.player.code !== props.player.code) {
    liveStatus.value = 'unavailable'
    return
  }
  livePlayer.value = result.player
  liveCapturedAt.value = result.capturedAt
  liveStatus.value = 'ready'
})
const portraitFailed = ref(false)
watch(playerPhotoUrl, () => { portraitFailed.value = false })
const compact = (value: number | null) => value === null ? 'Unavailable' : new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
const difficulty = (value: number) => value <= 2 ? 'text-success' : value === 3 ? 'text-warning' : 'text-error'
const difficultySegment = (value: number, level: number) => level > value ? 'bg-current/10' : value <= 2 ? 'bg-lime-600' : value === 3 ? 'bg-amber-500' : 'bg-rose-600'
const fixtureClubCode = (fixture: ArticlePlayerSnapshot['fixtures'][number]) => fixture.opponentCode ?? liveTeams.value.find(team => team.name === fixture.opponent)?.code ?? null
const formatKickoff = (value: string | null) => {
  if (!value) return 'Kickoff TBC'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Kickoff TBC' : `${new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(date)} IST`
}
const missingExtendedStats = computed(() => [displayPlayer.value.pointsPerGame, displayPlayer.value.goals, displayPlayer.value.assists, displayPlayer.value.cleanSheets].some(value => value === null))
const displayStat = (value: number | string | null) => value === null ? '—' : value
const stats = computed(() => [
  { label: 'Season points', value: displayPlayer.value.points ?? 'Unavailable' },
  { label: 'Minutes', value: compact(displayPlayer.value.minutes) },
  { label: 'FPL form', value: displayPlayer.value.form ?? 'Unavailable' },
  { label: 'Selected by', value: displayPlayer.value.ownership === null ? 'Unavailable' : `${displayPlayer.value.ownership}%` },
  { label: 'Points per game', value: displayStat(displayPlayer.value.pointsPerGame) },
  { label: 'Goals', value: displayStat(displayPlayer.value.goals) },
  { label: 'Assists', value: displayStat(displayPlayer.value.assists) },
  { label: 'Clean sheets', value: displayStat(displayPlayer.value.cleanSheets) },
])
</script>

<template>
  <figure v-if="!fixturesOnly" class="relative isolate my-8 overflow-hidden rounded-xl" :style="{ backgroundColor: theme.light, color: theme.dark }" :aria-label="`${name}, player card`">
    <div class="relative grid min-h-[18rem] grid-cols-[minmax(0,1fr)_minmax(9rem,46%)] sm:min-h-[24rem] sm:grid-cols-[minmax(0,1fr)_minmax(18rem,46%)]">
      <div class="pointer-events-none absolute inset-y-0 right-0 w-[46%] opacity-30" aria-hidden="true">
        <SchedulerClubGraphics :colour="theme.colour" :dark="theme.dark" mode="sweep" />
      </div>
      <div class="relative z-10 flex min-w-0 flex-col items-start px-4 py-5 sm:px-8 sm:py-7">
        <div class="flex min-w-0 items-center gap-3">
          <SchedulerArtworkAsset :src="clubCrestUrl" :label="`${displayPlayer.teamName} crest`" class="h-11 w-11 shrink-0 rounded-full bg-white/90 p-2 sm:h-14 sm:w-14" />
          <div class="min-w-0">
            <p class="break-words text-sm leading-tight font-semibold sm:text-base">{{ displayPlayer.teamName }}</p>
            <p class="mt-1 text-xs font-medium tracking-[0.12em] uppercase opacity-75">{{ displayPlayer.position }}</p>
          </div>
        </div>
        <NuxtLink :to="getPlayerRoute(displayPlayer)" target="_blank" class="mt-5 block break-words text-2xl leading-tight font-semibold tracking-tight hover:opacity-80 sm:mt-7 sm:text-4xl" :style="{ color: theme.dark }">{{ name }}</NuxtLink>
        <div class="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-4 text-sm">
          <span class="text-base font-semibold tabular-nums">£{{ displayPlayer.price.toFixed(1) }}m</span>
          <span class="opacity-75">GW {{ displayPlayer.gameweek || player.gameweek }} · {{ player.season }}</span>
        </div>
      </div>
      <div class="relative z-10 min-h-[18rem] self-end overflow-hidden sm:min-h-[24rem]">
        <img v-if="!portraitFailed" :src="playerPhotoUrl" :alt="name" class="absolute inset-0 h-full w-full object-contain object-bottom" @error="portraitFailed = true">
        <PlayerPortrait v-else :player="displayPlayer" :alt="name" class="absolute inset-0 h-full w-full" />
      </div>
    </div>
    <dl class="grid grid-cols-2 border-y border-current/15 sm:grid-cols-4">
      <div v-for="(stat, index) in stats" :key="stat.label" class="min-w-0 border-current/15 px-4 py-3 sm:px-5 sm:py-4" :class="[index % 2 === 1 ? 'border-l' : '', index > 1 ? 'border-t sm:border-t-0' : '', index > 0 && index % 4 !== 0 ? 'sm:border-l' : '', index >= 4 ? 'sm:border-t' : '']">
        <dt class="text-[0.65rem] leading-tight font-medium tracking-[0.1em] opacity-75 uppercase">{{ stat.label }}</dt>
        <dd class="mt-1 break-words text-xl leading-none font-semibold tabular-nums sm:text-2xl">{{ stat.value }}</dd>
      </div>
    </dl>
    <SchedulerTransferBar :incoming="displayPlayer.transfersIn" :outgoing="displayPlayer.transfersOut" compact class="mx-5 !border-t-0 pb-2 sm:mx-8" />
    <figcaption class="px-5 pb-4 text-xs leading-5 opacity-75 sm:px-8">
      <template v-if="liveStatus === 'loading'">Updating FPL data · saved snapshot shown.</template>
      <template v-else-if="liveStatus === 'ready'">Latest FPL data · captured {{ liveCaptured }} IST.</template>
      <template v-else>Live FPL data unavailable · saved snapshot shown.</template>
      <span v-if="missingExtendedStats"> Some stats are not present in this data.</span>
    </figcaption>
  </figure>
  <figure v-else class="relative isolate my-8 overflow-hidden rounded-xl" :style="{ backgroundColor: theme.light, color: theme.dark }" :aria-label="`${name}, fixture run`">
    <div class="pointer-events-none absolute inset-y-0 right-0 w-[46%] opacity-25" aria-hidden="true">
      <SchedulerClubGraphics :colour="theme.colour" :dark="theme.dark" mode="sweep" />
    </div>
    <header class="relative z-10 flex items-center gap-3 border-b border-current/15 px-4 py-4 sm:px-6">
      <div class="relative size-14 shrink-0 overflow-hidden rounded-lg bg-white/35 sm:size-16">
        <img v-if="!portraitFailed" :src="playerPhotoUrl" alt="" class="absolute inset-0 h-full w-full object-contain object-bottom" @error="portraitFailed = true">
        <PlayerPortrait v-else :player="player" />
        <SchedulerArtworkAsset :src="clubCrestUrl" :label="`${player.teamName} crest`" decorative class="absolute right-0 bottom-0 size-6 rounded-full bg-white/90 p-1" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="break-words text-xs font-semibold opacity-75">{{ player.teamName }} · {{ player.position }}</p>
        <NuxtLink :to="getPlayerRoute(player)" target="_blank" class="mt-1 block break-words text-xl font-semibold tracking-tight hover:opacity-75 sm:text-2xl">{{ name }}</NuxtLink>
      </div>
      <p class="shrink-0 text-right text-xs font-medium opacity-75">Upcoming fixtures<br>{{ player.season }}</p>
    </header>
    <div class="relative z-10 grid grid-cols-3 divide-x divide-current/15">
      <section v-for="gameweek in player.gameweeks" :key="gameweek" class="min-w-0 px-3 py-4 first:pl-4 last:pr-4 sm:px-5 sm:py-5 first:sm:pl-6 last:sm:pr-6" :aria-label="`Gameweek ${gameweek}`">
        <p class="text-[0.65rem] font-semibold tracking-[0.1em] uppercase opacity-65">GW {{ gameweek }}</p>
        <div v-for="(fixture, index) in player.fixtures.filter(f => f.gameweek === gameweek)" :key="index" class="mt-3 min-w-0">
          <div class="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-2">
            <SchedulerArtworkAsset v-if="fixtureClubCode(fixture)" :src="opponentCrestUrl(fixtureClubCode(fixture)!)" :label="`${fixture.opponent} crest`" decorative class="size-7 shrink-0 rounded-full bg-white/90 p-1 sm:size-8" />
            <p class="min-w-0 break-words text-sm leading-tight font-semibold">{{ fixture.opponent }}</p>
          </div>
          <p class="mt-1 text-xs opacity-70">{{ fixture.home ? 'Home' : 'Away' }}</p>
          <time v-if="fixture.kickoff" :datetime="fixture.kickoff" class="mt-3 block text-xs leading-4 tabular-nums opacity-75">{{ formatKickoff(fixture.kickoff) }}</time>
          <p v-else class="mt-3 text-xs opacity-65">Kickoff TBC</p>
          <div class="mt-3 flex items-center gap-2" :aria-label="`Fixture difficulty ${fixture.difficulty} out of 5`">
            <div class="flex w-16 gap-1" aria-hidden="true">
              <span v-for="level in 5" :key="level" class="h-1.5 flex-1 rounded-full" :class="difficultySegment(fixture.difficulty, level)" />
            </div>
            <span class="text-xs font-semibold tabular-nums" :class="difficulty(fixture.difficulty)">{{ fixture.difficulty }}/5</span>
          </div>
        </div>
        <p v-if="!player.fixtures.some(f => f.gameweek === gameweek)" class="mt-3 text-sm opacity-65">No fixture listed</p>
      </section>
    </div>
    <figcaption class="relative z-10 border-t border-current/15 px-4 py-3 text-xs leading-5 opacity-70 sm:px-6">Kickoff times shown in IST · Difficulty runs from 1 (easiest) to 5 (hardest).</figcaption>
  </figure>
</template>
