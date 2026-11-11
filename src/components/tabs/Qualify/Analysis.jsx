import { useMemo } from 'react'
import { Info, Target } from 'lucide-react'
import { remainingFixtures, simulateQualification } from '../../../lib/qualification'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { TeamLogo } from '../../shared/TeamLogo'
import { TeamPill } from '../../shared/TeamPill'

const GOLD = '232,185,35'
const GREEN = '95,169,138'
const RED = '192,39,43'
const zoneRgb = (pos) => (pos < 2 ? GOLD : pos < 5 ? GREEN : RED)

function pct(p) {
  if (p <= 0) return '0%'
  if (p < 0.01) return '<1%'
  if (p > 0.995) return '>99%'
  return `${Math.round(p * 100)}%`
}
const fmtPts = (n) => (Math.round(n * 10) / 10).toString()

export function Analysis({ data }) {
  const sim = useMemo(() => simulateQualification(data), [data])
  if (sim.remainingSlots === 0) return null
  const rankOf = Object.fromEntries(sim.teams.map((t) => [t.team.id, t.rank]))
  const teamById = (id) => data.teams.find((t) => t.id === id)

  return (
    <div className="mb-4">
      <SectionTitle icon={Target}>Qualification Analysis</SectionTitle>

      <Card className="mb-3">
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Where the cut-offs are heading</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="stat-box">
            <p className="display text-lg" style={{ color: `rgb(${GOLD})` }}>~{fmtPts(sim.cutoffs.final)} pts</p>
            <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: 'var(--muted2)' }}>Typically needed for top 2 (Grand Final)</p>
          </div>
          <div className="stat-box">
            <p className="display text-lg" style={{ color: `rgb(${GREEN})` }}>~{fmtPts(sim.cutoffs.semi)} pts</p>
            <p className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: 'var(--muted2)' }}>Typically needed for top 5 (Semi-Final)</p>
          </div>
        </div>
        <p className="text-[11px] mt-2" style={{ color: 'var(--muted2)' }}>
          From {sim.runs.toLocaleString()} simulated finishes of the {sim.remainingSlots} league slot{sim.remainingSlots === 1 ? '' : 's'} still to play. Finishing 1st matters too: that team gets a 10-run bonus to use in the Final Slot (any match except the Final).
        </p>
      </Card>

      <Card className="mb-3">
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Chance of finishing in each position</p>
        <div className="flex items-center gap-1 mb-1" style={{ paddingLeft: 32 }}>
          {sim.teams.map((_, i) => (
            <span key={i} className="text-[9px] text-center" style={{ flex: 1, color: `rgb(${zoneRgb(i)})`, fontWeight: 600 }}>{i === 0 ? '1★' : i + 1}</span>
          ))}
        </div>
        <div className="space-y-1">
          {sim.teams.map((t) => (
            <div key={t.team.id} className="flex items-center gap-1">
              <span style={{ width: 28, flexShrink: 0 }}><TeamLogo team={t.team} size={24} /></span>
              {t.pos.map((p, i) => (
                <span
                  key={i}
                  className="text-[9px] text-center rounded"
                  style={{ flex: 1, padding: '5px 0', background: `rgba(${zoneRgb(i)}, ${Math.min(0.85, p * 1.1)})`, color: p > 0.45 ? '#1A1409' : 'var(--cream)', opacity: p === 0 ? 0.35 : 1 }}
                >
                  {p >= 0.005 ? Math.round(p * 100) : '·'}
                </span>
              ))}
            </div>
          ))}
        </div>
        <p className="text-[10px] mt-2" style={{ color: 'var(--faint)' }}>Percent of simulations. Gold columns reach the Grand Final, green the Semi-Final, red are out. ★ 1st place also earns the 10-run Final Slot bonus.</p>
      </Card>

      <div className="space-y-2">
        {sim.teams.map((t) => {
          const fixtures = remainingFixtures(data, t.team.id)
          const best = t.points + 5 * t.slotsLeft
          const toFinal = sim.cutoffs.final - t.projected
          const toSemi = sim.cutoffs.semi - t.projected
          let verdict
          if (t.pFinal > 0.995) verdict = { text: 'Virtually certain of a Grand Final place.', color: 'var(--green)' }
          else if (t.pFinal >= 0.85) verdict = { text: 'Very likely to reach the Grand Final.', color: 'var(--green)' }
          else if (t.pFinal + t.pSemi > 0.995) verdict = { text: 'Virtually certain of reaching at least the Semi-Final.', color: 'var(--green)' }
          else if (t.pOut > 0.995) verdict = { text: 'Almost out of contention.', color: 'var(--red)' }
          else if (t.pFinal >= 0.5) verdict = { text: 'Favourite for a Grand Final place.', color: 'var(--green)' }
          else if (t.pOut >= 0.5) verdict = { text: 'More likely out than in — needs results to go their way.', color: 'var(--red)' }
          else verdict = { text: 'In the mix for the Semi-Final.', color: 'var(--muted)' }
          return (
            <Card key={t.team.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2"><span className="display text-lg" style={{ color: 'var(--muted)' }}>{t.rank}</span><TeamPill team={t.team} /></div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{t.points} pts · NRR {t.nrr >= 0 ? '+' : ''}{t.nrr.toFixed(2)}</span>
              </div>

              <div className="flex rounded overflow-hidden my-2" style={{ height: 22 }}>
                {[[t.pFinal, GOLD], [t.pSemi, GREEN], [t.pOut, RED]].map(([p, rgb], i) => (
                  <div key={i} className="text-[10px] flex items-center justify-center font-semibold" style={{ width: `${p * 100}%`, background: `rgba(${rgb}, 0.8)`, color: '#1A1409', minWidth: p > 0.02 ? undefined : 0 }}>
                    {p >= 0.08 ? pct(p) : ''}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--muted2)' }}>
                <span style={{ color: `rgb(${GOLD})` }}>Final {pct(t.pFinal)}</span>
                <span style={{ color: `rgb(${GREEN})` }}>Semi {pct(t.pSemi)}</span>
                <span style={{ color: `rgb(${RED})` }}>Out {pct(t.pOut)}</span>
              </div>
              <p className="text-[10px] mb-2" style={{ color: `rgb(${GOLD})` }}>★ Finish 1st (10-run Final Slot bonus): {pct(t.pFirst)}</p>

              <p className="text-xs mb-1" style={{ color: verdict.color }}>{verdict.text}</p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                Projected finish <span style={{ color: 'var(--gold)', fontWeight: 600 }}>~{fmtPts(t.projected)} pts</span> (likely {fmtPts(t.p10)}–{fmtPts(t.p90)}), {t.slotsLeft} slot{t.slotsLeft === 1 ? '' : 's'} left, ceiling {best} from slot points and time bonus alone.
              </p>
              {t.pFinal < 0.995 && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted2)' }}>
                  {toFinal > 0 ? `About ${fmtPts(toFinal)} pts short of the usual top-2 mark` : 'Projected at or above the usual top-2 mark'}
                  {t.pFinal + t.pSemi < 0.995 && (toSemi > 0 ? `; ${fmtPts(toSemi)} short of the top-5 mark.` : '; above the top-5 mark.')}
                </p>
              )}

              {fixtures.length > 0 && (
                <details className="mt-2">
                  <summary className="text-[11px] cursor-pointer" style={{ color: 'var(--gold)' }}>Fixtures left ({fixtures.length})</summary>
                  <div className="mt-1.5 space-y-1">
                    {fixtures.map((f) => (
                      <div key={f.slotId} className="text-[11px] px-2 py-1.5 rounded" style={{ background: 'var(--ink)', color: 'var(--muted)' }}>
                        <span style={{ color: 'var(--cream)' }}>{f.date ? new Date(f.date + 'T00:00').toDateString() : 'Date TBD'}</span>
                        {f.optedOut ? ' — sitting out this slot' : ` vs ${f.opponents.map((id) => `${teamById(id)?.name} (#${rankOf[id]})`).join(' & ')}`}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </Card>
          )
        })}
      </div>

      <details className="mt-3">
        <summary className="text-[11px] cursor-pointer flex items-center gap-1" style={{ color: 'var(--muted2)' }}><Info size={11} /> How this is worked out</summary>
        <ul className="text-[11px] mt-2 space-y-1 pl-4" style={{ color: 'var(--muted2)', listStyle: 'disc' }}>
          <li>The rest of the league stage is played out {sim.runs.toLocaleString()} times using the real remaining fixtures.</li>
          <li>Each team's strength is its match win rate so far, smoothed toward 50% so a small sample doesn't swing things; a stronger team is likelier to win and to finish second in a slot (4 / 2 / 0 slot points).</li>
          <li>Margin bonus and penalty come from each team's own average so far (pulled toward zero early on) with random variation. The time bonus follows the league-wide rate so far ({Math.round(sim.punctRate * 100)}% of slots).</li>
          <li>Teams level on points are split by their current NRR.</li>
          <li>It's a guide to the odds, not a guarantee — upsets, shortened matches and bonus runs all move the real result. Odds sharpen as the season goes on.</li>
        </ul>
      </details>
    </div>
  )
}
