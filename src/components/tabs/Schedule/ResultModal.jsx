import { useState } from 'react'
import { X } from 'lucide-react'
import { TeamPill } from '../../shared/TeamPill'

export function ResultModal({ data, persist, slotId, matchId, teamA, teamB, existing, onClose }) {
  const [battingFirst, setBattingFirst] = useState(existing ? existing.battingFirst : teamA.id)
  const [scoreA, setScoreA] = useState(existing ? String(existing.teamAScore) : '')
  const [scoreB, setScoreB] = useState(existing ? String(existing.teamBScore) : '')
  const [oversA, setOversA] = useState(existing && existing.teamAOvers != null ? String(existing.teamAOvers) : '7')
  const [oversB, setOversB] = useState(existing && existing.teamBOvers != null ? String(existing.teamBOvers) : '7')
  const [shortened, setShortened] = useState(existing ? (existing.matchOvers || 7) !== 7 : false)
  const [matchOvers, setMatchOvers] = useState(existing && existing.matchOvers ? String(existing.matchOvers) : '7')
  const [useSuperOver, setUseSuperOver] = useState(!!(existing && existing.superOver))
  const [soScoreA, setSoScoreA] = useState(existing && existing.superOver ? String(existing.superOver.teamAScore) : '')
  const [soScoreB, setSoScoreB] = useState(existing && existing.superOver ? String(existing.superOver.teamBScore) : '')
  const [err, setErr] = useState('')

  function save() {
    setErr('')
    const sA = Number(scoreA), sB = Number(scoreB)
    if (scoreA === '' || scoreB === '') { setErr('Enter both scores.'); return }
    let winnerId, superOver = null
    if (sA === sB) {
      if (!useSuperOver) { setErr("Scores are level — tick 'Super Over' below to decide a winner."); return }
      const soA = Number(soScoreA), soB = Number(soScoreB)
      if (soScoreA === '' || soScoreB === '' || soA === soB) { setErr('Enter two different Super Over scores.'); return }
      winnerId = soA > soB ? teamA.id : teamB.id
      superOver = { teamAScore: soA, teamBScore: soB, winner: winnerId }
    } else {
      winnerId = sA > sB ? teamA.id : teamB.id
    }
    const result = {
      teamA: teamA.id, teamB: teamB.id, teamAScore: sA, teamBScore: sB,
      teamAOvers: oversA === '' ? null : Number(oversA), teamBOvers: oversB === '' ? null : Number(oversB),
      battingFirst, winner: winnerId,
      matchOvers: shortened ? Number(matchOvers) || 7 : 7,
      superOver,
    }
    const slots = data.slots.map((s) => (s.id !== slotId ? s : { ...s, matches: s.matches.map((m) => (m.id !== matchId ? m : { ...m, result })) }))
    persist({ ...data, slots })
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
        <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Batted first</label>
        <select value={battingFirst} onChange={(e) => setBattingFirst(e.target.value)} className="field w-full mt-1 mb-3 px-3 py-2 text-sm">
          <option value={teamA.id}>{teamA.name}</option>
          <option value={teamB.id}>{teamB.name}</option>
        </select>

        <div className="mb-3">
          <p className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{teamA.name}</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>Score</label><input inputMode="numeric" value={scoreA} onChange={(e) => setScoreA(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
            <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>Overs faced</label><input inputMode="decimal" value={oversA} onChange={(e) => setOversA(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
          </div>
        </div>
        <div className="mb-3">
          <p className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{teamB.name}</p>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>Score</label><input inputMode="numeric" value={scoreB} onChange={(e) => setScoreB(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
            <div><label className="text-[10px]" style={{ color: 'var(--muted2)' }}>Overs faced</label><input inputMode="decimal" value={oversB} onChange={(e) => setOversB(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm" /></div>
          </div>
        </div>

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
        <p className="text-[11px] mb-3" style={{ color: 'var(--muted2)' }}>{shortened ? 'No bonus or negative points will be awarded for this match.' : 'Full 7-over match — bonus/negative points apply as usual.'}</p>

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

        {err && <p className="text-xs mb-2" style={{ color: 'var(--red)' }}>{err}</p>}

        <button onClick={save} className="gold-btn w-full py-2.5 rounded-md text-sm mt-2">{existing ? 'Update result' : 'Save result'}</button>
        {existing && <button onClick={clearResult} className="w-full py-2 rounded-md text-sm mt-2" style={{ color: 'var(--red)', background: 'transparent', border: '1px solid var(--hair2)' }}>Clear this result</button>}
      </div>
    </div>
  )
}
