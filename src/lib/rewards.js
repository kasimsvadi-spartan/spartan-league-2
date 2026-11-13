import { normName } from './players'

export function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

// Total rewards per player across the whole winners log, biggest earner first.
export function computeEarnings(entries) {
  const byName = new Map()
  ;(entries || []).forEach((e) => {
    const key = normName(e.recipientName)
    if (!key) return
    const cur = byName.get(key) || { name: e.recipientName, team: e.team, total: 0 }
    cur.total += e.amount
    if (!cur.team && e.team) cur.team = e.team
    byName.set(key, cur)
  })
  return [...byName.values()].sort((a, b) => b.total - a.total)
}
