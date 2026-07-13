import { uid } from './uid'

// Auction outcomes live on the player-pool entry itself (auctionStatus/soldTeamId/soldPrice/
// rosterId). "Sold" additionally copies the player into the team's own `players` array (same
// shape Squads already understands, tagged with poolId) so the Squads tab keeps working
// unmodified for post-sale edits like earnings or a name fix — see the roster entry created
// below, which is the actual thing Squads renders and edits.

const MAX_SQUAD_SIZE = 9

export function canSellToTeam(data, teamId, excludeRosterId) {
  const team = data.teams.find((t) => t.id === teamId)
  if (!team) return false
  const count = excludeRosterId ? team.players.filter((p) => p.id !== excludeRosterId).length : team.players.length
  return count < MAX_SQUAD_SIZE
}

export function markSold(data, poolPlayerId, teamId, price) {
  const player = data.playerPool.find((p) => p.id === poolPlayerId)
  if (!player) return data
  const rosterId = uid('p')
  const teams = data.teams.map((t) => (t.id !== teamId ? t : {
    ...t,
    players: [...t.players, { id: rosterId, name: player.name, role: player.role, photoUrl: player.photoUrl || '', earnings: 0, poolId: player.id }],
  }))
  const playerPool = data.playerPool.map((p) => (p.id === poolPlayerId ? { ...p, auctionStatus: 'sold', soldTeamId: teamId, soldPrice: price, rosterId } : p))
  return { ...data, teams, playerPool }
}

export function markUnsold(data, poolPlayerId) {
  const player = data.playerPool.find((p) => p.id === poolPlayerId)
  // Defensive cleanup in case this is called on a previously-sold player (normally reversing
  // a sale goes through undoSale instead, but this keeps the data consistent either way).
  const teams = player && player.rosterId
    ? data.teams.map((t) => ({ ...t, players: t.players.filter((pl) => pl.id !== player.rosterId) }))
    : data.teams
  const playerPool = data.playerPool.map((p) => (p.id === poolPlayerId ? { ...p, auctionStatus: 'unsold', soldTeamId: null, soldPrice: null, rosterId: null } : p))
  return { ...data, teams, playerPool }
}

export function undoSale(data, poolPlayerId) {
  const player = data.playerPool.find((p) => p.id === poolPlayerId)
  if (!player) return data
  const teams = data.teams.map((t) => (t.id === player.soldTeamId ? { ...t, players: t.players.filter((pl) => pl.id !== player.rosterId) } : t))
  const playerPool = data.playerPool.map((p) => (p.id === poolPlayerId ? { ...p, auctionStatus: null, soldTeamId: null, soldPrice: null, rosterId: null } : p))
  return { ...data, teams, playerPool }
}

export function editSale(data, poolPlayerId, newTeamId, newPrice) {
  const player = data.playerPool.find((p) => p.id === poolPlayerId)
  if (!player || player.auctionStatus !== 'sold') return data
  if (newTeamId === player.soldTeamId) {
    const playerPool = data.playerPool.map((p) => (p.id === poolPlayerId ? { ...p, soldPrice: newPrice } : p))
    return { ...data, playerPool }
  }
  const rosterId = uid('p')
  const teams = data.teams.map((t) => {
    if (t.id === player.soldTeamId) return { ...t, players: t.players.filter((pl) => pl.id !== player.rosterId) }
    if (t.id === newTeamId) return { ...t, players: [...t.players, { id: rosterId, name: player.name, role: player.role, photoUrl: player.photoUrl || '', earnings: 0, poolId: player.id }] }
    return t
  })
  const playerPool = data.playerPool.map((p) => (p.id === poolPlayerId ? { ...p, soldTeamId: newTeamId, soldPrice: newPrice, rosterId } : p))
  return { ...data, teams, playerPool }
}

// Total spent and players bought per team, purely informational — there's no purse cap yet.
export function teamSpendTotals(data) {
  const pool = data.playerPool || []
  return data.teams.map((team) => {
    const bought = pool.filter((p) => p.auctionStatus === 'sold' && p.soldTeamId === team.id)
    return { team, spent: bought.reduce((s, p) => s + (p.soldPrice || 0), 0), count: bought.length }
  })
}
