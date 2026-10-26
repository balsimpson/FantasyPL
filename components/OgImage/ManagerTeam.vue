<script setup lang="ts">
import { createManagerOgArtwork, getManagerOgTheme, layoutManagerOgPlayers, type ManagerOgPlayer } from '~/utils/manager-og-image';

const props = withDefaults(defineProps<{
	managerId?: string | number;
	managerName?: string;
	teamName?: string;
	currentEvent?: string | number | null;
	gameweekPoints?: string | number | null;
	overallPoints?: string | number | null;
	overallRank?: string | number | null;
	formation?: string;
	players?: ManagerOgPlayer[];
	bench?: ManagerOgPlayer[];
}>(), {
	managerId: '', managerName: 'FPL Manager', teamName: 'Fantasy Premier League team',
	currentEvent: null, gameweekPoints: null, overallPoints: null, overallRank: null,
	formation: '', players: () => [], bench: () => [],
});

const theme = computed(() => getManagerOgTheme(props.managerId));
const players = computed(() => layoutManagerOgPlayers(props.players));
const artwork = computed(() => createManagerOgArtwork(props.players, props.bench, theme.value));
const teamNameSize = computed(() => props.teamName.length > 30 ? 38 : props.teamName.length > 20 ? 44 : 60);
const formatNumber = (value: string | number | null | undefined) => {
	if (value === null || value === undefined || value === '' || !Number.isFinite(Number(value))) return '—';
	return new Intl.NumberFormat('en-GB').format(Number(value));
};
// Both arrays are required by the isolated OG component renderer.
useHead({ style: [], link: [] });
</script>

<template>
	<div :style="{ position: 'relative', display: 'flex', width: '1200px', height: '630px', overflow: 'hidden', backgroundColor: theme.canvas, color: theme.ink, fontFamily: 'Inter' }">
		<img :src="artwork" width="1200" height="630" alt="" :style="{ position: 'absolute', left: '0', top: '0' }" />
		<div :style="{ position: 'absolute', left: '38px', top: '29px', fontSize: '22px', fontWeight: 700, letterSpacing: '-.7px' }">FPL Insights</div>
		<div :style="{ position: 'absolute', left: '36px', top: '77px', width: '420px', height: '123px', fontSize: `${teamNameSize}px`, fontWeight: 700, letterSpacing: '-1.6px', lineHeight: '1.02', overflowWrap: 'anywhere' }">{{ teamName }}</div>
		<div :style="{ position: 'absolute', left: '38px', top: '211px', width: '410px', fontSize: '19px', lineHeight: '1.2' }">Manager: {{ managerName }}</div>
		<div class="flex-row" :style="{ position: 'absolute', left: '38px', top: '258px', display: 'flex', alignItems: 'center', gap: '17px', fontSize: '17px', fontWeight: 700 }">
			<span>{{ currentEvent ? `GW ${currentEvent}` : 'FPL' }}</span>
			<span v-if="formation" :style="{ borderLeft: `1px solid ${theme.ink}`, paddingLeft: '17px' }">{{ formation }}</span>
		</div>
		<div :style="{ position: 'absolute', left: '38px', top: '294px', width: '190px', height: '1px', backgroundColor: theme.ink, opacity: 0.65 }" />
		<div :style="{ position: 'absolute', left: '30px', top: '304px', width: '390px', fontSize: String(gameweekPoints ?? '').length > 3 ? '96px' : '124px', fontWeight: 700, letterSpacing: '-5px', lineHeight: '1' }">{{ formatNumber(gameweekPoints) }}</div>
		<div :style="{ position: 'absolute', left: '38px', top: '430px', fontSize: '20px' }">Gameweek points</div>
		<div class="flex-row" :style="{ position: 'absolute', left: '38px', top: '473px', display: 'flex', gap: '28px' }">
			<div class="flex-col" :style="{ display: 'flex', flexDirection: 'column', gap: '7px', paddingRight: '28px', borderRight: `1px solid ${theme.ink}` }">
				<span :style="{ fontSize: '28px', fontWeight: 700, lineHeight: '1' }">{{ formatNumber(overallPoints) }}</span>
				<span :style="{ fontSize: '13px' }">Overall points</span>
			</div>
			<div class="flex-col" :style="{ display: 'flex', flexDirection: 'column', gap: '7px' }">
				<span :style="{ fontSize: '28px', fontWeight: 700, lineHeight: '1' }">{{ formatNumber(overallRank) }}</span>
				<span :style="{ fontSize: '13px' }">Overall rank</span>
			</div>
		</div>
		<div :style="{ position: 'absolute', left: '38px', top: '537px', fontSize: '12px' }">Season points shown under players</div>

		<div v-for="(player, index) in players" :key="`${player.position}-${index}`" class="flex-col" :style="{ position: 'absolute', left: `${player.x - player.labelWidth / 2}px`, top: `${player.y + 7}px`, width: `${player.labelWidth}px`, minHeight: '37px', padding: '5px 3px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', backgroundColor: theme.paper, color: theme.ink, borderRadius: '5px' }">
			<span :style="{ display: 'flex', justifyContent: 'center', width: '100%', fontSize: player.labelWidth < 90 || player.name.length > 13 ? '11px' : '13px', fontWeight: 700, lineHeight: '1.1', textAlign: 'center', overflowWrap: 'anywhere' }">{{ player.name }}</span>
			<span :style="{ fontSize: '11px', lineHeight: '1' }">{{ formatNumber(player.seasonPoints) }} pts</span>
		</div>
		<template v-for="(player, index) in players" :key="`badge-${index}`">
			<div v-if="player.isCaptain || player.isViceCaptain" :style="{ position: 'absolute', left: `${player.x + 13}px`, top: `${player.y - 39}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', width: player.isCaptain ? '23px' : '27px', height: '23px', borderRadius: '12px', border: '1px solid #202221', backgroundColor: player.isCaptain ? '#ffdc54' : theme.paper, color: '#202221', fontSize: player.isCaptain ? '14px' : '10px', fontWeight: 700 }">{{ player.isCaptain ? 'C' : 'VC' }}</div>
		</template>
		<div v-if="!players.length" :style="{ position: 'absolute', left: '650px', top: '330px', width: '450px', padding: '15px', backgroundColor: theme.paper, color: theme.ink, fontSize: '20px', textAlign: 'center' }">Starting XI unavailable</div>

		<div :style="{ position: 'absolute', left: '38px', top: '590px', color: theme.paper, fontSize: '15px', fontWeight: 700 }">sportsync.in</div>
		<div :style="{ position: 'absolute', left: '464px', top: '590px', color: theme.paper, fontSize: '14px', fontWeight: 700 }">Bench</div>
		<div v-for="(player, index) in bench.slice(0, 4)" :key="`bench-${index}`" class="flex-col" :style="{ position: 'absolute', left: `${585 + index * 155}px`, top: '586px', width: '115px', display: 'flex', flexDirection: 'column', gap: '4px', color: theme.paper }">
			<span :style="{ fontSize: '13px', fontWeight: 700, lineHeight: '1.1', overflowWrap: 'anywhere' }">{{ player.name }}</span>
			<span :style="{ fontSize: '11px', opacity: 0.8 }">{{ formatNumber(player.seasonPoints) }} pts</span>
		</div>
		<div v-if="!bench.length" :style="{ position: 'absolute', left: '555px', top: '590px', color: theme.paper, fontSize: '13px' }">Unavailable</div>
	</div>
</template>
