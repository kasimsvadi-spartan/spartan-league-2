import { X } from 'lucide-react'
import { fmt } from '../../lib/players'
import { buildPlayerIndex, sortBatting, sortBowling, sortMvp } from '../../lib/stats'
import { TeamLogo } from './TeamLogo'
import { StatBox } from './StatBox'

// Read-only team profile, derived entirely from data that already exists — nothing here
// writes anything. `row` is the team's line from computePointsTable (points breakdown,
// NRR, W/R/T); everything else is computed from match results and CricHeroes imports.
export function TeamModal({ data, row, rank, onClose }) {
  const team = row.team

  // Match record. Abandoned slots are skipped — their matches are discarded, same as the
  // points table. A walkover has no second-innings score, so runs only count where both exist.
  let played = 0, won = 0, lost = 0, runsFor = 0, runsAgainst = 0
  const results = []
  data.slots.forEach((slot) => {
    if (slot.abandonment) return
    slot.matches.forEach((m) => {
      const r = m.result
      if (!r || (r.teamA !== team.id && r.teamB !== team.id)) return
      const isA = r.teamA === team.id
      const myScore = isA ? r.teamAScore : r.teamBScore
      const oppScore = isA ? r.teamBScore : r.teamAScore
      const opp = data.teams.find((t) => t.id === (isA ? r.teamB : r.teamA))
      const win = r.winner === team.id
      const myNet = isA ? r.netScoreA : r.netScoreB
      const oppNet = isA ? r.netScoreB : r.netScoreA
      played++
      if (win) won++
      else lost++
      if (myScore != null && oppScore != null) { runsFor += myScore; runsAgainst += oppScore }
      results.push({ id: m.id, date: slot.date || '', win, myScore: myNet ?? myScore, oppScore: oppNet ?? oppScore, opp, walkover: !!r.walkover, bonus: !!r.bonusRunsApplied })
    })
  })
  results.sort((a, b) => b.date.localeCompare(a.date))

  const squad = buildPlayerIndex(data).filter((p) => p.team && p.team.id === team.id)
  const batters = sortBatting(squad.filter((p) => p.batting))
  const bowlers = sortBowling(squad.filter((p) => p.bowling))
  const mvps = sortMvp(squad.filter((p) => p.mvp))
  const teamRuns = batters.reduce((s, p) => s + (p.batting.total_runs || 0), 0)
  const teamWickets = bowlers.reduce((s, p) => s + (p.bowling.total_wickets || 0), 0)

  return (
    <div className="modal-overlay items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="ember-card w-full sm:max-w-md max-h-[90vh] overflow-y-auto" style={{ borderRadius: '16px 16px 0 0' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <TeamLogo team={team} size={48} />
            <div>
              <h3 className="display text-xl" style={{ color: team.color }}>{team.name}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--muted2)' }}>
                #{rank} in the table{team.captain ? ` · Captain ${team.captain}` : ''}{team.owner ? ` · Owner ${team.owner}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>Points · {row.slotsPlayed} slot{row.slotsPlayed === 1 ? '' : 's'}</p>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Total" value={row.total} />
            <StatBox label="Slot pts" value={row.placement} />
            <StatBox label="NRR" value={`${row.nrr >= 0 ? '+' : ''}${row.nrr.toFixed(2)}`} />
            <StatBox label="Bonus" value={`+${row.marginBonusFor}`} />
            <StatBox label="Conceded" value={`-${row.marginBonusAgainst}`} />
            <StatBox label="Punctual" value={`+${row.punctuality}`} />
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--muted2)' }}>Slots: {row.wins} won · {row.runnerUp} runner-up · {row.third} third</p>
        </div>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>Matches · {played} played</p>
          <div className="grid grid-cols-3 gap-2">
            <StatBox label="Won" value={won} />
            <StatBox label="Lost" value={lost} />
            <StatBox label="Runs for/against" value={played ? `${runsFor}/${runsAgainst}` : null} />
          </div>
          {results.length > 0 && (
            <div className="mt-2 space-y-1">
              {results.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded" style={{ background: 'var(--ink)' }}>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold" style={{ color: r.win ? 'var(--green)' : 'var(--red)' }}>{r.win ? 'W' : 'L'}</span>
                    <span>vs {r.opp ? r.opp.name : '—'}</span>
                  </span>
                  <span style={{ color: 'var(--muted)' }}>{r.walkover ? 'no chase needed' : `${r.myScore} - ${r.oppScore}${r.bonus ? ' (incl. bonus runs)' : ''}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {squad.length > 0 ? (
          <div className="mb-2">
            <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--muted)' }}>Player stats</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <StatBox label="Team runs" value={teamRuns} />
              <StatBox label="Team wickets" value={teamWickets} />
            </div>
            <div className="space-y-1 text-xs">
              {batters[0] && <div className="flex justify-between px-2.5 py-1.5 rounded" style={{ background: 'var(--ink)' }}><span style={{ color: 'var(--muted)' }}>Top bat</span><span>{batters[0].name} · {batters[0].batting.total_runs} runs</span></div>}
              {bowlers[0] && <div className="flex justify-between px-2.5 py-1.5 rounded" style={{ background: 'var(--ink)' }}><span style={{ color: 'var(--muted)' }}>Top bowl</span><span>{bowlers[0].name} · {bowlers[0].bowling.total_wickets} wkts</span></div>}
              {mvps[0] && <div className="flex justify-between px-2.5 py-1.5 rounded" style={{ background: 'var(--ink)' }}><span style={{ color: 'var(--muted)' }}>Top MVP</span><span>{mvps[0].name} · {fmt(mvps[0].mvp.total, 1)}</span></div>}
            </div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--muted2)' }}>Player stats appear here once CricHeroes stats are imported for this team.</p>
        )}
      </div>
    </div>
  )
}
