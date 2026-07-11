import { useState } from 'react'
import { Pencil, Plus, Search, Users, X } from 'lucide-react'
import { buildPlayerIndex, sortMvp } from '../../../lib/stats'
import { fmt } from '../../../lib/players'
import { uploadPhoto } from '../../../lib/photo'
import { uid } from '../../../lib/uid'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { ConfirmModal } from '../../layout/ConfirmModal'
import { TeamLogo } from '../../shared/TeamLogo'
import { TeamPill } from '../../shared/TeamPill'
import { PlayerAvatar } from '../../shared/PlayerAvatar'
import { PlayerModal } from '../../shared/PlayerModal'

export function Teams({ data, persist, isAdmin }) {
  const [openTeam, setOpenTeam] = useState(null)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('Batter')
  const [selected, setSelected] = useState(null)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [query, setQuery] = useState('')
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadErr, setUploadErr] = useState('')
  const [confirmClearSquad, setConfirmClearSquad] = useState(null)
  const players = buildPlayerIndex(data)

  function updateTeam(id, patch) { persist({ ...data, teams: data.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)) }) }
  function clearSquad(teamId) {
    persist({ ...data, teams: data.teams.map((t) => (t.id === teamId ? { ...t, players: [] } : t)) })
    setConfirmClearSquad(null)
  }
  function addPlayer(teamId) {
    if (!newName.trim()) return
    const team = data.teams.find((t) => t.id === teamId)
    if (team.players.length >= 9) return
    const player = { id: uid('p'), name: newName.trim(), role: newRole, photoUrl: '', earnings: 0 }
    persist({ ...data, teams: data.teams.map((t) => (t.id === teamId ? { ...t, players: [...t.players, player] } : t)) })
    setNewName('')
  }
  function removePlayer(teamId, playerId) {
    persist({ ...data, teams: data.teams.map((t) => (t.id === teamId ? { ...t, players: t.players.filter((p) => p.id !== playerId) } : t)) })
  }
  function updatePlayer(teamId, playerId, patch) {
    persist({ ...data, teams: data.teams.map((t) => (t.id === teamId ? { ...t, players: t.players.map((p) => (p.id === playerId ? { ...p, ...patch } : p)) } : t)) })
  }
  async function handlePhotoUpload(teamId, playerId, file) {
    if (!file) return
    setUploadErr('')
    setUploadingId(playerId)
    try {
      const url = await uploadPhoto(file, 'players')
      updatePlayer(teamId, playerId, { photoUrl: url })
    } catch {
      setUploadErr("Couldn't process that photo — try a different image.")
    }
    setUploadingId(null)
  }

  const q = query.trim().toLowerCase()
  const searchMatches = q ? data.teams.flatMap((t) => t.players.filter((p) => p.name.toLowerCase().includes(q)).map((p) => ({ ...p, team: t }))) : null

  return (
    <div>
      <SectionTitle icon={Users}>Squads</SectionTitle>
      <div className="relative mb-3">
        <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search players…" className="field w-full pl-8 pr-3 py-2 text-sm" />
      </div>

      {searchMatches ? (
        searchMatches.length === 0 ? (
          <Empty title="No players found" body={`Nobody matching "${query}" in any squad.`} />
        ) : (
          <div className="space-y-1.5">
            {searchMatches.map((p) => (
              <button key={p.id} onClick={() => { setOpenTeam(p.team.id); setQuery('') }} className="w-full ember-card flex items-center justify-between text-left" style={{ padding: '10px 14px' }}>
                <div className="flex items-center gap-2.5">
                  <PlayerAvatar player={p} team={p.team} size={28} />
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{p.role}</p>
                  </div>
                </div>
                <TeamPill team={p.team} />
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          {data.teams.map((team) => {
            const teamPlayers = players.filter((p) => p.team && p.team.id === team.id)
            const teamStats = [...sortMvp(teamPlayers.filter((p) => p.mvp)), ...teamPlayers.filter((p) => !p.mvp)]
            return (
              <Card key={team.id}>
                <button className="w-full flex items-center justify-between" onClick={() => setOpenTeam(openTeam === team.id ? null : team.id)}>
                  <div className="flex items-center gap-2.5">
                    <TeamLogo team={team} size={44} />
                    {isAdmin ? (
                      <input value={team.name} onClick={(e) => e.stopPropagation()} onChange={(e) => updateTeam(team.id, { name: e.target.value })} className="display text-lg tracking-wide outline-none bg-transparent" style={{ color: team.color }} />
                    ) : (
                      <span className="display text-lg tracking-wide" style={{ color: team.color }}>{team.name}</span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{team.players.length}/9 players</span>
                </button>
                {openTeam === team.id && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--hair3)' }}>
                    {isAdmin ? (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div><label className="text-[10px]" style={{ color: 'var(--muted)' }}>Captain</label><input value={team.captain} onChange={(e) => updateTeam(team.id, { captain: e.target.value })} className="field w-full px-2 py-1.5 text-sm" /></div>
                        <div><label className="text-[10px]" style={{ color: 'var(--muted)' }}>Owner</label><input value={team.owner} onChange={(e) => updateTeam(team.id, { owner: e.target.value })} className="field w-full px-2 py-1.5 text-sm" /></div>
                      </div>
                    ) : (
                      <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Captain: {team.captain || '—'} · Owner: {team.owner || '—'}</p>
                    )}
                    {isAdmin && team.players.length > 0 && (
                      <button onClick={() => setConfirmClearSquad(team.id)} className="text-[11px] mb-2" style={{ color: 'var(--red)' }}>Clear entire squad (new season reset)</button>
                    )}
                    {team.players.length === 0 && <p className="text-xs mb-2" style={{ color: 'var(--muted2)' }}>No players added yet.</p>}
                    <div className="space-y-1.5 mb-3">
                      {team.players.map((p) => {
                        const isEditing = editingPlayer && editingPlayer.playerId === p.id
                        return (
                          <div key={p.id} className="rounded" style={{ background: 'var(--ink)' }}>
                            <div className="flex items-center justify-between px-2.5 py-1.5">
                              <div className="flex items-center gap-2">
                                <PlayerAvatar player={p} team={team} size={32} />
                                <span className="text-sm">{p.name} <span className="text-xs" style={{ color: 'var(--muted2)' }}>· {p.role}</span></span>
                                {p.earnings > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(232,185,35,0.15)', color: 'var(--gold)' }}>₹{p.earnings}</span>}
                              </div>
                              {isAdmin && (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setEditingPlayer(isEditing ? null : { teamId: team.id, playerId: p.id })}><Pencil size={13} color="var(--muted)" /></button>
                                  <button onClick={() => removePlayer(team.id, p.id)}><X size={14} color="var(--muted)" /></button>
                                </div>
                              )}
                            </div>
                            {isEditing && (
                              <div className="px-2.5 pb-2.5 space-y-1.5">
                                <div>
                                  <label className="text-[10px]" style={{ color: 'var(--muted)' }}>Photo</label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <PlayerAvatar player={p} team={team} size={36} />
                                    <label className="plain-btn text-xs px-2.5 py-1.5 rounded-md" style={{ cursor: 'pointer' }}>
                                      {uploadingId === p.id ? 'Uploading…' : 'Upload photo'}
                                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(team.id, p.id, e.target.files[0])} />
                                    </label>
                                  </div>
                                  {uploadErr && uploadingId === null && <p className="text-[10px] mt-1" style={{ color: 'var(--red)' }}>{uploadErr}</p>}
                                  <p className="text-[9px] mt-1" style={{ color: 'var(--faint)' }}>Stored in Supabase Storage — no external site needed, so it always loads.</p>
                                  <details className="mt-1.5">
                                    <summary className="text-[10px]" style={{ color: 'var(--muted)', cursor: 'pointer' }}>Or paste an image link instead</summary>
                                    <input value={p.photoUrl && p.photoUrl.startsWith('data:') ? '' : (p.photoUrl || '')} onChange={(e) => updatePlayer(team.id, p.id, { photoUrl: e.target.value })} placeholder="https://…" className="field w-full mt-1 px-2 py-1.5 text-xs" />
                                  </details>
                                </div>
                                <div><label className="text-[10px]" style={{ color: 'var(--muted)' }}>Total earnings (₹)</label><input inputMode="numeric" value={p.earnings || 0} onChange={(e) => updatePlayer(team.id, p.id, { earnings: Number(e.target.value) || 0 })} className="field w-full px-2 py-1.5 text-xs" /></div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {isAdmin && team.players.length < 9 && (
                      <div className="flex gap-2 mb-4">
                        <input placeholder="Player name" value={newName} onChange={(e) => setNewName(e.target.value)} className="field flex-1 px-2.5 py-1.5 text-sm" />
                        <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="field px-2 py-1.5 text-sm">
                          <option>Batter</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper</option>
                        </select>
                        <button onClick={() => addPlayer(team.id)} className="gold-btn rounded px-2.5"><Plus size={16} /></button>
                      </div>
                    )}

                    {teamStats.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>Season stats · ranked by MVP</p>
                        <div className="space-y-1">
                          {teamStats.map((p, i) => (
                            <button key={p.name + i} onClick={() => setSelected(p)} className="w-full flex items-center justify-between text-sm rounded px-2.5 py-1.5" style={{ background: 'var(--ink)' }}>
                              <span>{i + 1}. {p.name}</span>
                              <span style={{ color: 'var(--gold)' }}>{p.mvp ? fmt(p.mvp.total, 1) : '—'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
      {confirmClearSquad && (
        <ConfirmModal
          title="Clear this squad?"
          body="Removes every player from this team so you can start the new season's roster fresh. This can't be undone."
          confirmLabel="Clear squad"
          onCancel={() => setConfirmClearSquad(null)}
          onConfirm={() => clearSquad(confirmClearSquad)}
        />
      )}
    </div>
  )
}
