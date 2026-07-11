import { findTeamByName } from './players'
import { isFullOvers } from './scoring'

// Auto-computed season records — ported verbatim from spartan-league-2.jsx.
// Manual overrides (highestScore, bestBowling) live in data.manualRecords and are
// merged in by the Records component, not here — CricHeroes exports are slot-level,
// not per-match, so the admin can correct these two records by hand.
export function computeRecords(data) {
  const teamById = (id) => data.teams.find((t) => t.id === id)
  const findTeam = (rawName) => findTeamByName(data.teams, rawName)

  // Highest individual score & best strike rate: per-slot batting entries.
  let highestScore = null, bestSR = null
  ;(data.statsImports || []).forEach((batch) => {
    ;(batch.batting || []).forEach((r) => {
      if (r.highest_run != null && (highestScore == null || r.highest_run > highestScore.value)) {
        highestScore = { value: r.highest_run, name: r.name, team: findTeam(r.team_name), label: batch.label }
      }
      if (r.ball_faced != null && r.ball_faced >= 10 && r.total_runs != null) {
        const sr = (r.total_runs / r.ball_faced) * 100
        if (bestSR == null || sr > bestSR.value) bestSR = { value: sr, name: r.name, team: findTeam(r.team_name), label: batch.label, runs: r.total_runs, balls: r.ball_faced }
      }
    })
  })

  // Best bowling figures: per-slot wickets/runs-conceded (best wickets, tie-break fewest runs).
  let bestBowling = null
  ;(data.statsImports || []).forEach((batch) => {
    ;(batch.bowling || []).forEach((r) => {
      if (r.total_wickets == null) return
      const better = !bestBowling || r.total_wickets > bestBowling.wickets || (r.total_wickets === bestBowling.wickets && (r.runs_conceded ?? Infinity) < bestBowling.runs)
      if (better) bestBowling = { wickets: r.total_wickets, runs: r.runs_conceded, name: r.name, team: findTeam(r.team_name), label: batch.label }
    })
  })

  // Team totals & chase/defence records: full 7-over matches only, for a fair comparison.
  let highestTotal = null, lowestTotal = null, highestChased = null, lowestDefended = null
  data.slots.forEach((slot) => slot.matches.forEach((m) => {
    if (!m.result || !isFullOvers(m.result)) return
    const { teamA, teamB, teamAScore, teamBScore, battingFirst, winner } = m.result
    ;[[teamA, teamAScore], [teamB, teamBScore]].forEach(([tid, score]) => {
      if (highestTotal == null || score > highestTotal.value) highestTotal = { value: score, team: teamById(tid), label: slot.date, slot }
      if (lowestTotal == null || score < lowestTotal.value) lowestTotal = { value: score, team: teamById(tid), label: slot.date, slot }
    })
    const winnerScore = winner === teamA ? teamAScore : teamBScore
    const winnerBattedFirst = battingFirst === winner
    if (winnerBattedFirst) {
      if (lowestDefended == null || winnerScore < lowestDefended.value) lowestDefended = { value: winnerScore, team: teamById(winner), label: slot.date, slot }
    } else {
      if (highestChased == null || winnerScore > highestChased.value) highestChased = { value: winnerScore, team: teamById(winner), label: slot.date, slot }
    }
  }))

  return { highestScore, bestSR, bestBowling, highestTotal, lowestTotal, highestChased, lowestDefended }
}
