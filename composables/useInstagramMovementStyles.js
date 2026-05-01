export const instagramMovementPatternOptions = [
  { label: 'Grid', value: 'grid' },
  { label: 'Dots', value: 'dots' },
  { label: 'Diagonal', value: 'diagonal' },
  { label: 'Crosshatch', value: 'crosshatch' },
];

export const instagramMovementPresets = [
  {
    id: 'aurora-grid',
    name: 'Aurora Grid',
    description: 'The existing neon look with a soft grid and lime/cyan glow.',
    baseGradient: ['#050816', '#0b1224', '#03050b'],
    gradientAngle: 135,
    lights: [
      { x: 18, y: 18, size: 24, blur: 76, opacity: 0.22, color: 'rgba(190,255,84,0.9)' },
      { x: 82, y: 16, size: 22, blur: 70, opacity: 0.18, color: 'rgba(63,195,255,0.9)' },
      { x: 50, y: 100, size: 34, blur: 128, opacity: 0.08, color: 'rgba(255,255,255,0.85)' },
    ],
    pattern: {
      kind: 'grid',
      size: 88,
      opacity: 0.16,
      rotation: 0,
      mask: 80,
    },
  },
  {
    id: 'violet-pulse',
    name: 'Violet Pulse',
    description: 'A darker cinematic variant with violet and sky accents.',
    baseGradient: ['#04040d', '#120b27', '#050816'],
    gradientAngle: 145,
    lights: [
      { x: 20, y: 15, size: 22, blur: 72, opacity: 0.24, color: 'rgba(188,120,255,0.88)' },
      { x: 76, y: 20, size: 24, blur: 76, opacity: 0.18, color: 'rgba(88,196,255,0.9)' },
      { x: 45, y: 92, size: 30, blur: 116, opacity: 0.1, color: 'rgba(255,255,255,0.72)' },
    ],
    pattern: {
      kind: 'crosshatch',
      size: 96,
      opacity: 0.12,
      rotation: 12,
      mask: 84,
    },
  },
  {
    id: 'solar-wave',
    name: 'Solar Wave',
    description: 'Warmer glow with amber highlights and a denser texture.',
    baseGradient: ['#06040a', '#18100f', '#050816'],
    gradientAngle: 155,
    lights: [
      { x: 16, y: 20, size: 22, blur: 68, opacity: 0.22, color: 'rgba(255,196,92,0.9)' },
      { x: 82, y: 18, size: 24, blur: 74, opacity: 0.16, color: 'rgba(190,255,84,0.85)' },
      { x: 50, y: 94, size: 32, blur: 120, opacity: 0.09, color: 'rgba(255,255,255,0.75)' },
    ],
    pattern: {
      kind: 'diagonal',
      size: 80,
      opacity: 0.14,
      rotation: -10,
      mask: 78,
    },
  },
  {
    id: 'ice-field',
    name: 'Ice Field',
    description: 'Cooler, cleaner contrast with a tighter grid.',
    baseGradient: ['#040810', '#071928', '#03050b'],
    gradientAngle: 128,
    lights: [
      { x: 16, y: 16, size: 22, blur: 70, opacity: 0.2, color: 'rgba(88,196,255,0.95)' },
      { x: 84, y: 18, size: 20, blur: 66, opacity: 0.16, color: 'rgba(190,255,84,0.72)' },
      { x: 50, y: 98, size: 30, blur: 122, opacity: 0.09, color: 'rgba(255,255,255,0.7)' },
    ],
    pattern: {
      kind: 'grid',
      size: 74,
      opacity: 0.12,
      rotation: 0,
      mask: 84,
    },
  },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, amount) => start + (end - start) * amount;

const hashString = (value = '') => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createRandom = (seedValue) => {
  let seed = hashString(String(seedValue || 'instagram-movement')) || 1;

  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const buildPatternImage = (patternKind, baseOpacity) => {
  const opacity = Number(baseOpacity.toFixed(3));

  switch (patternKind) {
    case 'dots':
      return `radial-gradient(circle at center, rgba(255,255,255,${opacity}) 0 1px, transparent 1.4px)`;
    case 'diagonal':
      return `repeating-linear-gradient(135deg, rgba(255,255,255,${opacity}) 0 1px, transparent 1px 20px)`;
    case 'crosshatch':
      return [
        `repeating-linear-gradient(135deg, rgba(255,255,255,${opacity}) 0 1px, transparent 1px 22px)`,
        `repeating-linear-gradient(45deg, rgba(255,255,255,${opacity * 0.7}) 0 1px, transparent 1px 22px)`,
      ].join(', ');
    case 'grid':
    default:
      return [
        `linear-gradient(rgba(255,255,255,${opacity}) 1px, transparent 1px)`,
        `linear-gradient(90deg, rgba(255,255,255,${opacity}) 1px, transparent 1px)`,
      ].join(', ');
  }
};

export const resolveInstagramMovementPreset = (presetId) =>
  instagramMovementPresets.find((preset) => preset.id === presetId) || instagramMovementPresets[0];

export const buildInstagramMovementStyle = (options = {}) => {
  const preset = resolveInstagramMovementPreset(options.presetId);
  const random = createRandom(`${preset.id}:${options.seed ?? '0'}`);

  const glowIntensity = clamp(Number(options.glowIntensity ?? 100) / 100, 0.4, 1.6);
  const lightSpread = clamp(Number(options.lightSpread ?? 50) / 100, 0, 1);
  const patternScale = clamp(Number(options.patternScale ?? 100) / 100, 0.7, 1.35);
  const patternOpacity = clamp(Number(options.patternOpacity ?? preset.pattern.opacity * 100) / 100, 0.05, 0.85);
  const patternRotation = Number(options.patternRotation ?? preset.pattern.rotation ?? 0);
  const patternKind = options.patternKind || preset.pattern.kind;

  const glowLayers = preset.lights.map((light, index) => {
    const drift = lerp(4, 18, lightSpread) * (0.7 + index * 0.22);
    const width = light.size * lerp(0.88, 1.18, random());
    const height = width * lerp(0.9, 1.1, random());
    const x = clamp(light.x + (random() - 0.5) * drift * 2, 4, 96);
    const y = clamp(light.y + (random() - 0.5) * drift * 2, 4, 96);

    return {
      style: {
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
        opacity: (light.opacity * glowIntensity).toFixed(3),
        background: `radial-gradient(circle, ${light.color} 0%, transparent 72%)`,
        transform: 'translate(-50%, -50%)',
        filter: `blur(${(light.blur * lerp(0.85, 1.12, random())).toFixed(0)}px)`,
      },
    };
  });

  const baseGradient = `linear-gradient(${preset.gradientAngle}deg, ${preset.baseGradient[0]} 0%, ${preset.baseGradient[1]} 52%, ${preset.baseGradient[2]} 100%)`;
  const backdropStyle = {
    backgroundImage: baseGradient,
    backgroundColor: preset.baseGradient[0],
  };

  const patternSize = Math.round(lerp(preset.pattern.size * 0.78, preset.pattern.size * 1.22, random()) * patternScale);
  const patternOffsetX = Math.round(lerp(-24, 24, random()));
  const patternOffsetY = Math.round(lerp(-24, 24, random()));

  const patternStyle = {
    backgroundImage: buildPatternImage(patternKind, patternOpacity),
    backgroundSize: `${patternSize}px ${patternSize}px`,
    backgroundPosition: `${patternOffsetX}px ${patternOffsetY}px`,
    transform: `rotate(${patternRotation}deg) scale(${patternScale})`,
    opacity: patternOpacity,
    maskImage: `radial-gradient(circle at center, black 0%, black ${preset.pattern.mask}%, transparent 100%)`,
    WebkitMaskImage: `radial-gradient(circle at center, black 0%, black ${preset.pattern.mask}%, transparent 100%)`,
  };

  const shellStyle = {
    '--instagram-glow-intensity': glowIntensity,
  };

  return {
    preset,
    shellStyle,
    backdropStyle,
    patternStyle,
    glowLayers,
  };
};
