<script setup>
const props = defineProps({
	managerId: { type: [String, Number], default: "" },
	managerName: { type: String, default: "FPL Manager" },
	teamName: { type: String, default: "Fantasy Premier League team" },
	currentEvent: { type: [Number, String], default: null },
	eventPoints: { type: [Number, String], default: null },
	eventRank: { type: [Number, String], default: null },
	overallPoints: { type: [Number, String], default: null },
	overallRank: { type: [Number, String], default: null },
	formation: { type: String, default: "" },
	players: { type: Array, default: () => [] },
});

const positionRows = computed(() => [
	{ position: "Forward", label: "FORWARDS" },
	{ position: "Midfielder", label: "MIDFIELDERS" },
	{ position: "Defender", label: "DEFENDERS" },
	{ position: "Goalkeeper", label: "GOALKEEPER" },
].map((row) => ({
	...row,
	players: props.players.filter((player) => player.position === row.position),
})).filter((row) => row.players.length));

const formatNumber = (value) => {
	if (value === null || value === undefined || value === "") return "-";
	const number = Number(value);
	return Number.isFinite(number) ? new Intl.NumberFormat("en-GB").format(number) : "-";
};

const playerInitials = (name) => String(name || "?").trim().slice(0, 2).toUpperCase();

const gameweekLabel = computed(() => props.currentEvent || "-");

// The isolated renderer expects both arrays on the component's head payload.
useHead({ style: [], link: [] });
</script>

<template>
	<div :style="{ display: 'flex', flexDirection: 'column', width: '1200px', height: '630px', boxSizing: 'border-box', overflow: 'hidden', padding: '34px 40px 28px', backgroundColor: '#080e0b', color: '#f6f8f6', fontFamily: 'Inter' }">
		<header :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', marginBottom: '18px' }">
			<div :style="{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }">
				<div :style="{ display: 'flex', alignItems: 'center', gap: '9px', color: '#8fe05c', fontSize: '12px', fontWeight: 700, letterSpacing: '2px' }">
					<span>FPL INSIGHTS</span>
					<span :style="{ color: '#617268' }">/</span>
					<span :style="{ color: '#c4cec8' }">MANAGER TEAM</span>
				</div>
				<div :style="{ color: '#ffffff', fontSize: '32px', fontWeight: 700, lineHeight: '1.12' }">{{ teamName }}</div>
				<div :style="{ color: '#a6b2aa', fontSize: '15px' }">{{ managerName }} <span :style="{ color: '#64766b' }">·</span> Manager {{ managerId }}</div>
			</div>
			<div :style="{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '112px', padding: '12px 16px', border: '1px solid #426948', borderRadius: '14px', backgroundColor: '#12261a' }">
				<span :style="{ color: '#9baa9e', fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px' }">GAMEWEEK</span>
				<span :style="{ marginTop: '3px', color: '#c2f080', fontSize: '28px', fontWeight: 700, lineHeight: '1' }">{{ gameweekLabel }}</span>
			</div>
		</header>

		<div :style="{ display: 'flex', flex: 1, minHeight: 0, gap: '20px' }">
			<section :style="{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0, padding: '18px 20px', border: '1px solid #28503b', borderRadius: '20px', backgroundColor: '#103122' }">
				<div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }">
					<span :style="{ color: '#d9e5dc', fontSize: '12px', fontWeight: 700, letterSpacing: '1.7px' }">STARTING XI</span>
					<span :style="{ color: '#a8df79', fontSize: '13px', fontWeight: 700 }">{{ formation }}</span>
				</div>
				<div v-if="positionRows.length" :style="{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'space-around', gap: '5px' }">
					<div v-for="row in positionRows" :key="row.position" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '8px' }">
						<div v-for="player in row.players" :key="`${row.position}-${player.name}`" :style="{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', maxWidth: '142px', gap: '4px' }">
							<div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#b7ed69', color: '#102016', fontSize: '13px', fontWeight: 700 }">{{ playerInitials(player.name) }}</div>
							<div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#f4f7f4', fontSize: '12px', fontWeight: 700, lineHeight: '15px', textAlign: 'center' }">
								<span>{{ player.name }}</span>
								<span v-if="player.isCaptain" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '16px', height: '16px', padding: '0 3px', borderRadius: '5px', backgroundColor: '#e4a738', color: '#1b1609', fontSize: '9px' }">C</span>
								<span v-else-if="player.isViceCaptain" :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '16px', padding: '0 3px', borderRadius: '5px', backgroundColor: '#bed5c1', color: '#122016', fontSize: '8px' }">VC</span>
							</div>
						</div>
					</div>
				</div>
				<div v-else :style="{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#b0beb4', fontSize: '17px' }">Starting XI unavailable</div>
			</section>

			<aside :style="{ display: 'flex', flexDirection: 'column', width: '340px', gap: '12px' }">
				<div :style="{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', padding: '18px 20px', border: '1px solid #294c36', borderRadius: '18px', backgroundColor: '#111b15' }">
					<span :style="{ color: '#9baa9e', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px' }">SEASON POINTS</span>
					<span :style="{ marginTop: '5px', color: '#c2f080', fontSize: '42px', fontWeight: 700, lineHeight: '1' }">{{ formatNumber(overallPoints) }}</span>
					<span :style="{ marginTop: '10px', color: '#d1dbd3', fontSize: '14px' }">Overall rank <strong :style="{ color: '#ffffff' }">{{ formatNumber(overallRank) }}</strong></span>
				</div>
				<div :style="{ display: 'flex', flex: 1, gap: '12px' }">
					<div :style="{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', padding: '16px', border: '1px solid #294c36', borderRadius: '18px', backgroundColor: '#111b15' }">
						<span :style="{ color: '#9baa9e', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }">GW POINTS</span>
						<span :style="{ marginTop: '7px', color: '#ffffff', fontSize: '27px', fontWeight: 700 }">{{ formatNumber(eventPoints) }}</span>
					</div>
					<div :style="{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center', padding: '16px', border: '1px solid #294c36', borderRadius: '18px', backgroundColor: '#111b15' }">
						<span :style="{ color: '#9baa9e', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }">GW RANK</span>
						<span :style="{ marginTop: '7px', color: '#ffffff', fontSize: '27px', fontWeight: 700 }">{{ formatNumber(eventRank) }}</span>
					</div>
				</div>
			</aside>
		</div>

		<footer :style="{ display: 'flex', justifyContent: 'space-between', marginTop: '13px', color: '#718078', fontSize: '11px' }">
			<span>Fantasy Premier League team profile</span>
			<span>sportsync.in</span>
		</footer>
	</div>
</template>
