import { useState } from 'react'
import { X } from 'lucide-react'

export function ManualRecordModal({ data, persist, kind, existing, onClose }) {
  const [name, setName] = useState(existing?.name || '')
  const [teamId, setTeamId] = useState(existing?.teamId || data.teams[0]?.id || '')
  const [value, setValue] = useState(existing?.value != null ? String(existing.value) : '')
  const [runs, setRuns] = useState(existing?.runs != null ? String(existing.runs) : '')
  const [label, setLabel] = useState(existing?.label || '')

  function save() {
    const team = data.teams.find((t) => t.id === teamId)
    let record
    if (kind === 'highestScore') {
      if (!name.trim() || value === '') return
      record = { name: name.trim(), teamId, team, value: Number(value), label: label.trim() || 'Manually recorded' }
    } else {
      if (!name.trim() || value === '') return
      record = { name: name.trim(), teamId, team, wickets: Number(value), runs: runs === '' ? null : Number(runs), label: label.trim() || 'Manually recorded' }
    }
    persist({ ...data, manualRecords: { ...data.manualRecords, [kind]: record } })
    onClose()
  }
  function clear() {
    persist({ ...data, manualRecords: { ...data.manualRecords, [kind]: null } })
    onClose()
  }

  return (
    <div className="modal-overlay items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="ember-card w-full sm:max-w-md" style={{ borderRadius: '16px 16px 0 0' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <p className="display text-lg gold-text">{kind === 'highestScore' ? 'Highest Individual Score' : 'Best Bowling Figures'}</p>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>CricHeroes' export only gives the best figures within a whole slot, not a single match. If you know the actual match-level record, enter it here to override the computed value.</p>
        <label className="text-[11px]" style={{ color: 'var(--muted)' }}>Player name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="field w-full mt-1 mb-2 px-2.5 py-1.5 text-sm" />
        <label className="text-[11px]" style={{ color: 'var(--muted)' }}>Team</label>
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="field w-full mt-1 mb-2 px-2.5 py-1.5 text-sm">
          {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {kind === 'highestScore' ? (
          <>
            <label className="text-[11px]" style={{ color: 'var(--muted)' }}>Runs</label>
            <input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className="field w-full mt-1 mb-2 px-2.5 py-1.5 text-sm" />
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div><label className="text-[11px]" style={{ color: 'var(--muted)' }}>Wickets</label><input inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className="field w-full mt-1 px-2.5 py-1.5 text-sm" /></div>
            <div><label className="text-[11px]" style={{ color: 'var(--muted)' }}>Runs conceded</label><input inputMode="numeric" value={runs} onChange={(e) => setRuns(e.target.value)} className="field w-full mt-1 px-2.5 py-1.5 text-sm" /></div>
          </div>
        )}
        <label className="text-[11px]" style={{ color: 'var(--muted)' }}>Note (e.g. "vs Desi Boyz, Slot 5")</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} className="field w-full mt-1 mb-3 px-2.5 py-1.5 text-sm" />
        <button onClick={save} className="gold-btn w-full py-2 rounded-md text-sm">Save override</button>
        {existing && <button onClick={clear} className="w-full py-2 rounded-md text-sm mt-2" style={{ color: 'var(--red)', background: 'transparent', border: '1px solid var(--hair2)' }}>Clear override (use computed value)</button>}
      </div>
    </div>
  )
}
