<template>
  <div :id="props.id" ref="rootEl" class="relative">
    <!-- Full player layout (your post content) -->
    <div
      class="w-[1080px] h-[1080px] aspect-square bg-gray-200 overflow-hidden bg-gradient-to-br from-gray-100 text-gray-800 to-gray-300 relative"
    >
      <div class="absolute flex justify-between w-full px-20 pt-20">
        <div class="flex justify-between w-full">
          <!-- Left info -->
          <div class="text-left">
            <h2
              class="text-6xl font-bold transition-all duration-500"
              :class="{ 'fade-in show': anim.titleIn }"
            >
              {{ player.web_name }}
            </h2>

            <div class="flex items-center mt-6 space-x-2">
              <img
                :src="`https://resources.premierleague.com/premierleague/badges/t${player.team_code}.png`"
                :alt="player.web_name"
                class="w-24 mr-3"
              />
              <div>
                <p class="text-3xl">{{ team }}</p>
                <p class="text-4xl font-bold">{{ elementType }}</p>
              </div>
            </div>

            <p class="mt-24 text-3xl">Played</p>
            <p class="text-6xl font-bold">{{ player.minutes }} min</p>
            <p class="mt-8 text-3xl">Selected by</p>
            <p class="text-6xl font-bold">
              {{ player.selected_by_percent }}<span class="opacity-50">%</span>
            </p>
            <p class="mt-8 text-3xl">Bonus</p>
            <p class="text-6xl font-bold">{{ player.bonus }}</p>
          </div>

          <!-- Right stats -->
          <div
            class="text-right transition-all duration-500"
            :class="{ 'fade-in show': anim.statsIn }"
          >
            <p class="text-5xl">GAMEWEEK {{ gameweek.id }}</p>
            <p class="pt-8 font-bold text-8xl">
              {{ player.now_cost / 10 }}<span class="opacity-50">m</span>
            </p>
            <p class="mt-24 text-3xl">Age</p>
            <p class="text-6xl font-bold">{{ getAge(player.birth_date) }}</p>
            <p class="mt-8 text-3xl">Points per game</p>
            <p class="text-6xl font-bold">{{ player.points_per_game }}</p>
            <p class="mt-8 text-3xl">Total points</p>
            <p class="text-6xl font-bold">{{ player.total_points }}</p>
          </div>
        </div>
      </div>

      <!-- Player image -->
      <div class="relative flex items-center justify-center w-full h-full">
        <img
          :src="`https://resources.premierleague.com/premierleague/photos/players/250x250/p${player.code}.png`"
          alt=""
          class="object-contain scale-150 transition-transform duration-500"
          :class="{ 'pop-up show': anim.playerPop }"
          style="filter: drop-shadow(0 20px 25px rgba(0, 0, 0, 0.45))"
          @error="
            (e) => {
              e.target.onerror = null;
              e.target.src = `https://resources.premierleague.com/premierleague25/photos/players/110x140/${player.code}.png`;
              e.target.style.transform = 'scale(2.5)';
            }
          "
        />
      </div>

      <!-- Upcoming difficulty -->
      <div
        class="absolute left-1/2 -translate-x-1/2 z-50 py-2 bottom-[310px] transition-all"
        :class="{ 'fade-in show': anim.difficultyIn }"
      >
        <div
          class="w-[400px] bg-white/90 flex flex-col items-center justify-center rounded-lg pb-3"
        >
          <p class="mb-2 text-xl font-bold text-center text-black">
            Upcoming games difficulty
          </p>
          <div
            v-if="upcoming"
            class="flex items-center justify-center mt-0 space-x-2"
          >
            <div
              v-for="item in upcoming"
              :key="item"
              class="flex items-center justify-center w-16 h-16 rounded-md"
              :class="`${getDifficultyColors(item.difficulty)}`"
            >
              <div class="relative text-center">
                <div class="text-xl font-bold">{{ item.difficulty }}</div>
                <div
                  class="absolute text-xs font-light -translate-x-1/2 left-1/2"
                >
                  {{ item.is_home ? "Home" : "" }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Export button -->
    <button
      @click="exportReelUsingWebMWriter"
      class="fixed top-6 right-6 px-4 py-2 rounded bg-indigo-600 text-white"
    >
      Export Reel
    </button>
  </div>
</template>

<script setup>
import WebMWriter from "webm-writer";
import * as htmlToImage from "html-to-image";

const props = defineProps(["player", "team", "upcoming", "gameweek", "id"]);

const rootEl = ref(null);

const anim = reactive({
  titleIn: false,
  statsIn: false,
  difficultyIn: false,
  playerPop: false,
});

const elementTypeMap = {
  1: "Goalkeeper",
  2: "Defender",
  3: "Midfielder",
  4: "Forward",
};
const elementType = computed(
  () => elementTypeMap[props.player.element_type] || "Unknown"
);

const getAge = (birthDate) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()))
    age--;
  return age;
};

function getDifficultyColors(difficulty) {
  const colors = {
    1: "bg-teal-300",
    2: "bg-blue-300",
    3: "bg-yellow-300",
    4: "bg-orange-300",
    5: "bg-red-300",
  };
  return colors[difficulty];
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function exportReel({
  durationSeconds = 4,
  fps = 25,
  width = 1080,
  height = 1920,
} = {}) {
  if (!rootEl.value) return alert("Root element not found");

  await convertExternalImagesToProxy(rootEl.value);
  const totalFrames = Math.round(durationSeconds * fps);
  const frameDurationMs = 1000 / fps;

  const timeline = [
    {
      t: 0,
      action: () => {
        anim.titleIn = true;
        anim.playerPop = false;
        anim.statsIn = false;
        anim.difficultyIn = false;
      },
    },
    { t: 400, action: () => (anim.playerPop = true) },
    { t: 800, action: () => (anim.statsIn = true) },
    { t: 1500, action: () => (anim.difficultyIn = true) },
  ];

  // output canvas
  const outCanvas = document.createElement("canvas");
  outCanvas.width = width;
  outCanvas.height = height;
  const ctx = outCanvas.getContext("2d");

  // DOM rect + scale
  const domRect = rootEl.value.getBoundingClientRect();
  const scaleX = width / domRect.width;
  const scaleY = height / domRect.height;
  const useScale = Math.min(scaleX, scaleY);

  // select a supported mimeType
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4", // most browsers won't accept mp4 for MediaRecorder, but keep as fallback
  ];
  let mimeType =
    candidates.find((t) => {
      try {
        return (
          MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)
        );
      } catch (e) {
        return false;
      }
    }) || "";

  console.info("Chosen recorder mimeType:", mimeType || "(default)");

  // prepare recorder but DON'T start yet
  const stream = outCanvas.captureStream(fps);
  let recorder;
  try {
    recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
  } catch (err) {
    console.error("Failed to create MediaRecorder:", err);
    alert(
      "MediaRecorder not supported with chosen options in this browser. Check console."
    );
    return;
  }

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size) {
      chunks.push(e.data);
    }
  };
  recorder.onerror = (ev) => console.error("MediaRecorder error:", ev);

  const nextActions = [...timeline];
  const startTime = performance.now();

  // helper to convert dataURL -> Image element reliably
  const dataUrlToImage = (dataUrl) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      // data URLs from html-to-image are same-origin so no need for crossOrigin usually
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = dataUrl;
    });

  // small wait util
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ensure DOM is stable for first render
  await nextTick();
  await wait(50);

  // We'll render *one* initial frame first (not recorded) to ensure everything's ready,
  // then start recorder and render the rest.
  // Render initial frame:
  let initialDataUrl;
  try {
    initialDataUrl = await htmlToImage.toPng(rootEl.value, {
      width: domRect.width,
      height: domRect.height,
    });
  } catch (err) {
    console.error("html-to-image initial render error:", err);
    alert("Failed to render initial image. See console.");
    return;
  }

  let firstImg;
  try {
    firstImg = await dataUrlToImage(initialDataUrl);
  } catch (err) {
    console.error("Failed to load initial image:", err);
    alert("Failed to decode initial image. See console.");
    return;
  }

  // draw initial frame to canvas (not recorded) so canvas is warmed up
  ctx.clearRect(0, 0, outCanvas.width, outCanvas.height);
  const dw0 = domRect.width * useScale;
  const dh0 = domRect.height * useScale;
  const dx0 = (outCanvas.width - dw0) / 2;
  const dy0 = (outCanvas.height - dh0) / 2;
  ctx.drawImage(
    firstImg,
    0,
    0,
    domRect.width,
    domRect.height,
    dx0,
    dy0,
    dw0,
    dh0
  );

  // tiny pause so the canvas has content before starting recorder
  await wait(50);

  // Now start the recorder
  try {
    // start with a timeslice to encourage regular ondataavailable events (optional)
    // but many browsers ignore timeslice for canvas captureStream. safe to start without.
    recorder.start();
  } catch (err) {
    console.error("recorder.start() failed:", err);
    alert("Failed to start recorder. See console.");
    return;
  }
  console.info("Recorder started.");

  // Begin frame loop (this is the loop that will be recorded)
  for (let frame = 0; frame < totalFrames; frame++) {
    const now = performance.now();
    const elapsed = now - startTime;

    // run timeline actions at right times
    while (nextActions.length && elapsed >= nextActions[0].t) {
      nextActions.shift().action();
      await nextTick(); // allow DOM to update before capture
    }

    // capture DOM snapshot
    let dataUrl;
    try {
      dataUrl = await htmlToImage.toPng(rootEl.value, {
        width: domRect.width,
        height: domRect.height,
      });
    } catch (err) {
      console.error("html-to-image frame render error at frame", frame, err);
      // continue but we expect failures to mean empty frames
      dataUrl = null;
    }

    if (dataUrl) {
      try {
        const img = await dataUrlToImage(dataUrl);
        ctx.clearRect(0, 0, outCanvas.width, outCanvas.height);
        const dw = domRect.width * useScale;
        const dh = domRect.height * useScale;
        const dx = (outCanvas.width - dw) / 2;
        const dy = (outCanvas.height - dh) / 2;
        ctx.drawImage(img, 0, 0, domRect.width, domRect.height, dx, dy, dw, dh);
      } catch (err) {
        console.error("Failed to draw image for frame", frame, err);
      }
    } else {
      // if no snapshot, keep last canvas content (avoid blanking)
    }

    // throttle to target fps
    const expectedNext = startTime + (frame + 1) * frameDurationMs;
    const toWait = expectedNext - performance.now();
    if (toWait > 0) await wait(Math.min(toWait, frameDurationMs));
  }

  // finished frames — stop recorder and gather blob
  recorder.stop();
  console.info("Recorder stopped, waiting for data...");

  const blob = await new Promise((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: mimeType || "video/webm" }));
    };
  });

  if (!blob || blob.size < 1000) {
    console.warn("Recorded blob is suspiciously small:", blob && blob.size);
    alert(
      "Recording finished but output seems empty. Check console for errors (CORS or MediaRecorder support)."
    );
  }

  // trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reel-${Date.now()}.webm`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  // reset animation state
  anim.titleIn = anim.statsIn = anim.playerPop = anim.difficultyIn = false;
}

/**
 * exportReelUsingWebMWriter
 * - durationSeconds: total seconds
 * - fps: frames per second
 * - width/height: output canvas size
 */
async function exportReelUsingWebMWriter({
  durationSeconds = 5, // increased from 2
  fps = 30, // increased from 10
  width = 1080,
  height = 1920,
} = {}) {
  if (!rootEl.value) return alert("Root element not found");
  await convertExternalImagesToProxy(rootEl.value);
  const totalFrames = Math.round(durationSeconds * fps);
  const frameDurationMs = 1000 / fps;

  // timeline actions (same as you had)
  const timeline = [
    { t: 0, action: () => { anim.titleIn = true; anim.playerPop = false; anim.statsIn = false; anim.difficultyIn = false; } },
    { t: 400, action: () => (anim.playerPop = true) },
    { t: 800, action: () => (anim.statsIn = true) },
    { t: 1500, action: () => (anim.difficultyIn = true) },
  ];
  const nextActions = [...timeline];

  // output canvas to draw frames
  const outCanvas = document.createElement("canvas");
  outCanvas.width = width;
  outCanvas.height = height;
  const ctx = outCanvas.getContext("2d");

  // compute scale from DOM to output canvas
  const domRect = rootEl.value.getBoundingClientRect();
  const scaleX = width / domRect.width;
  const scaleY = height / domRect.height;
  const useScale = Math.min(scaleX, scaleY);
  const dw = domRect.width * useScale;
  const dh = domRect.height * useScale;
  const dx = (width - dw) / 2;
  const dy = (height - dh) / 2;

  // create WebMWriter (you can tweak quality)
  const writer = new WebMWriter({
    quality: 0.9,        // 0..1
    frameRate: fps,      // frames per second
    transparent: false,  // set true if you want alpha (may increase file size)
  });

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  await nextTick();
  await wait(40);

  const dataUrlToImage = (dataUrl) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = dataUrl;
    });

  const startTime = performance.now();

  // Warm-up single frame (so css animation initial state can be seen)
  try {
    const firstData = await htmlToImage.toPng(rootEl.value, {
      width: domRect.width,
      height: domRect.height,
    });
    const firstImg = await dataUrlToImage(firstData);
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(firstImg, 0, 0, domRect.width, domRect.height, dx, dy, dw, dh);
    // add the warmup frame multiple times to give first frame stability
    for (let i = 0; i < Math.max(1, Math.round(fps * 0.08)); i++) {
      writer.addFrame(outCanvas);
    }
  } catch (err) {
    console.error("Warm-up render failed", err);
    alert("Initial render failed — check console (CORS or html-to-image).");
    return;
  }

  // Frame loop
  for (let frame = 0; frame < totalFrames; frame++) {
    const now = performance.now();
    const elapsed = now - startTime;

    // timeline actions
    while (nextActions.length && elapsed >= nextActions[0].t) {
      nextActions.shift().action();
      await nextTick();
    }

    // capture DOM
    let dataUrl;
    try {
      dataUrl = await htmlToImage.toPng(rootEl.value, {
        width: domRect.width,
        height: domRect.height,
      });
    } catch (err) {
      console.error("html-to-image error at frame", frame, err);
      // fallback: reuse last frame (skip adding an empty frame)
      writer.addFrame(outCanvas);
      // throttle
      const expectedNext = startTime + (frame + 1) * frameDurationMs;
      const toWait = expectedNext - performance.now();
      if (toWait > 0) await wait(Math.min(toWait, frameDurationMs));
      continue;
    }

    // decode and draw
    try {
      const img = await dataUrlToImage(dataUrl);
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, domRect.width, domRect.height, dx, dy, dw, dh);
      // add canvas frame to writer
      writer.addFrame(outCanvas);
    } catch (err) {
      console.error("Failed to draw frame", frame, err);
      // still add last canvas content to avoid blanks
      writer.addFrame(outCanvas);
    }

    // throttle to fps
    const expectedNext = startTime + (frame + 1) * frameDurationMs;
    const toWait = expectedNext - performance.now();
    if (toWait > 0) await wait(Math.min(toWait, frameDurationMs));
  }

  // complete and get blob
  let blob;
  try {
    blob = await writer.complete(); // returns a Blob (webm)
  } catch (err) {
    console.error("WebMWriter complete failed", err);
    alert("Failed to complete WebM encoding. See console.");
    return;
  }

  if (!blob || blob.size < 1000) {
    console.warn("Resulting blob is small:", blob && blob.size);
    alert("Encoding finished but output seems small. Check console.");
  }

  // download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reel-${Date.now()}.webm`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  // reset animation state
  anim.titleIn = anim.statsIn = anim.playerPop = anim.difficultyIn = false;
}

const convertExternalImagesToProxy = async (element) => {
  const images = Array.from(element.querySelectorAll("img"));
  const promises = images.map((img) => {
    const src = img.src || img.getAttribute("src");
    if (src && src.startsWith("http") && !src.startsWith(window.location.origin)) {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
      
      return new Promise((resolve) => {
        img.crossOrigin = "anonymous";
        img.onload = resolve;
        img.onerror = () => {
          console.warn("Failed to load proxied image:", proxyUrl);
          resolve(); // Resolve even on error to not block everything
        };
        img.src = proxyUrl;
      });
    }
    return Promise.resolve();
  });

  await Promise.all(promises);
  // Add a small extra delay for rendering after images load
  await new Promise((resolve) => setTimeout(resolve, 100));
};
</script>

<style>
.fade-in {
  opacity: 0;
  transform: translateY(10px);
}
.fade-in.show {
  opacity: 1;
  transform: translateY(0);
  transition: all 0.6s ease;
}

.pop-up {
  opacity: 0;
  transform: scale(0.85);
}
.pop-up.show {
  opacity: 1;
  transform: scale(1);
  transition: all 0.5s cubic-bezier(0.16, 0.84, 0.44, 1);
}
</style>
