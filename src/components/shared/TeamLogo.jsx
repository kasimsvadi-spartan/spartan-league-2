export function TeamLogo({ team, size = 34 }) {
  if (team && team.logo) {
    return (
      <img
        src={team.logo}
        alt={team.name}
        style={{ width: size, height: size, border: `2px solid ${team.color}`, background: '#fff', borderRadius: '50%', objectFit: 'contain' }}
      />
    )
  }
  return <span style={{ width: size, height: size, background: team ? team.color : 'var(--hair2)', borderRadius: '50%', display: 'inline-block' }} />
}
