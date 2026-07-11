import { findTeamByName, num, playerKey, sum } from './players'

// Extract only the requested columns at import time, keyed consistently across categories.
// For batting/bowling we also pull the underlying components (innings, not-outs, balls, runs conceded)
// so season averages and rates can be computed exactly rather than approximated.
export function extractRows(rawRows, type) {
  return rawRows.map((r) => {
    if (type === 'batting') return { name: r.name, team_name: r.team_name, total_runs: num(r.total_runs), innings: num(r.innings), not_out: num(r.not_out), ball_faced: num(r.ball_faced), highest_run: num(r.highest_run) }
    if (type === 'bowling') return { name: r.name, team_name: r.team_name, total_wickets: num(r.total_wickets), runs_conceded: num(r.runs), balls: num(r.balls) }
    if (type === 'fielding') return { name: r.name, team_name: r.team_name, total_dismissal: num(r.total_dismissal) }
    if (type === 'mvp') return { name: r['Player Name'], team_name: r['Team Name'], total: num(r.Total) }
    return r
  }).filter((r) => r.name && r.name.trim())
}

// Accumulates every imported slot's batting/bowling/fielding/MVP rows into one row per player,
// computing season averages/rates exactly from summed components (not by averaging per-slot averages).
export function buildPlayerIndex(data) {
  const imports = data.statsImports || []
  const idx = {}
  const ensure = (name, teamRaw) => {
    const k = playerKey(name, teamRaw)
    if (!idx[k]) idx[k] = { name: name.trim(), teamRaw, battingEntries: [], bowlingEntries: [], fieldingEntries: [], mvpEntries: [] }
    return idx[k]
  }
  imports.forEach((batch) => {
    ;(batch.batting || []).forEach((r) => ensure(r.name, r.team_name).battingEntries.push(r))
    ;(batch.bowling || []).forEach((r) => ensure(r.name, r.team_name).bowlingEntries.push(r))
    ;(batch.fielding || []).forEach((r) => ensure(r.name, r.team_name).fieldingEntries.push(r))
    ;(batch.mvp || []).forEach((r) => ensure(r.name, r.team_name).mvpEntries.push(r))
  })

  return Object.values(idx).map((p) => {
    const team = findTeamByName(data.teams, p.teamRaw)
    const out = { name: p.name, team }
    if (p.battingEntries.length) {
      const totalRuns = sum(p.battingEntries.map((e) => e.total_runs))
      const totalInnings = sum(p.battingEntries.map((e) => e.innings))
      const totalNotOut = sum(p.battingEntries.map((e) => e.not_out))
      const totalBalls = sum(p.battingEntries.map((e) => e.ball_faced))
      const outs = totalInnings - totalNotOut
      out.batting = {
        slots: p.battingEntries.length,
        total_runs: totalRuns,
        average: outs > 0 ? totalRuns / outs : null,
        strike_rate: totalBalls > 0 ? (totalRuns / totalBalls) * 100 : null,
      }
    }
    if (p.bowlingEntries.length) {
      const totalWickets = sum(p.bowlingEntries.map((e) => e.total_wickets))
      const totalRunsConceded = sum(p.bowlingEntries.map((e) => e.runs_conceded))
      const totalBalls = sum(p.bowlingEntries.map((e) => e.balls))
      out.bowling = {
        slots: p.bowlingEntries.length,
        total_wickets: totalWickets,
        avg: totalWickets > 0 ? totalRunsConceded / totalWickets : null,
        economy: totalBalls > 0 ? (totalRunsConceded / totalBalls) * 6 : null,
      }
    }
    if (p.fieldingEntries.length) {
      out.fielding = { slots: p.fieldingEntries.length, total_dismissal: sum(p.fieldingEntries.map((e) => e.total_dismissal)) }
    }
    if (p.mvpEntries.length) {
      out.mvp = { slots: p.mvpEntries.length, total: sum(p.mvpEntries.map((e) => e.total)) }
    }
    return out
  })
}

// Tie-break order exactly as specified: primary stat first, then the listed tiebreakers, in cricket-conventional direction.
export function sortBatting(rows) {
  return [...rows].sort((a, b) =>
    (b.batting.total_runs ?? -Infinity) - (a.batting.total_runs ?? -Infinity) ||
    (b.batting.average ?? -Infinity) - (a.batting.average ?? -Infinity) ||
    (b.batting.strike_rate ?? -Infinity) - (a.batting.strike_rate ?? -Infinity)
  )
}
export function sortBowling(rows) {
  return [...rows].sort((a, b) =>
    (b.bowling.total_wickets ?? -Infinity) - (a.bowling.total_wickets ?? -Infinity) ||
    (a.bowling.avg ?? Infinity) - (b.bowling.avg ?? Infinity) ||
    (a.bowling.economy ?? Infinity) - (b.bowling.economy ?? Infinity)
  )
}
export function sortFielding(rows) {
  return [...rows].sort((a, b) => (b.fielding.total_dismissal ?? -Infinity) - (a.fielding.total_dismissal ?? -Infinity))
}
export function sortMvp(rows) {
  return [...rows].sort((a, b) => (b.mvp.total ?? -Infinity) - (a.mvp.total ?? -Infinity))
}
