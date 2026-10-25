<template>
	<span
		class="relative grid h-full w-full place-items-center overflow-hidden"
		:style="fillFrame ? { position: 'absolute', inset: '0', zIndex: 0, width: '100%', height: '100%' } : undefined"
		:aria-hidden="alt ? undefined : 'true'"
		:role="alt && imageState === 'icon' ? 'img' : undefined"
		:aria-label="alt && imageState === 'icon' ? `${alt} portrait unavailable` : undefined"
	>
		<UIcon v-if="!imageLoaded" name="i-lucide-user-round" class="absolute z-0 size-10 text-white/70" aria-hidden="true" />
		<img
			v-if="imageSource"
			ref="imageElement"
			:key="imageSource"
			:src="imageSource"
			:alt="alt"
			width="110"
			height="140"
			loading="lazy"
			decoding="async"
			class="absolute inset-0 z-10 h-full w-full object-contain object-bottom transition duration-150"
			:style="fillFrame ? { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center' } : undefined"
			:class="[imageLoaded ? 'opacity-100' : 'opacity-0', hover ? 'motion-safe:group-hover:scale-[1.04]' : '']"
			@load="imageLoaded = true"
			@error="handleImageError"
		/>
	</span>
</template>

<script setup>
const props = defineProps({
	player: { type: Object, required: true },
	alt: { type: String, default: "" },
	hover: { type: Boolean, default: false },
	fillFrame: { type: Boolean, default: false },
});

const imageLoaded = ref(false);
const imageElement = ref(null);
const playerImageUrl = computed(() => {
	const code = String(props.player?.code ?? "").trim();
	return /^\d+$/.test(code) ? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png` : null;
});
const imageState = ref(playerImageUrl.value ? "player" : "fallback");
const imageSource = computed(() => imageState.value === "player" ? playerImageUrl.value : imageState.value === "fallback" ? "/fallback.png" : null);

watch(playerImageUrl, (url) => {
	imageState.value = url ? "player" : "fallback";
	imageLoaded.value = false;
});

onMounted(() => {
	const image = imageElement.value;
	if (!image?.complete) return;
	if (image.naturalWidth > 0) imageLoaded.value = true;
	else handleImageError();
});

const handleImageError = () => {
	imageLoaded.value = false;
	imageState.value = imageState.value === "player" ? "fallback" : "icon";
};
</script>
