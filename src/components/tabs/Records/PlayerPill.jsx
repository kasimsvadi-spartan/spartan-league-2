import { normName } from '../../../lib/players'
import { PlayerAvatar } from '../../shared/PlayerAvatar'

export function PlayerPill({ record }) {
  if (!record) return null
  const squadPlayer = record.team ? record.team.players.find((sp) => normName(sp.name) === normName(record.name)) : null
  return (
    <span className="inline-flex items-center gap-2">
      <PlayerAvatar player={squadPlayer || { name: record.name }} team={record.team} size={28} />
      <span className="text-sm font-medium">{record.name}</span>
    </span>
  )
}
