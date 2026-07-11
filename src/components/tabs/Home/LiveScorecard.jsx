import { useState } from 'react'
import { ExternalLink, Radio } from 'lucide-react'
import { Card } from '../../layout/Card'

// Feasibility note: I could not confirm from this environment how much of a CricHeroes
// scorecard iframe.cricheroes.in shows to viewers without a CricHeroes login (network access
// to that domain was blocked in the sandbox this was built in). This embeds whatever the link
// renders and always shows an "Open in CricHeroes" fallback alongside it, since a login wall or
// an X-Frame-Options block would otherwise leave someone looking at a blank box with no way out.
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
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Live Scorecard</p>
        </div>
        {isAdmin && (
          <button onClick={() => setEditing((e) => !e)} className="text-xs" style={{ color: 'var(--gold)' }}>
            {editing ? 'Cancel' : url ? 'Change link' : '+ Add link'}
          </button>
        )}
      </div>

      {isAdmin && editing && (
        <div className="mb-3">
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

      {url ? (
        <div>
          <div className="rounded-md overflow-hidden mb-2" style={{ border: '1px solid var(--hair2)', background: 'var(--ink)' }}>
            <iframe
              src={url}
              title="Live CricHeroes scorecard"
              loading="lazy"
              style={{ width: '100%', height: 420, border: 'none', display: 'block' }}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1" style={{ color: 'var(--gold)' }}>
            <ExternalLink size={12} /> Open in CricHeroes {url.includes('cricheroes') ? '' : '↗'}
          </a>
        </div>
      ) : (
        isAdmin && !editing && <p className="text-xs" style={{ color: 'var(--muted2)' }}>No live match linked right now.</p>
      )}
    </Card>
  )
}
