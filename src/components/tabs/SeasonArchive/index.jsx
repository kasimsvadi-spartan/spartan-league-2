import { useState } from 'react'
import { History, ListOrdered, Plus, Trophy, X } from 'lucide-react'
import { uid } from '../../../lib/uid'
import { uploadPhoto } from '../../../lib/photo'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { PlayerAvatar } from '../../shared/PlayerAvatar'

const EMPTY_AWARD = { name: '', team: '', value: '' }
const EMPTY_CHAMPION = { teamName: '', logoUrl: '', members: [] }
const EMPTY_RECORD = { holder: '', team: '', value: '' }
const AWARDS = [
  { key: 'bestBatsman', label: 'Best Batsman', unit: 'runs' },
  { key: 'bestBowler', label: 'Best Bowler', unit: 'wickets' },
  { key: 'bestFielder', label: 'Best Fielder', unit: 'dismissals' },
  { key: 'mvp', label: 'MVP', unit: 'MVP score' },
]
const RECORDS = [
  { key: 'highestIndividualScore', label: 'Highest Individual Score' },
  { key: 'bestBowlingFigures', label: 'Best Bowling Figures' },
  { key: 'highestTeamScore', label: 'Highest Team Score' },
  { key: 'lowestTeamScore', label: 'Lowest Team Score' },
  { key: 'highestScoreChased', label: 'Highest Score Chased' },
  { key: 'lowestScoreDefended', label: 'Lowest Score Defended' },
  { key: 'mostMvps', label: 'Most MVPs' },
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
    records: Object.fromEntries(RECORDS.map((r) => [r.key, { ...EMPTY_RECORD, ...(saved && saved.records && saved.records[r.key]) }])),
    pointsTable: (saved && saved.pointsTable) || [],
    leaderboard: (saved && saved.leaderboard) || [],
  }
}

export function SeasonArchive({ data, persist, isAdmin }) {
  const archive = getArchive(data)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('Batter')
  const [uploadingId, setUploadingId] = useState(null)
  const [showAllLeaders, setShowAllLeaders] = useState(false)

  function saveArchive(next) {
    persist({ ...data, seasonArchive: { ...data.seasonArchive, season1: next } })
  }
  function updateAward(key, patch) {
    saveArchive({ ...archive, [key]: { ...archive[key], ...patch } })
  }
  function updateRecord(key, patch) {
    saveArchive({ ...archive, records: { ...archive.records, [key]: { ...archive.records[key], ...patch } } })
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
  const hasAnyRecordData = RECORDS.some((r) => archive.records[r.key].holder)

  return (
    <div className="space-y-6">
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

      {archive.pointsTable.length > 0 && (
        <div>
          <SectionTitle icon={ListOrdered}>Final Points Table</SectionTitle>
          <div className="space-y-2">
            {archive.pointsTable.map((r, i) => (
              <Card key={r.team} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="display text-xl w-6" style={{ color: 'var(--muted)' }}>{i + 1}</span>
                  <PlayerAvatar player={{ name: r.team, photoUrl: r.logo }} size={36} />
                  <div>
                    <p className="text-sm font-semibold">{r.team}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted2)' }}>{r.slots} slots · {r.won}W {r.runnerUp}R {r.lost}L · NRR {r.nrr >= 0 ? '+' : ''}{r.nrr.toFixed(2)}</p>
                  </div>
                </div>
                <span className="display text-2xl gold-text">{r.totalPts}</span>
              </Card>
            ))}
          </div>
        </div>
      )}

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
        <SectionTitle icon={History}>Season 1 Record Book</SectionTitle>
        {!isAdmin && !hasAnyRecordData ? (
          <Empty title="Coming soon" body="Season 1's records will show up here once the admin adds them." />
        ) : (
          <div className="space-y-2">
            {RECORDS.map((r) => (
              <Card key={r.key}>
                <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>{r.label}</p>
                {isAdmin ? (
                  <div className="grid grid-cols-3 gap-2">
                    <input placeholder="Holder" value={archive.records[r.key].holder} onChange={(e) => updateRecord(r.key, { holder: e.target.value })} className="field px-2 py-1.5 text-sm" />
                    <input placeholder="Team" value={archive.records[r.key].team} onChange={(e) => updateRecord(r.key, { team: e.target.value })} className="field px-2 py-1.5 text-sm" />
                    <input placeholder="Value" value={archive.records[r.key].value} onChange={(e) => updateRecord(r.key, { value: e.target.value })} className="field px-2 py-1.5 text-sm" />
                  </div>
                ) : archive.records[r.key].holder ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="display text-lg">{archive.records[r.key].holder}</p>
                      {archive.records[r.key].team && <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{archive.records[r.key].team}</p>}
                    </div>
                    <span className="display text-lg gold-text">{archive.records[r.key].value}</span>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--muted2)' }}>Not set yet</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {archive.leaderboard.length > 0 && (() => {
        const shown = showAllLeaders ? archive.leaderboard : archive.leaderboard.slice(0, 10)
        return (
          <div>
            <SectionTitle icon={ListOrdered}>Full Player Stats</SectionTitle>
            <div className="space-y-1.5">
              {shown.map((p) => (
                <div key={p.rank} className="ember-card flex items-center justify-between" style={{ padding: '10px 14px' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="display text-lg w-5" style={{ color: 'var(--muted)' }}>{p.rank}</span>
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{p.team} · {p.runs} runs · {p.wkts} wkts · {p.catches} catches · ₹{p.winnings.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  <span className="display text-xl gold-text">{p.mvp}</span>
                </div>
              ))}
            </div>
            {archive.leaderboard.length > 10 && (
              <button onClick={() => setShowAllLeaders((s) => !s)} className="text-xs mt-2" style={{ color: 'var(--gold)' }}>
                {showAllLeaders ? 'Show top 10 only' : `Show all ${archive.leaderboard.length} players →`}
              </button>
            )}
          </div>
        )
      })()}
    </div>
  )
}
