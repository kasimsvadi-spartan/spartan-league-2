import { useState } from 'react'
import Papa from 'papaparse'
import { X } from 'lucide-react'
import { uid } from '../../../lib/uid'
import { extractRows } from '../../../lib/stats'
import { Card } from '../../layout/Card'

export function ImportPanel({ data, persist, onDone }) {
  const [files, setFiles] = useState({ batting: null, bowling: null, fielding: null, mvp: null })
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const imports = data.statsImports || []

  function pick(key, file) { setFiles((f) => ({ ...f, [key]: file || null })) }

  async function doImport() {
    if (!files.batting && !files.bowling && !files.fielding && !files.mvp) { setErr('Choose at least one file.'); return }
    setBusy(true); setErr('')
    try {
      const batch = { id: uid('import'), label: label.trim() || `Slot import ${imports.length + 1}`, importedAt: new Date().toISOString(), batting: [], bowling: [], fielding: [], mvp: [] }
      for (const key of ['batting', 'bowling', 'fielding', 'mvp']) {
        const file = files[key]
        if (!file) continue
        const text = await file.text()
        const res = Papa.parse(text, { header: true, skipEmptyLines: true })
        batch[key] = extractRows(res.data, key)
      }
      await persist({ ...data, statsImports: [...imports, batch] })
      onDone()
    } catch {
      setErr("Couldn't read one of the files — make sure they're CricHeroes CSV exports.")
    }
    setBusy(false)
  }

  function removeImport(id) {
    persist({ ...data, statsImports: imports.filter((b) => b.id !== id) })
  }

  return (
    <Card className="mb-4">
      <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Each CricHeroes export covers one slot. Upload it here after every slot and the season totals accumulate — runs, wickets, dismissals and MVP score are summed; average, strike rate and economy are recalculated exactly from the combined innings/balls/runs-conceded across every slot you've imported.</p>
      <label className="text-[11px] uppercase tracking-wide block mb-1" style={{ color: 'var(--muted)' }}>Label this import (optional)</label>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Slot 3 — Jul 21" className="field w-full px-2.5 py-1.5 text-sm mb-3" />
      {['batting', 'bowling', 'fielding', 'mvp'].map((key) => (
        <div key={key} className="mb-2.5">
          <label className="text-[11px] uppercase tracking-wide capitalize block mb-1" style={{ color: 'var(--muted)' }}>{key} CSV</label>
          <input type="file" accept=".csv" onChange={(e) => pick(key, e.target.files[0])} className="field w-full px-2 py-1.5 text-xs" />
        </div>
      ))}
      {err && <p className="text-xs mb-2" style={{ color: 'var(--red)' }}>{err}</p>}
      <button disabled={busy} onClick={doImport} className="gold-btn w-full py-2 rounded-md text-sm mt-1">{busy ? 'Importing…' : 'Import this slot'}</button>

      {imports.length > 0 && (
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--hair3)' }}>
          <p className="text-[11px] uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Imported slots</p>
          <div className="space-y-1">
            {imports.map((b) => (
              <div key={b.id} className="flex items-center justify-between text-xs rounded px-2.5 py-1.5" style={{ background: 'var(--ink)' }}>
                <span>{b.label}</span>
                <button onClick={() => removeImport(b.id)}><X size={13} color="var(--muted)" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
