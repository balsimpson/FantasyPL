export interface ArticlePlayerSnapshot {
  id: number
  code: number
  first_name: string
  second_name: string
  web_name: string
  teamName: string
  teamCode: number
  position: string
  price: number
  points: number | null
  minutes: number | null
  form: number | null
  ownership: number | null
  transfersIn: number | null
  transfersOut: number | null
  season: string
  gameweek: number
  capturedAt: string
  gameweeks: number[]
  fixtures: { gameweek: number; opponent: string; home: boolean; difficulty: number; kickoff: string | null }[]
}

export function validatePlayerSnapshot(value: unknown): ArticlePlayerSnapshot {
  if (!value || typeof value !== 'object') throw new Error('The player visual is invalid.')
  const p = value as ArticlePlayerSnapshot
  if (![p.id, p.code, p.teamCode].every(n => Number.isSafeInteger(n) && n > 0) || !Number.isFinite(p.price) || p.price <= 0) throw new Error('The player identity or price is invalid.')
  for (const key of ['first_name', 'second_name', 'web_name', 'teamName', 'position', 'season', 'capturedAt'] as const) {
    if (typeof p[key] !== 'string' || p[key].length > 120) throw new Error('The player visual contains invalid text.')
  }
  if (!/^\d{4}\/\d{2}$/.test(p.season) || !Number.isFinite(Date.parse(p.capturedAt)) || !Number.isSafeInteger(p.gameweek) || p.gameweek < 1 || p.gameweek > 38) throw new Error('The player visual needs a season, gameweek and capture time.')
  for (const key of ['points', 'minutes', 'form', 'ownership', 'transfersIn', 'transfersOut'] as const) {
    if (p[key] !== null && (!Number.isFinite(p[key]) || Number(p[key]) < 0)) throw new Error('The player visual contains an invalid statistic.')
  }
  if (!Array.isArray(p.gameweeks) || !p.gameweeks.length || p.gameweeks.length > 3 || p.gameweeks.some(n => !Number.isSafeInteger(n) || n < 1 || n > 38)) throw new Error('The fixture horizon is invalid.')
  if (!Array.isArray(p.fixtures) || p.fixtures.length > 12) throw new Error('The fixture visual is invalid.')
  const fixtures = p.fixtures.map(f => {
    if (!p.gameweeks.includes(f.gameweek) || typeof f.opponent !== 'string' || f.opponent.length > 100 || typeof f.home !== 'boolean' || !Number.isInteger(f.difficulty) || f.difficulty < 1 || f.difficulty > 5 || (f.kickoff !== null && (typeof f.kickoff !== 'string' || !Number.isFinite(Date.parse(f.kickoff))))) throw new Error('The fixture visual contains invalid data.')
    return { gameweek: f.gameweek, opponent: f.opponent, home: f.home, difficulty: f.difficulty, kickoff: f.kickoff }
  })
  return { id: p.id, code: p.code, first_name: p.first_name, second_name: p.second_name, web_name: p.web_name, teamName: p.teamName, teamCode: p.teamCode, position: p.position, price: p.price, points: p.points, minutes: p.minutes, form: p.form, ownership: p.ownership, transfersIn: p.transfersIn, transfersOut: p.transfersOut, season: p.season, gameweek: p.gameweek, capturedAt: p.capturedAt, gameweeks: [...p.gameweeks], fixtures }
}
