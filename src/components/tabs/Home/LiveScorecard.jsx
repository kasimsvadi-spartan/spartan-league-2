import { useState } from 'react'
import { Radio } from 'lucide-react'
import { Card } from '../../layout/Card'

export function LiveScorecard({ data, persist, isAdmin }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(data.liveScorecardUrl || '')
  const url = data.liveScorecardUrl

  function save() {
    persist({ ...data, liveScorecardUrl: draft.trim() })
    setEditing(false)
  }
  function clear() {
    persist({ ...data, liveScorecardUrl: '' })
    setDraft('')
    setEditing(false)
  }

  if (!url && !isAdmin) return null

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Radio size={14} color="var(--gold)" />
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Live Match</p>
        </div>
        {isAdmin && (
          <button onClick={() => setEditing((e) => !e)} className="text-xs" style={{ color: 'var(--gold)' }}>
            {editing ? 'Cancel' : url ? 'Change link' : '+ Add link'}
          </button>
        )}
      </div>

      {isAdmin && editing && (
        <div className="mb-1">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://cricheroes.in/scorecard/…"
            className="field w-full px-2.5 py-2 text-sm mb-2"
          />
          <div className="flex gap-2">
            <button onClick={save} className="gold-btn flex-1 py-1.5 rounded-md text-sm">Save</button>
            {url && <button onClick={clear} className="plain-btn px-3 py-1.5 rounded-md text-sm">Remove</button>}
          </div>
        </div>
      )}

      {url && !editing && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="gold-btn w-full py-2.5 rounded-md text-sm flex items-center justify-center gap-2"
        >
          <Radio size={14} /> Follow live on CricHeroes
        </a>
      )}
      {!url && isAdmin && !editing && <p className="text-xs" style={{ color: 'var(--muted2)' }}>No live match linked right now.</p>}
    </Card>
  )
}
