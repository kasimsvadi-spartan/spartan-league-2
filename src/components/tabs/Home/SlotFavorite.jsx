import { TrendingUp } from 'lucide-react'
import { predictSlotFavorite } from '../../../lib/prediction'
import { fmt } from '../../../lib/players'
import { Card } from '../../layout/Card'
import { TeamLogo } from '../../shared/TeamLogo'
import { TeamPill } from '../../shared/TeamPill'

export function SlotFavorite({ data, slot }) {
  const result = predictSlotFavorite(data, slot)
  if (!result) return null
  const { rows, favorite } = result

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={14} color="var(--gold)" />
        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Predicted Favorite</p>
      </div>

      {!favorite ? (
        <p className="text-sm" style={{ color: 'var(--muted2)' }}>Not enough data yet — this fills in once a few slots are played and stats are imported.</p>
      ) : (
        <>
          <div className="flex items-center gap-2.5 mb-3">
            <TeamLogo team={favorite.team} size={40} />
            <div>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Favorite to win this slot</p>
              <p className="display text-lg" style={{ color: favorite.team.color }}>{favorite.team.name}</p>
            </div>
          </div>
          <div className="space-y-1">
            {rows.map((r) => (
              <div key={r.team.id} className="flex items-center justify-between text-xs py-1.5" style={{ borderTop: '1px solid var(--hair3)' }}>
                <TeamPill team={r.team} />
                <span style={{ color: 'var(--muted)' }}>{r.points} pts · H2H {r.h2h >= 0 ? '+' : ''}{r.h2h} · Form {fmt(r.form, 1)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="text-[11px] mt-3" style={{ color: 'var(--muted2)' }}>Simplified estimate from season points, head-to-head between these three teams, and recent MVP form — not a guarantee.</p>
    </Card>
  )
}
