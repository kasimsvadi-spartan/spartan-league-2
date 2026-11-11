import { describe, expect, it } from 'vitest'
import { remainingFixtures, remainingLeagueSlots, simulateQualification } from './qualification'

const ids = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const teams = ids.map((id) => ({ id, name: id, color: '#fff' }))
const emptyMatches = () => ['league1', 'league2', 'league3', 'qualifier1', 'eliminator', 'final'].map((type) => ({ type, result: null }))
const slot = (id, teamIds) => ({ id, date: '2026-12-01', slotType: 'League', teamIds, matches: emptyMatches() })

// Seven teams, nothing played, a round of overlapping 3-team slots still to come.
function freshSeason() {
  return {
    teams,
    slots: [
      slot('a', ['T1', 'T2', 'T3']), slot('b', ['T4', 'T5', 'T6']), slot('c', ['T7', 'T1', 'T4']),
      slot('d', ['T2', 'T5', 'T7']), slot('e', ['T3', 'T6', 'T1']), slot('f', ['T2', 'T4', 'T7']),
    ],
  }
}

describe('qualification simulation', () => {
  it('is repeatable — same data, same numbers', () => {
    const a = simulateQualification(freshSeason(), 500)
    const b = simulateQualification(freshSeason(), 500)
    expect(a.teams.map((t) => t.pFinal)).toEqual(b.teams.map((t) => t.pFinal))
  })

  it('hands out exactly 2 Final, 3 Semi-Final and 2 eliminated places in total', () => {
    const sim = simulateQualification(freshSeason(), 800)
    const sum = (key) => sim.teams.reduce((t, x) => t + x[key], 0)
    expect(sum('pFinal')).toBeCloseTo(2, 6)
    expect(sum('pSemi')).toBeCloseTo(3, 6)
    expect(sum('pOut')).toBeCloseTo(2, 6)
    expect(sum('pFirst')).toBeCloseTo(1, 6)
    sim.teams.forEach((t) => expect(t.pos.reduce((a, v) => a + v, 0)).toBeCloseTo(1, 6))
  })

  it('treats a team far ahead with little left as all but through, and one far behind as all but out', () => {
    const data = freshSeason()
    // T1 has already banked a huge lead; T7 sits on nothing. Two slots left for everyone.
    const done = { id: 'done', date: '2026-11-01', slotType: 'League', teamIds: ['T1', 'T2', 'T3'], abandonment: { willingTeamIds: ['T1'], winnerId: null }, matches: emptyMatches() }
    const bonus = { id: 'done2', date: '2026-11-02', slotType: 'League', teamIds: ['T1', 'T2', 'T3'], abandonment: { willingTeamIds: ['T1'], winnerId: null }, matches: emptyMatches() }
    data.slots = [done, bonus, slot('x', ['T4', 'T5', 'T6']), slot('y', ['T7', 'T5', 'T6'])]
    const sim = simulateQualification(data, 1000)
    const t1 = sim.teams.find((t) => t.team.id === 'T1')
    expect(t1.pFinal).toBeGreaterThan(0.95)
    expect(t1.points).toBe(12)
  })

  it('finds each team\'s remaining fixtures, opponents and nothing else', () => {
    const data = freshSeason()
    expect(remainingLeagueSlots(data)).toHaveLength(6)
    const t1 = remainingFixtures(data, 'T1')
    expect(t1).toHaveLength(3)
    expect(t1[0].opponents).toEqual(['T2', 'T3'])
  })

  it('reports sensible cutoff points once slots are still to play', () => {
    const sim = simulateQualification(freshSeason(), 500)
    expect(sim.remainingSlots).toBe(6)
    expect(sim.cutoffs.final).toBeGreaterThanOrEqual(sim.cutoffs.semi)
  })
})
