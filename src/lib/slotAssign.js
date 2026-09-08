import { MATCH_ORDER } from './scoring'

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
