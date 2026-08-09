import { uid } from './uid'

// Assigning a Player Pool entry to a team copies them into that team's own `players` array
// (same shape Squads already uses, tagged with poolId for traceability) rather than the pool
// entry and the roster entry being a live join — same pattern the old Auction feature used,
// minus the sale price. This keeps Squads working completely unmodified.

const MAX_SQUAD_SIZE = 9

export function canAssignToTeam(data, teamId, excludeRosterId) {
  const team = data.teams.find((t) => t.id === teamId)
  if (!team) return false
  const count = excludeRosterId ? team.players.filter((p) => p.id !== excludeRosterId).length : team.players.length
  return count < MAX_SQUAD_SIZE
}

export function assignToTeam(data, poolPlayerId, teamId) {
  const player = data.playerPool.find((p) => p.id === poolPlayerId)
  if (!player) return data
  const rosterId = uid('p')
  const teams = data.teams.map((t) => (t.id !== teamId ? t : {
    ...t,
    players: [...t.players, { id: rosterId, name: player.name, role: player.role, photoUrl: player.photoUrl || '', earnings: 0, poolId: player.id }],
  }))
  const playerPool = data.playerPool.map((p) => (p.id === poolPlayerId ? { ...p, assignedTeamId: teamId, rosterId } : p))
  return { ...data, teams, playerPool }
}

export function unassignFromTeam(data, poolPlayerId) {
  const player = data.playerPool.find((p) => p.id === poolPlayerId)
  if (!player) return data
  const teams = data.teams.map((t) => (t.id === player.assignedTeamId ? { ...t, players: t.players.filter((pl) => pl.id !== player.rosterId) } : t))
  const playerPool = data.playerPool.map((p) => (p.id === poolPlayerId ? { ...p, assignedTeamId: null, rosterId: null } : p))
  return { ...data, teams, playerPool }
}
