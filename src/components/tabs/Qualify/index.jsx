import { Award, Trophy } from 'lucide-react'
import { computeLeagueStandings, TEAM_LEAGUE_SLOTS } from '../../../lib/scoring'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { TeamLogo } from '../../shared/TeamLogo'
import { TeamPill } from '../../shared/TeamPill'

const ZONE_STYLE = {
  final: { label: '→ Grand Final', bg: 'rgba(232,185,35,0.15)', border: 'var(--gold)', text: 'var(--gold)' },
  semi: { label: '→ Semi-Final', bg: 'rgba(95,169,138,0.12)', border: 'var(--green)', text: 'var(--green)' },
  out: { label: 'Eliminated', bg: 'rgba(192,39,43,0.12)', border: 'var(--red)', text: 'var(--red)' },
}
const zoneFor = (i) => (i < 2 ? 'final' : i < 5 ? 'semi' : 'out')

export function Qualify({ data, isAdmin, onCreateSlot }) {
  const { table, completed, total } = computeLeagueStandings(data)
  const leagueDone = completed >= total
  const semiSlot = data.slots.find((s) => s.slotType === 'Semi-Final')
  const finalSlot = data.slots.find((s) => s.slotType === 'Final')
  const semiFinalMatch = semiSlot && semiSlot.matches.find((m) => m.type === 'final')
  const semiWinnerId = semiFinalMatch && semiFinalMatch.result ? semiFinalMatch.result.winner : null
  const semiWinner = semiWinnerId ? data.teams.find((t) => t.id === semiWinnerId) : null

  return (
    <div>
      <SectionTitle icon={Award}>Qualification</SectionTitle>

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold">League stage</p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{completed} / {total} slots played</p>
        </div>
        <div style={{ background: 'var(--ink)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, (completed / total) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold-light), var(--gold-dark))' }} />
        </div>
        {!leagueDone && <p className="text-[11px] mt-2" style={{ color: 'var(--muted2)' }}>Standings below are provisional until all {total} league slots are complete.</p>}
      </Card>

      {leagueDone && (
        <div className="space-y-2 mb-4">
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Final League Standings</p>
          {table.map((r, i) => {
            const z = ZONE_STYLE[zoneFor(i)]
            return (
              <Card key={r.team.id} className="flex items-center justify-between" style={{ borderColor: z.border }}>
                <div className="flex items-center gap-3">
                  <span className="display text-xl w-6" style={{ color: 'var(--muted)' }}>{i + 1}</span>
                  <TeamLogo team={r.team} size={40} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: r.team.color }}>{r.team.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{r.total} pts · NRR {r.nrr >= 0 ? '+' : ''}{r.nrr.toFixed(2)}</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded font-semibold" style={{ background: z.bg, color: z.text }}>{z.label}</span>
              </Card>
            )
          })}
        </div>
      )}

      {!leagueDone && table.length >= 5 && (
        <div className="mb-4">
          <SectionTitle icon={Award}>Qualification Targets</SectionTitle>
          <div className="space-y-2">
            {table.map((r, i) => {
              const remaining = Math.max(0, TEAM_LEAGUE_SLOTS - r.slotsPlayed)
              const finalCutoff = table[1].total
              const semiCutoff = table[4].total
              const z = ZONE_STYLE[zoneFor(i)]
              let body
              if (i < 2) {
                body = <p className="text-xs" style={{ color: 'var(--green)' }}>Currently on course for the Grand Final.</p>
              } else if (i < 5) {
                const gap = Math.max(0, finalCutoff - r.total)
                const perSlot = remaining > 0 ? Math.ceil(gap / remaining) : null
                body = gap === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--green)' }}>Level with or ahead of the current Final cutoff ({table[1].team.name}).</p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Needs <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{gap} more pts</span> to draw level with {table[1].team.name} for a Final berth {remaining > 0 ? `(~${perSlot}/slot over ${remaining} remaining slots)` : '(no league slots remaining)'}.</p>
                )
              } else {
                const gap = Math.max(0, semiCutoff - r.total)
                const perSlot = remaining > 0 ? Math.ceil(gap / remaining) : null
                body = gap === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--green)' }}>Level with or ahead of the current Semi-Final cutoff ({table[4].team.name}).</p>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--red)' }}>Needs <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{gap} more pts</span> to draw level with {table[4].team.name} for a Semi-Final spot {remaining > 0 ? `(~${perSlot}/slot over ${remaining} remaining slots)` : '(no league slots remaining — elimination risk)'}.</p>
                )
              }
              return (
                <Card key={r.team.id} style={{ borderColor: z.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2"><span className="display text-lg" style={{ color: 'var(--muted)' }}>{i + 1}</span><TeamPill team={r.team} /></div>
                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded font-semibold" style={{ background: z.bg, color: z.text }}>{z.label}</span>
                  </div>
                  <p className="text-[11px] mb-1" style={{ color: 'var(--muted2)' }}>{r.total} pts · {remaining} slots left</p>
                  {body}
                </Card>
              )
            })}
          </div>
          <p className="text-[11px] mt-3" style={{ color: 'var(--muted2)' }}>These are simplified targets against today's cutoff position — they ignore bonus points and assume rivals stop gaining, so treat them as a rough guide rather than a guarantee.</p>
        </div>
      )}

      {leagueDone && !semiSlot && (
        <Card className="mb-4 text-center">
          <p className="text-sm font-semibold mb-1">League stage complete</p>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>3rd, 4th and 5th place play the Semi-Final slot. The winner joins {table[0].team.name} and {table[1].team.name} in the Grand Final.</p>
          {isAdmin && <button onClick={() => onCreateSlot({ teamIds: [table[2].team.id, table[3].team.id, table[4].team.id], slotType: 'Semi-Final' })} className="gold-btn w-full py-2 rounded-md text-sm">Create Semi-Final slot</button>}
        </Card>
      )}

      {semiSlot && !semiWinner && (
        <Empty title="Semi-Final in progress" body="Waiting on results from the Semi-Final slot in Schedule." />
      )}

      {semiWinner && !finalSlot && (
        <Card className="mb-4 text-center">
          <p className="text-sm font-semibold mb-1">Semi-Final complete</p>
          <div className="flex items-center justify-center gap-2 mb-3"><TeamPill team={semiWinner} /> <span className="text-xs" style={{ color: 'var(--muted)' }}>advance to the Grand Final</span></div>
          {isAdmin && <button onClick={() => onCreateSlot({ teamIds: [table[0].team.id, table[1].team.id, semiWinner.id], slotType: 'Final' })} className="gold-btn w-full py-2 rounded-md text-sm">Create Grand Final slot</button>}
        </Card>
      )}

      {finalSlot && (() => {
        const finalMatch = finalSlot.matches.find((m) => m.type === 'final')
        const champion = finalMatch && finalMatch.result ? data.teams.find((t) => t.id === finalMatch.result.winner) : null
        return champion ? (
          <Card className="text-center py-6">
            <p className="text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-1" style={{ color: 'var(--muted)' }}><Trophy size={12} color="var(--gold)" /> Season Champions</p>
            <div className="flex justify-center mt-3 mb-1"><TeamLogo team={champion} size={80} /></div>
            <p className="display text-3xl gold-text mt-2">{champion.name}</p>
          </Card>
        ) : (
          <Empty title="Grand Final in progress" body="Waiting on results from the Grand Final slot in Schedule." />
        )
      })()}
    </div>
  )
}
