<script setup lang="ts">
import type { ArticleNode } from '~/shared/articles'
import type { ArticlePlayerSnapshot } from '~/shared/article-visuals'
defineProps<{ node: ArticleNode }>()
const children = (node: ArticleNode) => node.content || []
const linkHref = (node: ArticleNode) => node.marks?.find(mark => mark.type === 'link')?.attrs?.href as string | undefined
const linkIsExternal = (node: ArticleNode) => /^https?:\/\//i.test(linkHref(node) || '')
const textTag = (node: ArticleNode) => node.marks?.some(mark => mark.type === 'bold') ? 'strong' : node.marks?.some(mark => mark.type === 'italic') ? 'em' : node.marks?.some(mark => mark.type === 'strike') ? 'del' : node.marks?.some(mark => mark.type === 'underline') ? 'u' : 'span'
const textClasses = (node: ArticleNode) => ({
  italic: node.marks?.some(mark => mark.type === 'italic'),
  'line-through': node.marks?.some(mark => mark.type === 'strike'),
  underline: node.marks?.some(mark => mark.type === 'underline'),
})
</script>

<template>
  <template v-if="node.type === 'text'">
    <a v-if="linkHref(node)" :href="linkHref(node)" :target="linkIsExternal(node) ? '_blank' : undefined" :rel="linkIsExternal(node) ? 'noopener noreferrer' : undefined" class="text-primary underline underline-offset-4"><component :is="textTag(node)" :class="textClasses(node)">{{ node.text }}</component></a>
    <component :is="textTag(node)" v-else :class="textClasses(node)">{{ node.text }}</component>
  </template>
  <p v-else-if="node.type === 'paragraph'" class="my-5 max-w-[68ch] whitespace-pre-wrap text-base leading-8 text-stone-200"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></p>
  <component :is="node.attrs?.level === 3 ? 'h3' : 'h2'" v-else-if="node.type === 'heading'" class="mt-10 max-w-[68ch] text-xl font-semibold tracking-tight text-white sm:text-2xl"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></component>
  <blockquote v-else-if="node.type === 'blockquote'" class="my-7 max-w-[68ch] border-l-2 border-primary pl-5 text-lg leading-8 text-stone-200"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></blockquote>
  <ul v-else-if="node.type === 'bulletList'" class="my-5 max-w-[68ch] list-disc space-y-2 pl-6 text-base leading-7 text-stone-200"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></ul>
  <ol v-else-if="node.type === 'orderedList'" :start="Number(node.attrs?.start) || 1" class="my-5 max-w-[68ch] list-decimal space-y-2 pl-6 text-base leading-7 text-stone-200"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></ol>
  <li v-else-if="node.type === 'listItem'"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></li>
  <hr v-else-if="node.type === 'horizontalRule'" class="my-9 border-white/15">
  <br v-else-if="node.type === 'hardBreak'">
  <ArticlesPlayerVisual v-else-if="node.type === 'playerCard' || node.type === 'fixtureRun'" :player="node.attrs?.player" :fixtures-only="node.type === 'fixtureRun'" class="my-8" />
  <ArticlesInsightCard v-else-if="['comparisonCard', 'transferWatch', 'budgetShortlist', 'teamFixtureTable'].includes(node.type)" :type="node.type" :players="node.attrs?.players as ArticlePlayerSnapshot[]" :criteria="node.attrs?.criteria as string" />
</template>
