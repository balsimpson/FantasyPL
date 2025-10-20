<template>
  <div class="p-4 mx-auto max-w-3xl">
    <div>Players</div>

    <AppCarousel>
      <SchedulerPlayerCard
        v-for="item in getTopPlayers(data.players)"
        :key="item"
        :player="item"
        :data="data.teams"
        class="flex-shrink-0 w-64 bg-gradient-to-br rounded-lg from-slate-100 to-slate-300 snap-start"
        @selected="getPreview($event)"
        />
    </AppCarousel>


    

    <div>

        <h2 class="mt-6 font-bold">Caption</h2>
        <div class="p-4 bg-blue-100 rounded-lg min-h-44">
           {{ caption }}
        </div>
        
        <div class="flex overflow-scroll flex-col mx-auto w-full">
          <InstaPlayerCard
            v-if="selectedPlayerData"
            :player="selectedPlayerData"
            :team="getTeamInfo(selectedPlayerData.team_code, data.teams)?.name || ''"
            :upcoming="player?.fixtures.slice(0, 5)"
            :gameweek="data.currentGameweek"
            :key="selectedPlayerData.web_name"
            ref="playerCard"
            id="my-node"
          />
        </div>
    </div>

    <pre>{{ data.teams.length }}</pre>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false,
});
const { data } = await useLazyAsyncData("bootstrap", () =>
  $fetch("/api/players/get-all")
);

const player = ref(null);
const caption = ref("");
const selectedPlayerData = ref();
const teams = ref([])

const getPreview = async(playerData) => {
    // console.log("playerData", playerData)
    selectedPlayerData.value = playerData
    // console.log(playerData.value)
    let currentPlayer = extractPlayerSummary(playerData)
    console.log("playerData", currentPlayer)
    caption.value = await getInstaCaption(playerData) || ""
    console.log("caption", caption.value)
}

const getTeamInfo = (id, teamsData) => {

	if (!id || !teamsData) return;

    const teams = toRaw(unref(teamsData));
    // console.log("team:", teams);
	try {
		const team = teams.find((t) => t.code == id);        
		return team;
	} catch (error) {
		console.log("getTeamInfo: Error - ", error);
		return null;
	}
};

function extractPlayerSummary(player) {
  if (!player) return null;
    const team = getTeamInfo(player.team_code, data.value.teams)
    
  return {
    // Basic Info
    id: player.id,
    name: player.web_name,
    full_name: player.first_name + " " + player.second_name,
    team: team?.name || "", 
    position: player.__pos || '',
    
    // FPL Core
    total_points: player.total_points,
    event_points: player.event_points,
    form: player.form,
    price: player.now_cost / 10, // e.g. 58 → 5.8m
    minutes: player.minutes,

    // Attack
    goals_scored: player.goals_scored,
    assists: player.assists,
    expected_goals: player.expected_goals,
    expected_assists: player.expected_assists,
    bonus: player.bonus,

    // Defence / Keeper
    clean_sheets: player.clean_sheets,
    goals_conceded: player.goals_conceded,
    saves: player.saves,
    expected_goal_involvements: player.expected_goal_involvements,

    // Popularity
    ownership_percent: player.selected_by_percent,
    transfers_in_event: player.transfers_in_event,
    transfers_out_event: player.transfers_out_event,
    
    // Misc
    status: player.status, // 'a' = available, 'i' = injured, etc.
    // chance_of_playing_next_round: player.chance_of_playing_next_round,
  };
}

const getInstaCaption = async (playerData) => {
    const res = await $fetch('/api/get-response', {
        method: 'POST',
        body: JSON.stringify({ prompt: playerData }),
        headers: { 'Content-Type': 'application/json' }
    });
    console.log("caption", res);
    return res.output;
};

watchEffect(async () => {
	if (selectedPlayerData.value) {
		console.log("id", selectedPlayerData.value.id);

		let playerId = selectedPlayerData.value.id;
		player.value = await $fetch(`/api/players/${playerId}`);
        teams.value = data.value.teams
	}
});

// FPL ranking + comparison pairs
// Usage: const { top10, pairs } = selectTopAndPairs(playersArray, { topN: 10 });

const getTopPlayers = (players, opts = {}) => {
  const cfg = {
    topN: 10,
    minMinutes: 270,
    minChance: 75,
    lambdaValue: 0.1, // value boost weight
    costBand: 1, // max cost diff for pairs (FPL units)
    maxPairsPerPos: 4,
    ...opts,
  };

  // -------- helpers --------
  const pos = (p) =>
    ({ 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" }[p.element_type] || "MID");
  const num = (v) =>
    v == null || v === "" ? 0 : typeof v === "number" ? v : parseFloat(v);
  const inv = (v) => 1 - v; // for metrics where lower is better

  const fieldsByPos = {
    FWD: [
      "goals_scored",
      "assists",
      "expected_goals",
      "expected_goal_involvements",
      "form",
      "bonus",
    ],
    MID: [
      "goals_scored",
      "assists",
      "expected_goal_involvements",
      "creativity",
      "form",
      "clean_sheets",
      "bonus",
    ],
    DEF: [
      "clean_sheets",
      "tackles",
      "clearances_blocks_interceptions",
      "threat",
      "form",
      "bonus",
    ],
    GK: ["clean_sheets", "saves", "goals_conceded_per_90", "form"],
    VALUE: ["points_per_game", "now_cost"],
    PAIRS_FWD: [
      "goals_scored",
      "assists",
      "expected_goals",
      "expected_goal_involvements",
      "form",
      "now_cost",
    ],
    PAIRS_MID: [
      "goals_scored",
      "assists",
      "expected_goal_involvements",
      "creativity",
      "form",
      "now_cost",
    ],
    PAIRS_DEF: [
      "clean_sheets",
      "tackles",
      "clearances_blocks_interceptions",
      "threat",
      "form",
      "now_cost",
    ],
    PAIRS_GK: [
      "clean_sheets",
      "saves",
      "goals_conceded_per_90",
      "form",
      "now_cost",
    ],
  };

  const weights = {
    FWD: {
      goals_scored: 0.45,
      assists: 0.2,
      expected_goals: 0.15,
      expected_goal_involvements: 0.1,
      form: 0.05,
      bonus: 0.05,
    },
    MID: {
      goals_scored: 0.35,
      assists: 0.25,
      expected_goal_involvements: 0.2,
      creativity: 0.1,
      form: 0.05,
      clean_sheets: 0.05,
    },
    DEF: {
      clean_sheets: 0.35,
      tackles: 0.2,
      clearances_blocks_interceptions: 0.15,
      threat: 0.15,
      form: 0.15,
      bonus: 0,
    },
    GK: { clean_sheets: 0.5, saves: 0.3, form: 0.2 },
  };

  // Filter availability/ minutes
  const pool = players.filter(
    (p) =>
      p &&
      p.status === "a" &&
      num(p.minutes) >= cfg.minMinutes &&
      (p.chance_of_playing_next_round == null ||
        num(p.chance_of_playing_next_round) >= cfg.minChance)
  );

  // Build normalization ranges per metric (min-max)
  const allFields = new Set([
    ...fieldsByPos.FWD,
    ...fieldsByPos.MID,
    ...fieldsByPos.DEF,
    ...fieldsByPos.GK,
    ...fieldsByPos.VALUE,
    "selected_by_percent",
  ]);
  const ranges = {};
  for (const f of allFields) {
    let arr = pool.map((p) => num(p[f]));
    // invert list for conceded per 90 later; keep raw now
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    ranges[f] = { min, max, span: max - min || 1 };
  }

  const norm = (f, v) => (num(v) - ranges[f].min) / ranges[f].span;

  // Scoring per player
  function scorePlayer(p) {
    const position = pos(p);
    const W = weights[position];
    let s = 0;

    // normalized metrics (handle inverted ones)
    const n = (key) =>
      key === "goals_conceded_per_90"
        ? inv(norm(key, num(p[key])))
        : norm(key, num(p[key]));

    for (const k of Object.keys(W)) s += (W[k] || 0) * n(k);

    // availability multiplier
    const chance =
      p.chance_of_playing_next_round != null
        ? num(p.chance_of_playing_next_round) / 100
        : 1;
    s *= chance;

    // value boost: points_per_game / now_cost (then min-max via VALUE fields)
    const vRaw = (num(p.points_per_game) || 0) / (num(p.now_cost) || 1);
    // rescale value across pool using min-max of vRaw computed on the fly
    // quick pass: approximate by using normalized PPG minus normalized cost
    const valueScore = Math.max(
      0,
      norm("points_per_game", p.points_per_game) - norm("now_cost", p.now_cost)
    );
    s += cfg.lambdaValue * valueScore;

    return s;
  }

  // Rank
  const scored = pool.map((p) => ({
    ...p,
    __score: scorePlayer(p),
    __pos: pos(p),
    __ppg: num(p.points_per_game),
    __form: num(p.form),
    __cost: num(p.now_cost),
  }));

  scored.sort(
    (a, b) =>
      b.__score - a.__score ||
      b.__ppg - a.__ppg ||
      b.__form - a.__form ||
      a.__cost - b.__cost
  );

  const top10 = scored.slice(0, cfg.topN);

  return top10;
};

// function selectTopAndPairs(players, opts = {}) {
//   const cfg = {
//     topN: 10,
//     minMinutes: 270,
//     minChance: 75,
//     lambdaValue: 0.1,           // value boost weight
//     costBand: 1,                // max cost diff for pairs (FPL units)
//     maxPairsPerPos: 4,
//     ...opts,
//   };

//   // -------- helpers --------
//   const pos = p => ({1:'GK',2:'DEF',3:'MID',4:'FWD'}[p.element_type] || 'MID');
//   const num = v => (v == null || v === '' ? 0 : typeof v === 'number' ? v : parseFloat(v));
//   const inv = v => 1 - v; // for metrics where lower is better

//   const fieldsByPos = {
//     FWD: ['goals_scored','assists','expected_goals','expected_goal_involvements','form','bonus'],
//     MID: ['goals_scored','assists','expected_goal_involvements','creativity','form','clean_sheets','bonus'],
//     DEF: ['clean_sheets','tackles','clearances_blocks_interceptions','threat','form','bonus'],
//     GK:  ['clean_sheets','saves','goals_conceded_per_90','form'],
//     VALUE: ['points_per_game','now_cost'],
//     PAIRS_FWD: ['goals_scored','assists','expected_goals','expected_goal_involvements','form','now_cost'],
//     PAIRS_MID: ['goals_scored','assists','expected_goal_involvements','creativity','form','now_cost'],
//     PAIRS_DEF: ['clean_sheets','tackles','clearances_blocks_interceptions','threat','form','now_cost'],
//     PAIRS_GK:  ['clean_sheets','saves','goals_conceded_per_90','form','now_cost'],
//   };

//   const weights = {
//     FWD: { goals_scored:.45, assists:.2, expected_goals:.15, expected_goal_involvements:.1, form:.05, bonus:.05 },
//     MID: { goals_scored:.35, assists:.25, expected_goal_involvements:.2, creativity:.1, form:.05, clean_sheets:.05 },
//     DEF: { clean_sheets:.35, tackles:.2, clearances_blocks_interceptions:.15, threat:.15, form:.15, bonus:0 },
//     GK:  { clean_sheets:.5, saves:.3, form:.2 },
//   };

//   // Filter availability/ minutes
//   const pool = players.filter(p =>
//     p && p.status === 'a' &&
//     num(p.minutes) >= cfg.minMinutes &&
//     (p.chance_of_playing_next_round == null || num(p.chance_of_playing_next_round) >= cfg.minChance)
//   );

//   // Build normalization ranges per metric (min-max)
//   const allFields = new Set([
//     ...fieldsByPos.FWD, ...fieldsByPos.MID, ...fieldsByPos.DEF, ...fieldsByPos.GK,
//     ...fieldsByPos.VALUE, 'selected_by_percent'
//   ]);
//   const ranges = {};
//   for (const f of allFields) {
//     let arr = pool.map(p => num(p[f]));
//     // invert list for conceded per 90 later; keep raw now
//     const min = Math.min(...arr);
//     const max = Math.max(...arr);
//     ranges[f] = { min, max, span: max - min || 1 };
//   }

//   const norm = (f, v) => (num(v) - ranges[f].min) / ranges[f].span;

//   // Scoring per player
//   function scorePlayer(p) {
//     const position = pos(p);
//     const W = weights[position];
//     let s = 0;

//     // normalized metrics (handle inverted ones)
//     const n = key => key === 'goals_conceded_per_90'
//       ? inv(norm(key, num(p[key])))
//       : norm(key, num(p[key]));

//     for (const k of Object.keys(W)) s += (W[k] || 0) * n(k);

//     // availability multiplier
//     const chance = p.chance_of_playing_next_round != null ? num(p.chance_of_playing_next_round)/100 : 1;
//     s *= chance;

//     // value boost: points_per_game / now_cost (then min-max via VALUE fields)
//     const vRaw = (num(p.points_per_game) || 0) / (num(p.now_cost) || 1);
//     // rescale value across pool using min-max of vRaw computed on the fly
//     // quick pass: approximate by using normalized PPG minus normalized cost
//     const valueScore = Math.max(0, norm('points_per_game', p.points_per_game) - norm('now_cost', p.now_cost));
//     s += cfg.lambdaValue * valueScore;

//     return s;
//   }

//   // Rank
//   const scored = pool.map(p => ({
//     ...p,
//     __score: scorePlayer(p),
//     __pos: pos(p),
//     __ppg: num(p.points_per_game),
//     __form: num(p.form),
//     __cost: num(p.now_cost),

//   }));

//   scored.sort((a,b) =>
//     b.__score - a.__score ||
//     b.__ppg - a.__ppg ||
//     b.__form - a.__form ||
//     a.__cost - b.__cost
//   );

//   const top10 = scored.slice(0, cfg.topN);
// //   console.log(top10);

//   // ---------- pairs ----------
//   function vecForPairs(p) {
//     const position = pos(p);
//     const key = {FWD:'PAIRS_FWD', MID:'PAIRS_MID', DEF:'PAIRS_DEF', GK:'PAIRS_GK'}[position];
//     const ks = fieldsByPos[key];
//     return ks.map(k => k === 'goals_conceded_per_90' ? inv(norm(k, p[k])) : norm(k, p[k]));
//   }

//   const byPos = {
//     FWD: scored.filter(p => p.__pos==='FWD'),
//     MID: scored.filter(p => p.__pos==='MID'),
//     DEF: scored.filter(p => p.__pos==='DEF'),
//     GK:  scored.filter(p => p.__pos==='GK'),
//   };

//   function cosineDist(a,b){
//     let dot=0, na=0, nb=0;
//     for (let i=0;i<a.length;i++){ dot+=a[i]*b[i]; na+=a[i]*a[i]; nb+=b[i]*b[i]; }
//     const denom = Math.sqrt(na)*Math.sqrt(nb) || 1;
//     return 1 - (dot/denom);
//   }

//   function contrastFactor(p,q){
//     const keys = ['goals_scored','assists','expected_goal_involvements','tackles','clean_sheets','saves','threat','creativity'];
//     let c = 0;
//     for (const k of keys) {
//       if (!(k in p) || !(k in q)) continue;
//       const diff = Math.abs(norm(k, p[k]) - norm(k, q[k]));
//       c = Math.max(c, diff);
//     }
//     return c;
//   }

//   function makePairs(list){
//     const out = [];
//     for (let i=0;i<list.length;i++){
//       for (let j=i+1;j<list.length;j++){
//         const a = list[i], b = list[j];
//         if (Math.abs(a.__cost - b.__cost) > cfg.costBand) continue;
//         const va = vecForPairs(a), vb = vecForPairs(b);
//         const dist = cosineDist(va, vb);
//         const availability = Math.min(
//           a.chance_of_playing_next_round ?? 100,
//           b.chance_of_playing_next_round ?? 100
//         )/100;
//         const contrast = contrastFactor(a,b);
//         const ownershipGap = Math.abs(num(a.selected_by_percent) - num(b.selected_by_percent))/100;
//         const pairScore = (1 - dist) * (0.6*contrast + 0.4*ownershipGap) * availability;
//         out.push({ a, b, dist, contrast, ownershipGap, pairScore });
//       }
//     }
//     // sort by "similar but contrasting + good availability"
//     out.sort((x,y) => y.pairScore - x.pairScore);
//     return out.slice(0, cfg.maxPairsPerPos);
//   }

//   const pairs = {
//     FWD: makePairs(byPos.FWD),
//     MID: makePairs(byPos.MID),
//     DEF: makePairs(byPos.DEF),
//     GK:  makePairs(byPos.GK),
//   };

//   // Minimal payloads for UI
//   const slimTop = top10.map(p => ({
//     id: p.id,
//     name: p.web_name,
//     team: p.team,
//     pos: p.__pos,
//     cost: p.__cost,
//     score: +p.__score.toFixed(4),
//     ppg: p.__ppg,
//     form: p.__form,
//     sel: num(p.selected_by_percent),
//     news: p.news,
//     chance: p.chance_of_playing_next_round,
//     transfers_in_event: num(p.transfers_in_event),
//     transfers_out_event: num(p.transfers_out_event),
//     birth_date: p.birth_date,
//     yellow_cards: p.yellow_cards,
//     red_cards: p.red_cards
//   }));

//   const slimPairs = Object.fromEntries(
//     Object.entries(pairs).map(([k, arr]) => [k, arr.map(({a,b, pairScore, contrast, ownershipGap}) => ({
//       a: { id:a.id, name:a.web_name, cost:a.__cost, sel:num(a.selected_by_percent), ppg:a.__ppg, form:a.__form },
//       b: { id:b.id, name:b.web_name, cost:b.__cost, sel:num(b.selected_by_percent), ppg:b.__ppg, form:b.__form },
//       pairScore:+pairScore.toFixed(4),
//       contrast:+contrast.toFixed(3),
//       ownershipGap:+ownershipGap.toFixed(3)
//     }))])
//   );

//   return { top10: top10, pairs: slimPairs };
// }
</script>
