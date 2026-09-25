import { useState } from 'react'
import { X, Zap } from 'lucide-react'
import { TeamPill } from '../../shared/TeamPill'
import { bonusRunsForFirstBatting, computeMatchAdvantage } from '../../../lib/scoring'

// `slot` and `matchType` let this compute the match's own bonus/penalty-run advantage
// (rulebook section 9) via the single computeMatchAdvantage source of truth, instead of
// duplicating that logic here or trusting a value passed down from elsewhere.
export function ResultModal({ data, persist, slotId, matchId, teamA, teamB, slot, matchType, existing, onClose }) {
  const [battingFirst, setBattingFirst] = useState(existing ? existing.battingFirst : teamA.id)
  const [scoreA, setScoreA] = useState(existing && existing.teamAScore != null ? String(existing.teamAScore) : '')
  const [scoreB, setScoreB] = useState(existing && existing.teamBScore != null ? String(existing.teamBScore) : '')
  const [oversA, setOversA] = useState(existing && existing.teamAOvers != null ? String(existing.teamAOvers) : '7')
  const [oversB, setOversB] = useState(existing && existing.teamBOvers != null ? String(existing.teamBOvers) : '7')
  const [shortened, setShortened] = useState(existing ? (existing.matchOvers || 7) !== 7 : false)
  const [matchOvers, setMatchOvers] = useState(existing && existing.matchOvers ? String(existing.matchOvers) : '7')
  const [useSuperOver, setUseSuperOver] = useState(!!(existing && existing.superOver))
  const [soScoreA, setSoScoreA] = useState(existing && existing.superOver ? String(existing.superOver.teamAScore) : '')
  const [soScoreB, setSoScoreB] = useState(existing && existing.superOver ? String(existing.superOver.teamBScore) : '')
  const [err, setErr] = useState('')

  const advantage = slot && matchType ? computeMatchAdvantage(data, slot, matchType, matchId) : { teamId: null, amount: 0 }
  const advantageTeam = advantage.teamId === teamA.id ? teamA : advantage.teamId === teamB.id ? teamB : null

  const firstId = battingFirst
  const secondId = firstId === teamA.id ? teamB.id : teamA.id
  const firstScoreRaw = firstId === teamA.id ? scoreA : scoreB
  const firstOversRaw = firstId === teamA.id ? oversA : oversB
  const bonusAdj = bonusRunsForFirstBatting({ teamA: teamA.id, teamB: teamB.id, battingFirst }, advantage.teamId, advantage.amount)
  const firstGrossNum = firstScoreRaw === '' ? null : Number(firstScoreRaw)
  const firstNet = firstGrossNum == null ? null : firstGrossNum + bonusAdj
  const isWalkover = firstNet != null && firstNet < 0

  function save() {
    setErr('')
    if (firstScoreRaw === '') { setErr('Enter the score for whichever team batted first.'); return }
    const firstOvers = firstOversRaw === '' ? null : Number(firstOversRaw)

    let result
    if (isWalkover) {
      // Section 9: the team batting first finishes on a negative net total, so the second
      // team wins immediately without batting at all.
      result = {
        teamA: teamA.id, teamB: teamB.id,
        teamAScore: firstId === teamA.id ? firstGrossNum : null,
        teamBScore: firstId === teamB.id ? firstGrossNum : null,
        teamAOvers: firstId === teamA.id ? firstOvers : null,
        teamBOvers: firstId === teamB.id ? firstOvers : null,
        battingFirst, winner: secondId,
        matchOvers: shortened ? Number(matchOvers) || 7 : 7,
        superOver: null, walkover: true,
        advantageTeamId: advantage.teamId, advantageAmount: advantage.amount, bonusRunsApplied: bonusAdj,
        netScoreA: firstId === teamA.id ? firstNet : null,
        netScoreB: firstId === teamB.id ? firstNet : null,
      }
    } else {
      const secondScoreRaw = secondId === teamA.id ? scoreA : scoreB
      if (secondScoreRaw === '') { setErr('Enter both scores.'); return }
      const secondGross = Number(secondScoreRaw)
      const secondOversRaw = secondId === teamA.id ? oversA : oversB
      const secondOvers = secondOversRaw === '' ? null : Number(secondOversRaw)
      const secondNet = secondGross

      let winnerId, superOver = null
      if (firstNet === secondNet) {
        if (!useSuperOver) { setErr("Scores are level — tick 'Super Over' below to decide a winner."); return }
        const soA = Number(soScoreA), soB = Number(soScoreB)
        if (soScoreA === '' || soScoreB === '' || soA === soB) { setErr('Enter two different Super Over scores.'); return }
        winnerId = soA > soB ? teamA.id : teamB.id
        superOver = { teamAScore: soA, teamBScore: soB, winner: winnerId }
      } else {
        winnerId = firstNet > secondNet ? firstId : secondId
      }

      result = {
        teamA: teamA.id, teamB: teamB.id,
        teamAScore: firstId === teamA.id ? firstGrossNum : secondGross,
        teamBScore: firstId === teamB.id ? firstGrossNum : secondGross,
        teamAOvers: firstId === teamA.id ? firstOvers : secondOvers,
        teamBOvers: firstId === teamB.id ? firstOvers : secondOvers,
        battingFirst, winner: winnerId,
        matchOvers: shortened ? Number(matchOvers) || 7 : 7,
        superOver, walkover: false,
        advantageTeamId: advantage.teamId, advantageAmount: advantage.amount, bonusRunsApplied: bonusAdj,
        netScoreA: firstId === teamA.id ? firstNet : secondNet,
        netScoreB: firstId === teamB.id ? firstNet : secondNet,
      }
    }

    let next = data
    // If this match was carrying the activated Final Slot bonus, saving its result spends
    // the one-use token permanently — section 9, "the bonus can be used once only".
    const activation = data.finalSlotAdvantage
    if (activation && activation.activatedForMatchId === matchId && !activation.usedInMatchId) {
      next = { ...next, finalSlotAdvantage: { ...activation, usedInMatchId: matchId } }
    }
    const slots = next.slots.map((s) => (s.id !== slotId ? s : { ...s, matches: s.matches.map((m) => (m.id !== matchId ? m : { ...m, result })) }))
    persist({ ...next, slots })
    onClose()
  }

  function clearResult() {
    const slots = data.slots.map((s) => (s.id !== slotId ? s : { ...s, matches: s.matches.map((m) => (m.id !== matchId ? m : { ...m, result: null })) }))
    persist({ ...data, slots })
    onClose()
  }

  return (
    <div className="modal-overlay items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="ember-card w-full sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ borderRadius: '16px 16px 0 0' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="display text-lg flex items-center gap-2"><TeamPill team={teamA} /> <span style={{ color: 'var(--muted2)' }}>v</span> <TeamPill team={teamB} /></h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {advantageTeam && (
          <div className="flex items-start gap-2 px-2.5 py-2 rounded-md mb-3" style={{ background: 'rgba(239, 193, 58, 0.1)', border: '1px solid var(--hair2)' }}>
            <Zap size={14} color="var(--gold)" style={{ marginTop: 2, flexShrink: 0 }} />
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              <strong style={{ color: 'var(--gold-light)' }}>{advantageTeam.name}</strong> holds a {advantage.amount}-run advantage this match{advantage.amount === 20 ? ' (qualifier advantage + saved Final Slot bonus, stacked)' : ''}.
              {' '}{advantageTeam.id === battingFirst ? `${advantage.amount} runs are added to their score.` : `Whoever bats first starts on minus ${advantage.amount}.`}
            </p>
          </div>
        )}

        <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Batted first</label>
        <select value={battingFirst} onChange={(e) => setBattingFirst(e.target.value)} className="field w-full mt-1 mb-3 px-3 py-2 text-sm">
          <option value={teamA.id}>{teamA.name}</option>
          <option value={teamB.id}>{teamB.name}</option>
        </select>

        {isWalkover && secondId === teamA.id ? (
          <div className="mb-3 px-2.5 py-2 rounded-md" style={{ background: 'rgba(215, 72, 77, 0.12)', border: '1px solid var(--red)' }}>
            <p className="text-xs" style={{ color: 'var(--red)' }}>
              {teamB.name}'s net total is {firstNet} — {teamA.name} wins immediately without batting.
            </p>
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{teamA.name}{battingFirst === teamA.id ? ' (batted first)' : ''}</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>Score</label><input inputMode="numeric" value={scoreA} onChange={(e) => setScoreA(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
              <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>Overs faced</label><input inputMode="decimal" value={oversA} onChange={(e) => setOversA(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
            </div>
          </div>
        )}

        {isWalkover && secondId === teamB.id ? (
          <div className="mb-3 px-2.5 py-2 rounded-md" style={{ background: 'rgba(215, 72, 77, 0.12)', border: '1px solid var(--red)' }}>
            <p className="text-xs" style={{ color: 'var(--red)' }}>
              {teamA.name}'s net total is {firstNet} — {teamB.name} wins immediately without batting.
            </p>
          </div>
        ) : (
          <div className="mb-3">
            <p className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{teamB.name}{battingFirst === teamB.id ? ' (batted first)' : ''}</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>Score</label><input inputMode="numeric" value={scoreB} onChange={(e) => setScoreB(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
              <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>Overs faced</label><input inputMode="decimal" value={oversB} onChange={(e) => setOversB(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" checked={shortened} onChange={(e) => setShortened(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
          Match was shortened (not a full 7-over contest)
        </label>
        {shortened && (
          <div className="mb-2">
            <label className="text-xs" style={{ color: 'var(--muted)' }}>Overs allotted for this match</label>
            <input inputMode="numeric" value={matchOvers} onChange={(e) => setMatchOvers(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" />
          </div>
        )}
        <p className="text-[11px] mb-3" style={{ color: 'var(--muted2)' }}>{shortened ? 'No margin bonus will be awarded for this match.' : 'Full 7-over match — margin bonus applies as usual.'}</p>

        {!isWalkover && (
          <>
            <label className="flex items-center gap-2 text-sm mb-2">
              <input type="checkbox" checked={useSuperOver} onChange={(e) => setUseSuperOver(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
              Went to a Super Over (knockout stage)
            </label>
            {useSuperOver && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>{teamA.name} Super Over</label><input inputMode="numeric" value={soScoreA} onChange={(e) => setSoScoreA(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
                <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>{teamB.name} Super Over</label><input inputMode="numeric" value={soScoreB} onChange={(e) => setSoScoreB(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
              </div>
            )}
          </>
        )}

        {err && <p className="text-xs mb-2" style={{ color: 'var(--red)' }}>{err}</p>}

        <button onClick={save} className="gold-btn w-full py-2.5 rounded-md text-sm mt-2">{existing ? 'Update result' : 'Save result'}</button>
        {existing && <button onClick={clearResult} className="w-full py-2 rounded-md text-sm mt-2" style={{ color: 'var(--red)', background: 'transparent', border: '1px solid var(--hair2)' }}>Clear this result</button>}
      </div>
    </div>
  )
}
