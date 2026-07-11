import { useEffect, useState } from 'react'
import { castVote, fetchVoteCounts, getVotedTeamId } from '../../../lib/polls'
import { Card } from '../../layout/Card'
import { TeamPill } from '../../shared/TeamPill'

export function PredictionPoll({ data, slot }) {
  const [loading, setLoading] = useState(true)
  const [votedFor, setVotedFor] = useState(null)
  const [counts, setCounts] = useState({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setVotedFor(getVotedTeamId(slot.id))
    fetchVoteCounts(slot.id)
      .then((c) => { if (!cancelled) setCounts(c) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slot.id])

  async function vote(teamId) {
    setVotedFor(teamId)
    setCounts((c) => ({ ...c, [teamId]: (c[teamId] || 0) + 1 }))
    try { await castVote(slot.id, teamId) } catch { /* optimistic count already applied */ }
  }

  if (loading) return null

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const teamById = (id) => data.teams.find((t) => t.id === id)

  return (
    <Card>
      <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted)' }}>Who wins this slot?</p>
      <div className="space-y-2">
        {slot.teamIds.map((id) => {
          const team = teamById(id)
          const votes = counts[id] || 0
          const pct = total > 0 ? Math.round((votes / total) * 100) : 0
          return (
            <button key={id} disabled={!!votedFor} onClick={() => vote(id)} className="w-full text-left" style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--hair2)', background: 'var(--ink)' }}>
              <div className="flex items-center justify-between mb-1">
                <TeamPill team={team} />
                {votedFor && <span className="text-xs" style={{ color: 'var(--muted)' }}>{pct}% ({votes})</span>}
              </div>
              {votedFor && (
                <div style={{ background: 'var(--hair2)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: team.color }} />
                </div>
              )}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] mt-2" style={{ color: 'var(--muted2)' }}>{votedFor ? `${total} vote${total === 1 ? '' : 's'} so far · thanks for predicting!` : 'Tap a team to lock in your prediction.'}</p>
    </Card>
  )
}
