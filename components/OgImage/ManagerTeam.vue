<script setup>
import { compactInstagramNumber, getInstagramClubTheme } from "~/utils/instagram-designs";

const props = defineProps({
	managerName: { type: String, default: "FPL Manager" },
	teamName: { type: String, default: "Fantasy Premier League team" },
	currentEvent: { type: [Number, String], default: null },
	overallPoints: { type: [Number, String], default: null },
	overallRank: { type: [Number, String], default: null },
	formation: { type: String, default: "" },
	players: { type: Array, default: () => [] },
});

const playerWidth = 112;
const rowPositions = {
	Forward: 218,
	Midfielder: 306,
	Defender: 394,
	Goalkeeper: 482,
};

const clubTheme = computed(() => {
	const captain = props.players.find((player) => player.isCaptain) ?? props.players[0];
	const clubCode = Number(captain?.clubCode) || 0;
	return getInstagramClubTheme(clubCode);
});

const positionedPlayers = computed(() => {
	const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
	const left = 68;
	const width = 694;

	return positions.flatMap((position) => {
		const players = props.players.filter((player) => player.position === position);
		const step = width / (players.length + 1);

		return players.map((player, index) => ({
			...player,
			left: Math.round(left + step * (index + 1) - playerWidth / 2),
			top: rowPositions[position],
		}));
	});
});

const formatNumber = (value) => {
	if (value === null || value === undefined || value === "") return "-";
	const number = Number(value);
	return Number.isFinite(number) ? new Intl.NumberFormat("en-GB").format(number) : "-";
};

const formatRank = (value) => {
	if (value === null || value === undefined || value === "") return "-";
	const number = Number(value);
	return Number.isFinite(number) ? compactInstagramNumber(number) : "-";
};

const gameweekLabel = computed(() => props.currentEvent ? `GW ${props.currentEvent}` : "FPL");
const teamNameSize = computed(() => {
	if (props.teamName.length > 28) return "34px";
	if (props.teamName.length > 20) return "38px";
	return "44px";
});

// The isolated renderer expects both arrays on the component's head payload.
useHead({ style: [], link: [] });
</script>

<template>
	<div :style="{ position: 'relative', display: 'flex', width: '1200px', height: '630px', overflow: 'hidden', backgroundColor: clubTheme.dark, color: clubTheme.light, fontFamily: 'Inter' }">
		<div :style="{ position: 'absolute', left: '0', top: '0', width: '1200px', height: '6px', backgroundColor: clubTheme.primary }" />

		<div :style="{ position: 'absolute', left: '40px', top: '24px', color: clubTheme.light, fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px' }">FPL INSIGHTS</div>
		<div :style="{ position: 'absolute', left: '40px', top: '48px', width: '780px', height: '54px', color: clubTheme.light, fontSize: teamNameSize, fontWeight: 700, lineHeight: '1.05' }">{{ teamName }}</div>
		<div :style="{ position: 'absolute', left: '40px', top: '108px', color: clubTheme.light, fontSize: '17px' }">{{ managerName }}</div>
		<div :style="{ position: 'absolute', left: '870px', top: '38px', width: '290px', color: clubTheme.light, fontSize: '20px', fontWeight: 700, textAlign: 'right' }">{{ gameweekLabel }}</div>

		<div :style="{ position: 'absolute', left: '56px', top: '388px', width: '716px', height: '1px', backgroundColor: clubTheme.primary, opacity: 0.32 }" />
		<div :style="{ position: 'absolute', left: '804px', top: '180px', width: '1px', height: '390px', backgroundColor: clubTheme.primary, opacity: 0.42 }" />
		<div :style="{ position: 'absolute', left: '682px', top: '182px', width: '74px', color: clubTheme.light, fontSize: '17px', fontWeight: 700, textAlign: 'right' }">{{ formation }}</div>

		<div v-for="player in positionedPlayers" :key="`${player.position}-${player.name}`" :style="{ position: 'absolute', left: `${player.left}px`, top: `${player.top}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${playerWidth}px`, height: '78px' }">
			<div :style="{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', border: `2px solid ${clubTheme.primary}`, borderRadius: '50%', backgroundColor: clubTheme.light }">
				<span v-if="player.isCaptain" :style="{ position: 'absolute', right: '-10px', top: '-5px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', border: '1px solid #211a09', borderRadius: '50%', backgroundColor: '#f0bd4a', color: '#211a09', fontSize: '10px', fontWeight: 700 }">C</span>
				<span v-else-if="player.isViceCaptain" :style="{ position: 'absolute', right: '-12px', top: '-5px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '20px', border: `1px solid ${clubTheme.primary}`, borderRadius: '10px', backgroundColor: clubTheme.light, color: clubTheme.dark, fontSize: '9px', fontWeight: 700 }">VC</span>
			</div>
			<div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: `${playerWidth}px`, height: '30px', marginTop: '6px', color: clubTheme.light, fontSize: '14px', fontWeight: 700, lineHeight: '15px', textAlign: 'center' }">{{ player.name }}</div>
		</div>

		<div v-if="!positionedPlayers.length" :style="{ position: 'absolute', left: '68px', top: '355px', width: '694px', color: clubTheme.light, fontSize: '20px', textAlign: 'center' }">Starting XI unavailable</div>

		<div :style="{ position: 'absolute', left: '850px', top: '252px', color: clubTheme.light, fontSize: '78px', fontWeight: 700, lineHeight: '1' }">{{ formatNumber(overallPoints) }} <span :style="{ color: clubTheme.light, fontSize: '18px' }">PTS</span></div>
		<div :style="{ position: 'absolute', left: '850px', top: '376px', color: clubTheme.light, fontSize: '42px', fontWeight: 700, lineHeight: '1' }">{{ formatRank(overallRank) }}</div>
		<div :style="{ position: 'absolute', left: '850px', top: '430px', color: clubTheme.light, fontSize: '13px', fontWeight: 700, letterSpacing: '1.2px' }">OVERALL RANK</div>
	</div>
</template>
