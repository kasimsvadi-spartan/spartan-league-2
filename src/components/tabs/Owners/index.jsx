import { useState } from 'react'
import { Crown } from 'lucide-react'
import { teamSpendTotals } from '../../../lib/auction'
import { uploadPhoto } from '../../../lib/photo'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { TeamLogo } from '../../shared/TeamLogo'
import { PlayerAvatar } from '../../shared/PlayerAvatar'

export function Owners({ data, persist, isAdmin }) {
  const [uploadingId, setUploadingId] = useState(null)
  const [uploadErr, setUploadErr] = useState('')
  const totals = teamSpendTotals(data)

  function updateTeam(id, patch) {
    persist({ ...data, teams: data.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  }
  async function handlePhotoUpload(teamId, file) {
    if (!file) return
    setUploadErr('')
    setUploadingId(teamId)
    try {
      const url = await uploadPhoto(file, 'owners')
      updateTeam(teamId, { ownerPhotoUrl: url })
    } catch {
      setUploadErr("Couldn't process that photo — try a different image.")
    }
    setUploadingId(null)
  }

  return (
    <div>
      <SectionTitle icon={Crown}>Owners</SectionTitle>
      <div className="space-y-2">
        {data.teams.map((team) => {
          const spend = totals.find((t) => t.team.id === team.id)
          return (
            <Card key={team.id}>
              <div className="flex items-center gap-3">
                <PlayerAvatar player={{ name: team.owner || team.name, photoUrl: team.ownerPhotoUrl || '' }} team={team} size={52} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <TeamLogo team={team} size={22} />
                    <span className="text-xs" style={{ color: team.color }}>{team.name}</span>
                  </div>
                  {isAdmin ? (
                    <input
                      value={team.owner}
                      onChange={(e) => updateTeam(team.id, { owner: e.target.value })}
                      placeholder="Owner name"
                      className="field w-full px-2 py-1.5 text-sm"
                    />
                  ) : (
                    <p className="display text-lg">{team.owner || '—'}</p>
                  )}
                  {spend && spend.count > 0 && (
                    <p className="text-[11px] mt-1" style={{ color: 'var(--muted2)' }}>{spend.count} player{spend.count === 1 ? '' : 's'} bought · ₹{spend.spent} spent</p>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid var(--hair3)' }}>
                  <label className="plain-btn text-xs px-2.5 py-1.5 rounded-md inline-block" style={{ cursor: 'pointer' }}>
                    {uploadingId === team.id ? 'Uploading…' : 'Upload owner photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handlePhotoUpload(team.id, e.target.files[0])} />
                  </label>
                  {uploadErr && uploadingId === null && <p className="text-[10px] mt-1" style={{ color: 'var(--red)' }}>{uploadErr}</p>}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
