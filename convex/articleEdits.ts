import { ConvexError, v } from 'convex/values'
import { action } from './_generated/server'
import { articleCompletion } from './articleProvider'
import { validateArticleDraft } from '../shared/articles'
import { applyRevision, articleToRevisionInput, revisionSchema, revisionSystemPrompt, type RevisionResult } from '../shared/article-revision'

function authorize(secret: string) {
  if (!process.env.CONTENT_SERVICE_TOKEN || secret !== process.env.CONTENT_SERVICE_TOKEN) throw new ConvexError({ code: 'FORBIDDEN', message: 'Article access denied.' })
}

const editSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['replacementText'],
  properties: { replacementText: { type: 'string' } },
}

export const editSelection = action({
  args: { secret: v.string(), selectedText: v.string(), instruction: v.string(), title: v.optional(v.string()), context: v.optional(v.string()) },
  returns: v.string(),
  handler: async (_ctx, args) => {
    authorize(args.secret)
    if (!args.selectedText.trim() || args.selectedText.length > 3000 || !args.instruction.trim() || args.instruction.length > 500) {
      throw new ConvexError({ code: 'INVALID', message: 'Select up to 3,000 characters and enter an edit instruction.' })
    }
    const response = await articleCompletion([
      { role: 'system', content: 'You are an editor for an FPL article. Rewrite only the selected text to follow the instruction. Keep its meaning and any facts that remain relevant. Use surroundingText only to match tone and avoid repetition; never rewrite it. Do not add facts, headings, markdown fences, explanations, or quotation marks unless the selected text already needs them. Separate paragraphs with a blank line only when the selection already spans paragraphs. Return only replacementText as plain text.' },
      { role: 'user', content: JSON.stringify({ selectedText: args.selectedText, instruction: args.instruction, articleTitle: (args.title || '').slice(0, 200), surroundingText: (args.context || '').slice(0, 4000) }) },
    ], { schema: editSchema })
    let result: unknown
    try { result = JSON.parse(response.message.content) } catch { throw new Error('The edit response was not valid. Your article is unchanged.') }
    const replacement = result && typeof result === 'object' ? (result as { replacementText?: unknown }).replacementText : undefined
    if (typeof replacement !== 'string' || !replacement.trim() || replacement.length > 6000) throw new Error('The edit response was incomplete. Your article is unchanged.')
    return replacement
  },
})

export const reviseArticle = action({
  args: { secret: v.string(), instruction: v.string(), draftJson: v.string() },
  returns: v.object({ draftJson: v.string(), summary: v.string() }),
  handler: async (_ctx, args) => {
    authorize(args.secret)
    if (!args.instruction.trim() || args.instruction.length > 1000 || args.draftJson.length > 400_000) {
      throw new ConvexError({ code: 'INVALID', message: 'Enter an instruction of up to 1,000 characters.' })
    }
    let draft
    try { draft = validateArticleDraft(JSON.parse(args.draftJson)) } catch (cause) {
      throw new ConvexError({ code: 'INVALID', message: cause instanceof Error ? cause.message : 'The article is invalid.' })
    }
    const { input, atoms, order } = articleToRevisionInput(draft)
    const response = await articleCompletion([
      { role: 'system', content: revisionSystemPrompt },
      { role: 'user', content: JSON.stringify({ instruction: args.instruction.trim(), article: input }) },
    ], { schema: revisionSchema })
    let result: RevisionResult
    try { result = JSON.parse(response.message.content) } catch { throw new Error('The revision response was not valid. Your article is unchanged.') }
    const revised = await applyRevision(draft, result, atoms, order)
    const summary = typeof result.summary === 'string' && result.summary.trim() ? result.summary.trim().slice(0, 240) : 'Article revised.'
    return { draftJson: JSON.stringify(revised), summary }
  },
})
