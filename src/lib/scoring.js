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

export const LEAGUE_SLOTS_TOTAL = 21
export const TEAM_LEAGUE_SLOTS = 9 // each team plays 9 of the 21 league slots
export const KNOCKOUT_SLOTS_TOTAL = 2 // Semi-Final + Grand Final
export const TOTAL_SLOTS = LEAGUE_SLOTS_TOTAL + KNOCKOUT_SLOTS_TOTAL

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

// ============================================================================
// Bonus and penalty runs — rulebook section 9 ("Slot structure and bonus runs")
//
// The qualifier and eliminator each hand a 10-run advantage to a specific team, and the
// Final Slot's saved 1st-place bonus (also 10 runs, admin-activated — see
// computeFinalSlotAdvantage below) can stack on top of the qualifier advantage for the same
// team in the same match, hence `amount` rather than a hardcoded 10. The runs are never
// attributed to a batsman: whichever team bats first has its gross score adjusted (up if it
// holds the advantage, down if its opponent does); the team batting second is untouched
// either way, since its edge is already reflected in the first team's adjusted score.
// ============================================================================

export function bonusRunsForFirstBatting(result, advantageTeamId, amount) {
  if (!advantageTeamId || !amount) return 0
  return result.battingFirst === advantageTeamId ? amount : -amount
}

// Resolves a single match into its final outcome, applying bonus/penalty runs and the
// negative-net-score walkover rule. This is the one place that mechanic lives — margin
// bonus, NRR and the points table all consume its output rather than raw teamAScore/
// teamBScore, so a match with bonus runs is scored identically everywhere it's used.
//
// `raw`: { teamA, teamB, teamAScore, teamBScore, teamAOvers, teamBOvers, battingFirst,
//          matchOvers, superOver }. teamBScore/teamBOvers are ignored when the team batting
//          first's net score goes negative, since the second team never bats.
// `advantageTeamId`/`advantageAmount`: the run advantage for this match (10, 20 if the
//          Final Slot bonus stacks with the qualifier advantage, or null/0 for most matches).
export function resolveMatch(raw, advantageTeamId = null, advantageAmount = 0) {
  const { teamA, teamB, battingFirst } = raw
  const firstId = battingFirst
  const secondId = firstId === teamA ? teamB : teamA
  const firstGross = firstId === teamA ? raw.teamAScore : raw.teamBScore
  const firstOvers = firstId === teamA ? raw.teamAOvers : raw.teamBOvers
  const adj = bonusRunsForFirstBatting(raw, advantageTeamId, advantageAmount)
  const firstNet = firstGross + adj
  const full = isFullOvers(raw)

  if (firstNet < 0) {
    // "If a side finishes on a negative total, the chasing side wins immediately without
    // batting, and earns the +2 margin bonus. For net run rate the winners are credited
    // with the opposition's gross score — the runs actually scored before the penalty —
    // over 1 over faced."
    return {
      teamA, teamB, full, walkover: true, tie: false,
      winner: secondId, loser: firstId,
      bonusRunsApplied: adj,
      grossScoreByTeam: { [firstId]: firstGross, [secondId]: null },
      netScoreByTeam: { [firstId]: firstNet, [secondId]: null },
      nrrByTeam: {
        [firstId]: { runs: firstNet, overs: firstOvers },
        [secondId]: { runs: firstGross, overs: 1 },
      },
      marginBonus: { [firstId]: 0, [secondId]: 2 },
    }
  }

  const secondGross = secondId === teamA ? raw.teamAScore : raw.teamBScore
  const secondOvers = secondId === teamA ? raw.teamAOvers : raw.teamBOvers
  const secondNet = secondGross // never adjusted — see bonusRunsForFirstBatting above
  const isTie = firstNet === secondNet

  let winner = null
  let loser = null
  if (isTie) {
    if (raw.superOver) {
      winner = raw.superOver.winner
      loser = winner === teamA ? teamB : teamA
    }
  } else {
    winner = firstNet > secondNet ? firstId : secondId
    loser = winner === firstId ? secondId : firstId
  }

  const marginBonus = { [teamA]: 0, [teamB]: 0 }
  if (winner && full) {
    const winnerBattedFirst = winner === firstId
    const margin = Math.abs(firstNet - secondNet)
    marginBonus[winner] = winnerBattedFirst
      ? marginBonusPts(margin)
      : chaseBonusPts(winner === teamA ? raw.teamAOvers : raw.teamBOvers)
  }

  return {
    teamA, teamB, full, walkover: false, tie: isTie && !winner,
    winner, loser,
    bonusRunsApplied: adj,
    grossScoreByTeam: { [teamA]: raw.teamAScore, [teamB]: raw.teamBScore },
    netScoreByTeam: { [firstId]: firstNet, [secondId]: secondNet },
    nrrByTeam: {
      [firstId]: { runs: firstNet, overs: firstOvers },
      [secondId]: { runs: secondNet, overs: secondOvers },
    },
    marginBonus,
  }
}

// ============================================================================
// Punctuality bonus — rulebook section 11
//
// A flat +1 to all three teams, but only if the whole slot finished inside its 9pm-12am
// window AND every one of its 6 matches started as a full 7-over contest — one shortened
// match voids the bonus for everyone even if the slot finished on time. Nothing is ever
// deducted. `punctualityOverride` is the Match Referee's discretion for a delay outside
// everyone's control (floodlight failure, rain, a double-booked cage).
// ============================================================================

export function computePunctualityBonus(slot) {
  const teamIds = slot.teamIds || []
  const award = () => Object.fromEntries(teamIds.map((id) => [id, 1]))
  const none = () => Object.fromEntries(teamIds.map((id) => [id, 0]))
  if (slot.punctualityOverride) return award()
  if (!slot.finishedOnTime) return none()
  const allPlayedFullLength = slot.matches.length > 0 && slot.matches.every((m) => m.result && isFullOvers(m.result))
  return allPlayedFullLength ? award() : none()
}

// ============================================================================
// Abandoned slots — rulebook section 10
//
// A slot not played in full carries 6 points total, split by which teams were actually
// willing to take the field (stating willingness isn't enough). Matches already completed
// before the abandonment are discarded — they must not be scored separately. Captains agree
// willingness outside the app; the admin records the outcome by passing the willing team
// ids here, plus the winner if exactly two teams played each other.
// ============================================================================

export function computeAbandonedSlotPoints(teamIds, willingTeamIds, winnerIdIfTwoWilling = null) {
  const points = Object.fromEntries(teamIds.map((id) => [id, 0]))
  const willing = teamIds.filter((id) => willingTeamIds.includes(id))
  if (willing.length === 1) {
    points[willing[0]] = 6
  } else if (willing.length === 2 && winnerIdIfTwoWilling) {
    const loserId = willing.find((id) => id !== winnerIdIfTwoWilling)
    points[winnerIdIfTwoWilling] = 4
    if (loserId) points[loserId] = 2
  } else {
    // All three agreed not to play (or a degenerate/unset input) — split evenly.
    teamIds.forEach((id) => (points[id] = 2))
  }
  return points
}

// ============================================================================
// Final Slot 1st-place advantage — rulebook section 9
//
// The league-stage winner holds a one-use 10-run bonus for the Final Slot, usable in any
// single match before the Final (not the Final itself), forfeited once a ball is bowled if
// not activated, and rolling forward to the next eligible match if unused. It stacks with
// the standard qualifier advantage when the same team seeds 1st in the Final Slot round
// robin — resolveAdvantageAmount below is what makes that stacking arithmetic explicit.
// ============================================================================

// `finalSlotBonus`: { teamId, usedInMatchId } | null — season-level state for the one-use
// token, persisted alongside the slot data by whatever wires this into the UI.
// `qualifierAdvantageTeamId`: the team this particular match's own standard advantage (from
// resolveSlot's seeding) belongs to, or null if this match carries none.
export function resolveAdvantageAmount(finalSlotBonus, activatedForMatchId, matchId, qualifierAdvantageTeamId) {
  const bonusActive = !!finalSlotBonus && !finalSlotBonus.usedInMatchId && activatedForMatchId === matchId
  const bonusTeamId = bonusActive ? finalSlotBonus.teamId : null
  if (bonusTeamId && qualifierAdvantageTeamId === bonusTeamId) {
    return { teamId: bonusTeamId, amount: 20 }
  }
  if (bonusTeamId) return { teamId: bonusTeamId, amount: 10 }
  if (qualifierAdvantageTeamId) return { teamId: qualifierAdvantageTeamId, amount: 10 }
  return { teamId: null, amount: 0 }
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
