export interface ArticlePlayerSnapshot {
  id: number
  code: number
  photoCode: string
  first_name: string
  second_name: string
  web_name: string
  teamName: string
  teamCode: number
  position: string
  price: number
  points: number | null
  pointsPerGame: number | null
  minutes: number | null
  form: number | null
  ownership: number | null
  goals: number | null
  assists: number | null
  cleanSheets: number | null
  transfersIn: number | null
  transfersOut: number | null
  season: string
  gameweek: number
  capturedAt: string
  gameweeks: number[]
  fixtures: { gameweek: number; opponent: string; opponentCode?: number | null; home: boolean; difficulty: number; kickoff: string | null }[]
}

export type ArticleLivePlayerData = Pick<ArticlePlayerSnapshot,
  'id' | 'code' | 'photoCode' | 'first_name' | 'second_name' | 'web_name' | 'teamName' | 'teamCode' | 'position' | 'price' |
  'points' | 'pointsPerGame' | 'minutes' | 'form' | 'ownership' | 'goals' | 'assists' | 'cleanSheets' | 'transfersIn' | 'transfersOut'
> & { gameweek: number | null }

export interface ArticleLivePlayerResponse {
  capturedAt: string
  players: ArticleLivePlayerData[]
  teams: { code: number; name: string }[]
}

export function validatePlayerSnapshot(value: unknown): ArticlePlayerSnapshot {
  if (!value || typeof value !== 'object') throw new Error('The player visual is invalid.')
  const p = value as ArticlePlayerSnapshot
  if (![p.id, p.code, p.teamCode].every(n => Number.isSafeInteger(n) && n > 0) || !Number.isFinite(p.price) || p.price <= 0) throw new Error('The player identity or price is invalid.')
  const photoCode = p.photoCode === undefined ? String(p.code) : p.photoCode
  if (typeof photoCode !== 'string' || !/^\d{1,12}$/.test(photoCode)) throw new Error('The player photo identity is invalid.')
  for (const key of ['first_name', 'second_name', 'web_name', 'teamName', 'position', 'season', 'capturedAt'] as const) {
    if (typeof p[key] !== 'string' || p[key].length > 120) throw new Error('The player visual contains invalid text.')
  }
  if (!/^\d{4}\/\d{2}$/.test(p.season) || !Number.isFinite(Date.parse(p.capturedAt)) || !Number.isSafeInteger(p.gameweek) || p.gameweek < 1 || p.gameweek > 38) throw new Error('The player visual needs a season, gameweek and capture time.')
  const optionalNumber = (value: unknown) => {
    if (value === undefined || value === null) return null
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error('The player visual contains an invalid statistic.')
    return value
  }
  const points = optionalNumber(p.points)
  const pointsPerGame = optionalNumber(p.pointsPerGame)
  const minutes = optionalNumber(p.minutes)
  const form = optionalNumber(p.form)
  const ownership = optionalNumber(p.ownership)
  const goals = optionalNumber(p.goals)
  const assists = optionalNumber(p.assists)
  const cleanSheets = optionalNumber(p.cleanSheets)
  const transfersIn = optionalNumber(p.transfersIn)
  const transfersOut = optionalNumber(p.transfersOut)
  if (!Array.isArray(p.gameweeks) || !p.gameweeks.length || p.gameweeks.length > 3 || p.gameweeks.some(n => !Number.isSafeInteger(n) || n < 1 || n > 38)) throw new Error('The fixture horizon is invalid.')
  if (!Array.isArray(p.fixtures) || p.fixtures.length > 12) throw new Error('The fixture visual is invalid.')
  const fixtures = p.fixtures.map(f => {
    if (!p.gameweeks.includes(f.gameweek) || typeof f.opponent !== 'string' || f.opponent.length > 100 || typeof f.home !== 'boolean' || !Number.isInteger(f.difficulty) || f.difficulty < 1 || f.difficulty > 5 || (f.kickoff !== null && (typeof f.kickoff !== 'string' || !Number.isFinite(Date.parse(f.kickoff))))) throw new Error('The fixture visual contains invalid data.')
    const opponentCode = f.opponentCode == null ? null : f.opponentCode
    if (opponentCode !== null && (!Number.isSafeInteger(opponentCode) || opponentCode <= 0)) throw new Error('The fixture visual contains an invalid opponent club code.')
    return { gameweek: f.gameweek, opponent: f.opponent, opponentCode, home: f.home, difficulty: f.difficulty, kickoff: f.kickoff }
  })
  return { id: p.id, code: p.code, photoCode, first_name: p.first_name, second_name: p.second_name, web_name: p.web_name, teamName: p.teamName, teamCode: p.teamCode, position: p.position, price: p.price, points, pointsPerGame, minutes, form, ownership, goals, assists, cleanSheets, transfersIn, transfersOut, season: p.season, gameweek: p.gameweek, capturedAt: p.capturedAt, gameweeks: [...p.gameweeks], fixtures }
}
