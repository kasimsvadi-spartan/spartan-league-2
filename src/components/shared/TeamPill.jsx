import { TeamLogo } from './TeamLogo'

export function TeamPill({ team, muted, size = 'sm' }) {
  if (!team) return <span style={{ color: 'var(--muted2)' }} className="text-sm">TBD</span>
  const textSize = size === 'lg' ? 'text-base' : 'text-sm'
  return (
    <span className="inline-flex items-center gap-2 font-medium" style={{ opacity: muted ? 0.5 : 1 }}>
      <TeamLogo team={team} size={size === 'lg' ? 40 : 28} />
      <span className={textSize}>{team.name}</span>
    </span>
  )
}
