import { activeTeamIds, computePointsTable, computePunctualityBonus, isSlotComplete } from './scoring'

// Qualification analysis: plays out the rest of the league stage thousands of times using the
// real remaining fixtures, and reports how often each team ends up in each finishing position.
// It's an estimate, not a proof — every assumption below is deliberately simple and spelled out
// in the UI so nobody mistakes it for a guarantee.
//
//  - Team strength is its match win rate so far, smoothed toward 50% (a team that has played
//    two matches isn't "100%").
//  - A slot's placings are drawn in order (winner, then runner-up) with chances proportional to
//    strength squared, which pays 4 / 2 / 0 slot points.
//  - Margin bonus/penalty per slot is each team's own average net margin so far, pulled toward
//    zero while the sample is small, plus random noise.
//  - The time bonus is awarded to a slot's teams at the league-wide rate seen so far.
//  - Points ties are split by each team's current NRR (it can't be simulated).

export const SIM_RUNS = 4000
const STRENGTH_EXPONENT = 2
const MARGIN_SHRINK_SLOTS = 3
const MARGIN_NOISE_SD = 2.5
const FINAL_SPOTS = 2
const SEMI_SPOTS = 3 // 3rd-5th

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rng) {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

// The league slots still to be played (not complete, teams known).
export function remainingLeagueSlots(data) {
  return data.slots.filter((s) => (s.slotType || 'League') === 'League' && !isSlotComplete(s) && activeTeamIds(s).length >= 2)
}

// Every remaining slot a team plays in, with who it plays against — for the "fixtures left" view.
export function remainingFixtures(data, teamId) {
  return remainingLeagueSlots(data)
    .filter((s) => s.teamIds.includes(teamId))
    .map((s) => ({
      slotId: s.id,
      date: s.date,
      optedOut: !!s.series && s.series.optedOutTeamId === teamId,
      opponents: activeTeamIds(s).filter((id) => id !== teamId),
    }))
}

function matchRecord(data) {
  const rec = {}
  data.teams.forEach((t) => (rec[t.id] = { played: 0, won: 0 }))
  data.slots.forEach((slot) => {
    if (slot.abandonment) return
    slot.matches.forEach((m) => {
      const r = m.result
      if (!r) return
      ;[r.teamA, r.teamB].forEach((id) => {
        if (!rec[id]) return
        rec[id].played++
        if (r.winner === id) rec[id].won++
      })
    })
  })
  return rec
}

// Share of finished slots that earned the time bonus (lightly smoothed).
function punctualityRate(data) {
  const done = data.slots.filter((s) => !s.abandonment && isSlotComplete(s))
  const hits = done.filter((s) => Object.values(computePunctualityBonus(s)).some((v) => v > 0)).length
  return (hits + 1) / (done.length + 2)
}

export function simulateQualification(data, runs = SIM_RUNS) {
  const rows = computePointsTable(data)
  const teamCount = rows.length
  const remaining = remainingLeagueSlots(data)
  const record = matchRecord(data)
  const punctRate = punctualityRate(data)

  const base = {}
  const nrr = {}
  const strength = {}
  const marginMean = {}
  rows.forEach((r) => {
    const id = r.team.id
    base[id] = r.total
    nrr[id] = r.nrr
    const rec = record[id]
    strength[id] = Math.pow((rec.won + 2) / (rec.played + 4), STRENGTH_EXPONENT)
    const slots = r.slotsPlayed
    const net = slots > 0 ? (r.marginBonusFor - r.marginBonusAgainst) / slots : 0
    marginMean[id] = net * (slots / (slots + MARGIN_SHRINK_SLOTS))
  })

  // Remaining work per slot: its teams, and how much of it is still to be played (a slot that's
  // half-finished already has that half's margin points in the table).
  const plan = remaining.map((s) => ({
    ids: activeTeamIds(s),
    frac: s.matches.length ? s.matches.filter((m) => !m.result).length / s.matches.length : 1,
  }))

  const rng = mulberry32(12345 + rows.length * 101 + remaining.length * 7 + Math.round(rows.reduce((t, r) => t + r.total * 31 + r.nrr * 17, 0)))
  const ids = rows.map((r) => r.team.id)
  const posCount = {}
  const samples = {}
  ids.forEach((id) => { posCount[id] = new Array(teamCount).fill(0); samples[id] = [] })
  const cutoffSamples = { final: [], semi: [] }

  for (let run = 0; run < runs; run++) {
    const pts = { ...base }
    for (const { ids: slotIds, frac } of plan) {
      const pool = [...slotIds]
      const order = []
      while (pool.length) {
        const total = pool.reduce((t, id) => t + strength[id], 0)
        let pick = rng() * total
        let idx = 0
        for (; idx < pool.length - 1; idx++) {
          pick -= strength[pool[idx]]
          if (pick <= 0) break
        }
        order.push(pool.splice(idx, 1)[0])
      }
      const slotPts = [4, 2, 0]
      order.forEach((id, i) => { pts[id] += slotPts[i] })
      if (rng() < punctRate) slotIds.forEach((id) => { pts[id] += 1 })
      slotIds.forEach((id) => { pts[id] += marginMean[id] * frac + MARGIN_NOISE_SD * Math.sqrt(frac) * gaussian(rng) })
    }
    const ranked = [...ids].sort((a, b) => (pts[b] !== pts[a] ? pts[b] - pts[a] : nrr[b] - nrr[a]))
    ranked.forEach((id, i) => { posCount[id][i]++ })
    ids.forEach((id) => samples[id].push(pts[id]))
    cutoffSamples.final.push(pts[ranked[FINAL_SPOTS - 1]])
    cutoffSamples.semi.push(pts[ranked[Math.min(teamCount, FINAL_SPOTS + SEMI_SPOTS) - 1]])
  }

  const pct = (arr, p) => { const a = [...arr].sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.floor(p * a.length))] }
  const teams = rows.map((r, i) => {
    const id = r.team.id
    const pos = posCount[id].map((c) => c / runs)
    const sum = (from, to) => pos.slice(from, to).reduce((t, v) => t + v, 0)
    return {
      team: r.team,
      rank: i + 1,
      points: r.total,
      nrr: r.nrr,
      slotsLeft: remaining.filter((s) => s.teamIds.includes(id)).length,
      pos,
      pFirst: pos[0],
      pFinal: sum(0, FINAL_SPOTS),
      pSemi: sum(FINAL_SPOTS, FINAL_SPOTS + SEMI_SPOTS),
      pOut: sum(FINAL_SPOTS + SEMI_SPOTS, teamCount),
      projected: samples[id].reduce((t, v) => t + v, 0) / runs,
      p10: pct(samples[id], 0.1),
      p90: pct(samples[id], 0.9),
    }
  })

  return {
    teams,
    cutoffs: { final: pct(cutoffSamples.final, 0.5), semi: pct(cutoffSamples.semi, 0.5) },
    remainingSlots: remaining.length,
    runs,
    punctRate,
  }
}
