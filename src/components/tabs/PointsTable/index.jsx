import { BarChart3, Trophy } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { computePointsTable, computeProgressionData } from '../../../lib/scoring'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { TeamLogo } from '../../shared/TeamLogo'

export function PointsTable({ data }) {
  const rows = computePointsTable(data)
  const progression = computeProgressionData(data)
  if (data.slots.length === 0) return <Empty title="No matches yet" body="Create fixtures and enter results to see the points table fill up." />
  return (
    <div>
      <SectionTitle icon={Trophy}>Points Table</SectionTitle>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <Card key={r.team.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="display text-xl w-6" style={{ color: 'var(--muted)' }}>{i + 1}</span>
              <TeamLogo team={r.team} size={44} />
              <div>
                <p className="text-sm font-semibold" style={{ color: r.team.color }}>{r.team.name}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted2)' }}>{r.slotsPlayed} slots · {r.wins}W {r.runnerUp}R {r.third}T · NRR {r.nrr >= 0 ? '+' : ''}{r.nrr.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                <div>{r.placement} slot pts</div>
                <div style={{ color: r.bonusFor > 0 ? 'var(--green)' : 'var(--muted)' }}>+{r.bonusFor} bonus</div>
                <div style={{ color: r.bonusAgainst > 0 ? 'var(--red)' : 'var(--muted)' }}>-{r.bonusAgainst} conceded</div>
              </div>
              <div className="display text-2xl gold-text w-10">{r.total}</div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-[11px] mt-3 mb-5" style={{ color: 'var(--muted2)' }}>Slot pts: 4 for slot winner, 2 for runner-up, 0 for 3rd. Bonus applies only to full 7-over matches: +1 for a 30+ run win or chasing in ≤4 overs; +2 for a 60+ run win or chasing in ≤2 overs — subtracted from the opponent as negative points. Ties on points are broken by league-stage Net Run Rate.</p>

      {progression.length >= 2 && (
        <div>
          <SectionTitle icon={BarChart3}>Points Progression</SectionTitle>
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={progression} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--hair3)" strokeDasharray="3 3" />
                <XAxis dataKey="slot" stroke="var(--muted)" fontSize={11} />
                <YAxis stroke="var(--muted)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--ink2)', border: '1px solid var(--hair2)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'var(--cream)' }} />
                {data.teams.map((t) => (
                  <Line key={t.id} type="monotone" dataKey={t.id} name={t.name} stroke={t.color} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {data.teams.map((t) => (
                <span key={t.id} className="text-[11px] flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block' }} />{t.name}</span>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
