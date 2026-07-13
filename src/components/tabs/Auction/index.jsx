import { useState } from 'react'
import { Gavel, Search } from 'lucide-react'
import { editSale, markSold, markUnsold, teamSpendTotals, undoSale } from '../../../lib/auction'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { ConfirmModal } from '../../layout/ConfirmModal'
import { TeamLogo } from '../../shared/TeamLogo'
import { AuctionRow } from './AuctionRow'

export function Auction({ data, persist, isAdmin }) {
  const pool = data.playerPool || []
  const [teamFilter, setTeamFilter] = useState('')
  const [query, setQuery] = useState('')
  const [formFor, setFormFor] = useState(null)
  const [confirmUndoId, setConfirmUndoId] = useState(null)

  const totals = teamSpendTotals(data)

  const q = query.trim().toLowerCase()
  let visible = pool
  if (teamFilter) visible = visible.filter((p) => p.auctionStatus === 'sold' && p.soldTeamId === teamFilter)
  if (q) visible = visible.filter((p) => p.name.toLowerCase().includes(q))

  function handleMarkUnsold(id) {
    persist(markUnsold(data, id))
  }
  function handleConfirmSale(id, teamId, price) {
    const player = pool.find((p) => p.id === id)
    persist(player.auctionStatus === 'sold' ? editSale(data, id, teamId, price) : markSold(data, id, teamId, price))
    setFormFor(null)
  }
  function handleUndo(id) {
    persist(undoSale(data, id))
    setConfirmUndoId(null)
  }

  if (pool.length === 0) {
    return (
      <div>
        <SectionTitle icon={Gavel}>Auction</SectionTitle>
        <Empty title="No players in the pool yet" body="Add players from the Player Pool tab before starting the auction." />
      </div>
    )
  }

  return (
    <div>
      <SectionTitle icon={Gavel}>Auction</SectionTitle>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {totals.map(({ team, spent, count }) => (
          <button
            key={team.id}
            onClick={() => setTeamFilter(teamFilter === team.id ? '' : team.id)}
            className="ember-card text-left"
            style={{ padding: '10px 12px', borderColor: teamFilter === team.id ? team.color : undefined }}
          >
            <div className="flex items-center gap-2 mb-1">
              <TeamLogo team={team} size={24} />
              <span className="text-xs font-medium" style={{ color: team.color }}>{team.name}</span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{count} bought · ₹{spent}</p>
          </button>
        ))}
      </div>
      {teamFilter && (
        <button onClick={() => setTeamFilter('')} className="text-xs mb-3" style={{ color: 'var(--gold)' }}>Clear team filter ×</button>
      )}

      <div className="relative mb-3">
        <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search players…" className="field w-full pl-8 pr-3 py-2 text-sm" />
      </div>

      {visible.length === 0 ? (
        <Empty title="No players found" body={teamFilter ? "This team hasn't bought anyone yet." : `Nobody matching "${query}".`} />
      ) : (
        <div className="space-y-1.5">
          {visible.map((p) => (
            <AuctionRow
              key={p.id}
              player={p}
              data={data}
              isAdmin={isAdmin}
              isFormOpen={formFor === p.id}
              onToggleForm={() => setFormFor(formFor === p.id ? null : p.id)}
              onMarkUnsold={() => handleMarkUnsold(p.id)}
              onConfirmSale={(teamId, price) => handleConfirmSale(p.id, teamId, price)}
              onRequestUndo={() => setConfirmUndoId(p.id)}
            />
          ))}
        </div>
      )}

      {confirmUndoId && (
        <ConfirmModal
          title="Undo this sale?"
          body="Removes this player from the team's squad and returns them to Not Yet Auctioned. You'd need to re-sell them to put them back on a team."
          confirmLabel="Undo sale"
          onCancel={() => setConfirmUndoId(null)}
          onConfirm={() => handleUndo(confirmUndoId)}
        />
      )}
    </div>
  )
}
