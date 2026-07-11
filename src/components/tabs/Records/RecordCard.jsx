import { Card } from '../../layout/Card'

export function RecordCard({ icon: Icon, title, value, sub, teamOrPlayer }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} color="var(--gold)" />
        <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{title}</p>
      </div>
      {value == null ? (
        <p className="text-sm" style={{ color: 'var(--muted2)' }}>No qualifying data yet</p>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {teamOrPlayer}
            </div>
            {sub && <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted2)' }}>{sub}</p>}
          </div>
          <span className="display text-2xl gold-text">{value}</span>
        </div>
      )}
    </Card>
  )
}
