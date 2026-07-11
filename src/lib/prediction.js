import { computeHeadToHead, computePointsTable } from './scoring'
import { buildPlayerIndex } from './stats'
import { findTeamByName } from './players'

// Min-max normalize a list of numbers to 0-1 so points/head-to-head/form — three very
// different scales — can be averaged into one composite score. All-equal values (including
// all zero) normalize to 0.5 for everyone, i.e. that category contributes nothing either way.
function normalize(values) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return values.map(() => 0.5)
  return values.map((v) => (v - min) / (max - min))
}

// A simplified, explainable "who's favored" estimate for a 3-team slot — season points so
// far, head-to-head record among just these three teams, and recent player form (MVP score
// in the latest imported slot, falling back to season-average MVP if a team has no rows in
// that batch). Not a real prediction model; the point is to be transparent about what feeds
// it, same spirit as the Qualify tab's "simplified estimate" targets.
export function predictSlotFavorite(data, slot) {
  const teamIds = slot.teamIds
  if (!teamIds || teamIds.length !== 3) return null
  const teams = teamIds.map((id) => data.teams.find((t) => t.id === id))
  if (teams.some((t) => !t)) return null

  const table = computePointsTable(data)
  const pointsById = {}
  table.forEach((r) => { pointsById[r.team.id] = r.total })

  const h2h = computeHeadToHead(data)
  const h2hNetById = {}
  teamIds.forEach((id) => {
    let net = 0
    teamIds.forEach((otherId) => {
      if (otherId === id) return
      const cell = h2h[id] && h2h[id][otherId]
      if (cell) net += cell.wins - cell.losses
    })
    h2hNetById[id] = net
  })

  const imports = data.statsImports || []
  const latestBatch = imports.length ? [...imports].sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || ''))[0] : null
  const playerIndex = buildPlayerIndex(data)
  const formById = {}
  teamIds.forEach((id) => {
    let rows = []
    if (latestBatch) {
      rows = (latestBatch.mvp || []).filter((r) => {
        const t = findTeamByName(data.teams, r.team_name)
        return t && t.id === id
      })
    }
    if (rows.length > 0) {
      formById[id] = rows.reduce((s, r) => s + (r.total || 0), 0) / rows.length
    } else {
      const seasonRows = playerIndex.filter((p) => p.team && p.team.id === id && p.mvp)
      formById[id] = seasonRows.length ? seasonRows.reduce((s, p) => s + p.mvp.total, 0) / seasonRows.length : 0
    }
  })

  const pointsVals = teamIds.map((id) => pointsById[id] || 0)
  const h2hVals = teamIds.map((id) => h2hNetById[id])
  const formVals = teamIds.map((id) => formById[id])

  const hasAnyData = pointsVals.some((v) => v !== 0) || h2hVals.some((v) => v !== 0) || formVals.some((v) => v !== 0)
  if (!hasAnyData) return { rows: null, favorite: null }

  const normPoints = normalize(pointsVals)
  const normH2H = normalize(h2hVals)
  const normForm = normalize(formVals)

  const rows = teamIds.map((id, i) => ({
    team: teams[i],
    points: pointsVals[i],
    h2h: h2hVals[i],
    form: formVals[i],
    composite: (normPoints[i] + normH2H[i] + normForm[i]) / 3,
  })).sort((a, b) => b.composite - a.composite)

  return { rows, favorite: rows[0] }
}
