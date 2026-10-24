<script setup lang="ts">
import type { PublishedArticle } from '~/shared/articles'
import { getPublicSiteOrigin } from '~/utils/site-url'
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const { data: article, error } = await useFetch<PublishedArticle>(() => `/api/articles/${encodeURIComponent(slug.value)}`)
const config = useRuntimeConfig()
const siteOrigin = getPublicSiteOrigin(config.public.SITE_URL)
const canonicalUrl = useCanonicalUrl(computed(() => `/blog/${slug.value}`))
if (error.value) setResponseStatus(Number((error.value as any).statusCode) === 404 ? 404 : 503)
const structuredData = computed(() => article.value ? JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: article.value.title,
  description: article.value.excerpt,
  datePublished: new Date(article.value.publishedAt).toISOString(),
  dateModified: new Date(article.value.updatedAt).toISOString(),
  author: { '@type': 'Person', name: article.value.author },
  publisher: { '@type': 'Organization', name: 'FPL Insights', url: config.public.SITE_URL },
  mainEntityOfPage: canonicalUrl.value,
  image: `${siteOrigin}/twitter_large_image.png`,
  citation: article.value.sources.map(source => ({ '@type': 'CreativeWork', name: source.title, url: source.url })),
  inLanguage: 'en',
}).replace(/</g, '\\u003c') : '')
useHead(() => ({
  link: article.value ? [{ rel: 'canonical', href: canonicalUrl.value }] : [],
  script: article.value ? [{ type: 'application/ld+json', innerHTML: structuredData.value }] : [],
}))
useSeoMeta({
  title: () => article.value?.title || 'Article unavailable',
  description: () => article.value?.excerpt || 'This article is not available right now.',
  ogTitle: () => article.value?.title,
  ogDescription: () => article.value?.excerpt,
  ogUrl: canonicalUrl,
  ogImage: `${siteOrigin}/twitter_large_image.png`,
  ogType: 'article',
  twitterCard: 'summary_large_image',
  robots: () => article.value ? 'index, follow' : 'noindex, nofollow',
})
const formattedDate = computed(() => article.value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' }).format(article.value.publishedAt) : '')
</script>

<template>
  <main id="main-content" class="site-content-rail min-h-[70vh] py-7 sm:py-12">
    <p v-if="!article" class="py-12 text-stone-300">{{ Number((error as any)?.statusCode) === 404 ? 'This article could not be found.' : 'Articles are temporarily unavailable.' }} <NuxtLink to="/blog" class="text-primary underline underline-offset-4">Browse FPL articles</NuxtLink>.</p>
    <article v-else class="mx-auto max-w-3xl">
      <NuxtLink to="/blog" class="text-sm text-stone-300 underline underline-offset-4 hover:text-white">FPL articles</NuxtLink>
      <header class="mt-7 border-b border-white/10 pb-7">
        <p class="text-sm text-stone-400"><time :datetime="new Date(article.publishedAt).toISOString()">{{ formattedDate }}</time><span v-if="article.gameweek"> · Gameweek {{ article.gameweek }}</span><span v-if="article.season"> · {{ article.season }}</span></p>
        <h1 class="mt-3 break-words text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">{{ article.title }}</h1>
        <p class="mt-4 text-lg leading-8 text-stone-300">{{ article.excerpt }}</p>
        <p class="mt-5 text-sm text-stone-400">By {{ article.author }}</p>
      </header>
      <div class="pt-2">
        <ArticlesArticleBodyNode v-for="(node, index) in article.body.content || []" :key="index" :node="node" />
      </div>
      <section v-if="article.sources.length" class="mt-10 border-t border-white/10 pt-6" aria-labelledby="article-sources-heading">
        <h2 id="article-sources-heading" class="text-lg font-semibold text-white">Sources</h2>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-stone-300">
          <li v-for="source in article.sources" :key="source.url"><a :href="source.url" target="_blank" rel="noopener noreferrer" class="underline underline-offset-4 hover:text-white">{{ source.title }}</a></li>
        </ul>
      </section>
      <p v-if="article.dataCapturedAt" class="mt-5 text-xs text-stone-400">FPL data captured <time :datetime="article.dataCapturedAt">{{ new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(article.dataCapturedAt)) }} IST</time>.</p>
      <p class="mt-2 text-xs text-stone-400">Updated <time :datetime="new Date(article.updatedAt).toISOString()">{{ new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(article.updatedAt) }}</time>.</p>
      <footer class="mt-12 border-t border-white/10 pt-6">
        <NuxtLink to="/" class="text-sm text-primary underline underline-offset-4">Explore FPL player stats and fixtures</NuxtLink>
      </footer>
    </article>
  </main>
</template>
