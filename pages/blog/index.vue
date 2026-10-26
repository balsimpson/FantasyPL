<script setup lang="ts">
import type { PublishedArticle } from '~/shared/articles'
import { getArticlePreviewPath } from '~/utils/article-preview'
const canonicalUrl = useCanonicalUrl('/blog')
const { data: articles, error } = await useFetch<PublishedArticle[]>('/api/articles')
useHead({ link: [
  { rel: 'canonical', href: canonicalUrl },
  { rel: 'alternate', type: 'application/rss+xml', title: 'FPL Insights articles', href: '/feed.xml' },
] })
useSeoMeta({
  title: 'FPL Articles and Guides',
  description: 'Fantasy Premier League analysis, player comparisons, fixture guides and practical answers for your next FPL decision.',
  ogTitle: 'FPL Articles and Guides | FPL Insights',
  ogDescription: 'Fantasy Premier League analysis, player comparisons, fixture guides and practical answers for your next FPL decision.',
  ogUrl: canonicalUrl,
  ogImage: useRuntimeConfig().public.SITE_URL + '/twitter_large_image.png',
  twitterCard: 'summary_large_image',
  robots: () => articles.value?.length ? 'index, follow' : 'noindex, follow',
})
</script>

<template>
  <main id="main-content" class="site-content-rail min-h-[70vh] py-8 sm:py-12">
    <header class="max-w-3xl border-b border-white/10 pb-8">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-primary">FPL Insights</p>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">FPL articles and guides</h1>
      <p class="mt-4 text-base leading-7 text-stone-300 sm:text-lg">Clear analysis, visible evidence, and practical answers for your next Fantasy Premier League decision.</p>
    </header>
    <p v-if="error" role="status" class="py-10 text-stone-300">Articles are temporarily unavailable. Please try again soon.</p>
    <p v-else-if="!articles?.length" class="py-10 text-stone-300">New FPL analysis and guides will appear here.</p>
    <ul v-else class="divide-y divide-white/10">
      <li v-for="article in articles" :key="article.slug" class="py-7 sm:py-9">
        <NuxtLink :to="`/blog/${article.slug}`" class="group grid gap-5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)] sm:items-center sm:gap-7">
          <img :src="getArticlePreviewPath(article.slug)" alt="" width="1200" height="630" loading="lazy" decoding="async" class="aspect-[1200/630] w-full rounded-lg bg-[#10241c] object-cover" />
          <div class="min-w-0">
            <p class="text-sm text-stone-400"><time :datetime="new Date(article.publishedAt).toISOString()">{{ new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(article.publishedAt) }}</time><span v-if="article.gameweek"> · Gameweek {{ article.gameweek }}</span><span v-if="article.season"> · {{ article.season }}</span></p>
            <h2 class="mt-2 text-xl font-semibold leading-snug text-white group-hover:text-primary sm:text-2xl">{{ article.title }}</h2>
            <p class="mt-2 max-w-3xl leading-7 text-stone-300">{{ article.excerpt }}</p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>
