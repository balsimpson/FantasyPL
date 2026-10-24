import { ConvexError, v } from 'convex/values'
import { action } from './_generated/server'
import { articleCompletion } from './articleProvider'

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
  args: { secret: v.string(), selectedText: v.string(), instruction: v.string() },
  returns: v.string(),
  handler: async (_ctx, args) => {
    authorize(args.secret)
    if (!args.selectedText.trim() || args.selectedText.length > 3000 || !args.instruction.trim() || args.instruction.length > 500) {
      throw new ConvexError({ code: 'INVALID', message: 'Select up to 3,000 characters and enter an edit instruction.' })
    }
    const response = await articleCompletion([
      { role: 'system', content: 'You are an editor for an FPL article. Rewrite only the selected text to follow the instruction. Keep its meaning and any facts that remain relevant. Do not add facts, headings, markdown fences, explanations, or quotation marks unless the selected text already needs them. Return only replacementText as plain text.' },
      { role: 'user', content: JSON.stringify({ selectedText: args.selectedText, instruction: args.instruction }) },
    ], { schema: editSchema })
    let result: unknown
    try { result = JSON.parse(response.message.content) } catch { throw new Error('The edit response was not valid. Your article is unchanged.') }
    const replacement = result && typeof result === 'object' ? (result as { replacementText?: unknown }).replacementText : undefined
    if (typeof replacement !== 'string' || !replacement.trim() || replacement.length > 6000) throw new Error('The edit response was incomplete. Your article is unchanged.')
    return replacement
  },
})
