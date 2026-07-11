export function Countdown({ dateStr }) {
  const target = new Date(dateStr + 'T00:00')
  const now = new Date()
  const diffMs = target - now
  if (diffMs <= 0 && diffMs > -24 * 60 * 60 * 1000) return <span className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Today</span>
  if (diffMs <= 0) return <span className="text-xs" style={{ color: 'var(--muted2)' }}>Overdue</span>
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return <span className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>{days}d {hours}h to go</span>
}
