<script setup lang="ts">
import type { ArticleNode } from '~/shared/articles'
defineProps<{ node: ArticleNode }>()
const children = (node: ArticleNode) => node.content || []
const linkHref = (node: ArticleNode) => node.marks?.find(mark => mark.type === 'link')?.attrs?.href as string | undefined
</script>

<template>
  <template v-if="node.type === 'text'">
    <a v-if="linkHref(node)" :href="linkHref(node)" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-4">{{ node.text }}</a>
    <strong v-else-if="node.marks?.some(mark => mark.type === 'bold')">{{ node.text }}</strong>
    <em v-else-if="node.marks?.some(mark => mark.type === 'italic')">{{ node.text }}</em>
    <del v-else-if="node.marks?.some(mark => mark.type === 'strike')">{{ node.text }}</del>
    <u v-else-if="node.marks?.some(mark => mark.type === 'underline')">{{ node.text }}</u>
    <template v-else>{{ node.text }}</template>
  </template>
  <p v-else-if="node.type === 'paragraph'" class="my-5 whitespace-pre-wrap text-base leading-8 text-stone-200"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></p>
  <component :is="node.attrs?.level === 3 ? 'h3' : 'h2'" v-else-if="node.type === 'heading'" class="mt-10 text-xl font-semibold tracking-tight text-white sm:text-2xl"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></component>
  <blockquote v-else-if="node.type === 'blockquote'" class="my-7 border-l-2 border-primary pl-5 text-lg leading-8 text-stone-200"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></blockquote>
  <ul v-else-if="node.type === 'bulletList'" class="my-5 list-disc space-y-2 pl-6 text-base leading-7 text-stone-200"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></ul>
  <ol v-else-if="node.type === 'orderedList'" :start="Number(node.attrs?.start) || 1" class="my-5 list-decimal space-y-2 pl-6 text-base leading-7 text-stone-200"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></ol>
  <li v-else-if="node.type === 'listItem'"><ArticlesArticleBodyNode v-for="(child, index) in children(node)" :key="index" :node="child" /></li>
  <hr v-else-if="node.type === 'horizontalRule'" class="my-9 border-white/15">
  <br v-else-if="node.type === 'hardBreak'">
  <ArticlesPlayerVisual v-else-if="node.type === 'playerCard' || node.type === 'fixtureRun'" :player="node.attrs?.player" :fixtures-only="node.type === 'fixtureRun'" class="my-8" />
</template>
