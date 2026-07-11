import { Star } from 'lucide-react'
import { findTeamByName, normName } from '../../../lib/players'
import { Card } from '../../layout/Card'
import { PlayerAvatar } from '../../shared/PlayerAvatar'
import { TeamPill } from '../../shared/TeamPill'

// Highest MVP score within one slot's import batch (not the season-cumulative MVP ranking
// used elsewhere) — the whole point is spotlighting a single standout slot performance.
function topMvpInBatch(batch) {
  const rows = (batch && batch.mvp) || []
  if (rows.length === 0) return null
  return rows.reduce((best, r) => (r.total != null && (best == null || r.total > best.total) ? r : best), null)
}

export function SpartanOfSlot({ data }) {
  const imports = data.statsImports || []
  if (imports.length === 0) return null
  const latestImport = [...imports].sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || ''))[0]
  const top = topMvpInBatch(latestImport)
  if (!top) return null

  const team = findTeamByName(data.teams, top.team_name)
  const squadPlayer = team ? team.players.find((sp) => normName(sp.name) === normName(top.name)) : null

  return (
    <Card className="text-center py-6" style={{ borderColor: 'var(--gold)' }}>
      <p className="text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-1" style={{ color: 'var(--muted)' }}>
        <Star size={12} color="var(--gold)" /> Spartan of the Slot
      </p>
      <div className="flex justify-center mt-3 mb-2">
        <PlayerAvatar player={squadPlayer || { name: top.name }} team={team} size={88} />
      </div>
      <p className="display text-2xl gold-text mt-1">{top.name}</p>
      {team && <div className="flex justify-center mt-1"><TeamPill team={team} /></div>}
      <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>MVP score in {latestImport.label}</p>
      <p className="display text-3xl gold-text mt-0.5">{top.total}</p>
    </Card>
  )
}
