<template>
  <div class="min-h-screen bg-[#050816] text-white">
    <div class="mx-auto flex w-full max-w-[100rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-3">
        <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">Instagram builder</p>
        <h1 class="text-4xl font-black leading-[0.95] tracking-[-0.05em] text-balance sm:text-5xl">
          Build a clean Instagram post from live FPL movement.
        </h1>
      </div>

      <div class="grid gap-6 sm:grid-cols-3">
        <!-- LEFT: Player List -->
        <div class="flex h-[calc(100vh-10rem)] sticky top-6 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02]">
          <div class="space-y-4 border-b border-white/10 p-5 shrink-0 bg-white/[0.02]">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-black tracking-[-0.03em]">Trending Players</h2>
              <UBadge color="neutral" variant="soft" class="uppercase tracking-[0.24em] text-[0.55rem]">Live feed</UBadge>
            </div>
            <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Search players" color="neutral" variant="subtle" size="md" :highlight="false" class="w-full" />
            <USelect v-model="sortKey" :items="sortOptions" color="neutral" variant="subtle" size="sm" :highlight="false" class="w-full" />
          </div>
          
          <div class="flex-1 overflow-y-auto p-2 space-y-1">
            <div v-if="filteredMovers.length" class="space-y-1">
              <button v-for="item in filteredMovers" :key="item.player.id" type="button"
                class="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition duration-200"
                :class="item.player.id === selectedMover?.player?.id ? 'border-lime-300/40 bg-lime-300/10' : 'border-transparent hover:bg-white/[0.04]'"
                @click="selectMover(item)">
                <div class="relative flex h-10 w-10 shrink-0 items-end justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(8,12,24,0.12)_40%,rgba(0,0,0,0.95)_100%)] border border-white/10">
                  <img :src="resolveListImage(item.player.code)"
                       :alt="item.player.web_name" class="w-[90%] h-[90%] object-contain object-bottom" @error="handleImageError" />
                </div>
                <div class="min-w-0 flex-1">
                  <h3 class="truncate text-sm font-bold text-white">{{ item.player.web_name }}</h3>
                  <p class="truncate text-xs text-white/50">{{ item.teamName }} · {{ item.positionLabel }}</p>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-sm font-black" :class="item.netMovement >= 0 ? 'text-lime-300' : 'text-rose-300'">
                    {{ formatSigned(item.netMovement) }}
                  </div>
                  <div class="text-[0.55rem] uppercase tracking-[0.2em] text-white/40">Net</div>
                </div>
              </button>
            </div>
            <div v-else class="p-4 text-sm text-white/50 text-center">
              No players found.
            </div>
          </div>
        </div>

        <!-- RIGHT: Workspace -->
        <div class="flex flex-col gap-6 sm:col-span-2" v-if="selectedMover">
          <!-- PREVIEW -->
          <InstagramMovementCard :player="selectedMover.player" :team-name="selectedMover.teamName"
            :gameweek-label="currentGameweekLabel" :total-movement="selectedMover.totalMovement"
            :net-movement="selectedMover.netMovement" :style-config="activeStyleConfig" 
            :layout="selectedLayoutId" id="instagram-card" />
          
            <div class="space-y-4">
              
              <div>
                <p class="text-[0.56rem] font-semibold uppercase tracking-[0.32em] text-white/38">Instagram caption</p>
                <textarea readonly :value="captionText || 'Instagram caption generated.'"
                class="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white/80 outline-none"></textarea>
                
              </div>
              <div class="mt-4 flex flex-col gap-2">
                <UButton color="primary" size="lg" block :loading="isPosting" icon="i-lucide-send" @click="postToInsta">
                  <span v-if="isPosting">{{ postButtonText }}</span>
                  <span v-else>Post to Insta</span>
                </UButton>
              </div>
          </div>
        </div>
      </div>
      <!-- DETAILS & TOOLS -->
      <div class="space-y-6">

  
        <!-- Style Studio -->
        <UCard :ui="cardUi" class="border border-white/10 bg-white/[0.02] text-white rounded-[24px]">
          <div class="p-5 space-y-6">
            <div class="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div class="max-w-md space-y-2">
                <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">Style studio</p>
                <h2 class="text-2xl font-black leading-tight tracking-[-0.05em]">
                  Atmosphere & Layout
                </h2>
              </div>
  
              <div class="flex flex-wrap gap-2">
                <UButton color="neutral" variant="soft" icon="i-lucide-shuffle" @click="shuffleStyleSeed">
                  Shuffle lights
                </UButton>
                <UButton color="neutral" variant="soft" icon="i-lucide-rotate-ccw" @click="resetStyleControls">
                  Reset preset
                </UButton>
              </div>
            </div>
  
            <div class="grid gap-6">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Preset</label>
                  <USelect v-model="selectedStylePresetId" :items="stylePresetOptions" color="neutral" variant="subtle" size="md" :highlight="false" />
                </div>
                <div class="space-y-2">
                  <label class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Save as preset</label>
                  <div class="flex gap-2">
                    <UInput v-model="presetNameDraft" placeholder="Name this style" color="neutral" variant="subtle" size="md" :highlight="false" class="flex-1" />
                    <UButton color="primary" icon="i-lucide-bookmark-plus" @click="saveCurrentPreset">
                      Save
                    </UButton>
                  </div>
                </div>
              </div>
  
              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                    <span>Light drift</span>
                    <span>{{ styleControls.lightSpread }}%</span>
                  </div>
                  <input v-model.number="styleControls.lightSpread" type="range" min="0" max="100" class="w-full accent-lime-300" />
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                    <span>Glow strength</span>
                    <span>{{ styleControls.glowIntensity }}%</span>
                  </div>
                  <input v-model.number="styleControls.glowIntensity" type="range" min="50" max="160" class="w-full accent-sky-300" />
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                    <span>Pattern density</span>
                    <span>{{ styleControls.patternScale }}%</span>
                  </div>
                  <input v-model.number="styleControls.patternScale" type="range" min="70" max="135" class="w-full accent-white" />
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                    <span>Pattern opacity</span>
                    <span>{{ styleControls.patternOpacity }}%</span>
                  </div>
                  <input v-model.number="styleControls.patternOpacity" type="range" min="5" max="85" class="w-full accent-violet-300" />
                </div>
              </div>
  
              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <label class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Layout</label>
                  <USelect v-model="selectedLayoutId" :items="layoutOptions" color="neutral" variant="subtle" size="md" :highlight="false" />
                </div>
                <div class="space-y-2">
                  <label class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Pattern</label>
                  <USelect v-model="styleControls.patternKind" :items="patternKindOptions" color="neutral" variant="subtle" size="md" :highlight="false" />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2">
                  <div class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                    <span>Pattern rotation</span>
                    <span>{{ styleControls.patternRotation }}°</span>
                  </div>
                  <input v-model.number="styleControls.patternRotation" type="range" min="-24" max="24" class="w-full accent-emerald-300" />
                </div>
              </div>
  
            </div>
          </div>
        </UCard>

        
      </div>
    </div>

    <Transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-2 opacity-0">
      <div v-if="statusMessage" :class="[
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-2xl',
        statusMessage.type === 'error' ? 'bg-rose-500 text-white' : 'bg-lime-300 text-black',
      ]">
        <UIcon :name="statusMessage.type === 'error' ? 'i-lucide-circle-alert' : 'i-lucide-check'" class="size-4" />
        {{ statusMessage.text }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import {
  instagramMovementPatternOptions,
  instagramMovementPresets,
  resolveInstagramMovementPreset,
} from '~/composables/useInstagramMovementStyles';

definePageMeta({
  title: 'Instagram',
});

const { data: bootstrap } = await useLazyAsyncData('instagram-bootstrap', () => $fetch('/api/players/get-all'));

const sortKey = ref('interestingScore');
const searchQuery = ref('');
const selectedMoverId = ref(null);
const isPosting = ref(false);
const isGeneratingCaption = ref(false);
const postButtonText = ref('Post to Insta');
const captionText = ref('');
const statusMessage = ref(null);
const localStylePresetKey = 'fantasypl.instagram-movement.presets';
const variationSeed = ref(0);
const selectedStylePresetId = ref(instagramMovementPresets[0].id);
const selectedLayoutId = ref('classic');
const layoutOptions = [
  { label: 'Classic Movement', value: 'classic' },
  { label: 'Minimal Focus', value: 'minimal' },
];
const presetNameDraft = ref('');
const customStylePresets = ref([]);
const resolveListImage = (code) => {
  return `https://images.weserv.nl/?url=ssl:resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png&output=png`;
};

const styleControlsDefaults = {
  lightSpread: 48,
  glowIntensity: 100,
  patternScale: 100,
  patternOpacity: 16,
  patternKind: 'grid',
  patternRotation: 0,
};

const styleControls = reactive({ ...styleControlsDefaults });

const cardUi = {
  body: 'p-0',
  header: 'p-0',
  footer: 'p-0',
  root: 'ring-0 shadow-none',
};

const patternKindOptions = instagramMovementPatternOptions;

const resolveCustomPreset = (presetId) => customStylePresets.value.find((item) => item.id === presetId);

const resolvePresetRecord = (presetId) => resolveCustomPreset(presetId) || instagramMovementPresets.find((item) => item.id === presetId) || instagramMovementPresets[0];

const stylePresetOptions = computed(() => [
  ...instagramMovementPresets.map((preset) => ({ label: preset.name, value: preset.id, description: preset.description })),
  ...customStylePresets.value.map((preset) => ({ label: `${preset.name} · Saved`, value: preset.id, description: preset.description })),
]);

const activePresetMeta = computed(() => resolvePresetRecord(selectedStylePresetId.value));

const activeBasePreset = computed(() => {
  const preset = activePresetMeta.value;

  if (preset?.config?.presetId) {
    return resolveInstagramMovementPreset(preset.config.presetId);
  }

  if (preset?.presetId) {
    return resolveInstagramMovementPreset(preset.presetId);
  }

  return resolveInstagramMovementPreset(selectedStylePresetId.value);
});

const activeStyleConfig = computed(() => ({
  presetId: activeBasePreset.value.id,
  seed: variationSeed.value,
  lightSpread: styleControls.lightSpread,
  glowIntensity: styleControls.glowIntensity,
  patternScale: styleControls.patternScale,
  patternOpacity: styleControls.patternOpacity,
  patternKind: styleControls.patternKind,
  patternRotation: styleControls.patternRotation,
}));

const applyPresetToControls = (presetRecord) => {
  const preset = presetRecord?.config ? presetRecord.config : {
    ...styleControlsDefaults,
    lightSpread: 48,
    patternOpacity: Math.round((presetRecord?.pattern?.opacity || 0.48) * 100),
    patternKind: presetRecord?.pattern?.kind || styleControlsDefaults.patternKind,
    patternRotation: presetRecord?.pattern?.rotation || 0,
  };

  Object.assign(styleControls, {
    ...styleControlsDefaults,
    ...preset,
  });
};

const shuffleStyleSeed = () => {
  if (!process.client) return;

  variationSeed.value = Math.floor(Math.random() * 1_000_000_000);
};

const resetStyleControls = () => {
  applyPresetToControls(activePresetMeta.value);
};

const saveCustomStylePresets = () => {
  if (!process.client) return;

  window.localStorage.setItem(localStylePresetKey, JSON.stringify(customStylePresets.value));
};

const loadCustomStylePresets = () => {
  if (!process.client) return;

  try {
    const raw = window.localStorage.getItem(localStylePresetKey);
    customStylePresets.value = raw ? JSON.parse(raw) : [];
  } catch (error) {
    customStylePresets.value = [];
  }
};

const saveCurrentPreset = () => {
  const name = presetNameDraft.value.trim() || `${activeBasePreset.value.name} Custom`;
  const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

  customStylePresets.value = [
    {
      id,
      name,
      description: `Saved from ${activeBasePreset.value.name}`,
      presetId: activeBasePreset.value.id,
      config: {
        ...styleControls,
      },
    },
    ...customStylePresets.value.filter((item) => item.id !== id),
  ];

  selectedStylePresetId.value = id;
  presetNameDraft.value = '';
  saveCustomStylePresets();
};

watch(selectedStylePresetId, (presetId) => {
  applyPresetToControls(resolvePresetRecord(presetId));
}, { immediate: true });

watch(customStylePresets, () => {
  saveCustomStylePresets();
}, { deep: true });

watch(selectedMoverId, (value, oldValue) => {
  captionText.value = '';

  if (oldValue == null) return;

  shuffleStyleSeed();
});

onMounted(() => {
  loadCustomStylePresets();
  shuffleStyleSeed();
});

const sortOptions = [
  { label: 'Interesting mix', value: 'interestingScore' },
  { label: 'Total movement', value: 'totalMovement' },
  { label: 'Transfers in', value: 'transfersIn' },
  { label: 'Transfers out', value: 'transfersOut' },
  { label: 'Net movement', value: 'netMovement' },
];

const elementTypeMap = {
  1: 'GK',
  2: 'DEF',
  3: 'MID',
  4: 'FWD',
};

const teams = computed(() => bootstrap.value?.teams || []);
const players = computed(() => bootstrap.value?.players || []);
const currentGameweekLabel = computed(() => bootstrap.value?.currentGameweek?.id || 'Current');

const toNumber = (value) => Number(value || 0);

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const normalizeLinear = (value, ceiling) => clamp01(toNumber(value) / ceiling);

const normalizeLog = (value, ceiling) => clamp01(Math.log1p(Math.max(0, toNumber(value))) / Math.log1p(ceiling));

const stableHash = (value) => {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) >>> 0;
  }

  return hash / 0xffffffff;
};

const normalizePlayer = (player) => {
  const transfersIn = toNumber(player.transfers_in_event);
  const transfersOut = toNumber(player.transfers_out_event);
  const totalMovement = transfersIn + transfersOut;
  const netMovement = transfersIn - transfersOut;
  const team = teams.value.find((item) => item.id === player.team);
  const ownershipScore = 1 - normalizeLinear(player.selected_by_percent, 100);
  const formScore = normalizeLinear(player.form, 10);
  const minutesScore = normalizeLog(player.minutes, 3000);
  const pointsScore = normalizeLog(player.total_points, 250);
  const transferScore = normalizeLog(totalMovement, 200);
  const swingScore = normalizeLog(Math.abs(netMovement), 100);
  const availabilityScore = player.status === 'a' ? 1 : player.status === 'd' ? 0.7 : 0.5;
  const rotationScore = stableHash(`${player.id}-${currentGameweekLabel.value}`);

  const interestingScore =
    transferScore * 0.28 +
    swingScore * 0.14 +
    ownershipScore * 0.22 +
    formScore * 0.16 +
    minutesScore * 0.1 +
    pointsScore * 0.06 +
    availabilityScore * 0.02 +
    rotationScore * 0.02;

  return {
    player,
    teamName: team?.name || 'Unknown Team',
    positionLabel: elementTypeMap[player.element_type] || 'Player',
    transfersIn,
    transfersOut,
    totalMovement,
    netMovement,
    interestingScore,
  };
};

const movers = computed(() =>
  [...players.value]
    .map(normalizePlayer)
    .sort((a, b) => b.interestingScore - a.interestingScore || b.totalMovement - a.totalMovement || b.netMovement - a.netMovement)
    .slice(0, 24)
);

const filteredMovers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const list = query
    ? movers.value.filter((item) => {
      const name = `${item.player.first_name} ${item.player.second_name} ${item.player.web_name}`.toLowerCase();
      const team = item.teamName.toLowerCase();
      return name.includes(query) || team.includes(query);
    })
    : movers.value;

  return [...list].sort((a, b) => {
    switch (sortKey.value) {
      case 'interestingScore':
        return b.interestingScore - a.interestingScore || b.totalMovement - a.totalMovement;
      case 'transfersIn':
        return b.transfersIn - a.transfersIn;
      case 'transfersOut':
        return b.transfersOut - a.transfersOut;
      case 'netMovement':
        return b.netMovement - a.netMovement;
      case 'totalMovement':
      default:
        return b.totalMovement - a.totalMovement;
    }
  });
});

const selectedMover = computed(() => {
  if (!filteredMovers.value.length) return null;

  const found = filteredMovers.value.find((item) => item.player.id === selectedMoverId.value);
  return found || filteredMovers.value[0];
});

watch(
  filteredMovers,
  (items) => {
    if (!items.length) {
      selectedMoverId.value = null;
      return;
    }

    if (!items.some((item) => item.player.id === selectedMoverId.value)) {
      selectedMoverId.value = items[0].player.id;
    }
  },
  { immediate: true }
);

const selectMover = (item) => {
  selectedMoverId.value = item.player.id;
};

const selectTopMover = () => {
  if (filteredMovers.value[0]) {
    selectedMoverId.value = filteredMovers.value[0].player.id;
  }
};

const showMessage = (text, type = 'success') => {
  statusMessage.value = { text, type };
  window.setTimeout(() => {
    statusMessage.value = null;
  }, 2500);
};

const uploadToCloudinary = async (blobData, fileName) => {
  const url = useRuntimeConfig().public.CLOUDINARY_UPLOAD_URL;

  if (!url) {
    throw new Error('Cloudinary upload URL is not configured');
  }

  const formData = new FormData();
  formData.append("file", blobData, fileName);
  formData.append("upload_preset", "fpl-preset"); // your unsigned preset name
  formData.append("folder", "fpl-posts"); // optional

  const response = await fetch(url, { method: "POST", body: formData });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || 'Failed to upload image to Cloudinary');
  }

  return data.secure_url;
};

const sendImageToWebhook = async (captionText, imageUrl) => {
  const webhookUrl = useRuntimeConfig().public.MAKE_WEBHOOK_URL;
  const params = new URLSearchParams({
    caption: captionText || '',
    image_url: imageUrl || '',
  }).toString();

  if (webhookUrl && process.client) {
    fetch(`${webhookUrl}?${params}`, {
      method: 'GET',
      mode: 'no-cors',
      keepalive: true,
    }).catch((error) => {
      console.error('Failed to trigger Buffer webhook', error);
    });

    return { success: true, queued: true };
  }

  try {
    return await $fetch('/api/send-buffer-post', {
      method: 'POST',
      body: {
        caption: captionText,
        image_url: imageUrl,
      },
    });
  } catch (error) {
    console.error(error);
    throw new Error('Failed to send post to Buffer');
  }
};

// const buildCaption = (active) => {
//   const movement = formatCompact(active.totalMovement);
//   const net = formatSigned(active.netMovement);

//   return `${active.player.web_name} is trending right now.\n\nTotal movement: ${movement}\nNet movement: ${net}\n\n#FPL #FantasyPremierLeague`;
// };

const getInstaCaption = async (playerData) => {
  try {
    const playerId = playerData?.player?.id ?? playerData?.id;
    if (!playerId) {
      throw new Error('Missing player id for caption generation');
    }

    const playerDetails = await $fetch(`/api/players/${playerId}`);
    const prompt = {
      ...playerData,
      playerDetails,
      upcoming: playerDetails?.fixtures?.slice(0, 5) || [],
    };

    const res = await $fetch("/api/get-response", {
      method: "POST",
      body: JSON.stringify({ prompt }),
      headers: { "Content-Type": "application/json" },
    });

    const output = res?.output?.trim();
    captionText.value = output || buildCaption(prompt);
    // console.log("caption", res);
    return captionText.value;
  } catch (error) {
    console.log("getInstaCaption: Error - ", error);
    captionText.value = buildCaption(playerData);
    return captionText.value;
  }
};

const generateInstaCaption = async () => {
  const active = selectedMover.value;

  if (!active) {
    showMessage('No player available for caption generation.', 'error');
    return;
  }

  try {
    isGeneratingCaption.value = true;
    await getInstaCaption(active);
  } finally {
    isGeneratingCaption.value = false;
  }
};

const postToInsta = async () => {
  const active = selectedMover.value;
  if (!active) {
    showMessage('No player available to post.', 'error');
    return;
  }

  const img = document.getElementById('instagram-card');
  if (!img || !img.src || !img.src.startsWith('data:')) {
    showMessage('Instagram card preview not ready.', 'error');
    return;
  }

  try {
    isPosting.value = true;
    postButtonText.value = 'Preparing image...';

    const blob = await fetch(img.src).then((res) => res.blob());

    if (!blob) {
      throw new Error('Failed to generate image blob');
    }

    postButtonText.value = 'Uploading image...';
    const fileName = `instagram-${active.player.web_name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
    const publicUrl = await uploadToCloudinary(blob, fileName);
    if (!publicUrl) {
      throw new Error('Failed to upload image');
    }

    postButtonText.value = 'Posting to Buffer...';
    const caption = captionText.value || await getInstaCaption(active);
    await sendImageToWebhook(caption, publicUrl);

    showMessage('Post sent to Buffer.');
  } catch (error) {
    console.error('Failed to post Instagram image', error);
    showMessage(error.message || 'Post failed. Check image CORS or webhook settings.', 'error');
  } finally {
    isPosting.value = false;
    postButtonText.value = 'Post to Insta';
  }
};

const formatCompact = (value) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0));

const formatPercent = (value) => {
  const number = Number(value || 0);
  return `${number % 1 === 0 ? number.toFixed(0) : number.toFixed(1)}%`;
};

const formatSigned = (value) => {
  const number = Number(value || 0);
  const formatted = formatCompact(Math.abs(number));

  if (number > 0) return `+${formatted}`;
  if (number < 0) return `-${formatted}`;
  return formatted;
};

const formatInterestScore = (value) => `${Math.round(clamp01(Number(value || 0)) * 100)}%`;

const handleImageError = (event) => {
  const target = event?.target;

  if (!target) return;

  target.onerror = null;
  target.src = '/fallback.png';
};
</script>
