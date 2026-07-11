import { supabase } from './supabaseClient'

const VIEWER_ID_KEY = 'spartan_viewer_id'

// A random per-browser id, persisted in localStorage, is the only thing standing between a
// viewer and casting a second vote — same guarantee level as the original artifact's
// browser-scoped window.storage, just backed by a real unique constraint on poll_votes now.
export function getViewerId() {
  let id = localStorage.getItem(VIEWER_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VIEWER_ID_KEY, id)
  }
  return id
}

export function getVotedTeamId(slotId) {
  return localStorage.getItem(`poll_voted_${slotId}`)
}

function setVotedTeamId(slotId, teamId) {
  localStorage.setItem(`poll_voted_${slotId}`, teamId)
}

export async function fetchVoteCounts(slotId) {
  const { data, error } = await supabase.from('poll_votes').select('team_id').eq('slot_id', slotId)
  if (error) throw error
  const counts = {}
  data.forEach((row) => { counts[row.team_id] = (counts[row.team_id] || 0) + 1 })
  return counts
}

// Anonymous viewers can't write to the `season` row (RLS only allows admin writes there),
// so poll votes go to their own public-insert table instead — see supabase/migrations/0001_init.sql.
export async function castVote(slotId, teamId) {
  const viewerId = getViewerId()
  const { error } = await supabase.from('poll_votes').insert({ slot_id: slotId, team_id: teamId, viewer_id: viewerId })
  if (error && error.code !== '23505') throw error // 23505 = unique_violation (already voted) — treat as success
  setVotedTeamId(slotId, teamId)
}
