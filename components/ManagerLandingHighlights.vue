<template>
  <section v-if="article || trade" aria-labelledby="manager-highlights-title" class="grid min-w-0 gap-4">
    <h2 id="manager-highlights-title" class="text-xl font-bold tracking-tight text-white">Before your next deadline</h2>
    <div class="grid gap-4" :class="article && trade ? 'lg:grid-cols-2' : undefined">
      <article v-if="article" class="grid min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#141b18] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div class="flex items-center bg-[#10241c]">
          <img :src="getArticlePreviewPath(article.slug)" alt="" width="1200" height="630" loading="lazy" decoding="async" class="aspect-[1200/630] w-full object-contain" />
        </div>
        <div class="min-w-0 p-4 sm:p-5">
          <p class="text-xs font-semibold text-lime-300">FPL article</p>
          <h3 class="mt-1 text-base font-bold leading-snug text-white">
            <NuxtLink :to="`/blog/${article.slug}`" class="rounded-sm hover:text-lime-300 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-300">{{ article.title }}</NuxtLink>
          </h3>
          <p v-if="article.excerpt" class="mt-2 text-sm leading-5 text-stone-300">{{ article.excerpt }}</p>
        </div>
      </article>

      <article v-if="trade" class="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#141b18]">
        <header class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-3 sm:px-5">
          <h3 class="text-base font-bold text-white">Top recommended trade</h3>
          <p class="text-xs text-stone-400"><strong class="text-base font-bold tabular-nums text-lime-300">{{ pointsChange }}</strong> expected pts · GW {{ tradeGameweek }}</p>
        </header>
        <div class="relative grid grid-cols-2 divide-x divide-white/10 border-y border-white/10">
          <NuxtLink v-for="(player, index) in [trade.outgoing, trade.incoming]" :key="player.id" :to="getPlayerRoute(player)" class="group relative flex min-w-0 flex-col items-center justify-end px-3 pb-3 pt-2 text-center focus-visible:z-20 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lime-300" :class="index ? 'bg-linear-to-b from-lime-900/50 to-lime-950/10' : 'bg-linear-to-b from-slate-700/45 to-slate-900/10'">
            <span class="text-xs font-bold" :class="index ? 'text-lime-300' : 'text-stone-300'">{{ index ? 'Buy' : 'Sell' }}</span>
            <span class="h-24 w-23 sm:h-30 sm:w-29"><PlayerPortrait :player="player" hover /></span>
            <span class="text-base font-bold leading-tight text-white [overflow-wrap:anywhere] group-hover:text-lime-300 sm:text-lg">{{ player.web_name }}</span>
            <span class="mt-1 text-xs tabular-nums text-stone-300">£{{ (player.now_cost / 10).toFixed(1) }}m <span aria-hidden="true">·</span> {{ Number(player.ep_next).toFixed(1) }} expected pts</span>
          </NuxtLink>
          <span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 z-10 grid size-8 -translate-1/2 place-items-center rounded-full border border-lime-300/30 bg-[#141b18] text-lime-300">
            <UIcon name="i-lucide-arrow-right" class="size-4" />
          </span>
        </div>
        <div class="px-4 py-3 sm:px-5">
          <p class="text-sm leading-5 text-stone-300">{{ trade.reason }}</p>
          <p v-if="trade.sampleNote" class="mt-1 text-xs leading-5 text-amber-200">{{ trade.sampleNote }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import PlayerPortrait from "~/components/PlayerPortrait.vue";
import { getPlayerRoute } from "~/composables/usePlayerRoute";
import type { PublishedArticle } from "~/shared/articles";
import { getArticlePreviewPath } from "~/utils/article-preview";

const props = defineProps<{ gameweek?: number }>();
type TradePlayer = { id: number; web_name: string; code: number; now_cost: number; ep_next: string | number; first_name?: string; second_name?: string };
type TradeIdea = { outgoing: TradePlayer; incoming: TradePlayer; expectedPointsGain: number; reason: string; sampleNote?: string };

const { data: articles } = useLazyFetch<PublishedArticle[]>("/api/articles", { server: false, retry: 0 });
const { data: trades } = useLazyFetch<{ snapshot: { gameweeks: number[]; ideas: TradeIdea[] } }>("/api/homepage-trades", { server: false, retry: 0 });

const article = computed(() => articles.value?.find((item) => item.gameweek === null) ?? articles.value?.[0]);
const tradeGameweek = computed(() => trades.value?.snapshot.gameweeks[0]);
const trade = computed(() => tradeGameweek.value && (!props.gameweek || props.gameweek === tradeGameweek.value)
  ? trades.value?.snapshot.ideas[0] : undefined);
const pointsChange = computed(() => trade.value?.expectedPointsGain.toLocaleString("en-GB", {
  signDisplay: "exceptZero", minimumFractionDigits: 1, maximumFractionDigits: 1,
}));
</script>
