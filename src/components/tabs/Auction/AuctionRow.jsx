import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { canSellToTeam } from '../../../lib/auction'
import { Card } from '../../layout/Card'
import { PlayerAvatar } from '../../shared/PlayerAvatar'
import { TeamPill } from '../../shared/TeamPill'

export function AuctionRow({ player, data, isAdmin, isFormOpen, onToggleForm, onMarkUnsold, onConfirmSale, onRequestUndo }) {
  const soldTeam = player.soldTeamId ? data.teams.find((t) => t.id === player.soldTeamId) : null
  const [teamId, setTeamId] = useState(player.soldTeamId || '')
  const [price, setPrice] = useState(player.soldPrice != null ? String(player.soldPrice) : '')
  const [err, setErr] = useState('')

  function submit() {
    if (!teamId) { setErr('Pick a team.'); return }
    if (price === '' || Number(price) < 0) { setErr('Enter a valid price.'); return }
    if (!canSellToTeam(data, teamId, player.rosterId)) { setErr('That team already has 9 players.'); return }
    setErr('')
    onConfirmSale(teamId, Number(price))
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <PlayerAvatar player={player} team={soldTeam} size={36} />
          <div>
            <p className="text-sm font-medium">{player.name}</p>
            <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>
              {player.role}{player.basePrice ? ` · Base ₹${player.basePrice}` : ''}
            </p>
          </div>
        </div>
        <div className="text-right">
          {player.auctionStatus === 'sold' ? (
            <>
              <div className="flex items-center justify-end gap-1.5 mb-1"><TeamPill team={soldTeam} /></div>
              <p className="text-xs" style={{ color: 'var(--gold)' }}>₹{player.soldPrice}</p>
            </>
          ) : player.auctionStatus === 'unsold' ? (
            <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded" style={{ background: 'rgba(215,72,77,0.15)', color: 'var(--red)' }}>Unsold</span>
          ) : (
            <span className="badge-pending text-[10px] uppercase tracking-wide px-2 py-1 rounded">Not Yet Auctioned</span>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 flex-wrap" style={{ borderTop: '1px solid var(--hair3)' }}>
          {player.auctionStatus === 'sold' ? (
            <>
              <button onClick={onToggleForm} className="plain-btn text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1"><Pencil size={11} /> Edit sale</button>
              <button onClick={onRequestUndo} className="text-xs px-2.5 py-1.5 rounded-md" style={{ color: 'var(--red)', border: '1px solid var(--hair2)' }}>Undo</button>
            </>
          ) : (
            <>
              <button onClick={onToggleForm} className="gold-btn text-xs px-2.5 py-1.5 rounded-md">Mark Sold</button>
              {player.auctionStatus !== 'unsold' && (
                <button onClick={onMarkUnsold} className="plain-btn text-xs px-2.5 py-1.5 rounded-md">Mark Unsold</button>
              )}
              {player.auctionStatus === 'unsold' && (
                <span className="text-[11px]" style={{ color: 'var(--muted2)' }}>Tap "Mark Sold" if they get picked up later.</span>
              )}
            </>
          )}
        </div>
      )}

      {isAdmin && isFormOpen && (
        <div className="mt-2.5 pt-2.5 space-y-1.5" style={{ borderTop: '1px solid var(--hair3)' }}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px]" style={{ color: 'var(--muted)' }}>Team</label>
              <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="field w-full mt-1 px-2 py-1.5 text-sm">
                <option value="">Select team…</option>
                {data.teams.map((t) => {
                  const full = !canSellToTeam(data, t.id, player.rosterId)
                  return <option key={t.id} value={t.id} disabled={full}>{t.name}{full ? ' (Full)' : ''}</option>
                })}
              </select>
            </div>
            <div>
              <label className="text-[10px]" style={{ color: 'var(--muted)' }}>Sold price (₹)</label>
              <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className="field w-full mt-1 px-2 py-1.5 text-sm" />
            </div>
          </div>
          {err && <p className="text-xs" style={{ color: 'var(--red)' }}>{err}</p>}
          <div className="flex gap-2">
            <button onClick={submit} className="gold-btn flex-1 py-1.5 rounded-md text-sm">Confirm sale</button>
            <button onClick={onToggleForm} className="plain-btn px-3 py-1.5 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      )}
    </Card>
  )
}
