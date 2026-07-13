import { useState } from 'react'
import { BookUser, Pencil, Plus, Search, X } from 'lucide-react'
import { uid } from '../../../lib/uid'
import { uploadPhoto } from '../../../lib/photo'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { PlayerAvatar } from '../../shared/PlayerAvatar'

const ROLES = ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper']

export function PlayerPool({ data, persist, isAdmin }) {
  const pool = data.playerPool || []
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('Batter')
  const [newBasePrice, setNewBasePrice] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [query, setQuery] = useState('')
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadErr, setUploadErr] = useState('')

  function addPlayer() {
    if (!newName.trim()) return
    const player = {
      id: uid('pool'),
      name: newName.trim(),
      role: newRole,
      basePrice: newBasePrice === '' ? null : Number(newBasePrice),
      photoUrl: '',
    }
    persist({ ...data, playerPool: [...pool, player] })
    setNewName(''); setNewBasePrice(''); setNewRole('Batter')
  }
  function updatePlayer(id, patch) {
    persist({ ...data, playerPool: pool.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  }
  function removePlayer(id) {
    persist({ ...data, playerPool: pool.filter((p) => p.id !== id) })
  }
  async function handlePhotoUpload(id, file) {
    if (!file) return
    setUploadErr('')
    setUploadingId(id)
    try {
      const url = await uploadPhoto(file, 'players')
      updatePlayer(id, { photoUrl: url })
    } catch {
      setUploadErr("Couldn't process that photo — try a different image.")
    }
    setUploadingId(null)
  }

  const q = query.trim().toLowerCase()
  const filtered = q ? pool.filter((p) => p.name.toLowerCase().includes(q)) : pool

  return (
    <div>
      <SectionTitle icon={BookUser}>Player Pool</SectionTitle>
      <p className="text-[11px] mb-3" style={{ color: 'var(--muted2)' }}>Every player registered for Season 2, independent of team. Team assignment happens through the Auction tab.</p>

      <div className="relative mb-3">
        <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search players…" className="field w-full pl-8 pr-3 py-2 text-sm" />
      </div>

      {isAdmin && (
        <Card className="mb-4">
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Add player</p>
          <div className="flex gap-2 mb-2">
            <input placeholder="Player name" value={newName} onChange={(e) => setNewName(e.target.value)} className="field flex-1 px-2.5 py-1.5 text-sm" />
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="field px-2 py-1.5 text-sm">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input inputMode="numeric" placeholder="Base price (optional)" value={newBasePrice} onChange={(e) => setNewBasePrice(e.target.value)} className="field flex-1 px-2.5 py-1.5 text-sm" />
            <button onClick={addPlayer} className="gold-btn rounded px-2.5"><Plus size={16} /></button>
          </div>
        </Card>
      )}

      {filtered.length === 0 ? (
        <Empty
          title={q ? 'No players found' : 'No players yet'}
          body={q ? `Nobody matching "${query}".` : (isAdmin ? 'Add players above to build the Season 2 pool.' : 'Check back once the admin builds the player pool.')}
        />
      ) : (
        <div className="space-y-1.5">
          {filtered.map((p) => {
            const isEditing = editingId === p.id
            return (
              <Card key={p.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <PlayerAvatar player={p} size={36} />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{p.role}{p.basePrice ? ` · Base ₹${p.basePrice}` : ''}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingId(isEditing ? null : p.id)}><Pencil size={13} color="var(--muted)" /></button>
                      <button onClick={() => removePlayer(p.id)}><X size={14} color="var(--muted)" /></button>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-2.5 pt-2.5 space-y-1.5" style={{ borderTop: '1px solid var(--hair3)' }}>
                    <div>
                      <label className="text-[10px]" style={{ color: 'var(--muted)' }}>Name</label>
                      <input value={p.name} onChange={(e) => updatePlayer(p.id, { name: e.target.value })} className="field w-full mt-1 px-2 py-1.5 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px]" style={{ color: 'var(--muted)' }}>Role</label>
                        <select value={p.role} onChange={(e) => updatePlayer(p.id, { role: e.target.value })} className="field w-full mt-1 px-2 py-1.5 text-sm">
                          {ROLES.map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px]" style={{ color: 'var(--muted)' }}>Base price</label>
                        <input inputMode="numeric" value={p.basePrice ?? ''} onChange={(e) => updatePlayer(p.id, { basePrice: e.target.value === '' ? null : Number(e.target.value) })} className="field w-full mt-1 px-2 py-1.5 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px]" style={{ color: 'var(--muted)' }}>Photo</label>
                      <div className="flex items-center gap-2 mt-1">
                        <PlayerAvatar player={p} size={36} />
                        <label className="plain-btn text-xs px-2.5 py-1.5 rounded-md" style={{ cursor: 'pointer' }}>
                          {uploadingId === p.id ? 'Uploading…' : 'Upload photo'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(p.id, e.target.files[0])} />
                        </label>
                      </div>
                      {uploadErr && uploadingId === null && <p className="text-[10px] mt-1" style={{ color: 'var(--red)' }}>{uploadErr}</p>}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
