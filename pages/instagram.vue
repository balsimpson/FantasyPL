<template>
  <div class="min-h-screen bg-[#050816] text-white">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <section class="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <UCard :ui="cardUi" class="overflow-hidden border border-white/10 bg-white/[0.03] text-white">
          <div class="space-y-6">
            <div class="space-y-3">
              <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">
                Instagram builder
              </p>
              <h1 class="text-4xl font-black leading-[0.95] tracking-[-0.05em] text-balance sm:text-6xl">
                Build a clean Instagram post from live FPL movement.
              </h1>
            </div>

            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Players</p>
                <p class="mt-2 text-3xl font-black tracking-[-0.04em]">{{ movers.length }}</p>
              </div>
              <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Interest score</p>
                <p class="mt-2 text-3xl font-black tracking-[-0.04em] text-lime-300">
                  {{ selectedMover ? formatInterestScore(selectedMover.interestingScore) : '—' }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <UButton color="primary" size="md" :loading="isPosting" icon="i-lucide-send" @click="postToInsta">
                <span v-if="isPosting">{{ postButtonText }}</span>
                <span v-else>Post to Insta</span>
              </UButton>
              <UButton color="neutral" variant="soft" size="md" icon="i-lucide-rotate-ccw" @click="selectTopMover">
                Reset to top pick
              </UButton>
            </div>

            <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <div class="mb-3 flex items-center justify-between">
                <p class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Sort picks</p>
                <UBadge color="neutral" variant="soft" class="uppercase tracking-[0.24em]">Live feed</UBadge>
              </div>
              <USelect v-model="sortKey" :items="sortOptions" color="neutral" variant="subtle" size="md"
                :highlight="false" class="w-full" />
            </div>
          </div>
        </UCard>

        <div class="space-y-4">
          <div class="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div class="max-w-2xl">
              <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">
                Interesting players
              </p>
              <h2 class="mt-2 text-3xl font-black leading-none tracking-[-0.05em] sm:text-5xl">
                Choose a player and export the post
              </h2>
            </div>

            <div class="w-full max-w-xs">
              <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Search players" color="neutral"
                variant="subtle" size="md" :highlight="false" />
            </div>
          </div>

          <div v-if="filteredMovers.length" class="max-h-[42rem] overflow-y-auto pr-2">
            <div class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              <button v-for="item in filteredMovers" :key="item.player.id" type="button" class="group h-full text-left"
                @click="selectMover(item)">
                <UCard :ui="cardUi" class="h-full overflow-hidden border transition duration-200"
                  :class="item.player.id === selectedMover?.player?.id ? 'border-lime-300/40 bg-lime-300/10 shadow-[0_18px_40px_rgba(190,255,84,0.08)]' : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'">
                  <div class="space-y-4 p-5">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <div
                            class="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/20">
                            <img
                              :src="`https://resources.premierleague.com/premierleague/badges/t${item.player.team_code}.png`"
                              :alt="item.teamName" class="h-5 w-5 object-contain" />
                          </div>
                          <UBadge color="neutral" variant="soft">
                            {{ item.teamName }}
                          </UBadge>
                        </div>
                        <h3 class="mt-3 truncate text-2xl font-black tracking-[-0.04em] text-white">
                          {{ item.player.web_name }}
                        </h3>
                        <p class="mt-1 text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-white/45">
                          {{ item.positionLabel }}
                        </p>
                      </div>

                      <div class="h-16 w-16 shrink-0 rounded-2xl border border-white/10 bg-black/20 p-2">
                        <img
                          :src="`https://resources.premierleague.com/premierleague/badges/t${item.player.team_code}.png`"
                          :alt="item.teamName" class="h-full w-full object-contain" />
                      </div>
                    </div>

                    <div class="grid grid-cols-3 gap-2">
                      <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center">
                        <div class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-white/40">In</div>
                        <div class="mt-1 text-xl font-black tracking-[-0.04em] text-lime-300">
                          {{ formatCompact(item.transfersIn) }}
                        </div>
                      </div>
                      <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center">
                        <div class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-white/40">Out</div>
                        <div class="mt-1 text-xl font-black tracking-[-0.04em] text-sky-300">
                          {{ formatCompact(item.transfersOut) }}
                        </div>
                      </div>
                      <div class="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-center">
                        <div class="text-[0.54rem] font-semibold uppercase tracking-[0.28em] text-white/40">Net</div>
                        <div class="mt-1 text-xl font-black tracking-[-0.04em]"
                          :class="item.netMovement >= 0 ? 'text-lime-300' : 'text-rose-300'">
                          {{ formatSigned(item.netMovement) }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between border-t border-white/10 pt-3 text-sm text-white/55">
                      <span>Total movement</span>
                      <span class="font-black text-lime-300">{{ formatCompact(item.totalMovement) }}</span>
                    </div>
                  </div>
                </UCard>
              </button>
            </div>
          </div>

          <div v-else class="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
            No players matched this filter.
          </div>
        </div>
      </section>

      <section v-if="selectedMover" class="rounded-[36px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div class="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div class="max-w-2xl space-y-2">
            <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">Style studio</p>
            <h2 class="text-2xl font-black leading-tight tracking-[-0.05em] sm:text-3xl">
              Keep the layout, change the atmosphere.
            </h2>
            <p class="text-sm text-white/55">
              Tweak the preset, shuffle the glow positions, and save the result as a reusable style.
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton color="neutral" variant="soft" icon="i-lucide-shuffle" @click="shuffleStyleSeed">
              Shuffle lights
            </UButton>
            <UButton color="neutral" variant="soft" icon="i-lucide-rotate-ccw" @click="resetStyleControls">
              Reset preset
            </UButton>
            <UButton color="neutral" variant="soft" icon="i-lucide-file-text" :loading="isGeneratingCaption"
              @click="generateInstaCaption">
              Generate caption
            </UButton>
            <UButton color="primary" icon="i-lucide-bookmark-plus" @click="saveCurrentPreset">
              Save preset
            </UButton>
          </div>
        </div>

        <div class="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <label class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Preset</label>
                <USelect v-model="selectedStylePresetId" :items="stylePresetOptions" color="neutral" variant="subtle"
                  size="md" :highlight="false" />
              </div>
              <div class="space-y-2">
                <label class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Preset name</label>
                <UInput v-model="presetNameDraft" placeholder="Name this style" color="neutral" variant="subtle"
                  size="md" :highlight="false" />
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div class="space-y-2">
                <div
                  class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                  <span>Light drift</span>
                  <span>{{ styleControls.lightSpread }}%</span>
                </div>
                <input v-model.number="styleControls.lightSpread" type="range" min="0" max="100"
                  class="w-full accent-lime-300" />
              </div>
              <div class="space-y-2">
                <div
                  class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                  <span>Glow strength</span>
                  <span>{{ styleControls.glowIntensity }}%</span>
                </div>
                <input v-model.number="styleControls.glowIntensity" type="range" min="50" max="160"
                  class="w-full accent-sky-300" />
              </div>
              <div class="space-y-2">
                <div
                  class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                  <span>Pattern density</span>
                  <span>{{ styleControls.patternScale }}%</span>
                </div>
                <input v-model.number="styleControls.patternScale" type="range" min="70" max="135"
                  class="w-full accent-white" />
              </div>
              <div class="space-y-2">
                <div
                  class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                  <span>Pattern opacity</span>
                  <span>{{ styleControls.patternOpacity }}%</span>
                </div>
                <input v-model.number="styleControls.patternOpacity" type="range" min="5" max="85"
                  class="w-full accent-violet-300" />
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <label class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Pattern</label>
                <USelect v-model="styleControls.patternKind" :items="patternKindOptions" color="neutral"
                  variant="subtle" size="md" :highlight="false" />
              </div>
              <div class="space-y-2">
                <div
                  class="flex items-center justify-between text-[0.56rem] font-semibold uppercase tracking-[0.3em] text-white/40">
                  <span>Pattern rotation</span>
                  <span>{{ styleControls.patternRotation }}°</span>
                </div>
                <input v-model.number="styleControls.patternRotation" type="range" min="-24" max="24"
                  class="w-full accent-emerald-300" />
              </div>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div class="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p class="text-[0.56rem] font-semibold uppercase tracking-[0.32em] text-white/38">Active preset</p>
              <p class="mt-2 text-xl font-black tracking-[-0.05em]">{{ activePresetMeta?.name || 'Custom style' }}</p>
              <p class="mt-1 text-sm text-white/55">{{ activePresetMeta?.description || 'Saved style variation' }}</p>
            </div>
            <div class="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p class="text-[0.56rem] font-semibold uppercase tracking-[0.32em] text-white/38">Saved presets</p>
              <p class="mt-2 text-xl font-black tracking-[-0.05em]">{{ customStylePresets.length }}</p>
              <p class="mt-1 text-sm text-white/55">Stored in local storage for quick reuse.</p>
            </div>
            <div class="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p class="text-[0.56rem] font-semibold uppercase tracking-[0.32em] text-white/38">Seed</p>
              <p class="mt-2 text-xl font-black tracking-[-0.05em]">{{ variationSeed }}</p>
              <p class="mt-1 text-sm text-white/55">Changes the glow placement while keeping the same composition.</p>
            </div>
            <div class="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p class="text-[0.56rem] font-semibold uppercase tracking-[0.32em] text-white/38">Tip</p>
              <p class="mt-2 text-sm leading-6 text-white/70">
                Use the preset select to switch base looks, then nudge the sliders and save the result as a new preset.
              </p>
            </div>
            <div class="rounded-3xl border border-white/10 bg-black/20 p-4 sm:col-span-2 xl:col-span-1">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-[0.56rem] font-semibold uppercase tracking-[0.32em] text-white/38">Caption preview</p>
                  <p class="mt-2 text-xs text-white/50">Generated text for the next Instagram post.</p>
                </div>
              </div>
              <textarea readonly :value="captionText || 'Generate a caption to preview it here.'"
                class="mt-4 min-h-40 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white/80 outline-none"></textarea>
            </div>
          </div>
        </div>

        <div class="mt-6 grid gap-6 xl:grid-cols-[0.6fr_1.4fr]">
          <UCard :ui="cardUi" class="border border-white/10 bg-white/[0.03] text-white">
            <div class="space-y-4">
              <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">Selected player</p>
              <h2 class="text-3xl font-black tracking-[-0.05em]">{{ selectedMover.player.web_name }}</h2>
              <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Team</div>
                  <div class="mt-2 text-lg font-bold">{{ selectedMover.teamName }}</div>
                </div>
                <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Movement</div>
                  <div class="mt-2 text-lg font-bold text-lime-300">{{ formatCompact(selectedMover.totalMovement) }}
                  </div>
                </div>
                <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Points</div>
                  <div class="mt-2 text-lg font-bold">{{ formatCompact(selectedMover.player.total_points) }}</div>
                </div>
                <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Form</div>
                  <div class="mt-2 text-lg font-bold">{{ selectedMover.player.form }}</div>
                </div>
                <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Ownership</div>
                  <div class="mt-2 text-lg font-bold">{{ formatPercent(selectedMover.player.selected_by_percent) }}
                  </div>
                </div>
                <div class="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Minutes</div>
                  <div class="mt-2 text-lg font-bold">{{ formatCompact(selectedMover.player.minutes) }}</div>
                </div>
              </div>
            </div>
          </UCard>

          <div class="rounded-[36px] border border-white/10 bg-black/20 p-4">
            <InstagramMovementCard :player="selectedMover.player" :team-name="selectedMover.teamName"
              :gameweek-label="currentGameweekLabel" :total-movement="selectedMover.totalMovement"
              :net-movement="selectedMover.netMovement" :style-config="activeStyleConfig" id="instagram-card" />
          </div>
        </div>
      </section>
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
import { toPng } from 'html-to-image';

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
const presetNameDraft = ref('');
const customStylePresets = ref([]);

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

const clearBrowserCache = async () => {
  if (!process.client || !('caches' in window)) return;

  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

const convertExternalImagesToProxy = async (element) => {
  const images = element.querySelectorAll('img');
  const originalSrcs = new Map();
  const promises = [];

  images.forEach((img) => {
    const src = img.src || img.getAttribute('src');

    if (src && src.includes('/api/proxy-image')) return;

    if (src && src.startsWith('http') && !src.startsWith(window.location.origin)) {
      originalSrcs.set(img, src);

      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}&t=${Date.now()}`;

      const imagePromise = new Promise((resolve) => {
        const newImg = new Image();
        newImg.crossOrigin = 'anonymous';
        newImg.onload = () => {
          img.src = proxyUrl;
          resolve();
        };
        newImg.onerror = () => {
          console.warn('Failed to load image:', proxyUrl);
          resolve();
        };
        newImg.src = proxyUrl;
      });

      promises.push(imagePromise);
    }
  });

  await Promise.all(promises);
  await new Promise((resolve) => setTimeout(resolve, 500));

  return () => {
    originalSrcs.forEach((src, img) => {
      img.src = src;
    });
  };
};

const convertImage = async (elementToCapture) => {
  let cleanup;

  try {
    cleanup = await convertExternalImagesToProxy(elementToCapture);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const dataUrl = await toPng(elementToCapture, {
      canvasWidth: 1080,
      canvasHeight: 1080,
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: true,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#050816',
      style: {
        transform: 'none',
        overflow: 'hidden',
        width: '1080px',
        height: '1080px',
        position: 'absolute',
        top: '0',
        left: '0',
      },
      filter: (node) => {
        if (node.tagName === 'IMG') {
          console.log('Capturing image:', node.src);
        }
        return true;
      },
      fetchRequest: {
        cache: 'no-store',
      },
    });

    if (!dataUrl) {
      throw new Error('Failed to generate image data URL');
    }

    const blob = await fetch(dataUrl).then((response) => response.blob());

    return blob;
  } catch (error) {
    console.error('Convert image error:', error);
    return null;
  } finally {
    if (cleanup) cleanup();
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

const sendImageToWebhook = async (captionText, imageUrl) => {
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
      player: playerDetails,
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

const waitForImages = async (root) => {
  const images = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve();

      return new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    })
  );
};

const postToInsta = async () => {
  const active = selectedMover.value;
  if (!active) {
    showMessage('No player available to post.', 'error');
    return;
  }

  const card = document.getElementById('instagram-card');
  if (!card) {
    showMessage('Instagram card not found.', 'error');
    return;
  }

  const previousStyle = {
    width: card.style.width,
    height: card.style.height,
    maxWidth: card.style.maxWidth,
  };

  try {
    isPosting.value = true;
    postButtonText.value = 'Preparing image...';

    await clearBrowserCache();

    card.style.width = '1080px';
    card.style.height = '1080px';
    card.style.maxWidth = '1080px';

    await nextTick();
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    await waitForImages(card);
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    const blob = await convertImage(card);
    if (!blob) {
      throw new Error('Failed to generate image');
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
    card.style.width = previousStyle.width;
    card.style.height = previousStyle.height;
    card.style.maxWidth = previousStyle.maxWidth;
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
</script>
