import { MATCH_ORDER, SERIES_ORDER } from './scoring'
import { uid } from './uid'

// Fills in the teams for a slot that was created as an empty shell (a knockout slot
// scheduled for a known date before qualification is known — teamIds: [] at creation time).
// Regenerates the round-robin matches' fixedA/fixedB from the newly-assigned teams; leaves
// qualifier1/eliminator/final untouched since they always resolve dynamically from results,
// never from fixed team refs, regardless of when the slot's teams were assigned.
export function assignTeamsToSlot(data, slotId, teamIds) {
  const [a, b, c] = teamIds
  const slots = data.slots.map((s) => {
    if (s.id !== slotId) return s
    const matches = MATCH_ORDER.map((type) => {
      const existing = s.matches.find((m) => m.type === type)
      if (type === 'league1') return { ...existing, fixedA: a, fixedB: b }
      if (type === 'league2') return { ...existing, fixedA: b, fixedB: c }
      if (type === 'league3') return { ...existing, fixedA: a, fixedB: c }
      return existing
    })
    return { ...s, teamIds, matches }
  })
  return { ...data, slots }
}

// The usual 6-match tri-series for three teams.
function roundRobinMatches([a, b, c]) {
  return MATCH_ORDER.map((type) => {
    if (type === 'league1') return { id: uid('m'), type, fixedA: a, fixedB: b, result: null }
    if (type === 'league2') return { id: uid('m'), type, fixedA: b, fixedB: c, result: null }
    if (type === 'league3') return { id: uid('m'), type, fixedA: a, fixedB: c, result: null }
    return { id: uid('m'), type, result: null }
  })
}

// One of the slot's three teams has opted out, so the other two play a best-of-5 series
// instead (see seriesStatus in scoring.js). Replaces the slot's matches with five games
// between the two teams. The caller must make sure no results have been entered yet —
// this swaps the match list out, so anything already played would be lost.
export function convertToSeries(data, slotId, optedOutTeamId) {
  const slots = data.slots.map((s) => {
    if (s.id !== slotId) return s
    const playing = s.teamIds.filter((id) => id !== optedOutTeamId)
    const matches = SERIES_ORDER.map((type) => ({ id: uid('m'), type, fixedA: playing[0], fixedB: playing[1], result: null }))
    return { ...s, series: { teamIds: playing, optedOutTeamId, bestOf: 5 }, matches }
  })
  return { ...data, slots }
}

// Undo of convertToSeries: back to the normal 3-team slot. Same caveat — only with no results.
export function revertSeries(data, slotId) {
  const slots = data.slots.map((s) => {
    if (s.id !== slotId) return s
    const { series: _series, ...rest } = s
    return { ...rest, matches: roundRobinMatches(s.teamIds) }
  })
  return { ...data, slots }
}
