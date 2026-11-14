import { Extension, Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import ArticleVisualNode from '../components/admin/ArticleVisualNode.vue'
import ArticleImageNode from '../components/admin/ArticleImageNode.vue'

const visualNodes = ['playerCard', 'fixtureRun', 'comparisonCard', 'transferWatch', 'budgetShortlist', 'teamFixtureTable'].map(name => Node.create({
  name, group: 'block', atom: true, selectable: true, draggable: false,
  addAttributes() { return { player: { default: null, rendered: false }, players: { default: null, rendered: false }, criteria: { default: null, rendered: false } } },
  parseHTML() { return [] },
  renderHTML() { return ['div', { 'data-article-visual': name }] },
  addNodeView() { return VueNodeViewRenderer(ArticleVisualNode) },
}))

const imageAttributes = ['src', 'alt', 'caption', 'credit', 'creditUrl', 'license', 'licenseUrl', 'width', 'height', 'source']
const imageNode = Node.create({
  name: 'image', group: 'block', atom: true, selectable: true, draggable: false,
  addAttributes() { return Object.fromEntries(imageAttributes.map(name => [name, { default: ['width', 'height'].includes(name) ? null : '', rendered: false }])) },
  parseHTML() { return [] },
  renderHTML() { return ['figure', { 'data-article-image': '' }] },
  addNodeView() { return VueNodeViewRenderer(ArticleImageNode) },
})

/** Keeps the highlighted range visible while focus is in the floating edit panel. */
export const assistRangeKey = new PluginKey<DecorationSet>('articleAssistRange')
const assistRange = Extension.create({
  name: 'articleAssistRange',
  addProseMirrorPlugins() {
    return [new Plugin<DecorationSet>({
      key: assistRangeKey,
      state: {
        init: () => DecorationSet.empty,
        apply(tr, set) {
          const meta = tr.getMeta(assistRangeKey) as { from: number; to: number } | null | undefined
          if (meta === null) return DecorationSet.empty
          if (meta) return DecorationSet.create(tr.doc, [Decoration.inline(meta.from, meta.to, { class: 'article-assist-range' })])
          return set.map(tr.mapping, tr.doc)
        },
      },
      props: { decorations: state => assistRangeKey.getState(state) },
    })]
  },
})

export const articleVisualExtensions = [...visualNodes, imageNode, assistRange]
