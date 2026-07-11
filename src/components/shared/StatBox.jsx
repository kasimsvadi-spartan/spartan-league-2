export function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <p className="display text-lg gold-text">{value ?? '—'}</p>
      <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: 'var(--muted2)' }}>{label}</p>
    </div>
  )
}
