import { useState } from 'react'
import { ArrowLeftRight, BarChart3, CalendarDays, Flame, Medal, Pencil, Trophy } from 'lucide-react'
import { computeHeadToHead } from '../../../lib/scoring'
import { computeRecords } from '../../../lib/records'
import { fmt } from '../../../lib/players'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { Card } from '../../layout/Card'
import { TeamLogo } from '../../shared/TeamLogo'
import { TeamPill } from '../../shared/TeamPill'
import { RecordCard } from './RecordCard'
import { ManualRecordModal } from './ManualRecordModal'
import { PlayerPill } from './PlayerPill'

export function Records({ data, persist, isAdmin }) {
  const r = computeRecords(data)
  const h2h = computeHeadToHead(data)
  const hasMatches = data.slots.some((s) => s.matches.some((m) => m.result))
  const [editing, setEditing] = useState(null)
  const manual = data.manualRecords || {}
  const highestScore = manual.highestScore || r.highestScore
  const bestBowling = manual.bestBowling || r.bestBowling

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon={Medal}>Season Records</SectionTitle>
        {!hasMatches && (data.statsImports || []).length === 0 ? (
          <Empty title="No records yet" body="Records fill in once matches are played and CricHeroes stats are imported." />
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <RecordCard icon={Flame} title="Highest Individual Score" value={highestScore?.value} teamOrPlayer={highestScore && <PlayerPill record={highestScore} />} sub={highestScore && `${highestScore.team?.name || ''} · ${highestScore.label}${manual.highestScore ? ' · manually set' : ''}`} />
              {isAdmin && <button onClick={() => setEditing('highestScore')} className="absolute top-3 right-3"><Pencil size={13} color="var(--muted)" /></button>}
            </div>
            <div className="relative">
              <RecordCard icon={Medal} title="Best Bowling Figures" value={bestBowling ? `${bestBowling.wickets}/${bestBowling.runs ?? '—'}` : null} teamOrPlayer={bestBowling && <PlayerPill record={bestBowling} />} sub={bestBowling && `${bestBowling.team?.name || ''} · ${bestBowling.label}${manual.bestBowling ? ' · manually set' : ''}`} />
              {isAdmin && <button onClick={() => setEditing('bestBowling')} className="absolute top-3 right-3"><Pencil size={13} color="var(--muted)" /></button>}
            </div>
            <RecordCard icon={Trophy} title="Highest Team Total" value={r.highestTotal?.value} teamOrPlayer={r.highestTotal && <TeamPill team={r.highestTotal.team} />} sub={r.highestTotal && r.highestTotal.label} />
            <RecordCard icon={Trophy} title="Lowest Team Total" value={r.lowestTotal?.value} teamOrPlayer={r.lowestTotal && <TeamPill team={r.lowestTotal.team} />} sub={r.lowestTotal && r.lowestTotal.label} />
            <RecordCard icon={CalendarDays} title="Highest Score Chased" value={r.highestChased?.value} teamOrPlayer={r.highestChased && <TeamPill team={r.highestChased.team} />} sub={r.highestChased && r.highestChased.label} />
            <RecordCard icon={CalendarDays} title="Lowest Score Defended" value={r.lowestDefended?.value} teamOrPlayer={r.lowestDefended && <TeamPill team={r.lowestDefended.team} />} sub={r.lowestDefended && r.lowestDefended.label} />
            <RecordCard icon={BarChart3} title="Best Strike Rate" value={r.bestSR ? fmt(r.bestSR.value, 1) : null} teamOrPlayer={r.bestSR && <PlayerPill record={r.bestSR} />} sub={r.bestSR && `${r.bestSR.team?.name || ''} · ${r.bestSR.runs} runs off ${r.bestSR.balls} balls`} />
          </div>
        )}
        <p className="text-[11px] mt-3" style={{ color: 'var(--muted2)' }}>Team-total and chase/defence records only count full 7-over matches. Individual score and bowling figures default to the best reported within a single imported slot{isAdmin ? ' — tap the pencil to correct with the real match-level figure' : ''}. Strike rate record requires at least 10 balls faced.</p>
        {editing && <ManualRecordModal data={data} persist={persist} kind={editing} existing={manual[editing]} onClose={() => setEditing(null)} />}
      </div>

      <div>
        <SectionTitle icon={ArrowLeftRight}>Head-to-Head</SectionTitle>
        {data.teams.every((t) => Object.values(h2h[t.id] || {}).every((v) => v.wins === 0 && v.losses === 0)) ? (
          <Empty title="No head-to-head history yet" body="This fills in as matches are played across slots." />
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid var(--hair3)' }}></th>
                    {data.teams.map((t) => (
                      <th key={t.id} style={{ padding: 6, borderBottom: '1px solid var(--hair3)' }}><TeamLogo team={t} size={28} /></th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.teams.map((rowTeam) => (
                    <tr key={rowTeam.id}>
                      <td style={{ padding: 8, borderBottom: '1px solid var(--hair3)', whiteSpace: 'nowrap' }}><TeamPill team={rowTeam} /></td>
                      {data.teams.map((colTeam) => {
                        if (colTeam.id === rowTeam.id) return <td key={colTeam.id} style={{ padding: 6, textAlign: 'center', borderBottom: '1px solid var(--hair3)', color: 'var(--faint)' }}>—</td>
                        const cell = h2h[rowTeam.id][colTeam.id]
                        const played = cell.wins + cell.losses
                        return (
                          <td key={colTeam.id} style={{ padding: 6, textAlign: 'center', borderBottom: '1px solid var(--hair3)', color: played === 0 ? 'var(--faint)' : cell.wins > cell.losses ? 'var(--green)' : cell.wins < cell.losses ? 'var(--red)' : 'var(--cream)' }}>
                            {played === 0 ? '—' : `${cell.wins}-${cell.losses}`}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        <p className="text-[11px] mt-3" style={{ color: 'var(--muted2)' }}>Read row vs column as wins–losses, across every match played (league and playoff slots).</p>
      </div>
    </div>
  )
}
