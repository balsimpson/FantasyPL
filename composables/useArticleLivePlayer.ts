import type { ArticleLivePlayerData, ArticleLivePlayerResponse } from '~/shared/article-visuals'

export interface ArticleLivePlayerResult {
  player: ArticleLivePlayerData | null
  capturedAt: string | null
  teams: ArticleLivePlayerResponse['teams']
}

const pending = new Map<number, ((result: ArticleLivePlayerResult) => void)[]>()
let flushTimer: ReturnType<typeof setTimeout> | undefined
let flushing = false

function scheduleFlush() {
  if (flushTimer || flushing) return
  flushTimer = setTimeout(() => { void flush() }, 0)
}

async function flush() {
  flushTimer = undefined
  if (flushing || !pending.size) return
  flushing = true
  const batch = [...pending.entries()]
  pending.clear()
  try {
    const response = await $fetch<ArticleLivePlayerResponse>('/api/articles/player-data', {
      query: { ids: batch.map(([id]) => id).join(',') },
      timeout: 8_000,
    })
    const players = new Map(response.players.map(player => [player.id, player]))
    for (const [id, resolve] of batch) {
      const result = { player: players.get(id) ?? null, capturedAt: response.capturedAt, teams: response.teams }
      resolve.forEach(done => done(result))
    }
  } catch {
    for (const [, resolve] of batch) resolve.forEach(done => done({ player: null, capturedAt: null, teams: [] }))
  } finally {
    flushing = false
    scheduleFlush()
  }
}

export function useArticleLivePlayer(id: number): Promise<ArticleLivePlayerResult> {
  return new Promise(resolve => {
    const waiters = pending.get(id) || []
    waiters.push(resolve)
    pending.set(id, waiters)
    scheduleFlush()
  })
}
