import type { InstagramPlayer, InstagramPostStory, InstagramStatKey } from './instagram-templates'

export type SchedulerPickAngle = 'differential' | 'bought' | 'sold' | 'budget' | 'form' | 'standout'
export type SchedulerPickCandidate = { player: InstagramPlayer; story: InstagramPostStory; stats: InstagramStatKey[] }
export type SchedulerPickGameweek = { id: number; finished: boolean; data_checked?: boolean }

export const schedulerPickMix: SchedulerPickAngle[] = ['differential', 'bought', 'budget', 'form', 'sold', 'standout', 'differential', 'form']

const budgetLimits: Record<string, number> = { Goalkeeper: 45, Defender: 45, Midfielder: 60, Forward: 65 }
const count = (value: number) => value.toLocaleString('en-GB')
const definitions: Record<SchedulerPickAngle, { label: string; stats: InstagramStatKey[]; captionFocus: string }> = {
  differential: { label: 'Differential pick', stats: ['selected_by_percent', 'form', 'now_cost', 'points_per_game', 'total_points', 'minutes'], captionFocus: 'Explain the low ownership and recent form. Invite readers to consider the player, without promising a rank gain.' },
  bought: { label: 'Most bought', stats: ['transfers_in_event', 'form', 'now_cost', 'selected_by_percent', 'total_points', 'minutes'], captionFocus: 'Lead with gameweek transfer-ins. Ask whether readers would join the buyers. Buying activity is not proof that the player is a good buy.' },
  sold: { label: 'Most sold', stats: ['transfers_out_event', 'form', 'now_cost', 'selected_by_percent', 'total_points', 'minutes'], captionFocus: 'Lead with gameweek transfer-outs and ask sell or hold. This is a discussion, not a recommendation to buy or sell. Do not invent a reason for the sales.' },
  budget: { label: 'Budget pick', stats: ['now_cost', 'form', 'points_per_game', 'total_points', 'selected_by_percent', 'minutes'], captionFocus: 'Explain the price and recent returns as a budget option for this position. Do not claim future returns or guaranteed starts.' },
  form: { label: 'In form', stats: ['form', 'points_per_game', 'total_points', 'now_cost', 'selected_by_percent', 'minutes'], captionFocus: 'Lead with current form and ask whether readers expect it to continue. Do not describe form as a specific number of matches or promise future returns.' },
  standout: { label: 'GW standout', stats: ['event_points', 'form', 'now_cost', 'selected_by_percent', 'total_points', 'minutes'], captionFocus: 'Discuss the points from the completed gameweek. Ask whether readers owned, benched or missed the player. Do not invent match events.' },
}

export function getSchedulerPickPools(players: InstagramPlayer[], gameweek: SchedulerPickGameweek | null) {
  // Preserve the scheduler's availability and minimum-minutes rules for every angle.
  const eligible = players.filter(player => player.status === 'a' && (player.stats.minutes ?? 0) >= 90)
  const established = eligible.filter(player => (player.stats.minutes ?? 0) >= 270)
  const form = (player: InstagramPlayer) => player.stats.form ?? -Infinity
  const byForm = (a: InstagramPlayer, b: InstagramPlayer) => form(b) - form(a) || (b.stats.total_points ?? 0) - (a.stats.total_points ?? 0) || a.code - b.code
  const topTransfers = (key: 'transfersIn' | 'transfersOut') => eligible.filter(player => (player[key] ?? 0) > 0).sort((a, b) => b[key]! - a[key]! || byForm(a, b)).slice(0, 10)
  const pools: Record<SchedulerPickAngle, InstagramPlayer[]> = {
    differential: established.filter(player => player.stats.selected_by_percent != null && player.stats.selected_by_percent < 10 && form(player) >= 4).sort(byForm),
    bought: topTransfers('transfersIn'),
    sold: topTransfers('transfersOut'),
    budget: established.filter(player => player.stats.now_cost != null && player.stats.now_cost <= (budgetLimits[player.position] ?? 0) && form(player) >= 4).sort(byForm),
    form: established.filter(player => form(player) >= 5).sort(byForm),
    standout: gameweek?.finished && gameweek.data_checked === true
      ? eligible.filter(player => (player.stats.event_points ?? 0) >= 8).sort((a, b) => b.stats.event_points! - a.stats.event_points! || byForm(a, b)).slice(0, 10)
      : [],
  }
  return Object.fromEntries(Object.entries(pools).map(([key, list]) => {
    const angle = key as SchedulerPickAngle
    const definition = definitions[angle]
    return [angle, list.map((player, index): SchedulerPickCandidate => {
      const gw = gameweek?.id ? `GW${gameweek.id}` : 'Gameweek'
      const evidence = {
        differential: () => `${player.stats.selected_by_percent?.toFixed(1)}% owned · Form ${player.stats.form?.toFixed(1)}`,
        bought: () => `${count(player.transfersIn!)} ${gw} buys`,
        sold: () => `${count(player.transfersOut!)} ${gw} sales`,
        budget: () => `£${((player.stats.now_cost ?? 0) / 10).toFixed(1)}m · Form ${player.stats.form?.toFixed(1)}`,
        form: () => `Form ${player.stats.form?.toFixed(1)}${player.stats.total_points == null ? '' : ` · ${count(player.stats.total_points)} season pts`}`,
        standout: () => `${count(player.stats.event_points ?? 0)} pts in ${gw}`,
      }[angle]()
      const scope = angle === 'bought' || angle === 'sold' ? `#${index + 1} among available players with at least 90 season minutes, before posted players are excluded.` : undefined
      return { player, story: { id: angle, label: definition.label, evidence, captionFocus: definition.captionFocus, scope }, stats: definition.stats.filter(stat => player.stats[stat] != null) }
    })]
  })) as Record<SchedulerPickAngle, SchedulerPickCandidate[]>
}

export function takeSchedulerPickBatch(pools: Record<SchedulerPickAngle, SchedulerPickCandidate[]>, excludedIds: Set<number>, size = 8) {
  const selected = new Set(excludedIds)
  const batch: SchedulerPickCandidate[] = []
  while (batch.length < size) {
    let added = false
    for (const angle of schedulerPickMix) {
      const candidate = pools[angle].find(item => !selected.has(item.player.id))
      if (!candidate) continue
      selected.add(candidate.player.id)
      batch.push(candidate)
      added = true
      if (batch.length === size) break
    }
    if (!added) break
  }
  return batch
}
