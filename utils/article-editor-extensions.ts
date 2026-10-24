import { Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ArticleVisualNode from '../components/admin/ArticleVisualNode.vue'

export const articleVisualExtensions = ['playerCard', 'fixtureRun'].map(name => Node.create({
  name, group: 'block', atom: true, selectable: true, draggable: false,
  addAttributes() { return { player: { default: null, rendered: false } } },
  parseHTML() { return [] },
  renderHTML() { return ['div', { 'data-article-visual': name }] },
  addNodeView() { return VueNodeViewRenderer(ArticleVisualNode) },
}))
