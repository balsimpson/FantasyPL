import { ConvexError, v } from 'convex/values'
import { mutation } from './_generated/server'

function authorize(secret: string) {
  if (!process.env.CONTENT_SERVICE_TOKEN || secret !== process.env.CONTENT_SERVICE_TOKEN) throw new ConvexError({ code: 'FORBIDDEN', message: 'Article access denied.' })
}

const MAX_BYTES = 8 * 1024 * 1024
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

/** Short-lived upload URL for one owner-supplied article photo. */
export const generateUploadUrl = mutation({
  args: { secret: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    authorize(args.secret)
    return await ctx.storage.generateUploadUrl()
  },
})

/** Check an uploaded file and return its public URL. Rejected files are deleted straight away. */
export const resolveUpload = mutation({
  args: { secret: v.string(), storageId: v.id('_storage') },
  returns: v.string(),
  handler: async (ctx, args) => {
    authorize(args.secret)
    const file = await ctx.db.system.get(args.storageId)
    if (!file) throw new ConvexError({ code: 'NOT_FOUND', message: 'The uploaded image was not found.' })
    if (!IMAGE_TYPES.has(file.contentType || '') || file.size > MAX_BYTES) {
      await ctx.storage.delete(args.storageId)
      throw new ConvexError({ code: 'INVALID', message: 'Upload a JPEG, PNG or WebP image of up to 8 MB.' })
    }
    const url = await ctx.storage.getUrl(args.storageId)
    if (!url) throw new ConvexError({ code: 'NOT_FOUND', message: 'The uploaded image was not found.' })
    return url
  },
})
