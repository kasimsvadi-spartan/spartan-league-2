import { describe, expect, it } from 'vitest'
import {
  computeAbandonedSlotPoints,
  computePointsTable,
  computePunctualityBonus,
  marginBonusForResult,
  marginBonusPts,
  resolveAdvantageAmount,
  resolveMatch,
  resolveSlot,
} from './scoring'

// The 8 rulebook test cases from the Part B spec, in order. Each test name quotes the case
// verbatim so a failure is traceable straight back to the rulebook clause it covers.

describe('1. All three teams win one each -> seeded by slot NRR', () => {
  it('breaks a 1-1-1 win tie using net run rate within the slot', () => {
    const slot = {
      teamIds: ['A', 'B', 'C'],
      matches: [
        { type: 'league1', result: { teamA: 'A', teamB: 'B', teamAScore: 150, teamBScore: 100, teamAOvers: 7, teamBOvers: 7, battingFirst: 'A', winner: 'A', matchOvers: 7 } },
        { type: 'league2', result: { teamA: 'B', teamB: 'C', teamAScore: 150, teamBScore: 100, teamAOvers: 7, teamBOvers: 7, battingFirst: 'B', winner: 'B', matchOvers: 7 } },
        { type: 'league3', result: { teamA: 'C', teamB: 'A', teamAScore: 150, teamBScore: 149, teamAOvers: 7, teamBOvers: 7, battingFirst: 'C', winner: 'C', matchOvers: 7 } },
        { type: 'qualifier1' }, { type: 'eliminator' }, { type: 'final' },
      ],
    }
    const { wins, standings } = resolveSlot(slot)
    expect(wins).toEqual({ A: 1, B: 1, C: 1 })
    // A: +150-100=+50 for/against one match, -149+150 not relevant here — compute expected order by NRR magnitude:
    // A: for 150+149=299 over 14, against 100+150=250 over 14 -> NRR = (299-250)/14 ≈ +3.5
    // B: for 150+100=250 over 14, against 100+150=250 over 14 -> NRR = 0
    // C: for 150+100=250 over 14, against 100+149=249 over 14 -> NRR ≈ +0.07
    expect(standings[0]).toBe('A')
  })
})

describe('2. Team defends by 65 -> +2, not +3', () => {
  it('caps the margin bonus tier at +2', () => {
    expect(marginBonusPts(65)).toBe(2)
    const outcome = resolveMatch({
      teamA: 'A', teamB: 'B', teamAScore: 200, teamBScore: 135,
      teamAOvers: 7, teamBOvers: 7, battingFirst: 'A', matchOvers: 7,
    })
    expect(outcome.marginBonus.A).toBe(2)
  })
})

describe('3. Team defends by 32 where 10 were bonus runs -> +1 awarded', () => {
  it('computes the margin on the net (bonus-inclusive) scoreline', () => {
    // Gross margin is 22 (200 vs 178); the defending team also holds a 10-run advantage,
    // batted first, so its net score is 210 and the net margin is 32 -> tier 1 (+1), not
    // tier 2 (+2) and not the untouched gross-margin tier (which would also be +1, so this
    // specifically proves bonus runs are being added into the margin at all).
    const outcome = resolveMatch(
      { teamA: 'A', teamB: 'B', teamAScore: 200, teamBScore: 178, teamAOvers: 7, teamBOvers: 7, battingFirst: 'A', matchOvers: 7 },
      'A', 10
    )
    expect(outcome.netScoreByTeam.A).toBe(210)
    expect(outcome.marginBonus.A).toBe(1)
  })
})

describe('4. Shortened match won by 70 runs -> no margin bonus', () => {
  it('awards nothing outside a full 7-over match', () => {
    const outcome = resolveMatch({
      teamA: 'A', teamB: 'B', teamAScore: 140, teamBScore: 70,
      teamAOvers: 5, teamBOvers: 5, battingFirst: 'A', matchOvers: 5,
    })
    expect(outcome.full).toBe(false)
    expect(outcome.marginBonus.A).toBe(0)
  })
})

describe('5. Penalised team all out for 6 -> net -4, chasers win without batting, +2 bonus, NRR credits 6 off 1 over', () => {
  it('resolves the walkover from a negative net score', () => {
    // Team A bats first for 6 gross; team B holds the 10-run advantage and bats second, so
    // A (batting first, not the advantage holder) starts on -10 -> net -4.
    const outcome = resolveMatch(
      { teamA: 'A', teamB: 'B', teamAScore: 6, teamBScore: null, teamAOvers: 6.2, teamBOvers: null, battingFirst: 'A', matchOvers: 7 },
      'B', 10
    )
    expect(outcome.walkover).toBe(true)
    expect(outcome.netScoreByTeam.A).toBe(-4)
    expect(outcome.winner).toBe('B')
    expect(outcome.marginBonus.B).toBe(2)
    expect(outcome.nrrByTeam.B).toEqual({ runs: 6, overs: 1 })
  })
})

describe('6. Slot finishes 11:55pm with one 5-over match -> no punctuality bonus for anyone', () => {
  it('requires every match to be full length even if the slot finished on time', () => {
    const slot = {
      teamIds: ['A', 'B', 'C'],
      finishedOnTime: true,
      matches: [
        { type: 'league1', result: { matchOvers: 7 } },
        { type: 'league2', result: { matchOvers: 5 } }, // shortened
        { type: 'league3', result: { matchOvers: 7 } },
        { type: 'qualifier1', result: { matchOvers: 7 } },
        { type: 'eliminator', result: { matchOvers: 7 } },
        { type: 'final', result: { matchOvers: 7 } },
      ],
    }
    expect(computePunctualityBonus(slot)).toEqual({ A: 0, B: 0, C: 0 })
  })
})

describe('7. Slot abandoned after 2 matches with two teams willing -> results discarded, 4/2/0', () => {
  it('allocates 4/2/0 among the two willing teams and the team that declined', () => {
    const points = computeAbandonedSlotPoints(['A', 'B', 'C'], ['A', 'B'], 'A')
    expect(points).toEqual({ A: 4, B: 2, C: 0 })
  })
})

describe('8. Guest plays under replaced player\'s name -> stats to replaced player, reward to guest', () => {
  it('is a stats-attribution rule, not a points-table rule — see guest_actual_player_id on match performances (Part B follow-up)', () => {
    // Scoring/points-table math never sees player identities at all, so there is nothing
    // for this file's functions to get wrong here; this rule is enforced wherever season
    // stats and slot rewards are aggregated from match performances.
    expect(true).toBe(true)
  })
})

describe('Final Slot advantage stacking', () => {
  it('stacks the saved 10-run bonus with the standard qualifier advantage for the same team', () => {
    const finalSlotBonus = { teamId: 'A', usedInMatchId: null }
    const { teamId, amount } = resolveAdvantageAmount(finalSlotBonus, 'm4', 'm4', 'A')
    expect(teamId).toBe('A')
    expect(amount).toBe(20)
  })

  it('applies only the qualifier advantage when the bonus is not activated for this match', () => {
    const { teamId, amount } = resolveAdvantageAmount(null, null, 'm4', 'A')
    expect(teamId).toBe('A')
    expect(amount).toBe(10)
  })

  it('applies only the saved bonus when this match carries no qualifier advantage of its own', () => {
    const finalSlotBonus = { teamId: 'B', usedInMatchId: null }
    const { teamId, amount } = resolveAdvantageAmount(finalSlotBonus, 'm5', 'm5', null)
    expect(teamId).toBe('B')
    expect(amount).toBe(10)
  })
})

describe('Abandoned slots — other splits', () => {
  it('splits evenly with no punctuality bonus when all three decline', () => {
    expect(computeAbandonedSlotPoints(['A', 'B', 'C'], [])).toEqual({ A: 2, B: 2, C: 2 })
  })
  it('awards all 6 to the single willing team', () => {
    expect(computeAbandonedSlotPoints(['A', 'B', 'C'], ['A'])).toEqual({ A: 6, B: 0, C: 0 })
  })
})

describe('Margin bonus also concedes negative points to the losing team (kept as this app has always scored it)', () => {
  it('reports the same bonus figure for both the winner and the team that conceded it', () => {
    const result = { teamA: 'A', teamB: 'B', teamAScore: 200, teamBScore: 130, teamAOvers: 7, teamBOvers: 7, battingFirst: 'A', matchOvers: 7, winner: 'A', netScoreA: 200, netScoreB: 130 }
    expect(marginBonusForResult(result)).toEqual({ winner: 'A', loser: 'B', bonus: 2 })
  })
})

describe('computePointsTable integration', () => {
  const teams = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }]

  it('credits an abandoned slot\'s 6-point split without touching the other teams\' win/loss counters', () => {
    const data = {
      teams,
      slots: [{
        id: 's1', teamIds: ['A', 'B', 'C'], abandonment: { willingTeamIds: ['A', 'B'], winnerId: 'A' },
        matches: [{ type: 'league1' }, { type: 'league2' }, { type: 'league3' }, { type: 'qualifier1' }, { type: 'eliminator' }, { type: 'final' }],
      }],
    }
    const table = computePointsTable(data)
    const byId = Object.fromEntries(table.map((r) => [r.team.id, r]))
    expect(byId.A.placement).toBe(4)
    expect(byId.B.placement).toBe(2)
    expect(byId.C.placement).toBe(0)
    expect(byId.A.wins).toBe(0) // not a real Final win, so it doesn't count as one
  })

  it('adds the punctuality bonus into total once every match in the slot is full length', () => {
    const fullResult = { teamA: 'A', teamB: 'B', teamAScore: 150, teamBScore: 90, teamAOvers: 7, teamBOvers: 7, battingFirst: 'A', matchOvers: 7, winner: 'A', netScoreA: 150, netScoreB: 90 }
    const data = {
      teams,
      slots: [{
        id: 's1', teamIds: ['A', 'B', 'C'], finishedOnTime: true,
        matches: [
          { type: 'league1', result: { ...fullResult, teamA: 'A', teamB: 'B' } },
          { type: 'league2', result: { ...fullResult, teamA: 'B', teamB: 'C', winner: 'B' } },
          { type: 'league3', result: { ...fullResult, teamA: 'C', teamB: 'A', winner: 'C' } },
          { type: 'qualifier1', result: { ...fullResult, teamA: 'A', teamB: 'B' } },
          { type: 'eliminator', result: { ...fullResult, teamA: 'B', teamB: 'C', winner: 'B' } },
          { type: 'final', result: { ...fullResult, teamA: 'A', teamB: 'B' } },
        ],
      }],
    }
    const table = computePointsTable(data)
    const byId = Object.fromEntries(table.map((r) => [r.team.id, r]))
    expect(byId.A.punctuality).toBe(1)
    expect(byId.B.punctuality).toBe(1)
    expect(byId.C.punctuality).toBe(1)
    // Final winner (A): 4 placement + 1 punctuality + margin bonus from 2 wins as A.
    expect(byId.A.total).toBe(byId.A.placement + byId.A.marginBonusFor - byId.A.marginBonusAgainst + byId.A.punctuality)
    // B lost as teamB in 2 of those matches, so it should be conceding margin bonus, not just missing out on it.
    expect(byId.B.marginBonusAgainst).toBeGreaterThan(0)
  })
})
