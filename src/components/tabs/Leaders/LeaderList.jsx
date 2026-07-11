import { useState } from 'react'
import { normName } from '../../../lib/players'
import { TeamLogo } from '../../shared/TeamLogo'
import { PlayerAvatar } from '../../shared/PlayerAvatar'

export function LeaderList({ title, rows, onSelect, valueFn, subFn }) {
  const [expanded, setExpanded] = useState(false)
  if (rows.length === 0) return null
  const shown = expanded ? rows : rows.slice(0, 10)
  return (
    <div>
      <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>{title}</p>
      <div className="space-y-1.5">
        {shown.map((p, i) => (
          <button key={p.name + i} onClick={() => onSelect(p)} className="w-full ember-card flex items-center justify-between text-left" style={{ padding: '10px 14px' }}>
            <div className="flex items-center gap-2.5">
              <span className="display text-lg w-5" style={{ color: 'var(--muted)' }}>{i + 1}</span>
              {(() => {
                const squadPlayer = p.team ? p.team.players.find((sp) => normName(sp.name) === normName(p.name)) : null
                return squadPlayer && squadPlayer.photoUrl ? <PlayerAvatar player={squadPlayer} team={p.team} size={32} /> : p.team ? <TeamLogo team={p.team} size={32} /> : <span style={{ width: 32, height: 32, background: 'var(--hair2)', borderRadius: '50%', display: 'inline-block' }} />
              })()}
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{subFn(p)}</p>
              </div>
            </div>
            <span className="display text-xl gold-text">{valueFn(p)}</span>
          </button>
        ))}
      </div>
      {rows.length > 10 && (
        <button onClick={() => setExpanded((e) => !e)} className="text-xs mt-2" style={{ color: 'var(--gold)' }}>
          {expanded ? 'Show top 10 only' : `Show all ${rows.length} players →`}
        </button>
      )}
    </div>
  )
}
