// Nuxt 3 server route: /api/pl-photo-sizes?playerId=565297&sizes=40x40,80x100,110x140,220x280,300x400
export default defineEventHandler(async (event) => {
    const q = getQuery(event)
    const playerId = String(q.playerId || '')
    const sizes = String(q.sizes || '').split(',').map(s => s.trim()).filter(Boolean)
  
    if (!playerId || sizes.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'playerId and sizes are required' })
    }
  
    const base = 'https://resources.premierleague.com/premierleague25/photos/players'
    const results: Record<string, boolean> = {}
  
    for (const size of sizes) {
      const url = `${base}/${size}/${playerId}.png`
      try {
        // Some CDNs reject HEAD; try GET with small timeout
        const res = await fetch(url, { method: 'GET', redirect: 'manual', cache: 'no-store' })
        results[size] = res.ok
      } catch {
        results[size] = false
      }
    }
  
    return { playerId, results }
  })