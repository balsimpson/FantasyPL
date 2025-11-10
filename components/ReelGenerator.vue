<template>
  <div class="video-generator">
    <!-- Hidden animation container (9:16 ratio for Reels) -->
    <div
      ref="animationContainer"
      class="animation-stage"
      :class="{ 'is-recording': isRecording }"
    >
      <PlayerCardReel :player="player" :animation-step="animationStep" />
    </div>

    <!-- Controls -->
    <div class="controls">
      <button
        @click="startRecording"
        :disabled="isRecording"
        class="btn btn-primary"
      >
        {{ isRecording ? 'Recording...' : 'Generate Video' }}
      </button>
      <button
        v-if="videoBlob"
        @click="downloadVideo"
        class="btn btn-secondary"
      >
        Download MP4
      </button>
    </div>

    <!-- Progress indicator -->
    <div v-if="isRecording" class="progress-bar">
      <div class="progress" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import html2canvas from 'html2canvas'

// Props
const props = defineProps({
  player: {
    type: Object,
    required: true,
    default: () => ({
      name: 'Haaland',
      team: 'Man City',
      price: '14.8m',
      position: 'Forward',
      minutes: 854,
      age: 25,
      selectedBy: '70.4%',
      pointsPerGame: 9.8,
      bonus: 23,
      totalPoints: 98,
      form: 7.0,
      fixtures: [
        { difficulty: 4, isHome: true },
        { difficulty: 3, isHome: true },
        { difficulty: 2, isHome: true },
      ],
      goals: 11,
      assists: 7,
      xG: 10.18,
      xGI: 10.79,
      threat: 607.0,
    })
  },
  duration: {
    type: Number,
    default: 8 // seconds (Instagram Reels sweet spot)
  },
  fps: {
    type: Number,
    default: 30
  }
})

// State
const animationContainer = ref(null)
const isRecording = ref(false)
const videoBlob = ref(null)
const animationStep = ref(0)
const progress = ref(0)

// Animation sequence
const animationSequence = [
  { step: 1, delay: 0 },      // Card entrance
  { step: 2, delay: 500 },    // Player header
  { step: 3, delay: 1000 },   // Stats grid
  { step: 4, delay: 2000 },   // Fixtures
  { step: 5, delay: 3000 },   // Goals & assists
  { step: 6, delay: 4000 },   // xG & threat
  { step: 7, delay: 5000 },   // Elite comparisons
  { step: 8, delay: 6500 },   // Final pulse effect
]

// Main recording function
const startRecording = async () => {
  if (!animationContainer.value) return

  isRecording.value = true
  videoBlob.value = null
  animationStep.value = 0
  progress.value = 0

  // Create canvas and stream
  const canvas = await html2canvas(animationContainer.value, { 
    width: 1080, 
    height: 1920,
    scale: 2 // High quality for video
  })
  
  const stream = canvas.captureStream(props.fps)
  const recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp8'
  })
  
  const chunks = []
  recorder.ondataavailable = (e) => chunks.push(e.data)
  recorder.onstop = () => {
    videoBlob.value = new Blob(chunks, { type: 'video/webm' })
    isRecording.value = false
  }

  // Start recording
  recorder.start()

  // Run animation sequence
  const startTime = Date.now()
  const updateAnimation = () => {
    const elapsed = Date.now() - startTime
    progress.value = Math.min((elapsed / (props.duration * 1000)) * 100, 100)
    
    // Update animation step
    const currentStep = animationSequence.find(
      s => elapsed >= s.delay && elapsed < s.delay + 1000
    )
    if (currentStep) {
      animationStep.value = currentStep.step
    }

    // Continue updating canvas
    if (isRecording.value) {
      html2canvas(animationContainer.value, { 
        width: 1080, 
        height: 1920,
        scale: 2 
      }).then(newCanvas => {
        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(newCanvas, 0, 0)
      })
      
      if (elapsed < props.duration * 1000) {
        requestAnimationFrame(updateAnimation)
      } else {
        recorder.stop()
      }
    }
  }

  updateAnimation()
}

// Download video
const downloadVideo = () => {
  if (!videoBlob.value) return
  
  const url = URL.createObjectURL(videoBlob.value)
  const a = document.createElement('a')
  a.href = url
  a.download = `reel-${props.player.name.toLowerCase()}-${Date.now()}.mp4`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.video-generator {
  @apply max-w-md mx-auto p-4;
}

.animation-stage {
  /* Hidden by default, shown during recording */
  @apply fixed -left-full -top-full w-[1080px] h-[1920px] bg-gradient-to-b from-sky-400 to-sky-600;
}

.animation-stage.is-recording {
  @apply left-0 top-0; /* Visible during recording */
}

.controls {
  @apply flex gap-4 mt-4;
}

.btn {
  @apply px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50;
}

.btn-primary {
  @apply bg-indigo-600 text-white hover:bg-indigo-700;
}

.btn-secondary {
  @apply bg-green-600 text-white hover:bg-green-700;
}

.progress-bar {
  @apply w-full h-2 bg-gray-200 rounded-full mt-4 overflow-hidden;
}

.progress {
  @apply h-full bg-indigo-600 transition-all duration-300;
}
</style>

<!-- PlayerCard.vue (create this separate component) -->
