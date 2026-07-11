// Slot format, bonus points, and NRR — ported verbatim from spartan-league-2.jsx.
// Do not change this math without re-checking against the original artifact (see Verify step in the project plan).

export const MATCH_LABELS = {
  league1: 'Match 1',
  league2: 'Match 2',
  league3: 'Match 3',
  qualifier1: 'Qualifier 1',
  eliminator: 'Eliminator',
  final: 'Final',
}
export const MATCH_ORDER = ['league1', 'league2', 'league3', 'qualifier1', 'eliminator', 'final']

export const LEAGUE_SLOTS_TOTAL = 20
export const TEAM_LEAGUE_SLOTS = 10 // each team plays 10 of the 20 league slots

export function marginBonusPts(m) {
  if (m >= 60) return 2
  if (m >= 30) return 1
  return 0
}

export function chaseBonusPts(o) {
  if (o <= 2) return 2
  if (o <= 4) return 1
  return 0
}

export function inningsForMatch(result) {
  const matchOvers = result.matchOvers || 7
  // New schema: overs faced are entered directly for each team.
  if (result.teamAOvers != null && result.teamBOvers != null) {
    return {
      [result.teamA]: { runs: result.teamAScore, overs: result.teamAOvers },
      [result.teamB]: { runs: result.teamBScore, overs: result.teamBOvers },
    }
  }
  // Legacy fallback for results saved before per-team overs were tracked.
  const firstId = result.battingFirst
  const secondId = firstId === result.teamA ? result.teamB : result.teamA
  const firstRuns = firstId === result.teamA ? result.teamAScore : result.teamBScore
  const secondRuns = firstId === result.teamA ? result.teamBScore : result.teamAScore
  const secondWon = result.winner === secondId
  const secondOvers = secondWon && result.chaseOvers != null ? Number(result.chaseOvers) : matchOvers
  return { [firstId]: { runs: firstRuns, overs: matchOvers }, [secondId]: { runs: secondRuns, overs: secondOvers } }
}

export function computeNRR(results) {
  const stat = {}
  results.forEach((result) => {
    const innings = inningsForMatch(result)
    const ids = Object.keys(innings)
    if (ids.length !== 2) return
    const [x, y] = ids
    stat[x] = stat[x] || { forRuns: 0, forOvers: 0, againstRuns: 0, againstOvers: 0 }
    stat[y] = stat[y] || { forRuns: 0, forOvers: 0, againstRuns: 0, againstOvers: 0 }
    stat[x].forRuns += innings[x].runs; stat[x].forOvers += innings[x].overs
    stat[x].againstRuns += innings[y].runs; stat[x].againstOvers += innings[y].overs
    stat[y].forRuns += innings[y].runs; stat[y].forOvers += innings[y].overs
    stat[y].againstRuns += innings[x].runs; stat[y].againstOvers += innings[x].overs
  })
  const nrr = {}
  Object.entries(stat).forEach(([id, s]) => {
    nrr[id] = (s.forOvers > 0 ? s.forRuns / s.forOvers : 0) - (s.againstOvers > 0 ? s.againstRuns / s.againstOvers : 0)
  })
  return nrr
}

export function isFullOvers(result) {
  return (result.matchOvers || 7) === 7
}

export function resolveSlot(slot) {
  const league = MATCH_ORDER.slice(0, 3).map((t) => slot.matches.find((m) => m.type === t))
  const wins = {}
  slot.teamIds.forEach((id) => (wins[id] = 0))
  const leagueResults = []
  league.forEach((m) => {
    if (!m || !m.result) return
    leagueResults.push(m.result)
    if (wins[m.result.winner] != null) wins[m.result.winner]++
  })
  const leagueComplete = league.every((m) => m && m.result)
  const slotNRR = computeNRR(leagueResults)
  let standings = null
  if (leagueComplete) {
    standings = [...slot.teamIds].sort((a, b) => (wins[b] !== wins[a] ? wins[b] - wins[a] : (slotNRR[b] || 0) - (slotNRR[a] || 0)))
  }
  const q1 = slot.matches.find((m) => m.type === 'qualifier1')
  const el = slot.matches.find((m) => m.type === 'eliminator')
  const resolvedTeams = { qualifier1: null, eliminator: null, final: null }
  if (standings) {
    resolvedTeams.qualifier1 = [standings[0], standings[1]]
    if (q1.result) {
      const q1Loser = q1.result.winner === standings[0] ? standings[1] : standings[0]
      resolvedTeams.eliminator = [q1Loser, standings[2]]
      if (el.result) resolvedTeams.final = [q1.result.winner, el.result.winner]
    }
  }
  return { wins, slotNRR, standings, resolvedTeams, leagueComplete }
}

export function marginInfo(result) {
  if (!result) return null
  const { teamA, teamB, teamAScore, teamBScore, battingFirst, winner, chaseOvers } = result
  const full = isFullOvers(result)
  if (teamAScore === teamBScore) {
    if (result.superOver) {
      const loser = winner === teamA ? teamB : teamA
      return { type: 'superover', winner, loser, bonus: 0, full }
    }
    return { type: 'tie', full }
  }
  const loser = winner === teamA ? teamB : teamA
  const winnerBattedFirst = battingFirst === winner
  if (winnerBattedFirst) {
    const margin = Math.abs(teamAScore - teamBScore)
    return { type: 'runs', margin, bonus: full ? marginBonusPts(margin) : 0, winner, loser, full }
  }
  let overs = null
  if (result.teamAOvers != null && result.teamBOvers != null) {
    overs = winner === teamA ? result.teamAOvers : result.teamBOvers
  } else if (chaseOvers != null) {
    overs = Number(chaseOvers)
  }
  return { type: 'chase', overs, bonus: full && overs != null ? chaseBonusPts(overs) : 0, winner, loser, full }
}

export function computePointsTable(data) {
  const table = {}
  data.teams.forEach((t) => (table[t.id] = { placement: 0, bonusFor: 0, bonusAgainst: 0, wins: 0, runnerUp: 0, third: 0, slotsPlayed: 0 }))
  const allLeagueResults = []
  data.slots.forEach((slot) => {
    const { resolvedTeams } = resolveSlot(slot)
    const fn = slot.matches.find((m) => m.type === 'final')
    const el = slot.matches.find((m) => m.type === 'eliminator')
    if (fn && fn.result) {
      const w = fn.result.winner, l = w === fn.result.teamA ? fn.result.teamB : fn.result.teamA
      if (table[w]) { table[w].placement += 4; table[w].wins++; table[w].slotsPlayed++ }
      if (table[l]) { table[l].placement += 2; table[l].runnerUp++; table[l].slotsPlayed++ }
      if (el && el.result) {
        const el3 = el.result.winner === el.result.teamA ? el.result.teamB : el.result.teamA
        if (table[el3]) { table[el3].third++; table[el3].slotsPlayed++ }
      }
    }
    slot.matches.forEach((m) => {
      if (!m.result) return
      if (m.type === 'league1' || m.type === 'league2' || m.type === 'league3') allLeagueResults.push(m.result)
      const info = marginInfo(m.result)
      if (info && (info.type === 'runs' || info.type === 'chase') && info.bonus > 0) {
        if (table[info.winner]) table[info.winner].bonusFor += info.bonus
        if (table[info.loser]) table[info.loser].bonusAgainst += info.bonus
      }
    })
  })
  const seasonNRR = computeNRR(allLeagueResults)
  return data.teams.map((t) => {
    const r = table[t.id]
    return { team: t, ...r, nrr: seasonNRR[t.id] || 0, total: r.placement + r.bonusFor - r.bonusAgainst }
  }).sort((a, b) => (b.total !== a.total ? b.total - a.total : b.nrr - a.nrr))
}

export function computeLeagueStandings(data) {
  const leagueSlots = data.slots.filter((s) => (s.slotType || 'League') === 'League')
  const table = computePointsTable({ ...data, slots: leagueSlots })
  const completed = leagueSlots.filter((s) => s.matches.every((m) => m.result)).length
  return { table, completed, total: LEAGUE_SLOTS_TOTAL, leagueSlots }
}

export function computeChampion(data) {
  const finalSlot = data.slots.find((s) => s.slotType === 'Final')
  if (!finalSlot) return null
  const finalMatch = finalSlot.matches.find((m) => m.type === 'final')
  if (!finalMatch || !finalMatch.result) return null
  return data.teams.find((t) => t.id === finalMatch.result.winner) || null
}

// Cumulative points/NRR for every team after each completed slot, in chronological order — for the progress chart.
export function computeProgressionData(data) {
  const completed = [...data.slots].filter((s) => s.matches.every((m) => m.result)).sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  if (completed.length < 2) return []
  return completed.map((_, i) => {
    const upToHere = { ...data, slots: completed.slice(0, i + 1) }
    const table = computePointsTable(upToHere)
    const row = { slot: `#${i + 1}`, date: completed[i].date }
    table.forEach((r) => { row[r.team.id] = r.total })
    return row
  })
}

export function computeHeadToHead(data) {
  const grid = {}
  data.teams.forEach((a) => { grid[a.id] = {}; data.teams.forEach((b) => { if (a.id !== b.id) grid[a.id][b.id] = { wins: 0, losses: 0 } }) })
  data.slots.forEach((slot) => slot.matches.forEach((m) => {
    if (!m.result) return
    const { teamA, teamB, winner } = m.result
    const loser = winner === teamA ? teamB : teamA
    if (grid[winner] && grid[winner][loser]) grid[winner][loser].wins++
    if (grid[loser] && grid[loser][winner]) grid[loser][winner].losses++
  }))
  return grid
}
