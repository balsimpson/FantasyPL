import re

with open('pages/instagram.vue', 'r') as f:
    content = f.read()

template_match = re.search(r'<template>.*?</template>', content, re.DOTALL)
if not template_match:
    print("Could not find <template>")
    exit(1)

new_template = """<template>
  <div class="min-h-screen bg-[#050816] text-white">
    <div class="mx-auto flex w-full max-w-[100rem] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-3">
        <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">Instagram builder</p>
        <h1 class="text-4xl font-black leading-[0.95] tracking-[-0.05em] text-balance sm:text-5xl">
          Build a clean Instagram post from live FPL movement.
        </h1>
      </div>

      <div class="grid gap-6 xl:grid-cols-[360px_1fr]">
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
                <div class="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/20 border border-white/10">
                  <img :src="`https://resources.premierleague.com/premierleague/badges/t${item.player.team_code}.png`"
                       :alt="item.teamName" class="h-6 w-6 object-contain" />
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
        <div class="flex flex-col gap-6" v-if="selectedMover">
          <div class="grid gap-6 lg:grid-cols-[400px_1fr]">
            
            <!-- PREVIEW -->
            <div class="space-y-4">
              <div class="rounded-[36px] border border-white/10 bg-black/20 p-4 sticky top-6">
                <InstagramMovementCard :player="selectedMover.player" :team-name="selectedMover.teamName"
                  :gameweek-label="currentGameweekLabel" :total-movement="selectedMover.totalMovement"
                  :net-movement="selectedMover.netMovement" :style-config="activeStyleConfig" id="instagram-card" />
                
                <div class="mt-4 flex flex-col gap-2">
                  <UButton color="primary" size="lg" block :loading="isPosting" icon="i-lucide-send" @click="postToInsta">
                    <span v-if="isPosting">{{ postButtonText }}</span>
                    <span v-else>Post to Insta</span>
                  </UButton>
                </div>
              </div>
            </div>

            <!-- DETAILS & TOOLS -->
            <div class="space-y-6">
              <!-- Player Stats -->
              <UCard :ui="cardUi" class="border border-white/10 bg-white/[0.02] text-white rounded-[24px]">
                <div class="p-5 space-y-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-white/45">Selected player</p>
                      <h2 class="text-3xl font-black tracking-[-0.05em]">{{ selectedMover.player.web_name }}</h2>
                    </div>
                    <div class="text-right">
                      <p class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Interest score</p>
                      <p class="mt-1 text-2xl font-black tracking-[-0.04em] text-lime-300">
                        {{ formatInterestScore(selectedMover.interestingScore) }}
                      </p>
                    </div>
                  </div>

                  <div class="grid gap-3 grid-cols-2 sm:grid-cols-3">
                    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Team</div>
                      <div class="mt-1 text-base font-bold">{{ selectedMover.teamName }}</div>
                    </div>
                    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Movement</div>
                      <div class="mt-1 text-base font-bold text-lime-300">{{ formatCompact(selectedMover.totalMovement) }}</div>
                    </div>
                    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Points</div>
                      <div class="mt-1 text-base font-bold">{{ formatCompact(selectedMover.player.total_points) }}</div>
                    </div>
                    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Form</div>
                      <div class="mt-1 text-base font-bold">{{ selectedMover.player.form }}</div>
                    </div>
                    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Ownership</div>
                      <div class="mt-1 text-base font-bold">{{ formatPercent(selectedMover.player.selected_by_percent) }}</div>
                    </div>
                    <div class="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                      <div class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Minutes</div>
                      <div class="mt-1 text-base font-bold">{{ formatCompact(selectedMover.player.minutes) }}</div>
                    </div>
                  </div>
                </div>
              </UCard>

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
                        <label class="text-[0.58rem] font-semibold uppercase tracking-[0.3em] text-white/40">Pattern</label>
                        <USelect v-model="styleControls.patternKind" :items="patternKindOptions" color="neutral" variant="subtle" size="md" :highlight="false" />
                      </div>
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

              <!-- Caption -->
              <UCard :ui="cardUi" class="border border-white/10 bg-white/[0.02] text-white rounded-[24px]">
                <div class="p-5 space-y-4">
                  <div class="flex items-center justify-between gap-3">
                    <div>
                      <p class="text-[0.56rem] font-semibold uppercase tracking-[0.32em] text-white/38">Caption generator</p>
                      <p class="mt-1 text-xs text-white/50">Generated text for the Instagram post.</p>
                    </div>
                    <UButton color="neutral" variant="soft" icon="i-lucide-file-text" :loading="isGeneratingCaption" @click="generateInstaCaption">
                      Generate
                    </UButton>
                  </div>
                  <textarea readonly :value="captionText || 'Generate a caption to preview it here.'"
                    class="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-sm leading-6 text-white/80 outline-none"></textarea>
                </div>
              </UCard>
              
            </div>
          </div>
        </div>
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
</template>"""

new_content = content[:template_match.start()] + new_template + content[template_match.end():]

with open('pages/instagram.vue', 'w') as f:
    f.write(new_content)

print("Replaced <template> successfully!")
