export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string

  if (!url) {
    throw createError({ statusCode: 400, statusMessage: 'URL is required' })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
       throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
    }
    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'

    setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
    setResponseHeader(event, 'Content-Type', contentType)
    setResponseHeader(event, 'Cache-Control', 'public, max-age=86400')

    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.error('Image proxy error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to proxy image' })
  }
})
