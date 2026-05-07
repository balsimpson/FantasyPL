export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({ statusCode: 400, statusMessage: 'URL is required' })
  }

  let imageUrl: URL

  try {
    imageUrl = new URL(url)
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid image URL' })
  }

  const allowedHosts = new Set([
    'resources.premierleague.com',
    'fantasy.premierleague.com',
  ])

  if (imageUrl.protocol !== 'https:' || !allowedHosts.has(imageUrl.hostname)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported image URL' })
  }

  try {
    const response = await fetch(imageUrl.toString(), {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.premierleague.com/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || 'image/png'

    if (!contentType.startsWith('image/')) {
      throw new Error(`Unexpected image content type: ${contentType}`)
    }

    const arrayBuffer = await response.arrayBuffer()

    setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
    setResponseHeader(event, 'Content-Type', contentType)
    setResponseHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=86400')

    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.warn('Image proxy fallback:', error instanceof Error ? error.message : error)
    return sendRedirect(event, '/fallback.png', 302)
  }
})
