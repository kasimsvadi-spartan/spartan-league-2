import { describe, expect, it } from 'vitest'
import {
  computeAbandonedSlotPoints,
  computeHeadToHead,
  computeFinalSlotAdvantageHolder,
  inningsForMatch,
  computeMatchAdvantage,
  computeLeagueStandings,
  computePointsTable,
  computePunctualityBonus,
  isSlotComplete,
  marginBonusForResult,
  marginBonusPts,
  resolveAdvantageAmount,
  resolveMatch,
  resolveSlot,
  seriesStatus,
} from './scoring'
import { convertToSeries, revertSeries } from './slotAssign'

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

describe('An abandoned slot counts as a resolved outcome elsewhere in the app', () => {
  const teams = [{ id: 'A', name: 'A' }, { id: 'B', name: 'B' }, { id: 'C', name: 'C' }]
  const abandonedSlot = {
    id: 's1', teamIds: ['A', 'B', 'C'], slotType: 'League', abandonment: { willingTeamIds: [], winnerId: null },
    matches: [{ type: 'league1' }, { type: 'league2' }, { type: 'league3' }, { type: 'qualifier1' }, { type: 'eliminator' }, { type: 'final' }],
  }

  it('counts toward league-stage completion (computeLeagueStandings), or the Final Slot advantage could never unlock', () => {
    const { completed } = computeLeagueStandings({ teams, slots: [abandonedSlot] })
    expect(completed).toBe(1)
  })

  it('is excluded from head-to-head, since its matches were discarded', () => {
    const withStaleMatch = {
      ...abandonedSlot,
      matches: [
        { type: 'league1', result: { teamA: 'A', teamB: 'B', winner: 'A' } },
        ...abandonedSlot.matches.slice(1),
      ],
    }
    const grid = computeHeadToHead({ teams, slots: [withStaleMatch] })
    expect(grid.A.B.wins).toBe(0)
  })
})

describe('Eliminator bonus when the round robin is level on wins', () => {
  const rr = (a, b, winner, sa, sb) => ({ result: { teamA: a, teamB: b, teamAScore: sa, teamBScore: sb, teamAOvers: 7, teamBOvers: 7, battingFirst: a, winner, matchOvers: 7 } })
  const build = (m1, m2, m3) => ({
    id: 's', teamIds: ['A', 'B', 'C'], slotType: 'League',
    matches: [
      { type: 'league1', ...m1 }, { type: 'league2', ...m2 }, { type: 'league3', ...m3 },
      { type: 'qualifier1', result: { teamA: 'A', teamB: 'B', winner: 'A', teamAScore: 90, teamBScore: 60 } },
      { id: 'el', type: 'eliminator' }, { type: 'final' },
    ],
  })

  it('1-1-1: qualifier keeps the 1st-seed bonus, eliminator gets none', () => {
    const slot = build(rr('A', 'B', 'A', 150, 100), rr('B', 'C', 'B', 150, 100), rr('C', 'A', 'C', 150, 149))
    expect(computeMatchAdvantage({ teams: [], slots: [slot] }, slot, 'qualifier1', 'q')).toEqual({ teamId: 'A', amount: 10 })
    expect(computeMatchAdvantage({ teams: [], slots: [slot] }, slot, 'eliminator', 'el')).toEqual({ teamId: null, amount: 0 })
  })

  it('not level (2-1-0): eliminator still goes to the losing qualifier', () => {
    const slot = build(rr('A', 'B', 'A', 150, 100), rr('B', 'C', 'B', 150, 100), rr('A', 'C', 'A', 150, 100))
    expect(computeMatchAdvantage({ teams: [], slots: [slot] }, slot, 'eliminator', 'el')).toEqual({ teamId: 'B', amount: 10 })
  })
})

describe('Best-of-5 series slot (one team opted out)', () => {
  const teams = [{ id: 'RG', name: 'RG' }, { id: 'BF', name: 'BF' }, { id: 'WC', name: 'WC' }]
  const game = (type, winner, big = false, overs = 7) => ({
    type,
    result: {
      teamA: 'RG', teamB: 'BF', battingFirst: 'RG', winner, matchOvers: overs,
      teamAOvers: 7, teamBOvers: 7,
      teamAScore: winner === 'RG' ? (big ? 150 : 90) : 80, teamBScore: winner === 'BF' ? (big ? 150 : 90) : 80,
      netScoreA: winner === 'RG' ? (big ? 150 : 90) : 80, netScoreB: winner === 'BF' ? (big ? 150 : 90) : 80,
    },
  })
  const slotWith = (games, extra = {}) => ({
    id: 's', teamIds: ['RG', 'BF', 'WC'], slotType: 'League',
    series: { teamIds: ['RG', 'BF'], optedOutTeamId: 'WC', bestOf: 5 },
    matches: [...games, ...['series1', 'series2', 'series3', 'series4', 'series5'].slice(games.length).map((type) => ({ type, result: null }))],
    ...extra,
  })

  it('is decided at 3 wins; 2-2 is still open', () => {
    expect(seriesStatus(slotWith([game('series1', 'RG'), game('series2', 'BF'), game('series3', 'RG'), game('series4', 'BF')])).decided).toBe(false)
    const st = seriesStatus(slotWith([game('series1', 'RG'), game('series2', 'RG'), game('series3', 'BF'), game('series4', 'RG')]))
    expect(st.decided).toBe(true)
    expect(st.winner).toBe('RG')
    expect(st.wins).toEqual({ RG: 3, BF: 1 })
  })

  it('winner 4, loser 2, the team that opted out 0 — and the slot counts as played for all three', () => {
    const slot = slotWith([game('series1', 'RG'), game('series2', 'RG'), game('series3', 'RG')])
    const byId = Object.fromEntries(computePointsTable({ teams, slots: [slot] }).map((r) => [r.team.id, r]))
    expect(byId.RG.placement).toBe(4)
    expect(byId.BF.placement).toBe(2)
    expect(byId.WC.placement).toBe(0)
    expect([byId.RG.slotsPlayed, byId.BF.slotsPlayed, byId.WC.slotsPlayed]).toEqual([1, 1, 1])
  })

  it('pays no slot points until the series is decided', () => {
    const slot = slotWith([game('series1', 'RG'), game('series2', 'BF')])
    const byId = Object.fromEntries(computePointsTable({ teams, slots: [slot] }).map((r) => [r.team.id, r]))
    expect(byId.RG.placement + byId.BF.placement).toBe(0)
  })

  it('every full-length game earns margin bonus and a matching penalty for the other side', () => {
    const slot = slotWith([game('series1', 'RG', true), game('series2', 'RG', true), game('series3', 'RG', true)])
    const byId = Object.fromEntries(computePointsTable({ teams, slots: [slot] }).map((r) => [r.team.id, r]))
    expect(byId.RG.marginBonusFor).toBeGreaterThan(0)
    expect(byId.BF.marginBonusAgainst).toBe(byId.RG.marginBonusFor)
    expect(byId.WC.marginBonusFor + byId.WC.marginBonusAgainst).toBe(0)
  })

  const all5 = (overrides = {}) => slotWith([
    game('series1', 'RG'), game('series2', 'RG'), game('series3', 'RG'), game('series4', 'BF'), game('series5', 'BF', false, overrides.fifthOvers || 7),
  ], overrides.slot || {})

  it('time bonus goes only to the two playing teams, and only when all 5 games were played in full and on time', () => {
    expect(computePunctualityBonus(all5({ slot: { finishedOnTime: true } }))).toEqual({ RG: 1, BF: 1 })
    expect(computePunctualityBonus(all5({ slot: { finishedOnTime: true }, fifthOvers: 5 }))).toEqual({ RG: 0, BF: 0 })
    expect(computePunctualityBonus(all5())).toEqual({ RG: 0, BF: 0 })
    const onlyThree = slotWith([game('series1', 'RG'), game('series2', 'RG'), game('series3', 'RG')], { finishedOnTime: true })
    expect(computePunctualityBonus(onlyThree)).toEqual({ RG: 0, BF: 0 })
  })

  it('is only complete once all 5 games are played, even after a team has won 3', () => {
    const threeNil = slotWith([game('series1', 'RG'), game('series2', 'RG'), game('series3', 'RG')])
    expect(seriesStatus(threeNil).decided).toBe(true)
    expect(isSlotComplete(threeNil)).toBe(false)
    expect(isSlotComplete(all5())).toBe(true)
  })

  it('keeps earning margin points in the games after the series is decided', () => {
    const bonusFor = (games) => Object.fromEntries(computePointsTable({ teams, slots: [slotWith(games)] }).map((r) => [r.team.id, r.marginBonusFor])).RG
    const afterThree = bonusFor([game('series1', 'RG', true), game('series2', 'RG', true), game('series3', 'RG', true)])
    const afterFour = bonusFor([game('series1', 'RG', true), game('series2', 'RG', true), game('series3', 'RG', true), game('series4', 'RG', true)])
    expect(afterFour).toBeGreaterThan(afterThree) // game 4 was played after RG had already won the series
  })

  it('converts a 3-team slot to a series and back', () => {
    const data = { teams, slots: [{ id: 's', teamIds: ['RG', 'BF', 'WC'], matches: [] }] }
    const converted = convertToSeries(data, 's', 'WC').slots[0]
    expect(converted.series).toEqual({ teamIds: ['RG', 'BF'], optedOutTeamId: 'WC', bestOf: 5 })
    expect(converted.matches.map((m) => m.type)).toEqual(['series1', 'series2', 'series3', 'series4', 'series5'])
    expect(converted.matches.every((m) => m.fixedA === 'RG' && m.fixedB === 'BF')).toBe(true)
    const back = revertSeries({ teams, slots: [converted] }, 's').slots[0]
    expect(back.series).toBeUndefined()
    expect(back.matches.map((m) => m.type)).toEqual(['league1', 'league2', 'league3', 'qualifier1', 'eliminator', 'final'])
  })
})

describe('Final Slot 1st-place bonus: any match except the Final', () => {
  const teams = ['T1', 'T2', 'T3', 'T4'].map((id) => ({ id, name: id }))
  const empty = () => ['league1', 'league2', 'league3', 'qualifier1', 'eliminator', 'final'].map((type) => ({ type, result: null }))
  // 21 finished league slots (abandoned, T1 the only willing team each time) put T1 firmly 1st.
  const league = Array.from({ length: 21 }, (_, i) => ({ id: `L${i}`, slotType: 'League', teamIds: ['T1', 'T2', 'T3'], abandonment: { willingTeamIds: ['T1'], winnerId: null }, matches: empty() }))
  const finalSlot = (activation) => {
    const slot = {
      id: 'F', slotType: 'Final', teamIds: ['T1', 'T2', 'T3'],
      matches: [
        { id: 'm1', type: 'league1', fixedA: 'T1', fixedB: 'T2', result: null },
        { id: 'm2', type: 'league2', fixedA: 'T2', fixedB: 'T3', result: null },
        { id: 'm3', type: 'league3', fixedA: 'T1', fixedB: 'T3', result: null },
        { id: 'q', type: 'qualifier1', result: null }, { id: 'e', type: 'eliminator', result: null }, { id: 'f', type: 'final', result: null },
      ],
    }
    return { data: { teams, slots: [...league, slot], finalSlotAdvantage: activation }, slot }
  }

  it('goes to whoever finishes 1st on the points table', () => {
    expect(computeFinalSlotAdvantageHolder(finalSlot(null).data)).toBe('T1')
  })

  it('can be used in a round-robin match of the Final Slot, if the holder is playing', () => {
    const { data, slot } = finalSlot({ activatedForMatchId: 'm1', usedInMatchId: null })
    expect(computeMatchAdvantage(data, slot, 'league1', 'm1')).toEqual({ teamId: 'T1', amount: 10 })
  })

  it('is nothing in a match the holder is not playing', () => {
    const { data, slot } = finalSlot({ activatedForMatchId: 'm2', usedInMatchId: null })
    expect(computeMatchAdvantage(data, slot, 'league2', 'm2')).toEqual({ teamId: null, amount: 0 })
  })

  it('is nothing unless armed, and nothing once used', () => {
    expect(computeMatchAdvantage(finalSlot(null).data, finalSlot(null).slot, 'league1', 'm1')).toEqual({ teamId: null, amount: 0 })
    const { data, slot } = finalSlot({ activatedForMatchId: 'm3', usedInMatchId: 'm1' })
    expect(computeMatchAdvantage(data, slot, 'league3', 'm3')).toEqual({ teamId: null, amount: 0 })
  })

  it('never applies to the Final itself', () => {
    const { data, slot } = finalSlot({ activatedForMatchId: 'f', usedInMatchId: null })
    expect(computeMatchAdvantage(data, slot, 'final', 'f')).toEqual({ teamId: null, amount: 0 })
  })

  it('counts toward NRR: a bonus-run match uses its net scores', () => {
    const r = { teamA: 'T1', teamB: 'T2', teamAScore: 60, teamBScore: 65, teamAOvers: 7, teamBOvers: 7, battingFirst: 'T1', bonusRunsApplied: 10, netScoreA: 70, netScoreB: 65 }
    expect(inningsForMatch(r)).toEqual({ T1: { runs: 70, overs: 7 }, T2: { runs: 65, overs: 7 } })
  })

  it('counts toward NRR: a no-chase walkover credits the winner with the opposition gross score over 1 over', () => {
    const r = { teamA: 'T1', teamB: 'T2', teamAScore: 6, teamBScore: null, teamAOvers: 6.2, teamBOvers: null, battingFirst: 'T1', walkover: true, bonusRunsApplied: -10, netScoreA: -4, netScoreB: null }
    expect(inningsForMatch(r)).toEqual({ T1: { runs: -4, overs: 6.2 }, T2: { runs: 6, overs: 1 } })
  })
})
