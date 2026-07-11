import { useEffect, useState } from 'react'

export function PlayerAvatar({ player, team, size = 34 }) {
  const [broken, setBroken] = useState(false)
  const url = player && player.photoUrl
  useEffect(() => { setBroken(false) }, [url])
  const initial = (player && player.name ? player.name.trim()[0] : '?').toUpperCase()
  const color = team ? team.color : 'var(--hair2)'
  if (url && !broken) {
    return (
      <img
        src={url}
        alt={player.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}` }}
        onError={() => setBroken(true)}
      />
    )
  }
  return (
    <span
      style={{
        width: size, height: size, borderRadius: '50%', background: 'var(--chip)',
        border: `2px solid ${color}`, display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, color,
      }}
    >
      {initial}
    </span>
  )
}
