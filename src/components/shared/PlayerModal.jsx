import { X } from 'lucide-react'
import { normName, fmt } from '../../lib/players'
import { PlayerAvatar } from './PlayerAvatar'
import { TeamPill } from './TeamPill'
import { StatBox } from './StatBox'

export function PlayerModal({ player, onClose }) {
  const b = player.batting, bo = player.bowling, f = player.fielding, m = player.mvp
  const squadPlayer = player.team ? player.team.players.find((sp) => normName(sp.name) === normName(player.name)) : null
  return (
    <div className="modal-overlay items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="ember-card w-full sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ borderRadius: '16px 16px 0 0' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <PlayerAvatar player={squadPlayer} team={player.team} size={44} />
            <div>
              <h3 className="display text-xl gold-text">{player.name}</h3>
              {player.team && <div className="mt-1"><TeamPill team={player.team} /></div>}
              {squadPlayer && squadPlayer.earnings > 0 && <p className="text-xs mt-1" style={{ color: 'var(--gold)' }}>₹{squadPlayer.earnings} total earnings</p>}
            </div>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {m && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>MVP · {m.slots} slot{m.slots === 1 ? '' : 's'}</p>
            <div className="grid grid-cols-1 gap-2">
              <StatBox label="Total MVP Score" value={fmt(m.total, 1)} />
            </div>
          </div>
        )}

        {b && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>Batting · {b.slots} slot{b.slots === 1 ? '' : 's'}</p>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Runs" value={b.total_runs} />
              <StatBox label="Average" value={fmt(b.average)} />
              <StatBox label="Strike Rate" value={fmt(b.strike_rate)} />
            </div>
          </div>
        )}

        {bo && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>Bowling · {bo.slots} slot{bo.slots === 1 ? '' : 's'}</p>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Wickets" value={bo.total_wickets} />
              <StatBox label="Average" value={fmt(bo.avg)} />
              <StatBox label="Economy" value={fmt(bo.economy)} />
            </div>
          </div>
        )}

        {f && (
          <div className="mb-2">
            <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>Fielding · {f.slots} slot{f.slots === 1 ? '' : 's'}</p>
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Total Dismissals" value={f.total_dismissal} />
            </div>
          </div>
        )}

        {b && b.slots > 1 && <p className="text-[10px] mt-3" style={{ color: 'var(--faint)' }}>Average and strike rate are calculated exactly from combined innings, not-outs and balls faced across all {b.slots} imported slots.</p>}
      </div>
    </div>
  )
}
