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
	captainName: { type: String, default: "Not selected" },
	viceCaptainName: { type: String, default: "Not selected" },
	players: { type: Array, default: () => [] },
});

const playerWidth = 112;
const rowPositions = {
	Forward: 218,
	Midfielder: 307,
	Defender: 396,
	Goalkeeper: 485,
};

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

const playerInitials = (name) => String(name || "?").trim().slice(0, 2).toUpperCase();
const gameweekLabel = computed(() => props.currentEvent || "-");
const teamNameSize = computed(() => {
	if (props.teamName.length > 28) return "34px";
	if (props.teamName.length > 20) return "38px";
	return "44px";
});

// The isolated renderer expects both arrays on the component's head payload.
useHead({ style: [], link: [] });
</script>

<template>
	<div :style="{ position: 'relative', display: 'flex', width: '1200px', height: '630px', overflow: 'hidden', backgroundColor: '#080e0b', color: '#f5f8f5', fontFamily: 'Inter' }">
		<div :style="{ position: 'absolute', left: '0', top: '0', width: '1200px', height: '6px', backgroundColor: '#00c16a' }" />

		<div :style="{ position: 'absolute', left: '40px', top: '24px', color: '#a4e46a', fontSize: '13px', fontWeight: 700, letterSpacing: '1.8px' }">FPL INSIGHTS / MANAGER TEAM</div>
		<div :style="{ position: 'absolute', left: '40px', top: '48px', width: '850px', height: '54px', color: '#ffffff', fontSize: teamNameSize, fontWeight: 700, lineHeight: '1.05' }">{{ teamName }}</div>
		<div :style="{ position: 'absolute', left: '40px', top: '108px', color: '#b2beb5', fontSize: '17px' }">{{ managerName }} <span :style="{ color: '#68796d' }">·</span> Manager {{ managerId }}</div>

		<div :style="{ position: 'absolute', left: '1020px', top: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '140px', height: '94px', border: '1px solid #385842', borderRadius: '14px', backgroundColor: '#12251a' }">
			<span :style="{ color: '#aab8ad', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px' }">GAMEWEEK</span>
			<span :style="{ marginTop: '4px', color: '#c4f27b', fontSize: '36px', fontWeight: 700, lineHeight: '1' }">{{ gameweekLabel }}</span>
		</div>

		<div :style="{ position: 'absolute', left: '40px', top: '162px', width: '750px', height: '422px', border: '1px solid #315b40', borderRadius: '18px', backgroundColor: '#102a1d' }" />
		<div :style="{ position: 'absolute', left: '56px', top: '178px', width: '718px', height: '390px', border: '1px solid #294c36', borderRadius: '12px' }" />
		<div :style="{ position: 'absolute', left: '57px', top: '386px', width: '716px', height: '1px', backgroundColor: '#294c36' }" />

		<div :style="{ position: 'absolute', left: '68px', top: '184px', color: '#e6eee7', fontSize: '13px', fontWeight: 700, letterSpacing: '1.6px' }">STARTING XI</div>
		<div :style="{ position: 'absolute', left: '682px', top: '182px', width: '74px', color: '#a8e76a', fontSize: '17px', fontWeight: 700, textAlign: 'right' }">{{ formation }}</div>

		<div v-for="player in positionedPlayers" :key="`${player.position}-${player.name}`" :style="{ position: 'absolute', left: `${player.left}px`, top: `${player.top}px`, display: 'flex', flexDirection: 'column', alignItems: 'center', width: `${playerWidth}px`, height: '78px' }">
			<div :style="{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', border: '2px solid #d2f5a2', borderRadius: '50%', backgroundColor: '#a9df65', color: '#102016', fontSize: '15px', fontWeight: 700 }">
				{{ playerInitials(player.name) }}
				<span v-if="player.isCaptain" :style="{ position: 'absolute', right: '-10px', top: '-5px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', border: '1px solid #080e0b', borderRadius: '50%', backgroundColor: '#e8b044', color: '#1c1708', fontSize: '11px', fontWeight: 700 }">C</span>
				<span v-else-if="player.isViceCaptain" :style="{ position: 'absolute', right: '-12px', top: '-5px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '20px', border: '1px solid #080e0b', borderRadius: '10px', backgroundColor: '#d3ddd4', color: '#172119', fontSize: '9px', fontWeight: 700 }">VC</span>
			</div>
			<div :style="{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: `${playerWidth}px`, height: '30px', marginTop: '4px', color: '#f5f8f5', fontSize: '14px', fontWeight: 700, lineHeight: '15px', textAlign: 'center' }">{{ player.name }}</div>
		</div>

		<div v-if="!positionedPlayers.length" :style="{ position: 'absolute', left: '68px', top: '355px', width: '694px', color: '#c0cbc2', fontSize: '20px', textAlign: 'center' }">Starting XI unavailable</div>

		<div :style="{ position: 'absolute', left: '812px', top: '162px', width: '348px', height: '422px', border: '1px solid #2b4433', borderRadius: '18px', backgroundColor: '#111a14' }" />
		<div :style="{ position: 'absolute', left: '840px', top: '185px', color: '#adbaaf', fontSize: '13px', fontWeight: 700, letterSpacing: '1.5px' }">OVERALL POINTS</div>
		<div :style="{ position: 'absolute', left: '840px', top: '210px', color: '#c4f27b', fontSize: '58px', fontWeight: 700, lineHeight: '1' }">{{ formatNumber(overallPoints) }}</div>
		<div :style="{ position: 'absolute', left: '840px', top: '284px', color: '#adbaaf', fontSize: '13px', fontWeight: 700, letterSpacing: '1.3px' }">OVERALL RANK</div>
		<div :style="{ position: 'absolute', left: '840px', top: '306px', color: '#ffffff', fontSize: '29px', fontWeight: 700, lineHeight: '1' }">{{ formatNumber(overallRank) }}</div>

		<div :style="{ position: 'absolute', left: '840px', top: '352px', width: '292px', height: '1px', backgroundColor: '#304437' }" />
		<div :style="{ position: 'absolute', left: '840px', top: '375px', color: '#adbaaf', fontSize: '12px', fontWeight: 700, letterSpacing: '1.1px' }">GW POINTS</div>
		<div :style="{ position: 'absolute', left: '840px', top: '397px', color: '#ffffff', fontSize: '34px', fontWeight: 700, lineHeight: '1' }">{{ formatNumber(eventPoints) }}</div>
		<div :style="{ position: 'absolute', left: '992px', top: '370px', width: '1px', height: '76px', backgroundColor: '#304437' }" />
		<div :style="{ position: 'absolute', left: '1010px', top: '375px', color: '#adbaaf', fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }">GW RANK</div>
		<div :style="{ position: 'absolute', left: '1010px', top: '400px', width: '130px', color: '#ffffff', fontSize: '22px', fontWeight: 700, lineHeight: '1' }">{{ formatNumber(eventRank) }}</div>

		<div :style="{ position: 'absolute', left: '840px', top: '462px', width: '292px', height: '1px', backgroundColor: '#304437' }" />
		<div :style="{ position: 'absolute', left: '840px', top: '483px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e8b044', color: '#1c1708', fontSize: '12px', fontWeight: 700 }">C</div>
		<div :style="{ position: 'absolute', left: '878px', top: '477px', color: '#adbaaf', fontSize: '10px', fontWeight: 700, letterSpacing: '1.1px' }">CAPTAIN</div>
		<div :style="{ position: 'absolute', left: '878px', top: '493px', width: '252px', color: '#ffffff', fontSize: '15px', fontWeight: 700 }">{{ captainName }}</div>
		<div :style="{ position: 'absolute', left: '840px', top: '527px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '22px', borderRadius: '11px', backgroundColor: '#d3ddd4', color: '#172119', fontSize: '9px', fontWeight: 700 }">VC</div>
		<div :style="{ position: 'absolute', left: '878px', top: '520px', color: '#adbaaf', fontSize: '10px', fontWeight: 700, letterSpacing: '1px' }">VICE-CAPTAIN</div>
		<div :style="{ position: 'absolute', left: '878px', top: '536px', width: '252px', color: '#ffffff', fontSize: '15px', fontWeight: 700 }">{{ viceCaptainName }}</div>

		<div :style="{ position: 'absolute', left: '40px', top: '604px', color: '#839187', fontSize: '11px', letterSpacing: '1px' }">CURRENT SQUAD · GAMEWEEK {{ gameweekLabel }}</div>
		<div :style="{ position: 'absolute', left: '1070px', top: '604px', color: '#839187', fontSize: '11px', textAlign: 'right' }">sportsync.in</div>
	</div>
</template>
