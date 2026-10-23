<script setup lang="ts">
withDefaults(defineProps<{ colour: string, dark: string, mode?: 'club' | 'night' | 'sweep' | 'pitch' }>(), { mode: 'club' })
const id = useId().replace(/:/g, '')
</script>

<template>
  <svg viewBox="0 0 1080 760" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true" class="h-full w-full">
    <defs>
      <linearGradient :id="`${id}-wash`" x1="0" y1="0" x2="1080" y2="760" gradientUnits="userSpaceOnUse"><stop :stop-color="colour" stop-opacity="0.9" /><stop offset="1" :stop-color="dark" stop-opacity="0.15" /></linearGradient>
      <radialGradient :id="`${id}-light`"><stop stop-color="white" stop-opacity="0.8" /><stop offset="1" stop-color="white" stop-opacity="0" /></radialGradient>
    </defs>
    <template v-if="mode === 'night'">
      <path d="M-40 270Q540 40 1120 270L1120 760H-40Z" :fill="colour" opacity="0.15" />
      <path v-for="y in [290, 350, 410, 470, 530]" :key="y" :d="`M-40 ${y} Q540 ${y - 250} 1120 ${y}`" :stroke="colour" stroke-width="2" opacity="0.3" />
      <path d="M-40 90Q540 -135 1120 90" stroke="white" stroke-width="5" opacity="0.3" />
      <ellipse cx="60" cy="-30" rx="240" ry="100" :fill="`url(#${id}-light)`" opacity="0.45" /><ellipse cx="1040" cy="-30" rx="240" ry="100" :fill="`url(#${id}-light)`" opacity="0.45" />
      <g v-for="x in [20, 85, 150, 930, 995, 1060]" :key="x" fill="white"><rect :x="x" y="10" width="36" height="12" rx="2" opacity="0.8" /></g>
    </template>
    <template v-else-if="mode === 'club'">
      <path d="M-40 530L1120 150V760H-40Z" :fill="`url(#${id}-wash)`" opacity="0.4" />
      <path d="M-40 500L1120 120M-40 530L1120 150M-40 560L1120 180" :stroke="dark" stroke-width="3" opacity="0.25" />
      <path d="M100 490V230L310 430M400 390V130L610 330M700 290V30L910 230M1000 190V0" :stroke="dark" stroke-width="3" opacity="0.25" />
      <path d="M0 700Q540 350 1080 700M0 760Q540 410 1080 760" :stroke="colour" stroke-width="5" opacity="0.4" />
    </template>
    <template v-else-if="mode === 'sweep'">
      <path d="M-120 700L1120 50V240L-120 890Z" :fill="colour" opacity="0.35" />
      <path d="M-120 620L1120 -30M-120 600L1120 -50M-120 580L1120 -70" :stroke="colour" stroke-width="4" opacity="0.45" />
      <path d="M-120 760L1120 110" stroke="white" stroke-width="8" opacity="0.2" />
    </template>
    <template v-else>
      <path d="M60 700V80H1020V700M540 80V700" :stroke="colour" stroke-width="2" opacity="0.2" />
      <circle cx="540" cy="390" r="160" :stroke="colour" stroke-width="2" opacity="0.2" />
      <path d="M60 200H230V580H60M1020 200H850V580H1020" :stroke="colour" stroke-width="2" opacity="0.2" />
    </template>
  </svg>
</template>
