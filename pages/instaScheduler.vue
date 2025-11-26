<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Instagram Scheduler</h1>
        <p class="mt-2 text-gray-600">Generate and schedule Instagram posts for FPL players and comparisons.</p>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input v-model="searchQuery" type="text" placeholder="Search players..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>

          <div class="w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <select v-model="selectedPosition"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white">
              <option value="">All Positions</option>
              <option value="GK">Goalkeeper</option>
              <option value="DEF">Defender</option>
              <option value="MID">Midfielder</option>
              <option value="FWD">Forward</option>
            </select>
          </div>

          <div class="w-48">
            <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select v-model="sortBy"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white">
              <option value="score">Sort by Score</option>
              <option value="form">Sort by Form</option>
              <option value="cost">Sort by Price</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <!-- Left Column: Player Selection -->
        <div class="lg:col-span-12 space-y-12">

          <!-- AI Recommendations Section -->
          <section v-if="smartRecommendations.length > 0">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                ✨ AI Smart Picks
                <span class="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">Beta</span>
              </h2>
              <span class="text-sm text-gray-500">Curated weekly selections</span>
            </div>

            <AppCarousel class="py-4">
              <SchedulerPlayerCard v-for="item in smartRecommendations" :key="item.id" :player="item" :data="data.teams"
                :label="item.recommendationType"
                class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 snap-start cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                @selected="getPreview($event)" />
            </AppCarousel>
          </section>

          <!-- Single Player Section -->
          <section>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-900">Recommended Players</h2>
              <span class="text-sm text-gray-500">Select a player to preview</span>
            </div>

            <AppCarousel class="py-4">
              <SchedulerPlayerCard v-for="item in recommendedPlayersNew" :key="item.id" :player="item"
                :data="data.teams"
                class="flex-shrink-0 w-64 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                @selected="getPreview($event)" />
            </AppCarousel>

            <!-- Single Player Preview & Action Area -->
            <div v-if="selectedPlayerData"
              class="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Preview -->
                <div class="flex flex-col items-center">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                  <div
                    class="relative w-full overflow-x-auto flex justify-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <InstaPlayerCard :player="selectedPlayerData"
                      :team="getTeamInfo(selectedPlayerData.team_code, data.teams)?.name || ''"
                      :upcoming="player?.fixtures.slice(0, 5)" :gameweek="data.currentGameweek"
                      :key="selectedPlayerData.web_name" ref="playerCard" id="my-node" />
                  </div>
                </div>

                <!-- Controls -->
                <div class="flex flex-col space-y-6">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Caption</h3>
                    <p class="text-sm text-gray-500 mb-2">AI-generated caption for your post.</p>
                    <div
                      class="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[11rem] text-sm text-gray-700 whitespace-pre-wrap">
                      {{ caption || 'Generating caption...' }}
                    </div>
                  </div>

                  <div class="space-y-3 pt-4 border-t border-gray-100">
                    <button @click="schedulePost" :disabled="isPosting"
                      class="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                      <span v-if="isPosting" class="flex items-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                          fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                          </circle>
                          <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                          </path>
                        </svg>
                        {{ postButtonText }}
                      </span>
                      <span v-else>Schedule Post</span>
                    </button>
                    <p class="text-xs text-center text-gray-500">
                      This will generate the image and schedule it to Instagram.
                    </p>

                    <button @click="automatePostCreation" :disabled="isAutomating"
                      class="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <span v-if="isAutomating" class="flex items-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg"
                          fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                          </circle>
                          <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                          </path>
                        </svg>
                        {{ automateButtonText }}
                      </span>
                      <span v-else>Automate Random Post</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Comparisons Section -->
          <section class="pt-8 border-t border-gray-200">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-900">Player Comparisons</h2>
              <span class="text-sm text-gray-500">Select a pair to compare</span>
            </div>

            <AppCarousel class="py-4">
              <SchedulerPlayerComparisonCard v-for="(pair, index) in comparisonPairs" :key="index" :player1="pair.a"
                :player2="pair.b" :data="data"
                class="flex-shrink-0 w-[42rem] h-96 rounded-lg bg-gradient-to-br from-slate-100 to-slate-300 snap-start cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                @selected="getComparisonPreview(pair)" />
            </AppCarousel>

            <!-- Comparison Preview & Action Area -->
            <div v-if="selectedComparisonData"
              class="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <!-- Preview -->
                <div class="flex flex-col items-center">
                  <h3 class="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                  <div
                    class="relative w-full overflow-x-auto flex justify-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <InstaPlayerComparison :player1="selectedComparisonData.a" :player2="selectedComparisonData.b"
                      :data="data" id="player-comparison" />
                  </div>
                </div>

                <!-- Controls -->
                <div class="flex flex-col space-y-6">
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Caption</h3>
                    <p class="text-sm text-gray-500 mb-2">AI-generated caption for your comparison post.</p>
                    <div
                      class="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[11rem] text-sm text-gray-700 whitespace-pre-wrap">
                      {{ caption || 'Generating caption...' }}
                    </div>
                  </div>

                  <div class="space-y-3 pt-4 border-t border-gray-100">
                    <button @click="scheduleComparisonPost" :disabled="isComparisonPosting"
                      class="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
                      <span v-if="isComparisonPosting" class="flex items-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                          fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                          </circle>
                          <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                          </path>
                        </svg>
                        {{ postComparisonButtonText }}
                      </span>
                      <span v-else>Schedule Comparison Post</span>
                    </button>
                    <p class="text-xs text-center text-gray-500">
                      This will generate the comparison image and schedule it to Instagram.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <!-- Status Message Toast -->
      <Transition enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-y-2 opacity-0" enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in" leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-2 opacity-0">
        <div v-if="statusMessage" :class="[
          'fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-medium z-50 flex items-center gap-2',
          statusMessage.type === 'error' ? 'bg-red-600' : 'bg-green-600',
        ]">
          <span v-if="statusMessage.type === 'success'">✓</span>
          <span v-else>!</span>
          {{ statusMessage.text }}
        </div>
      </Transition>
    </div>
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
const selectedComparisonData = ref();
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

const smartRecommendations = computed(() => {
  if (!data.value?.players) return [];
  return getSmartRecommendations(data.value.players);
});

const comparisonPairs = computed(() => {
  if (!data.value?.players) return [];
  const pairsByPosition = selectPairsOnly(data.value.players);
  // Flatten the pairs from all positions into a single array
  return Object.values(pairsByPosition).flat();
});

const getPreview = async (playerData) => {
  // Clear any existing cache first
  await clearBrowserCache();

  selectedComparisonData.value = null;
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

const getComparisonPreview = async (pair) => {
  // Clear any existing cache first
  await clearBrowserCache();

  selectedPlayerData.value = null;
  selectedComparisonData.value = pair;
  console.log("pair", pair);

  // Reset the player card to ensure clean state
  await nextTick();

  caption.value = (await getInstaComparisonCaption(pair)) || "";

  // Force a fresh load of images
  await nextTick();
  const previewEl = document.querySelector("#player-comparison");
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

const getInstaComparisonCaption = async (pair) => {
  try {
    const res = await $fetch("/api/get-response", {
      method: "POST",
      body: JSON.stringify({ prompt: `Write an instagram caption comparing two football players for fantasy football. Player 1: ${pair.a.web_name}. Player 2: ${pair.b.web_name}. Here is the data for player 1: ${JSON.stringify(extractPlayerSummary(pair.a))}. Here is the data for player 2: ${JSON.stringify(extractPlayerSummary(pair.b))}` }),
      headers: { "Content-Type": "application/json" },
    });
    console.log("caption", res);
    return res.output;
  } catch (error) {
    console.log("getInstaComparisonCaption: Error - ", error);
  }
};

const isPosting = ref(false);
const isComparisonPosting = ref(false);
const isAutomating = ref(false);
const postButtonText = ref("Schedule Insta Post");
const postComparisonButtonText = ref("Schedule ComparisonInsta Post");
const automateButtonText = ref("Automate Insta Post");
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

const scheduleComparisonPost = async () => {
  let captureEl = document.querySelector("#player-comparison");

  if (!captureEl) {
    showMessage("Player card element not found", "error");
    return;
  }

  try {
    isComparisonPosting.value = true;
    postComparisonButtonText.value = "Converting Image...";

    // Clear any existing cache first
    await clearBrowserCache();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const comparisonName = selectedComparisonData.value?.a.web_name && selectedComparisonData.value?.b.web_name
      ? `${selectedComparisonData.value.a.web_name}_vs_${selectedComparisonData.value.b.web_name}`.replace(/\s+/g, "_").toLowerCase()
      : "comparison";
    const fileName = `${comparisonName}-${Date.now()}.png`;

    const blob = await convertImage(captureEl);
    if (!blob) {
      throw new Error("Failed to generate image");
    }

    postComparisonButtonText.value = "Uploading to Cloudinary...";
    const public_url = await uploadToCloudinary(blob, fileName);

    postComparisonButtonText.value = "Scheduling Post...";
    const res = await sendImageToWebhook(caption.value, public_url);
    console.log("res", res);

    showMessage("Post scheduled successfully!");

    // Clear cache again after successful post
    await clearBrowserCache();
  } catch (error) {
    console.error("Schedule post error:", error);
    showMessage(error.message || "Failed to schedule post", "error");
  } finally {
    isComparisonPosting.value = false;
    postComparisonButtonText.value = "Schedule Comparison Insta Post";
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
    // Then convert external images to proxy
    const cleanup = await convertExternalImagesToProxy(elementToCapture);

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
      fetchRequest: {
        cache: 'no-store'
      },
      cacheBust: true, // Add cache busting to prevent image caching issues
    });

    if (!dataUrl) {
      throw new Error("Failed to generate image data URL");
    }

    const blob = await fetch(dataUrl).then((r) => r.blob());

    // Restore original images
    if (cleanup) cleanup();

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

const automatePostCreation = async () => {
  isAutomating.value = true;
  automateButtonText.value = "Automating...";
  try {
    // Select a random player from the recommended players
    if (!recommendedPlayersNew.value || recommendedPlayersNew.value.length === 0) {
      showMessage("No players available for automation.", "error");
      return;
    }
    const randomIndex = Math.floor(Math.random() * recommendedPlayersNew.value.length);
    const playerToAutomate = recommendedPlayersNew.value[randomIndex];

    // Trigger the preview and then schedule the post
    await getPreview(playerToAutomate);
    await schedulePost();
    showMessage("Automated post created successfully!");
  } catch (error) {
    console.error("Automate post creation error:", error);
    showMessage(error.message || "Failed to automate post creation", "error");
  } finally {
    isAutomating.value = false;
    automateButtonText.value = "Automate Insta Post";
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
    costBand: 1, // absolute band in price units (change to percent if you prefer)
    maxPairsPerPos: 4,
    allowSameTeam: false,
    preferComplementary: false, // if true, reward contrast more; if false, reward similarity more
    weights: {
      similarity: 0.35,
      contrast: 0.25,
      individualQuality: 0.25, // average of forms/ppg
      ownershipGap: 0.10,
      availability: 0.05,
    },
    winsorPct: 0.02, // clip extremes at 2%
    minRangeSpanFallback: 1,
    ...opts,
  };

  const pos = (p) =>
    ({ 1: "GK", 2: "DEF", 3: "MID", 4: "FWD" }[p.element_type] || "MID");
  const num = (v) =>
    v == null || v === "" ? 0 : typeof v === "number" ? v : parseFloat(v);
  const inv = (v) => 1 - v;

  const fieldsByPos = {
    PAIRS_FWD: ["goals_scored", "assists", "expected_goals", "expected_goal_involvements", "form", "now_cost", "points_per_game"],
    PAIRS_MID: ["goals_scored", "assists", "expected_goal_involvements", "creativity", "form", "now_cost", "points_per_game"],
    PAIRS_DEF: ["clean_sheets", "tackles", "clearances_blocks_interceptions", "threat", "form", "now_cost", "points_per_game"],
    PAIRS_GK: ["clean_sheets", "saves", "goals_conceded_per_90", "form", "now_cost", "points_per_game"],
  };

  // 1) availability & minutes filter
  const pool = players.filter(
    (p) =>
      p &&
      p.status === "a" &&
      num(p.minutes) >= cfg.minMinutes &&
      (p.chance_of_playing_next_round == null ||
        num(p.chance_of_playing_next_round) >= cfg.minChance)
  );

  // 2) get fields list & compute robust min/max (winsorized)
  const allFields = new Set();
  Object.values(fieldsByPos).flat().forEach((f) => allFields.add(f));
  allFields.add("selected_by_percent");
  allFields.add("form");
  allFields.add("points_per_game");

  // helper to compute winsorized min/max
  function winsorizeVals(arr, pct) {
    const sorted = arr.slice().sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) return { min: 0, max: 1 };
    const loIdx = Math.floor(n * pct);
    const hiIdx = Math.ceil(n * (1 - pct)) - 1;
    const min = sorted[loIdx];
    const max = sorted[hiIdx];
    return { min, max };
  }

  const ranges = {};
  for (const f of allFields) {
    const arr = pool.map((p) => num(p[f]));
    const { min, max } = winsorizeVals(arr, cfg.winsorPct);
    const span = (max - min) || cfg.minRangeSpanFallback;
    ranges[f] = { min, span };
  }
  const norm = (f, v) => (num(v) - ranges[f].min) / ranges[f].span;

  // 3) vector builder (mix of metrics + ppg/form)
  function vecForPairs(p) {
    const position = pos(p);
    const key = { FWD: "PAIRS_FWD", MID: "PAIRS_MID", DEF: "PAIRS_DEF", GK: "PAIRS_GK" }[position];
    const ks = fieldsByPos[key];
    return ks.map((k) => {
      if (k === "goals_conceded_per_90") return inv(norm(k, p[k]));
      return norm(k, p[k]);
    });
  }

  // 4) helper distance & similarity
  function cosineSimilarity(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
    return dot / denom; // similarity in [-1..1] but mostly [0..1]
  }
  function cosineDist(a, b) { return 1 - cosineSimilarity(a, b); }

  // 5) contrast factor (complementarity)
  const contrastKeys = ["goals_scored", "assists", "expected_goal_involvements", "tackles", "clean_sheets", "saves", "threat", "creativity", "points_per_game"];
  function contrastFactor(p, q) {
    let maxDiff = 0;
    for (const k of contrastKeys) {
      if (!(k in p) || !(k in q)) continue;
      const diff = Math.abs(norm(k, p[k]) - norm(k, q[k]));
      maxDiff = Math.max(maxDiff, diff);
    }
    return maxDiff; // 0..1
  }

  // 6) build scored lists per pos
  const scored = pool.map((p) => ({
    ...p,
    __pos: pos(p),
    __cost: num(p.now_cost),
    __vec: vecForPairs(p),
    __form: norm("form", p.form || 0),
    __ppg: norm("points_per_game", p.points_per_game || 0),
    __sel: num(p.selected_by_percent || 0) / 100,
  }));

  const byPos = { FWD: [], MID: [], DEF: [], GK: [] };
  for (const p of scored) byPos[p.__pos].push(p);

  // optional: sort within pos by quality to speed pairing
  for (const k of Object.keys(byPos)) {
    byPos[k].sort((a, b) => (b.__form + b.__ppg) - (a.__form + a.__ppg));
  }

  // 7) scoring function for a pair
  function scorePair(a, b) {
    // similarity (higher=closer), contrast (higher=more complementary)
    const sim = cosineSimilarity(a.__vec, b.__vec); // typo safe check below
  }

  // 7b) implement makePairs with configurable formula
  function makePairs(list) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];

        // cost band (allow relative band based on avg cost if cfg.costBand < 1 treat as fraction)
        if (cfg.costBand >= 1) {
          if (Math.abs(a.__cost - b.__cost) > cfg.costBand) continue;
        } else {
          const avg = (a.__cost + b.__cost) / 2 || 1;
          if (Math.abs(a.__cost - b.__cost) / avg > cfg.costBand) continue;
        }

        // same team penalty / skip
        if (!cfg.allowSameTeam && a.team && b.team && a.team === b.team) continue;

        const sim = cosineSimilarity(a.__vec, b.__vec);
        const dist = 1 - sim;
        const contrast = contrastFactor(a, b);
        const availability = Math.min(
          a.chance_of_playing_next_round ?? 100,
          b.chance_of_playing_next_round ?? 100
        ) / 100;

        // individual quality = average of normalized form and ppg (you can change weights)
        const individualQuality = (a.__form + a.__ppg + b.__form + b.__ppg) / 4;

        // ownership gap (big gap -> differential interest)
        const ownershipGap = Math.abs(a.__sel - b.__sel);

        // choose whether we reward similarity or contrast (complementary)
        const simComponent = cfg.preferComplementary ? (1 - contrast) : sim;
        // final composite (tunable weights)
        const w = cfg.weights;
        const comp =
          w.similarity * simComponent +
          w.contrast * contrast +
          w.individualQuality * individualQuality +
          w.ownershipGap * ownershipGap +
          w.availability * availability;

        out.push({
          a, b, sim, dist, contrast, ownershipGap, pairScore: comp,
        });
      }
    }

    // sort & dedupe top results
    out.sort((x, y) => y.pairScore - x.pairScore);

    // ensure diversity: avoid repeating same player across multiple top pairs if requested
    const selected = [];
    const used = new Set();
    for (const p of out) {
      if (selected.length >= cfg.maxPairsPerPos) break;
      const idA = p.a.id ?? p.a.code ?? p.a.web_name;
      const idB = p.b.id ?? p.b.code ?? p.b.web_name;
      // crude de-duplication: avoid reusing a player twice in final set
      if (used.has(idA) || used.has(idB)) continue;
      selected.push(p);
      used.add(idA);
      used.add(idB);
    }

    return selected;
  }

  // run for each pos
  const pairsRaw = {
    FWD: makePairs(byPos.FWD),
    MID: makePairs(byPos.MID),
    DEF: makePairs(byPos.DEF),
    GK: makePairs(byPos.GK),
  };

  // slim payload (keep original objects but add meta)
  const pairs = Object.fromEntries(
    Object.entries(pairsRaw).map(([k, arr]) => [
      k,
      arr.map(({ a, b, pairScore, contrast, ownershipGap, sim }) => ({
        a, b,
        pairScore: +pairScore.toFixed(4),
        contrast: +contrast.toFixed(3),
        sim: +sim.toFixed(3),
        ownershipGap: +ownershipGap.toFixed(3),
      })),
    ])
  );

  return pairs;
}
const convertExternalImagesToProxy = async (element) => {
  const images = element.querySelectorAll("img");
  const promises = [];
  const originalSrcs = new Map();

  images.forEach((img) => {
    const src = img.src || img.getAttribute("src");

    // Skip if already proxied
    if (src && src.includes('/api/proxy-image')) return;

    if (
      src &&
      src.startsWith("http") &&
      !src.startsWith(window.location.origin)
    ) {
      // Store original src for cleanup
      originalSrcs.set(img, src);

      // Add timestamp to proxy URL to prevent caching issues
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}&t=${Date.now()}`;

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

  // Return cleanup function
  return () => {
    originalSrcs.forEach((src, img) => {
      img.src = src;
    });
  };
};
</script>
