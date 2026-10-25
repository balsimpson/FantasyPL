<template>
  <svg aria-hidden="true" class="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_18px_24px_rgba(0,0,0,0.35)]" viewBox="0 0 1000 1000" preserveAspectRatio="none">
    <defs>
      <linearGradient :id="turfId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a241b" />
        <stop offset="55%" stop-color="#123d2c" />
        <stop offset="100%" stop-color="#1b4b34" />
      </linearGradient>
    </defs>
    <g v-for="surface in surfaces" :key="surface.inset" :class="surface.visibility">
      <polygon :points="rectangle(0, 0, 1, 1, surface.inset)" :fill="`url(#${turfId})`" />
      <polygon v-for="band in [0, 2, 4, 6]" :key="band" :points="rectangle(0, band / 8, 1, (band + 1) / 8, surface.inset)" fill="white" fill-opacity="0.025" />
      <g fill="none" stroke="#d1fae5" stroke-opacity="0.18" stroke-width="1" vector-effect="non-scaling-stroke">
        <polygon :points="rectangle(0.025, 0.02, 0.975, 0.98, surface.inset)" />
        <polyline :points="points([[0.025, 0.5], [0.975, 0.5]], surface.inset)" />
        <polygon :points="rectangle(0.25, 0.02, 0.75, 0.17, surface.inset)" />
        <polygon :points="rectangle(0.38, 0.02, 0.62, 0.08, surface.inset)" />
        <polygon :points="rectangle(0.25, 0.83, 0.75, 0.98, surface.inset)" />
        <polygon :points="rectangle(0.38, 0.92, 0.62, 0.98, surface.inset)" />
        <polygon :points="centreCircle(surface.inset)" />
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
const turfId = `manager-pitch-turf-${useId()}`;
const surfaces = [
  { inset: 55, visibility: 'sm:hidden' },
  { inset: 150, visibility: 'hidden sm:block' },
];
type Point = [number, number];
// Project the field onto a trapezoid, with more space toward the near end.
const points = (vertices: Point[], inset: number) => vertices.map(([x, y]) => {
  const depth = y / (1.35 - 0.35 * y);
  const edge = inset * (1 - depth);
  return `${edge + x * (1000 - edge * 2)},${104 + depth * 882}`;
}).join(' ');
const rectangle = (left: number, top: number, right: number, bottom: number, inset: number) =>
  points([[left, top], [right, top], [right, bottom], [left, bottom]], inset);
const centreCircle = (inset: number) => points(Array.from({ length: 64 }, (_, index): Point => {
  const angle = index / 64 * Math.PI * 2;
  return [0.5 + Math.cos(angle) * 0.115, 0.5 + Math.sin(angle) * 0.085];
}), inset);
</script>
