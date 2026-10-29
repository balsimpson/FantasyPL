<script setup lang="ts">
import { getInstagramClubTheme } from '~/utils/instagram-designs'
import { getArticlePreviewPhotoPath, type ArticlePreviewPlayer } from '~/utils/article-preview'

const props = withDefaults(defineProps<{
  title: string
  category: string
  season?: string
  gameweek?: number | null
  players?: ArticlePreviewPlayer[]
}>(), { players: () => [] })

const theme = computed(() => props.players[0] ? getInstagramClubTheme(props.players[0].teamCode) : null)
const titleSize = computed(() => props.title.length > 150 ? 35 : props.title.length > 110 ? 40 : props.title.length > 85 ? 47 : props.title.length > 60 ? 54 : 62)

useHead({ style: [], link: [] })
</script>

<template>
  <div :style="{ position: 'relative', display: 'flex', width: '1200px', height: '630px', overflow: 'hidden', backgroundColor: '#10241c', color: '#f5f5f0' }">
    <div :style="{ position: 'absolute', right: '0', top: '0', width: '440px', height: '630px', backgroundColor: theme?.dark || '#1b3929' }" />
    <div :style="{ position: 'absolute', right: '0', top: '0', width: '16px', height: '630px', backgroundColor: theme?.primary || '#bef264' }" />

    <template v-if="players.length">
      <img v-for="(player, index) in players.slice(0, 2)" :key="player.photoCode" :src="getArticlePreviewPhotoPath(player.photoCode)" width="400" height="400" alt="" :style="{ position: 'absolute', left: players.length > 1 ? `${725 + index * 190}px` : '785px', bottom: '75px', width: players.length > 1 ? '310px' : '400px', height: players.length > 1 ? '310px' : '400px', objectFit: 'contain', objectPosition: 'bottom' }" />
      <div v-if="players.length > 1" :style="{ position: 'absolute', left: '955px', top: '245px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '55px', height: '55px', borderRadius: '28px', backgroundColor: '#bef264', color: '#10241c', fontSize: '20px', fontWeight: 700 }">VS</div>
    </template>
    <div v-else :style="{ position: 'absolute', right: '62px', top: '132px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '310px', height: '360px', border: '3px solid #7fa88c', borderRadius: '14px', opacity: 0.7 }">
      <div :style="{ position: 'absolute', top: '50%', width: '100%', height: '3px', backgroundColor: '#7fa88c' }" />
      <div :style="{ width: '94px', height: '94px', border: '3px solid #7fa88c', borderRadius: '50%' }" />
    </div>

    <div :style="{ position: 'absolute', left: '56px', top: '48px', display: 'flex', fontSize: '24px', fontWeight: 700, color: '#bef264' }">FPL Insights</div>
    <div :style="{ position: 'absolute', left: '56px', top: '152px', display: 'flex', flexDirection: 'column', width: '670px' }">
      <div :style="{ marginBottom: '22px', fontSize: '21px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#bef264' }">{{ category }}</div>
      <div :style="{ fontSize: `${titleSize}px`, fontWeight: 700, lineHeight: '1.12', letterSpacing: '-1px', overflowWrap: 'anywhere' }">{{ title }}</div>
    </div>
    <div :style="{ position: 'absolute', left: '0', bottom: '0', width: '1200px', height: '90px', backgroundColor: '#10241c' }" />
    <div :style="{ position: 'absolute', left: '56px', bottom: '88px', width: '1088px', height: '1px', backgroundColor: '#587264' }" />
    <div :style="{ position: 'absolute', left: '56px', bottom: '36px', fontSize: '20px' }">sportsync.in</div>
    <div v-if="gameweek || season" :style="{ position: 'absolute', right: '56px', bottom: '36px', fontSize: '20px' }">{{ gameweek ? `Gameweek ${gameweek}` : '' }}{{ gameweek && season ? ' · ' : '' }}{{ season || '' }}</div>
  </div>
</template>
