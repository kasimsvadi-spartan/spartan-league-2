import { useEffect, useState } from 'react'
import { Ban, CalendarDays, Check, Clock, Pencil, Plus, Trash2, Users, Zap } from 'lucide-react'
import { MATCH_LABELS, computeFinalSlotAdvantageHolder, resolveSlot } from '../../../lib/scoring'
import { assignTeamsToSlot } from '../../../lib/slotAssign'
import { uid } from '../../../lib/uid'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { ConfirmModal } from '../../layout/ConfirmModal'
import { TeamLogo } from '../../shared/TeamLogo'
import { TeamPill } from '../../shared/TeamPill'
import { ResultModal } from './ResultModal'
import { GuestTracker } from './GuestTracker'

const MATCH_ORDER = ['league1', 'league2', 'league3', 'qualifier1', 'eliminator', 'final']

export function Schedule({ data, persist, isAdmin, draft, clearDraft }) {
  const [showNew, setShowNew] = useState(false)
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [slotType, setSlotType] = useState('League')
  const [picked, setPicked] = useState([])
  const [openMatch, setOpenMatch] = useState(null)
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState(null)
  const [assigningSlotId, setAssigningSlotId] = useState(null)
  const [assignPicked, setAssignPicked] = useState([])
  const [showBlockForm, setShowBlockForm] = useState(false)
  const [blockDate, setBlockDate] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [filterTeamId, setFilterTeamId] = useState('')
  const [abandoningSlotId, setAbandoningSlotId] = useState(null)
  const [willingPicked, setWillingPicked] = useState([])
  const [twoWillingWinner, setTwoWillingWinner] = useState('')
  const teamById = (id) => data.teams.find((t) => t.id === id)
  const blockedDates = data.blockedDates || []
  const finalSlotAdvantage = data.finalSlotAdvantage || null
  const finalSlotHolderId = computeFinalSlotAdvantageHolder(data)

  function toggleWilling(id) {
    setWillingPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
    setTwoWillingWinner('')
  }
  function confirmAbandon(slot) {
    if (willingPicked.length === 2 && !twoWillingWinner) return
    const abandonment = { willingTeamIds: willingPicked, winnerId: willingPicked.length === 2 ? twoWillingWinner : null }
    const slots = data.slots.map((s) => (s.id !== slot.id ? s : { ...s, abandonment }))
    persist({ ...data, slots })
    setAbandoningSlotId(null); setWillingPicked([]); setTwoWillingWinner('')
  }
  function clearAbandon(slotId) {
    const slots = data.slots.map((s) => (s.id !== slotId ? s : { ...s, abandonment: null }))
    persist({ ...data, slots })
  }
  function updateSlotFlag(slotId, patch) {
    const slots = data.slots.map((s) => (s.id !== slotId ? s : { ...s, ...patch }))
    persist({ ...data, slots })
  }
  function toggleFinalSlotBonus(matchId) {
    const active = finalSlotAdvantage && finalSlotAdvantage.activatedForMatchId === matchId
    persist({ ...data, finalSlotAdvantage: active ? null : { activatedForMatchId: matchId, usedInMatchId: finalSlotAdvantage?.usedInMatchId || null } })
  }

  function toggleAssignPick(id) { setAssignPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p)) }
  function confirmAssign(slotId) {
    if (assignPicked.length !== 3) return
    persist(assignTeamsToSlot(data, slotId, assignPicked))
    setAssigningSlotId(null); setAssignPicked([])
  }

  function addBlockedDate() {
    if (!blockDate || !blockReason.trim()) return
    persist({ ...data, blockedDates: [...blockedDates, { id: uid('blocked'), date: blockDate, reason: blockReason.trim() }] })
    setBlockDate(''); setBlockReason(''); setShowBlockForm(false)
  }
  function removeBlockedDate(id) {
    persist({ ...data, blockedDates: blockedDates.filter((b) => b.id !== id) })
  }

  useEffect(() => {
    if (draft) {
      setPicked(draft.teamIds)
      setSlotType(draft.slotType)
      setShowNew(true)
      clearDraft()
    }
  }, [draft, clearDraft])

  function togglePick(id) { setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p)) }

  function deleteSlot(slotId) {
    persist({ ...data, slots: data.slots.filter((s) => s.id !== slotId) })
    setConfirmDeleteSlot(null)
  }

  function createSlot() {
    const isShell = slotType !== 'League' && picked.length === 0
    if ((picked.length !== 3 && !isShell) || !date) return
    const [a, b, c] = picked
    const matches = MATCH_ORDER.map((type) => {
      if (type === 'league1') return { id: uid('m'), type, fixedA: a, fixedB: b, result: null }
      if (type === 'league2') return { id: uid('m'), type, fixedA: b, fixedB: c, result: null }
      if (type === 'league3') return { id: uid('m'), type, fixedA: a, fixedB: c, result: null }
      return { id: uid('m'), type, result: null }
    })
    const slot = { id: uid('slot'), date, venue, slotType, teamIds: picked, matches }
    persist({ ...data, slots: [...data.slots, slot].sort((x, y) => (x.date || '').localeCompare(y.date || '')) })
    setPicked([]); setDate(''); setVenue(''); setSlotType('League'); setShowNew(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <SectionTitle icon={CalendarDays}>Schedule</SectionTitle>
        {isAdmin && (
          <div className="flex gap-2">
            <button onClick={() => setShowBlockForm((s) => !s)} className="plain-btn flex items-center gap-1 text-sm px-3 py-1.5 rounded-md"><Ban size={14} /> Block date</button>
            <button onClick={() => setShowNew((s) => !s)} className="gold-btn flex items-center gap-1 text-sm px-3 py-1.5 rounded-md"><Plus size={14} /> New slot</button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>My team</label>
        <select value={filterTeamId} onChange={(e) => setFilterTeamId(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm">
          <option value="">All teams</option>
          {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {isAdmin && showBlockForm && (
        <Card className="mb-4">
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Date</label>
          <input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="field w-full mt-1 mb-3 px-3 py-2 text-sm" />
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Reason</label>
          <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="e.g. Religious event" className="field w-full mt-1 mb-3 px-3 py-2 text-sm" />
          <button disabled={!blockDate || !blockReason.trim()} onClick={addBlockedDate} className="gold-btn w-full py-2 rounded-md text-sm">Block this date</button>
        </Card>
      )}

      {isAdmin && showNew && (
        <Card className="mb-4">
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field w-full mt-1 mb-3 px-3 py-2 text-sm" />
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Venue</label>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Turf name" className="field w-full mt-1 mb-3 px-3 py-2 text-sm" />
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Slot type</label>
          <select value={slotType} onChange={(e) => setSlotType(e.target.value)} className="field w-full mt-1 mb-3 px-3 py-2 text-sm">
            <option>League</option><option>Semi-Final</option><option>Final</option>
          </select>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Pick 3 teams for this slot{slotType !== 'League' ? ' (or leave blank to fill in later)' : ''}</label>
          <div className="grid grid-cols-2 gap-2 mt-2 mb-3">
            {data.teams.map((t) => {
              const idx = picked.indexOf(t.id)
              const selected = idx !== -1
              return (
                <button key={t.id} onClick={() => togglePick(t.id)} className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-sm relative ${selected ? 'chip-selected' : 'chip-outline'}`}>
                  <TeamLogo team={t} size={28} />
                  <span className="flex-1 text-left">{t.name}</span>
                  {selected && <span className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: 'var(--gold)', color: '#1A1409' }}>{idx + 1}</span>}
                </button>
              )
            })}
          </div>
          <button disabled={!date || (picked.length !== 3 && !(slotType !== 'League' && picked.length === 0))} onClick={createSlot} className="gold-btn w-full py-2 rounded-md text-sm">
            {slotType !== 'League' && picked.length === 0 ? 'Create slot (teams TBD)' : `Create slot (${picked.length}/3 teams)`}
          </button>
        </Card>
      )}

      {data.slots.length === 0 && blockedDates.length === 0 && <Empty title="No fixtures yet" body={isAdmin ? "Tap 'New slot' to schedule a set of matches between 3 teams." : 'Check back once the admin publishes the schedule.'} />}

      {(data.slots.length > 0 || blockedDates.length > 0) && filterTeamId && !data.slots.some((s) => s.teamIds.includes(filterTeamId)) && (
        <Empty title="No fixtures yet" body={`${teamById(filterTeamId)?.name} isn't scheduled in any slot yet.`} />
      )}

      <div className="space-y-4">
        {[
          ...data.slots.filter((slot) => !filterTeamId || slot.teamIds.includes(filterTeamId)).map((slot) => ({ kind: 'slot', date: slot.date || '', slot })),
          ...blockedDates.map((b) => ({ kind: 'blocked', date: b.date, blocked: b })),
        ].sort((x, y) => x.date.localeCompare(y.date)).map((item) => {
          if (item.kind === 'blocked') {
            const b = item.blocked
            return (
              <Card key={b.id} style={{ borderColor: 'var(--hair2)', opacity: 0.85 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Ban size={16} color="var(--muted)" />
                    <div>
                      <p className="text-sm font-semibold">{new Date(b.date + 'T00:00').toDateString()}</p>
                      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Blocked — {b.reason}</p>
                    </div>
                  </div>
                  {isAdmin && <button onClick={() => removeBlockedDate(b.id)} title="Unblock this date"><Trash2 size={14} color="var(--red)" /></button>}
                </div>
              </Card>
            )
          }
          const slot = item.slot
          const { resolvedTeams } = resolveSlot(slot)
          const done = slot.matches.every((m) => m.result)
          const isFinalSlot = (slot.slotType || 'League') === 'Final'
          const abandonment = slot.abandonment
          return (
            <Card key={slot.id}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold">{slot.date ? new Date(slot.date + 'T00:00').toDateString() : 'Date TBD'}</p>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{slot.venue || 'Venue TBD'} · {slot.slotType || 'League'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded ${abandonment ? 'tag-neutral' : done ? 'badge-done' : 'badge-pending'}`}>{abandonment ? 'Abandoned' : done ? 'Completed' : 'Upcoming'}</span>
                  {isAdmin && <button onClick={() => setConfirmDeleteSlot(slot.id)} title="Delete slot"><Trash2 size={14} color="var(--red)" /></button>}
                </div>
              </div>
              <div className="flex gap-3 mb-3 flex-wrap">{slot.teamIds.map((id) => <TeamPill key={id} team={teamById(id)} />)}</div>

              {abandonment ? (
                <div>
                  <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
                    {abandonment.willingTeamIds.length === 0 && 'All three teams agreed not to play — 2 points each, no punctuality bonus.'}
                    {abandonment.willingTeamIds.length === 1 && `${teamById(abandonment.willingTeamIds[0])?.name} was the only team willing to play and takes all 6 points.`}
                    {abandonment.willingTeamIds.length === 2 && `${teamById(abandonment.willingTeamIds[0])?.name} and ${teamById(abandonment.willingTeamIds[1])?.name} played each other; ${teamById(abandonment.winnerId)?.name} won (4 pts, loser 2 pts, declined team 0 pts).`}
                    {abandonment.willingTeamIds.length >= 3 && 'Recorded with all three teams willing — 2 points each, no punctuality bonus.'}
                  </p>
                  {isAdmin && <button onClick={() => clearAbandon(slot.id)} className="plain-btn text-xs px-2.5 py-1 rounded-md">Undo — restore normal scoring</button>}
                </div>
              ) : (
              <>
              {slot.teamIds.length < 3 && (
                isAdmin ? (
                  <div className="mb-3 pb-3" style={{ borderBottom: '1px solid var(--hair3)' }}>
                    {assigningSlotId === slot.id ? (
                      <>
                        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Pick 3 teams</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {data.teams.map((t) => {
                            const idx = assignPicked.indexOf(t.id)
                            const selected = idx !== -1
                            return (
                              <button key={t.id} onClick={() => toggleAssignPick(t.id)} className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-sm relative ${selected ? 'chip-selected' : 'chip-outline'}`}>
                                <TeamLogo team={t} size={24} />
                                <span className="flex-1 text-left">{t.name}</span>
                                {selected && <span className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: 'var(--gold)', color: '#1A1409' }}>{idx + 1}</span>}
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex gap-2">
                          <button disabled={assignPicked.length !== 3} onClick={() => confirmAssign(slot.id)} className="gold-btn flex-1 py-1.5 rounded-md text-sm">Confirm teams ({assignPicked.length}/3)</button>
                          <button onClick={() => { setAssigningSlotId(null); setAssignPicked([]) }} className="plain-btn px-3 py-1.5 rounded-md text-sm">Cancel</button>
                        </div>
                      </>
                    ) : (
                      <button onClick={() => { setAssigningSlotId(slot.id); setAssignPicked([]) }} className="gold-btn flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md">
                        <Users size={14} /> Assign teams
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs mb-3" style={{ color: 'var(--muted2)' }}>Teams to be decided once qualification is confirmed.</p>
                )
              )}
              <div className="space-y-1.5">
                {slot.matches.map((m) => {
                  let a = m.fixedA ? teamById(m.fixedA) : null, b = m.fixedB ? teamById(m.fixedB) : null
                  if (m.type === 'qualifier1' && resolvedTeams.qualifier1) { a = teamById(resolvedTeams.qualifier1[0]); b = teamById(resolvedTeams.qualifier1[1]) }
                  if (m.type === 'eliminator' && resolvedTeams.eliminator) { a = teamById(resolvedTeams.eliminator[0]); b = teamById(resolvedTeams.eliminator[1]) }
                  if (m.type === 'final' && resolvedTeams.final) { a = teamById(resolvedTeams.final[0]); b = teamById(resolvedTeams.final[1]) }
                  const playable = a && b
                  const bonusEligible = isFinalSlot && (m.type === 'qualifier1' || m.type === 'eliminator') && finalSlotHolderId && !finalSlotAdvantage?.usedInMatchId
                  const bonusActiveHere = finalSlotAdvantage?.activatedForMatchId === m.id
                  return (
                    <div key={m.id} className="pt-1.5" style={{ borderTop: '1px solid var(--hair3)' }}>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{MATCH_LABELS[m.type]}</p>
                          <div className="flex items-center gap-1.5"><TeamPill team={a} /><span style={{ color: 'var(--muted2)' }}>v</span><TeamPill team={b} /></div>
                        </div>
                        {m.result ? (
                          <span className="flex items-center gap-2">
                            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--green)' }}>
                              <Check size={12} /> {m.result.walkover ? `${m.result.teamAScore ?? m.result.teamBScore} (no chase needed)` : `${m.result.teamAScore}-${m.result.teamBScore}`}
                            </span>
                            {isAdmin && (
                              <button onClick={() => setOpenMatch({ slotId: slot.id, matchId: m.id, teamA: teamById(m.result.teamA), teamB: teamById(m.result.teamB), existing: m.result, slot, matchType: m.type })} className="plain-btn text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                <Pencil size={11} /> Edit
                              </button>
                            )}
                          </span>
                        ) : playable && isAdmin ? (
                          <button onClick={() => setOpenMatch({ slotId: slot.id, matchId: m.id, teamA: a, teamB: b, slot, matchType: m.type })} className="plain-btn text-xs px-2.5 py-1 rounded-md">Enter result</button>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--faint)' }}>{playable ? 'Pending' : 'Awaiting teams'}</span>
                        )}
                      </div>
                      {m.result && m.result.bonusRunsApplied ? (
                        <p className="text-[10px] mt-1" style={{ color: 'var(--gold)' }}>
                          {m.result.bonusRunsApplied > 0 ? '+' : ''}{m.result.bonusRunsApplied} bonus runs applied ({teamById(m.result.advantageTeamId)?.name}'s advantage)
                        </p>
                      ) : null}
                      {!m.result && isAdmin && bonusEligible && (
                        <button onClick={() => toggleFinalSlotBonus(m.id)} className="flex items-center gap-1 text-[10px] mt-1 px-2 py-1 rounded-md" style={bonusActiveHere ? { background: 'var(--gold)', color: '#1A1409' } : { border: '1px solid var(--hair2)', color: 'var(--muted)' }}>
                          <Zap size={10} /> {bonusActiveHere ? `Saved bonus armed for ${teamById(finalSlotHolderId)?.name} — tap to cancel` : `Use ${teamById(finalSlotHolderId)?.name}'s saved Final Slot bonus here`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              <GuestTracker data={data} persist={persist} slot={slot} isAdmin={isAdmin} />
              {isAdmin && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--hair3)' }}>
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                      <input type="checkbox" checked={!!slot.finishedOnTime} onChange={(e) => updateSlotFlag(slot.id, { finishedOnTime: e.target.checked })} style={{ accentColor: 'var(--gold)' }} />
                      <Clock size={12} /> Finished on time
                    </label>
                    <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                      <input type="checkbox" checked={!!slot.punctualityOverride} onChange={(e) => updateSlotFlag(slot.id, { punctualityOverride: e.target.checked })} style={{ accentColor: 'var(--gold)' }} />
                      Referee override (award bonus regardless)
                    </label>
                  </div>
                  {abandoningSlotId === slot.id ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Which teams are willing to play?</p>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {slot.teamIds.map((id) => (
                          <button key={id} onClick={() => toggleWilling(id)} className={`px-2.5 py-1.5 rounded-md text-xs ${willingPicked.includes(id) ? 'chip-selected' : 'chip-outline'}`}>{teamById(id)?.name}</button>
                        ))}
                      </div>
                      {willingPicked.length === 2 && (
                        <div className="mb-2">
                          <label className="text-[10px]" style={{ color: 'var(--muted2)' }}>Who won between the two willing teams?</label>
                          <select value={twoWillingWinner} onChange={(e) => setTwoWillingWinner(e.target.value)} className="field w-full mt-1 px-3 py-2 text-sm">
                            <option value="">Select winner…</option>
                            {willingPicked.map((id) => <option key={id} value={id}>{teamById(id)?.name}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button disabled={willingPicked.length === 2 && !twoWillingWinner} onClick={() => confirmAbandon(slot)} className="gold-btn flex-1 py-1.5 rounded-md text-sm">Confirm abandonment</button>
                        <button onClick={() => { setAbandoningSlotId(null); setWillingPicked([]); setTwoWillingWinner('') }} className="plain-btn px-3 py-1.5 rounded-md text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAbandoningSlotId(slot.id); setWillingPicked([]) }} className="plain-btn flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md">
                      <Ban size={12} /> Mark slot abandoned
                    </button>
                  )}
                </div>
              )}
              </>
              )}
            </Card>
          )
        })}
      </div>

      {openMatch && <ResultModal data={data} persist={persist} slotId={openMatch.slotId} matchId={openMatch.matchId} teamA={openMatch.teamA} teamB={openMatch.teamB} slot={openMatch.slot} matchType={openMatch.matchType} existing={openMatch.existing} onClose={() => setOpenMatch(null)} />}
      {confirmDeleteSlot && (
        <ConfirmModal
          title="Delete this slot?"
          body="This removes the slot and every match result in it. This can't be undone."
          onCancel={() => setConfirmDeleteSlot(null)}
          onConfirm={() => deleteSlot(confirmDeleteSlot)}
        />
      )}
    </div>
  )
}
