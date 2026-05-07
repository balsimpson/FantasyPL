<template>
  <div class="min-h-screen bg-[#050816] text-white font-['Outfit',sans-serif]">
    <div class="mx-auto flex w-full max-w-[100rem] flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      
      <div class="grid gap-12 lg:grid-cols-2">
        
        <!-- LEFT: Controls -->
        <div class="flex flex-col gap-8">
          
          <UCard :ui="cardUi" class="border border-white/10 bg-white/[0.02] rounded-[32px] overflow-hidden">
            <div class="p-8 space-y-8">
              
              <!-- Layout Selection -->
              <div class="space-y-4">
                <label class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/40">1. Select Layout</label>
                <div class="grid grid-cols-3 gap-3">
                  <button 
                    v-for="l in layouts" :key="l.id"
                    class="flex flex-col items-center gap-2 rounded-xl border p-3 transition-all"
                    :class="selectedLayout === l.id ? 'border-lime-400 bg-lime-400/10 text-lime-400' : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20'"
                    @click="selectedLayout = l.id"
                  >
                    <UIcon :name="l.icon" class="size-6" />
                    <span class="text-[0.6rem] font-bold uppercase tracking-widest">{{ l.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Platform Selection -->
              <div class="space-y-4">
                <label class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/40">2. Select Platform</label>
                <div class="grid grid-cols-2 gap-3">
                  <button 
                    v-for="p in platforms" :key="p.id"
                    class="flex items-center justify-center gap-2 rounded-xl border p-3 transition-all"
                    :class="selectedPlatform === p.id ? 'border-lime-400 bg-lime-400/10 text-lime-400' : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20'"
                    @click="selectedPlatform = p.id"
                  >
                    <UIcon :name="p.icon" class="size-5" />
                    <span class="text-[0.6rem] font-bold uppercase tracking-widest">{{ p.name }}</span>
                  </button>
                </div>
              </div>

              <!-- Background Upload -->
              <div class="space-y-4">
                <label class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/40">3. Background Image</label>
                <div class="relative group">
                  <div 
                    class="relative flex h-48 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] transition-all hover:border-lime-400/50 hover:bg-lime-400/5"
                    @click="$refs.fileInput.click()"
                  >
                    <div v-if="!backgroundImage" class="flex flex-col items-center gap-3 text-white/40">
                      <UIcon name="i-lucide-image-plus" class="size-10" />
                      <span class="text-sm font-bold uppercase tracking-widest">Upload Background</span>
                    </div>
                    <img v-else :src="backgroundImage" class="h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-100" />
                    
                    <div v-if="backgroundImage" class="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/40">
                      <UIcon name="i-lucide-refresh-cw" class="size-8 text-white" />
                    </div>
                  </div>
                  <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleFileUpload" />
                </div>
              </div>

              <!-- Tip Details -->
              <div class="space-y-6">
                <div class="space-y-2">
                  <label class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/40">4. Tip Title</label>
                  <UInput 
                    v-model="tipTitle" 
                    placeholder="e.g. Unstoppable Trivela" 
                    color="neutral" 
                    variant="subtle" 
                    size="xl" 
                    :highlight="false"
                    class="w-full"
                    :ui="{ rounded: 'rounded-xl' }"
                  />
                </div>

                <div class="space-y-2">
                  <label class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/40">5. Tip Description</label>
                  <UTextarea 
                    v-model="tipDescription" 
                    placeholder="Describe how to execute this tip..." 
                    color="neutral" 
                    variant="subtle" 
                    size="xl" 
                    :rows="4"
                    class="w-full"
                    :ui="{ rounded: 'rounded-xl' }"
                  />
                </div>
              </div>

              <!-- Controller Inputs -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <label class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/40">6. Button Combos</label>
                  <UButton variant="ghost" color="neutral" size="xs" icon="i-lucide-trash-2" v-if="selectedButtons.length" @click="selectedButtons = []">Clear</UButton>
                </div>
                <div class="flex flex-wrap gap-2">
                  <UButton 
                    v-for="btn in buttonOptions" :key="btn.id"
                    size="sm"
                    color="neutral"
                    variant="subtle"
                    class="rounded-lg"
                    @click="addButton(btn.id)"
                  >
                    <FifaControllerButton :platform="selectedPlatform" :type="btn.id" size="sm" />
                    <span class="ml-1">{{ getButtonLabel(btn.id) }}</span>
                  </UButton>
                </div>
                <div v-if="selectedButtons.length" class="flex flex-wrap items-center gap-2 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div v-for="(btn, idx) in selectedButtons" :key="idx" class="flex items-center gap-2 group">
                    <div class="relative">
                      <FifaControllerButton :platform="selectedPlatform" :type="btn" size="md" />
                      <button @click="removeButton(idx)" class="absolute -top-1 -right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-white z-10">
                        <UIcon name="i-lucide-x" class="size-2" />
                      </button>
                    </div>
                    <span v-if="idx < selectedButtons.length - 1" class="text-white/20 font-black">+</span>
                  </div>
                </div>
              </div>

              <!-- Advanced Controls -->
              <div class="space-y-6 pt-6 border-t border-white/10">
                <label class="text-[0.6rem] font-black uppercase tracking-[0.3em] text-white/40">6. Advanced Tuning</label>
                
                <div class="grid grid-cols-2 gap-6">
                  <!-- Gradient Controls -->
                  <div class="space-y-4">
                    <div class="space-y-2">
                      <div class="flex justify-between text-[0.6rem] font-bold uppercase text-white/30">
                        <span>Gradient Height</span>
                        <span>{{ gradientHeight }}%</span>
                      </div>
                      <USlider v-model="gradientHeight" :min="0" :max="100" color="lime" size="sm" />
                    </div>
                    <div class="space-y-2">
                      <div class="flex justify-between text-[0.6rem] font-bold uppercase text-white/30">
                        <span>Gradient Opacity</span>
                        <span>{{ gradientOpacity }}%</span>
                      </div>
                      <USlider v-model="gradientOpacity" :min="0" :max="100" color="lime" size="sm" />
                    </div>
                  </div>

                  <!-- Image Controls -->
                  <div class="space-y-4">
                    <div class="space-y-2">
                      <div class="flex justify-between text-[0.6rem] font-bold uppercase text-white/30">
                        <span>Image Zoom</span>
                        <span>{{ imageZoom.toFixed(2) }}x</span>
                      </div>
                      <USlider v-model="imageZoom" :min="1" :max="3" :step="0.01" color="lime" size="sm" />
                    </div>
                    <div class="space-y-2">
                      <div class="flex justify-between text-[0.6rem] font-bold uppercase text-white/30">
                        <span>Position X</span>
                        <span>{{ imageX }}px</span>
                      </div>
                      <USlider v-model="imageX" :min="-200" :max="200" color="lime" size="sm" />
                    </div>
                    <div class="space-y-2">
                      <div class="flex justify-between text-[0.6rem] font-bold uppercase text-white/30">
                        <span>Position Y</span>
                        <span>{{ imageY }}px</span>
                      </div>
                      <USlider v-model="imageY" :min="-200" :max="200" color="lime" size="sm" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-col gap-3 pt-4 border-t border-white/10">
                <UButton 
                  color="lime" 
                  size="xl" 
                  block 
                  icon="i-lucide-download" 
                  class="font-black uppercase tracking-widest py-4 rounded-2xl"
                  @click="downloadImage"
                  :loading="isGenerating"
                >
                  Download PNG
                </UButton>
                <p class="text-[0.6rem] text-center text-white/30 uppercase tracking-[0.2em]">High Resolution 1080x1080</p>
              </div>

            </div>
          </UCard>
        </div>

        <!-- RIGHT: Preview -->
        <div class="flex flex-col gap-6 sticky top-8">
          <div class="flex items-center justify-between px-2">
            <h2 class="text-sm font-black uppercase tracking-[0.4em] text-white/40">Live Preview</h2>
            <div class="flex items-center gap-2">
              <div class="h-[6px] w-[6px] animate-pulse rounded-full bg-lime-400" />
              <span class="text-[0.6rem] font-bold uppercase tracking-widest text-lime-400/80">Updating Live</span>
            </div>
          </div>
          
          <FifaTipCard 
            :layout="selectedLayout"
            :platform="selectedPlatform"
            :background-image="backgroundImage"
            :tip-title="tipTitle"
            :tip-description="tipDescription"
            :buttons="mappedButtons"
            :gradient-height="gradientHeight"
            :gradient-opacity="gradientOpacity"
            :image-zoom="imageZoom"
            :image-x="imageX"
            :image-y="imageY"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  title: 'FIFA Tip Generator',
});

const selectedLayout = ref('classic');
const selectedPlatform = ref('xbox');
const tipTitle = ref('Unstoppable Attack');
const tipDescription = ref('Master the new precision passing mechanics to slice through any defense with ease.');
const backgroundImage = ref('');
const isGenerating = ref(false);
const selectedButtons = ref([]);

const platforms = [
  { id: 'xbox', name: 'Xbox One', icon: 'i-lucide-box' },
  { id: 'playstation', name: 'PlayStation', icon: 'i-lucide-circle' },
];

// Advanced Tuning Refs
const gradientHeight = ref(50);
const gradientOpacity = ref(90);
const imageX = ref(0);
const imageY = ref(0);
const imageZoom = ref(1);

const layouts = [
  { id: 'classic', name: 'Classic', icon: 'i-lucide-layout' },
  { id: 'left', name: 'Left Aligned', icon: 'i-lucide-layout-panel-left' },
  { id: 'right', name: 'Right Aligned', icon: 'i-lucide-layout-panel-right' },
];

const buttonOptions = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'x', label: 'X' },
  { id: 'y', label: 'Y' },
  { id: 'lb', label: 'LB' },
  { id: 'rb', label: 'RB' },
  { id: 'lt', label: 'LT' },
  { id: 'rt', label: 'RT' },
  { id: 'ls', label: 'LS' },
  { id: 'rs', label: 'RS' },
];

const getButtonLabel = (id) => {
  if (selectedPlatform.value === 'playstation') {
    const labels = {
      'a': 'Cross',
      'b': 'Circle',
      'x': 'Square',
      'y': 'Triangle',
    };
    return labels[id] || id.toUpperCase();
  }
  return id.toUpperCase();
};

const mappedButtons = computed(() => selectedButtons.value.map(id => ({ type: id })));

const addButton = (id) => {
  if (selectedButtons.value.length < 6) {
    selectedButtons.value.push(id);
  }
};

const removeButton = (idx) => {
  selectedButtons.value.splice(idx, 1);
};

const getButtonIcon = (id) => buttonOptions.find(b => b.id === id)?.icon || 'i-lucide-circle';

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    backgroundImage.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const downloadImage = async () => {
  // We'll trigger the download through the component's internal mechanism or by finding the image
  const img = document.querySelector('img[alt="FIFA Card Preview"]');
  if (!img || !img.src) {
    alert('Preview not ready!');
    return;
  }

  const link = document.createElement('a');
  link.download = `fifa-tip-${Date.now()}.png`;
  link.href = img.src;
  link.click();
};

const cardUi = {
  body: 'p-0',
  header: 'p-0',
  footer: 'p-0',
  root: 'ring-0 shadow-none',
};
</script>
