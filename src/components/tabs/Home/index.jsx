import { CalendarDays, Flame, ListOrdered, Medal, Trophy } from 'lucide-react'
import { computeChampion, computePointsTable, MATCH_LABELS } from '../../../lib/scoring'
import { buildPlayerIndex, sortBatting, sortBowling, sortMvp } from '../../../lib/stats'
import { fmt } from '../../../lib/players'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { TeamLogo } from '../../shared/TeamLogo'
import { TeamPill } from '../../shared/TeamPill'
import { Announcements } from './Announcements'
import { Countdown } from './Countdown'
import { PredictionPoll } from './PredictionPoll'
import { LiveScorecard } from './LiveScorecard'
import { SpartanOfSlot } from './SpartanOfSlot'

export function Home({ data, persist, isAdmin, setTab }) {
  const table = computePointsTable(data)
  const leader = table[0]
  const upcoming = data.slots.filter((s) => s.matches.every((m) => !m.result)).sort((a, b) => (a.date || '').localeCompare(b.date || ''))[0]
  const teamById = (id) => data.teams.find((t) => t.id === id)
  const recentResults = []
  data.slots.forEach((slot) => slot.matches.forEach((m) => { if (m.result) recentResults.push({ slot, m }) }))
  recentResults.sort((a, b) => (b.slot.date || '').localeCompare(a.slot.date || ''))
  const players = buildPlayerIndex(data)
  const topMvp = sortMvp(players.filter((p) => p.mvp))[0]
  const topRuns = sortBatting(players.filter((p) => p.batting))[0]
  const topWickets = sortBowling(players.filter((p) => p.bowling))[0]
  const champion = computeChampion(data)

  const imports = data.statsImports || []
  const latestImport = imports.length ? [...imports].sort((a, b) => (b.importedAt || '').localeCompare(a.importedAt || ''))[0] : null
  const spotlightBat = latestImport && latestImport.batting.length ? [...latestImport.batting].sort((a, b) => (b.total_runs ?? -Infinity) - (a.total_runs ?? -Infinity))[0] : null
  const spotlightBowl = latestImport && latestImport.bowling.length ? [...latestImport.bowling].sort((a, b) => (b.total_wickets ?? -Infinity) - (a.total_wickets ?? -Infinity))[0] : null

  return (
    <div className="space-y-4">
      <Announcements data={data} persist={persist} isAdmin={isAdmin} />

      <LiveScorecard data={data} persist={persist} isAdmin={isAdmin} />

      <SpartanOfSlot data={data} />

      {champion && (
        <Card className="text-center py-6" style={{ borderColor: 'var(--gold)' }}>
          <p className="text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-1" style={{ color: 'var(--muted)' }}><Trophy size={12} color="var(--gold)" /> Season Awards</p>
          <div className="flex justify-center mt-3 mb-1"><TeamLogo team={champion} size={72} /></div>
          <p className="display text-2xl gold-text mt-1">{champion.name}</p>
          <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Season Champions</p>
          <div className="grid grid-cols-3 gap-2 text-left">
            <div className="stat-box">
              <p className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--muted2)' }}>Orange Cap</p>
              <p className="text-xs font-medium mt-1">{topRuns ? topRuns.name : '—'}</p>
              <p className="display text-lg gold-text">{topRuns ? topRuns.batting.total_runs : '—'}</p>
            </div>
            <div className="stat-box">
              <p className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--muted2)' }}>Purple Cap</p>
              <p className="text-xs font-medium mt-1">{topWickets ? topWickets.name : '—'}</p>
              <p className="display text-lg gold-text">{topWickets ? topWickets.bowling.total_wickets : '—'}</p>
            </div>
            <div className="stat-box">
              <p className="text-[9px] uppercase tracking-wide" style={{ color: 'var(--muted2)' }}>MVP</p>
              <p className="text-xs font-medium mt-1">{topMvp ? topMvp.name : '—'}</p>
              <p className="display text-lg gold-text">{topMvp ? fmt(topMvp.mvp.total, 1) : '—'}</p>
            </div>
          </div>
        </Card>
      )}

      {!champion && (
        <Card className="text-center py-6">
          <p className="text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-1" style={{ color: 'var(--muted)' }}><Flame size={11} color="var(--gold)" /> League Leader</p>
          {leader && leader.total > 0 ? (
            <>
              <div className="flex justify-center mt-3 mb-1"><TeamLogo team={leader.team} size={72} /></div>
              <p className="display text-2xl gold-text mt-1">{leader.team.name}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{leader.total} points · NRR {leader.nrr >= 0 ? '+' : ''}{leader.nrr.toFixed(2)}</p>
            </>
          ) : (
            <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Season hasn't started yet</p>
          )}
        </Card>
      )}

      {topMvp && (
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--muted)' }}>Top MVP</p>
            <p className="display text-lg mt-0.5">{topMvp.name}</p>
            {topMvp.team && <TeamPill team={topMvp.team} />}
          </div>
          <div className="display text-2xl gold-text">{fmt(topMvp.mvp.total, 1)}</div>
        </Card>
      )}

      {latestImport && (spotlightBat || spotlightBowl) && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--muted)' }}>Spotlight · {latestImport.label}</p>
          <div className="grid grid-cols-2 gap-2">
            {spotlightBat && (
              <Card>
                <p className="text-[10px] uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--muted)' }}><Flame size={10} color="var(--gold)" /> Top Bat</p>
                <p className="text-sm font-medium mt-1">{spotlightBat.name}</p>
                <p className="display text-xl gold-text">{spotlightBat.total_runs}</p>
              </Card>
            )}
            {spotlightBowl && (
              <Card>
                <p className="text-[10px] uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--muted)' }}><Medal size={10} color="var(--gold)" /> Top Bowl</p>
                <p className="text-sm font-medium mt-1">{spotlightBowl.name}</p>
                <p className="display text-xl gold-text">{spotlightBowl.total_wickets} wkts</p>
              </Card>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle icon={CalendarDays}>Next Slot</SectionTitle>
          <button onClick={() => setTab('schedule')} className="text-xs" style={{ color: 'var(--gold)' }}>View schedule →</button>
        </div>
        {upcoming ? (
          <>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">{upcoming.date ? new Date(upcoming.date + 'T00:00').toDateString() : 'Date TBD'}</p>
                {upcoming.date && <Countdown dateStr={upcoming.date} />}
              </div>
              <div className="space-y-3">
                {upcoming.teamIds.map((id) => {
                  const team = teamById(id)
                  const teamPlayers = players.filter((p) => p.team && p.team.id === id)
                  const key = [...sortMvp(teamPlayers.filter((p) => p.mvp)), ...sortBatting(teamPlayers.filter((p) => !p.mvp && p.batting))].slice(0, 2)
                  return (
                    <div key={id}>
                      <TeamPill team={team} />
                      {key.length > 0 && (
                        <p className="text-[11px] mt-1 ml-1" style={{ color: 'var(--muted2)' }}>
                          Key players: {key.map((p) => p.name).join(', ')}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
            <div className="mt-3">
              <PredictionPoll data={data} slot={upcoming} key={upcoming.id} />
            </div>
          </>
        ) : (
          <Empty title="No upcoming slots" body="Add a slot from the Schedule tab." />
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionTitle icon={ListOrdered}>Latest Result</SectionTitle>
          <button onClick={() => setTab('results')} className="text-xs" style={{ color: 'var(--gold)' }}>All results →</button>
        </div>
        {recentResults[0] ? (
          <Card>
            <p className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{MATCH_LABELS[recentResults[0].m.type]}</p>
            <div className="flex items-center justify-between mt-1 text-sm">
              <TeamPill team={teamById(recentResults[0].m.result.teamA)} />
              <span className="display text-lg gold-text">{recentResults[0].m.result.teamAScore} - {recentResults[0].m.result.teamBScore}</span>
              <TeamPill team={teamById(recentResults[0].m.result.teamB)} />
            </div>
          </Card>
        ) : (
          <Empty title="No results yet" body="Results will appear here once entered." />
        )}
      </div>
    </div>
  )
}
