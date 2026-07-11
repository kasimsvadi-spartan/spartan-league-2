// Name/team matching for CricHeroes CSV imports and player lookups elsewhere.

// CricHeroes team names have a "SL#" slot suffix (e.g. "MMT RANGERS SL1") that must be
// stripped before matching against our own team names.
export function normTeam(s) {
  return (s || '').replace(/\s*SL\s*\d+\s*$/i, '').trim().toLowerCase()
}

export function normName(s) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function findTeamByName(teams, rawName) {
  const n = normTeam(rawName)
  return teams.find((t) => t.name.trim().toLowerCase() === n) || null
}

export function playerKey(name, teamRaw) {
  return normName(name) + '|' + normTeam(teamRaw)
}

export function num(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : null
}

export function mean(arr) {
  const vals = arr.filter((v) => v != null)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

export function sum(arr) {
  return arr.filter((v) => v != null).reduce((a, b) => a + b, 0)
}

export function fmt(n, d = 2) {
  return n == null ? '—' : Number(n).toFixed(d)
}
