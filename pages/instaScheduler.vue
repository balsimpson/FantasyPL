<template>
  <div class="p-4 mx-auto max-w-7xl">
    <div class="mb-6 space-y-4">
      <!-- Search and filters -->
      <div class="flex flex-wrap gap-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search players..."
          class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          v-model="selectedPosition"
          class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Positions</option>
          <option value="GK">Goalkeeper</option>
          <option value="DEF">Defender</option>
          <option value="MID">Midfielder</option>
          <option value="FWD">Forward</option>
        </select>

        <select
          v-model="sortBy"
          class="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="score">Sort by Score</option>
          <option value="form">Sort by Form</option>
          <option value="cost">Sort by Price</option>
        </select>
      </div>
    </div>

    <div>Players</div>

    <AppCarousel>
      <SchedulerPlayerCard
        v-for="item in recommendedPlayersNew"
        :key="item"
        :player="item"
        :data="data.teams"
        class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start"
        @selected="getPreview($event)"
      />
    </AppCarousel>

    <div class="flex flex-col items-center justify-center">
      <button
        v-if="selectedPlayerData"
        @click="schedulePost"
        :disabled="isPosting"
        class="relative w-full max-w-md px-4 py-2 mx-auto mt-6 text-white bg-blue-500 rounded disabled:bg-blue-300"
      >
        {{ postButtonText }}
        <div
          v-if="isPosting"
          class="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-50"
        >
          <div
            class="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"
          ></div>
        </div>
      </button>

      <!-- Status Message -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0"
      >
        <div
          v-if="statusMessage"
          :class="[
            'fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg text-white max-w-sm',
            statusMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500',
          ]"
        >
          {{ statusMessage.text }}
        </div>
      </Transition>

      <h2 class="mt-6 font-bold">Caption</h2>
      <div class="w-full p-4 bg-blue-100 rounded-lg min-h-44">
        {{ caption }}
      </div>
      <!-- class="w-full max-w-2xl mx-auto md:max-w-3xl" -->
      <div class="flex w-full overflow-x-auto">
        <InstaPlayerCard
          v-if="selectedPlayerData"
          :player="selectedPlayerData"
          :team="
            getTeamInfo(selectedPlayerData.team_code, data.teams)?.name || ''
          "
          :upcoming="player?.fixtures.slice(0, 5)"
          :gameweek="data.currentGameweek"
          :key="selectedPlayerData.web_name"
          ref="playerCard"
          id="my-node"
        />
      </div>
    </div>


    <div v-if="data">
      <InstaPlayerComparison :player1="selectPairsOnly(data.players).FWD[2].a" :player2="selectPairsOnly(data.players).FWD[2].b" :data="data"/>
    </div>
    <!-- <pre v-if="data">iyuiyui{{ data }}</pre> -->
    <!-- <pre>{{ data.teams }}</pre> -->
  </div>
</template>

<script setup>
import { toPng } from "html-to-image";
definePageMeta({
  layout: false,
});

const { data } = await useLazyAsyncData("bootstrap", () =>
  $fetch("/api/players/get-all")
);

const player = ref(null);
const caption = ref("");
const selectedPlayerData = ref();
const teams = ref([]);

const searchQuery = ref("");
const selectedPosition = ref("");
const sortBy = ref("score");

const recommendedPlayersNew = computed(() => {
  if (!data.value?.players) return [];

  let filteredPlayers = data.value.players;

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filteredPlayers = filteredPlayers.filter(
      (player) =>
        player.web_name.toLowerCase().includes(query) ||
        player.first_name.toLowerCase().includes(query) ||
        player.second_name.toLowerCase().includes(query)
    );
  }

  // Apply position filter
  if (selectedPosition.value) {
    filteredPlayers = filteredPlayers.filter((player) => {
      const pos = { 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" }[
        player.element_type
      ];
      return pos === selectedPosition.value;
    });
  }

  // Compute scores
  let scoredPlayers = computeScores(filteredPlayers);

  // Apply sorting
  switch (sortBy.value) {
    case "form":
      scoredPlayers.sort((a, b) => Number(b.form) - Number(a.form));
      break;
    case "cost":
      scoredPlayers.sort((a, b) => Number(b.now_cost) - Number(a.now_cost));
      break;
    case "score":
    default:
      // Already sorted by score from computeScores
      break;
  }

  return scoredPlayers;
});

const getPreview = async (playerData) => {
  // Clear any existing cache first
  await clearBrowserCache();

  selectedPlayerData.value = playerData;
  let currentPlayer = extractPlayerSummary(playerData);
  console.log("playerData", currentPlayer);

  // Reset the player card to ensure clean state
  await nextTick();

  caption.value = (await getInstaCaption(playerData)) || "";

  // Force a fresh load of images
  await nextTick();
  const previewEl = document.querySelector("#my-node");
  if (previewEl) {
    const images = previewEl.getElementsByTagName("img");
    for (let img of images) {
      const currentSrc = img.src;
      img.src = currentSrc + "?t=" + Date.now();
    }
  }
};

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
  const team = getTeamInfo(player.team_code, data.value.teams);

  return {
    // Basic Info
    id: player.id,
    name: player.web_name,
    full_name: player.first_name + " " + player.second_name,
    team: team?.name || "",
    position: player.__pos || "",

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
  try {
    player.value = await $fetch(`/api/players/${playerData.id}`);
    playerData.upcoming = player?.value.fixtures.slice(0, 5);
    const res = await $fetch("/api/get-response", {
      method: "POST",
      body: JSON.stringify({ prompt: playerData }),
      headers: { "Content-Type": "application/json" },
    });
    console.log("caption", res);
    return res.output;
  } catch (error) {
    console.log("getInstaCaption: Error - ", error);
  }
};

const isPosting = ref(false);
const postButtonText = ref("Schedule Insta Post");
const statusMessage = ref(null);

const showMessage = (text, type = "success") => {
  statusMessage.value = { text, type };
  setTimeout(() => {
    statusMessage.value = null;
  }, 3000);
};

const clearBrowserCache = async () => {
  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    } catch (err) {
      console.error("Error clearing cache:", err);
    }
  }
};

const schedulePost = async () => {
  let captureEl = document.querySelector("#my-node");

  if (!captureEl) {
    showMessage("Player card element not found", "error");
    return;
  }

  try {
    isPosting.value = true;
    postButtonText.value = "Converting Image...";

    // Clear any existing cache first
    await clearBrowserCache();

    // Force reload images
    const images = captureEl.getElementsByTagName("img");
    for (let img of images) {
      const currentSrc = img.src;
      img.src = currentSrc + "?t=" + Date.now();
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const playerName = selectedPlayerData.value?.web_name
      ? selectedPlayerData.value.web_name.replace(/\s+/g, "_").toLowerCase()
      : "player";
    const fileName = `${playerName}-${Date.now()}.png`;

    const blob = await convertImage(captureEl);
    if (!blob) {
      throw new Error("Failed to generate image");
    }

    postButtonText.value = "Uploading to Cloudinary...";
    const public_url = await uploadToCloudinary(blob, fileName);

    postButtonText.value = "Scheduling Post...";
    const res = await sendImageToWebhook(caption.value, public_url);
    console.log("res", res);

    showMessage("Post scheduled successfully!");

    // Clear cache again after successful post
    await clearBrowserCache();
  } catch (error) {
    console.error("Schedule post error:", error);
    showMessage(error.message || "Failed to schedule post", "error");
  } finally {
    isPosting.value = false;
    postButtonText.value = "Schedule Insta Post";
  }
};

// Update sendImageToWebhook to remove alert
const sendImageToWebhook = async (caption, image_url) => {
  const webhookUrl = useRuntimeConfig().public.MAKE_WEBHOOK_URL;

  try {
    const params = new URLSearchParams({ caption, image_url }).toString();
    let url = `${webhookUrl}?${params}`;
    return await $fetch(url, { method: "GET" });
  } catch (error) {
    console.log(error);
    throw new Error("Failed to send to make.com");
  }
};

const convertImage = async (elementToCapture) => {
  try {
    // Add cache busting to image URLs
    const images = elementToCapture.getElementsByTagName("img");
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      img.src = img.src + "?t=" + Date.now();
      return new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
    });

    await Promise.all(imagePromises);

    // Then convert external images to proxy
    await convertExternalImagesToProxy(elementToCapture);

    // Additional safety delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const dataUrl = await toPng(elementToCapture, {
      canvasWidth: 1080,
      canvasHeight: 1080,
      pixelRatio: 2,
      cacheBust: true,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#000000",
      style: {
        transform: "none",
        overflow: "hidden",
        width: "1080px",
        height: "1080px",
        position: "absolute",
        top: "0",
        left: "0",
      },
      filter: (node) => {
        if (node.tagName === "IMG") {
          console.log("📷 Capturing image:", node.src);
          // Ensure image is loaded
          if (!node.complete) {
            console.warn("Image not loaded:", node.src);
          }
        }
        return true;
      },
      cacheBust: true, // Add cache busting to prevent image caching issues
    });

    if (!dataUrl) {
      throw new Error("Failed to generate image data URL");
    }

    const blob = await fetch(dataUrl).then((r) => r.blob());
    return blob;
  } catch (error) {
    console.error("Convert image error:", error);
    return null;
  }
};

const uploadToCloudinary = async (blobData, fileName) => {
  const url = useRuntimeConfig().public.CLOUDINARY_UPLOAD_URL;
  console.log("url", url);

  const formData = new FormData();
  formData.append("file", blobData, fileName);
  formData.append("upload_preset", "fpl-preset"); // your unsigned preset name
  formData.append("folder", "fpl-posts"); // optional

  try {
    // Upload to Cloudinary
    const response = await fetch(url, { method: "POST", body: formData });

    // Get the public URL
    const data = await response.json();

    console.log("cloudinary", data);
    return data.secure_url;
  } catch (error) {
    console.error(error);
    return error;
  }
};

watchEffect(async () => {
  if (selectedPlayerData.value) {
    console.log("id", selectedPlayerData.value.id);

    let playerId = selectedPlayerData.value.id;
    player.value = await $fetch(`/api/players/${playerId}`);
    teams.value = data.value.teams;
  }
});

// Usage: const pairs = selectPairsOnly(playersArray, { minMinutes: 270, minChance: 75, costBand: 1, maxPairsPerPos: 4 });

function selectPairsOnly(players, opts = {}) {
  const cfg = {
    minMinutes: 270,
    minChance: 75,
    costBand: 1,
    maxPairsPerPos: 4,
    ...opts,
  };

  const pos = (p) =>
    ({ 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" }[p.element_type] || "MID");
  const num = (v) =>
    v == null || v === "" ? 0 : typeof v === "number" ? v : parseFloat(v);
  const inv = (v) => 1 - v;

  const fieldsByPos = {
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

  // Filter availability / minutes
  const pool = players.filter(
    (p) =>
      p &&
      p.status === "a" &&
      num(p.minutes) >= cfg.minMinutes &&
      (p.chance_of_playing_next_round == null ||
        num(p.chance_of_playing_next_round) >= cfg.minChance)
  );

  // Build normalization ranges per metric (min-max) from pool
  const allFields = new Set();
  Object.values(fieldsByPos)
    .flat()
    .forEach((f) => allFields.add(f));
  allFields.add("selected_by_percent");
  const ranges = {};
  for (const f of allFields) {
    const arr = pool.map((p) => num(p[f]));
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    ranges[f] = { min, span: max - min || 1 };
  }
  const norm = (f, v) => (num(v) - ranges[f].min) / ranges[f].span;

  // Vector for pair comparison
  function vecForPairs(p) {
    const position = pos(p);
    const key = {
      FWD: "PAIRS_FWD",
      MID: "PAIRS_MID",
      DEF: "PAIRS_DEF",
      GK: "PAIRS_GK",
    }[position];
    const ks = fieldsByPos[key];
    return ks.map((k) =>
      k === "goals_conceded_per_90" ? inv(norm(k, p[k])) : norm(k, p[k])
    );
  }

  // group by position
  const scored = pool.map((p) => ({
    ...p,
    __pos: pos(p),
    __cost: num(p.now_cost),
  }));
  const byPos = {
    FWD: scored.filter((p) => p.__pos === "FWD"),
    MID: scored.filter((p) => p.__pos === "MID"),
    DEF: scored.filter((p) => p.__pos === "DEF"),
    GK: scored.filter((p) => p.__pos === "GK"),
  };

  function cosineDist(a, b) {
    let dot = 0,
      na = 0,
      nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
    return 1 - dot / denom;
  }

  function contrastFactor(p, q) {
    const keys = [
      "goals_scored",
      "assists",
      "expected_goal_involvements",
      "tackles",
      "clean_sheets",
      "saves",
      "threat",
      "creativity",
    ];
    let c = 0;
    for (const k of keys) {
      if (!(k in p) || !(k in q)) continue;
      const diff = Math.abs(norm(k, p[k]) - norm(k, q[k]));
      c = Math.max(c, diff);
    }
    return c;
  }

  function makePairs(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i],
          b = list[j];
        if (Math.abs(a.__cost - b.__cost) > cfg.costBand) continue;
        const va = vecForPairs(a),
          vb = vecForPairs(b);
        const dist = cosineDist(va, vb);
        const availability =
          Math.min(
            a.chance_of_playing_next_round ?? 100,
            b.chance_of_playing_next_round ?? 100
          ) / 100;
        const contrast = contrastFactor(a, b);
        const ownershipGap =
          Math.abs(num(a.selected_by_percent) - num(b.selected_by_percent)) /
          100;
        const pairScore =
          (1 - dist) * (0.6 * contrast + 0.4 * ownershipGap) * availability;
        out.push({ a, b, dist, contrast, ownershipGap, pairScore });
      }
    }
    out.sort((x, y) => y.pairScore - x.pairScore);
    return out.slice(0, cfg.maxPairsPerPos);
  }

  const pairsRaw = {
    FWD: makePairs(byPos.FWD),
    MID: makePairs(byPos.MID),
    DEF: makePairs(byPos.DEF),
    GK: makePairs(byPos.GK),
  };

  // Slim payload
  const pairs = Object.fromEntries(
    Object.entries(pairsRaw).map(([k, arr]) => [
      k,
      arr.map(({ a, b, pairScore, contrast, ownershipGap }) => ({
        // a: {
        //   id: a.id,
        //   name: a.web_name,
        //   cost: a.__cost,
        //   sel: num(a.selected_by_percent),
        //   ppg: num(a.points_per_game),
        //   form: num(a.form),
        // },
        // b: {
        //   id: b.id,
        //   name: b.web_name,
        //   cost: b.__cost,
        //   sel: num(b.selected_by_percent),
        //   ppg: num(b.points_per_game),
        //   form: num(b.form),
        // },
        a: a,
        b: b,
        pairScore: +pairScore.toFixed(4),
        contrast: +contrast.toFixed(3),
        ownershipGap: +ownershipGap.toFixed(3),
      })),
    ])
  );

  return pairs;
}

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

// async function sendImageToWebhook(caption, image_url) {
//   const webhookUrl = useRuntimeConfig().public.MAKE_WEBHOOK_URL;

//   try {
//     const params = new URLSearchParams({ caption, image_url }).toString();
//     let url = `${webhookUrl}?${params}`;
//     await $fetch(url, {
//       method: "GET",
//     });
//   } catch (error) {
//     console.log(error);
//     throw new Error("Failed to send to make.com");
//   }
// }

// Helper function to convert external image URLs to use our proxy
const convertExternalImagesToProxy = async (element) => {
  const images = element.querySelectorAll("img");
  const promises = [];

  images.forEach((img) => {
    const src = img.src || img.getAttribute("src");
    if (
      src &&
      src.startsWith("http") &&
      !src.startsWith(window.location.origin)
    ) {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;

      // Create a promise that resolves when the image loads
      const imagePromise = new Promise((resolve, reject) => {
        const newImg = new Image();
        newImg.crossOrigin = "anonymous";
        newImg.onload = () => {
          img.src = proxyUrl;
          resolve();
        };
        newImg.onerror = () => {
          console.warn("Failed to load image:", proxyUrl);
          resolve(); // Continue even if image fails to load
        };
        newImg.src = proxyUrl;
      });

      promises.push(imagePromise);
    }
  });

  // Wait for all images to load
  await Promise.all(promises);

  // Additional wait to ensure DOM is updated
  await new Promise((resolve) => setTimeout(resolve, 500));
};
</script>
