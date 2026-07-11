import { ListOrdered } from 'lucide-react'
import { MATCH_LABELS, marginInfo } from '../../../lib/scoring'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { TeamPill } from '../../shared/TeamPill'

export function Results({ data }) {
  const teamById = (id) => data.teams.find((t) => t.id === id)
  const rows = []
  data.slots.forEach((slot) => slot.matches.forEach((m) => { if (m.result) rows.push({ slot, m }) }))
  rows.sort((a, b) => (b.slot.date || '').localeCompare(a.slot.date || ''))
  if (rows.length === 0) return <Empty title="No results yet" body="Results appear here once the admin enters them from the Schedule tab." />
  return (
    <div>
      <SectionTitle icon={ListOrdered}>Results</SectionTitle>
      <div className="space-y-2">
        {rows.map(({ slot, m }) => {
          const a = teamById(m.result.teamA), b = teamById(m.result.teamB)
          const info = marginInfo(m.result)
          return (
            <Card key={m.id}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{MATCH_LABELS[m.type]} · {slot.date ? new Date(slot.date + 'T00:00').toDateString() : ''}</p>
                {!info.full && <span className="tag-neutral text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded">Shortened</span>}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <TeamPill team={a} muted={m.result.winner !== a.id} />
                    <span className="display text-base">{m.result.teamAScore}{m.result.teamAOvers != null && <span className="text-xs" style={{ color: 'var(--muted2)' }}> ({m.result.teamAOvers} ov)</span>}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TeamPill team={b} muted={m.result.winner !== b.id} />
                    <span className="display text-base">{m.result.teamBScore}{m.result.teamBOvers != null && <span className="text-xs" style={{ color: 'var(--muted2)' }}> ({m.result.teamBOvers} ov)</span>}</span>
                  </div>
                </div>
                <div className="text-right text-xs" style={{ color: 'var(--muted)' }}>
                  <p className="font-medium" style={{ color: 'var(--green)' }}>{teamById(m.result.winner)?.name} won</p>
                  {info?.type === 'runs' && <p>by {info.margin} runs {info.bonus > 0 && `(+${info.bonus} bonus)`}</p>}
                  {info?.type === 'chase' && info.overs != null && <p>chased in {info.overs} ov {info.bonus > 0 && `(+${info.bonus} bonus)`}</p>}
                  {info?.type === 'superover' && <p>on Super Over ({m.result.superOver.teamAScore}-{m.result.superOver.teamBScore})</p>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
