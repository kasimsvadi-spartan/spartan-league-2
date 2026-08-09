import { useState } from 'react'
import { History, Plus, Trophy, X } from 'lucide-react'
import { uid } from '../../../lib/uid'
import { uploadPhoto } from '../../../lib/photo'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { PlayerAvatar } from '../../shared/PlayerAvatar'

const EMPTY_AWARD = { name: '', team: '', value: '' }
const EMPTY_CHAMPION = { teamName: '', logoUrl: '', members: [] }
const AWARDS = [
  { key: 'bestBatsman', label: 'Best Batsman', unit: 'runs' },
  { key: 'bestBowler', label: 'Best Bowler', unit: 'wickets' },
  { key: 'bestFielder', label: 'Best Fielder', unit: 'dismissals' },
  { key: 'mvp', label: 'MVP', unit: 'MVP score' },
]
const ROLES = ['Batter', 'Bowler', 'All-rounder', 'Wicketkeeper']

function getArchive(data) {
  const saved = data.seasonArchive && data.seasonArchive.season1
  return {
    champion: { ...EMPTY_CHAMPION, ...(saved && saved.champion) },
    bestBatsman: { ...EMPTY_AWARD, ...(saved && saved.bestBatsman) },
    bestBowler: { ...EMPTY_AWARD, ...(saved && saved.bestBowler) },
    bestFielder: { ...EMPTY_AWARD, ...(saved && saved.bestFielder) },
    mvp: { ...EMPTY_AWARD, ...(saved && saved.mvp) },
  }
}

export function SeasonArchive({ data, persist, isAdmin }) {
  const archive = getArchive(data)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('Batter')
  const [uploadingId, setUploadingId] = useState(null)

  function saveArchive(next) {
    persist({ ...data, seasonArchive: { ...data.seasonArchive, season1: next } })
  }
  function updateAward(key, patch) {
    saveArchive({ ...archive, [key]: { ...archive[key], ...patch } })
  }
  function updateChampion(patch) {
    saveArchive({ ...archive, champion: { ...archive.champion, ...patch } })
  }
  function addMember() {
    if (!newMemberName.trim()) return
    const member = { id: uid('sm'), name: newMemberName.trim(), role: newMemberRole, photoUrl: '' }
    updateChampion({ members: [...archive.champion.members, member] })
    setNewMemberName('')
  }
  function updateMember(id, patch) {
    updateChampion({ members: archive.champion.members.map((m) => (m.id === id ? { ...m, ...patch } : m)) })
  }
  function removeMember(id) {
    updateChampion({ members: archive.champion.members.filter((m) => m.id !== id) })
  }
  async function handleChampionLogoUpload(file) {
    if (!file) return
    setUploadingId('champion-logo')
    try {
      updateChampion({ logoUrl: await uploadPhoto(file, 'season-archive') })
    } catch { /* upload failed, leave logo unset */ }
    setUploadingId(null)
  }
  async function handleMemberPhotoUpload(id, file) {
    if (!file) return
    setUploadingId(id)
    try {
      updateMember(id, { photoUrl: await uploadPhoto(file, 'season-archive') })
    } catch { /* upload failed, leave photo unset */ }
    setUploadingId(null)
  }

  const hasChampionData = archive.champion.teamName || archive.champion.members.length > 0
  const hasAnyAwardData = AWARDS.some((a) => archive[a.key].name)

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon={History}>Season 1 Award Winners</SectionTitle>
        {!isAdmin && !hasAnyAwardData ? (
          <Empty title="Coming soon" body="Season 1's award winners will show up here once the admin adds them." />
        ) : (
          <div className="space-y-2">
            {AWARDS.map((a) => (
              <Card key={a.key}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>{a.label}</p>
                {isAdmin ? (
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Player name" value={archive[a.key].name} onChange={(e) => updateAward(a.key, { name: e.target.value })} className="field px-2 py-1.5 text-sm" />
                    <input placeholder="Team" value={archive[a.key].team} onChange={(e) => updateAward(a.key, { team: e.target.value })} className="field px-2 py-1.5 text-sm" />
                    <input placeholder={a.unit} value={archive[a.key].value} onChange={(e) => updateAward(a.key, { value: e.target.value })} className="field px-2 py-1.5 text-sm" />
                  </div>
                ) : archive[a.key].name ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="display text-lg">{archive[a.key].name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{archive[a.key].team}</p>
                    </div>
                    <span className="display text-xl gold-text">{archive[a.key].value} {a.unit}</span>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted2)' }}>Not set yet</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <SectionTitle icon={Trophy}>Season 1 Champions</SectionTitle>
        {!isAdmin && !hasChampionData ? (
          <Empty title="Coming soon" body="Season 1's champion team will show up here once the admin adds them." />
        ) : (
          <Card>
            <div className="flex items-center gap-2.5 mb-3">
              <PlayerAvatar player={{ name: archive.champion.teamName, photoUrl: archive.champion.logoUrl }} size={44} />
              {isAdmin ? (
                <input value={archive.champion.teamName} onChange={(e) => updateChampion({ teamName: e.target.value })} placeholder="Champion team name" className="field flex-1 px-2.5 py-1.5 text-sm" />
              ) : (
                <p className="display text-xl gold-text">{archive.champion.teamName}</p>
              )}
            </div>
            {isAdmin && (
              <label className="plain-btn text-xs px-2.5 py-1.5 rounded-md inline-block mb-3" style={{ cursor: 'pointer' }}>
                {uploadingId === 'champion-logo' ? 'Uploading…' : 'Upload team logo'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleChampionLogoUpload(e.target.files[0])} />
              </label>
            )}

            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Squad</p>
            {archive.champion.members.length === 0 ? (
              <p className="text-sm mb-2" style={{ color: 'var(--muted2)' }}>No members added yet.</p>
            ) : (
              <div className="space-y-1.5 mb-3">
                {archive.champion.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-2.5 py-1.5 rounded" style={{ background: 'var(--ink)' }}>
                    <div className="flex items-center gap-2">
                      <PlayerAvatar player={m} size={28} />
                      <span className="text-sm">{m.name} <span className="text-xs" style={{ color: 'var(--muted2)' }}>· {m.role}</span></span>
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <label className="text-[10px]" style={{ color: 'var(--gold)', cursor: 'pointer' }}>
                          {uploadingId === m.id ? '…' : 'Photo'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleMemberPhotoUpload(m.id, e.target.files[0])} />
                        </label>
                        <button onClick={() => removeMember(m.id)}><X size={13} color="var(--muted)" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {isAdmin && (
              <div className="flex gap-2">
                <input placeholder="Member name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="field flex-1 px-2.5 py-1.5 text-sm" />
                <select value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="field px-2 py-1.5 text-sm">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
                <button onClick={addMember} className="gold-btn rounded px-2.5"><Plus size={16} /></button>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
