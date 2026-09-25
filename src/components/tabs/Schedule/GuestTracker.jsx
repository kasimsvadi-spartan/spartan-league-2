import { useState } from 'react'
import { AlertTriangle, UserPlus, X } from 'lucide-react'
import { uid } from '../../../lib/uid'
import { parentTeamOf } from '../../../lib/players'

const MAX_GUESTS_PER_TEAM = 2

// Records who guested for which team in a slot and who they replaced — rulebook section 8.
// This is an audit trail, not an eligibility engine: the max-2-per-team cap and the
// own-parent-team conflict are the only two things worth hard-checking in software (a fixed
// count and a name lookup); "same category or lower" and "not registered elsewhere" are
// judgment calls for the captains, same as the rulebook leaves them.
export function GuestTracker({ data, persist, slot, isAdmin }) {
  const [forTeamId, setForTeamId] = useState(slot.teamIds[0] || '')
  const [guestName, setGuestName] = useState('')
  const [replacedName, setReplacedName] = useState('')
  const guests = slot.guests || {}
  const teamById = (id) => data.teams.find((t) => t.id === id)

  const eligibleNames = data.teams
    .filter((t) => !slot.teamIds.includes(t.id))
    .flatMap((t) => (t.players || []).map((p) => p.name))
    .concat((data.playerPool || []).map((p) => p.name))

  function save(next) {
    persist({ ...data, slots: data.slots.map((s) => (s.id !== slot.id ? s : { ...s, guests: next })) })
  }

  function addGuest() {
    if (!guestName.trim() || !replacedName.trim() || !forTeamId) return
    const teamGuests = guests[forTeamId] || []
    if (teamGuests.length >= MAX_GUESTS_PER_TEAM) return
    const entry = { id: uid('guest'), guestName: guestName.trim(), replacedName: replacedName.trim() }
    save({ ...guests, [forTeamId]: [...teamGuests, entry] })
    setGuestName(''); setReplacedName('')
  }

  function removeGuest(teamId, entryId) {
    save({ ...guests, [teamId]: (guests[teamId] || []).filter((g) => g.id !== entryId) })
  }

  const conflictTeam = guestName.trim() ? parentTeamOf(data.teams, guestName.trim()) : null
  const hasConflict = conflictTeam && slot.teamIds.includes(conflictTeam.id)
  const teamAtCap = (guests[forTeamId] || []).length >= MAX_GUESTS_PER_TEAM

  const anyGuests = slot.teamIds.some((id) => (guests[id] || []).length > 0)
  if (!isAdmin && !anyGuests) return null

  return (
    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--hair3)' }}>
      <p className="text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
        <UserPlus size={12} /> Guests
      </p>
      {slot.teamIds.map((id) => {
        const entries = guests[id] || []
        if (entries.length === 0) return null
        return (
          <div key={id} className="mb-1.5">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--cream)' }}>{teamById(id)?.name}</p>
            {entries.map((g) => (
              <div key={g.id} className="flex items-center justify-between text-[11px] py-0.5" style={{ color: 'var(--muted)' }}>
                <span>{g.guestName} <span style={{ color: 'var(--faint)' }}>replacing {g.replacedName}</span></span>
                {isAdmin && <button onClick={() => removeGuest(id, g.id)}><X size={11} color="var(--red)" /></button>}
              </div>
            ))}
          </div>
        )
      })}
      {!anyGuests && <p className="text-[11px]" style={{ color: 'var(--faint)' }}>No guests declared.</p>}

      {isAdmin && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--hair3)' }}>
          <div className="grid grid-cols-2 gap-2 mb-1.5">
            <select value={forTeamId} onChange={(e) => setForTeamId(e.target.value)} className="field px-2 py-1.5 text-xs">
              {slot.teamIds.map((id) => <option key={id} value={id}>{teamById(id)?.name}</option>)}
            </select>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Guest name"
              list="guest-eligible-names"
              className="field px-2 py-1.5 text-xs"
            />
          </div>
          <datalist id="guest-eligible-names">
            {eligibleNames.map((n) => <option key={n} value={n} />)}
          </datalist>
          <input
            value={replacedName}
            onChange={(e) => setReplacedName(e.target.value)}
            placeholder={`Replacing which ${teamById(forTeamId)?.name || ''} player?`}
            className="field w-full px-2 py-1.5 text-xs mb-1.5"
          />
          {hasConflict && (
            <p className="text-[10px] mb-1.5 flex items-center gap-1" style={{ color: 'var(--red)' }}>
              <AlertTriangle size={11} /> {guestName.trim()}'s parent team ({conflictTeam.name}) is already in this slot — not eligible to guest here.
            </p>
          )}
          {teamAtCap && (
            <p className="text-[10px] mb-1.5" style={{ color: 'var(--red)' }}>
              {teamById(forTeamId)?.name} already has {MAX_GUESTS_PER_TEAM} guests for this slot (the maximum).
            </p>
          )}
          <button
            onClick={addGuest}
            disabled={!guestName.trim() || !replacedName.trim() || teamAtCap}
            className="plain-btn text-xs px-2.5 py-1.5 rounded-md w-full"
            style={{ opacity: !guestName.trim() || !replacedName.trim() || teamAtCap ? 0.5 : 1 }}
          >
            + Add guest
          </button>
        </div>
      )}
    </div>
  )
}
