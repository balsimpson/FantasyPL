export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string
  // The OG renderer needs image bytes instead of the normal fallback redirect.
  const inlineFallback = /^article-preview-player-\d{1,12}$/.test(getRouterParam(event, 'slug') || '')

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
    const signal = inlineFallback ? AbortSignal.timeout(5000) : undefined
    let response = await fetch(imageUrl.toString(), {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.premierleague.com/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      },
      redirect: 'follow',
      signal,
    })

    // Some players only have the archived headshot. Keep the same player code.
    if (!response.ok && (query.strict === '1' || inlineFallback)) {
      const code = imageUrl.pathname.match(/\/photos\/players\/250x250\/p(\d+)\.png$/)?.[1]
      if (code) {
        response = await fetch(`https://resources.premierleague.com/premierleague25/photos/players/110x140/${code}.png`, { signal })
      }
    }

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
    if (inlineFallback) {
      const fallback = await $fetch<ArrayBuffer>('/fallback.png', { responseType: 'arrayBuffer' })
      setResponseHeader(event, 'Content-Type', 'image/png')
      setResponseHeader(event, 'Cache-Control', 'no-store')
      return Buffer.from(fallback)
    }
    if (query.strict === '1') {
      throw createError({ statusCode: 502, statusMessage: 'Player photo unavailable' })
    }
    return sendRedirect(event, '/fallback.png', 302)
  }
})
