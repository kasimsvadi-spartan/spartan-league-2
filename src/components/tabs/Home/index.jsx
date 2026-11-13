import { CalendarDays, Flame, Hand, ListOrdered, Medal, Star } from 'lucide-react'
import { activeTeamIds, computeChampion, computePointsTable, MATCH_LABELS } from '../../../lib/scoring'
import { buildPlayerIndex, sortBatting, sortBowling, sortFielding, sortMvp } from '../../../lib/stats'
import { findPoolPhoto, fmt, normName } from '../../../lib/players'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { TeamLogo } from '../../shared/TeamLogo'
import { PlayerAvatar } from '../../shared/PlayerAvatar'
import { TeamPill } from '../../shared/TeamPill'
import { Announcements } from './Announcements'
import { Countdown } from './Countdown'
import { SlotFavorite } from './SlotFavorite'
import { LiveScorecard } from './LiveScorecard'
import { SpartanOfSlot } from './SpartanOfSlot'
import { ChampionsShowcase } from './ChampionsShowcase'
import { LeaderBackground } from './LeaderBackground'

export function Home({ data, persist, isAdmin, setTab }) {
  const table = computePointsTable(data)
  const leader = table[0]
  const upcoming = data.slots.filter((s) => !s.abandonment && s.matches.every((m) => !m.result)).sort((a, b) => (a.date || '').localeCompare(b.date || ''))[0]
  const teamById = (id) => data.teams.find((t) => t.id === id)
  const recentResults = []
  data.slots.forEach((slot) => {
    if (slot.abandonment) return
    slot.matches.forEach((m) => { if (m.result) recentResults.push({ slot, m }) })
  })
  recentResults.sort((a, b) => (b.slot.date || '').localeCompare(a.slot.date || ''))
  const players = buildPlayerIndex(data)
  const topMvp = sortMvp(players.filter((p) => p.mvp))[0]
  const topRuns = sortBatting(players.filter((p) => p.batting))[0]
  const topWickets = sortBowling(players.filter((p) => p.bowling))[0]
  const champion = computeChampion(data)

  const leaderPhoto = (p) => {
    const sq = p.team ? p.team.players.find((sp) => normName(sp.name) === normName(p.name)) : null
    return (sq && sq.photoUrl) || findPoolPhoto(data.playerPool, p.name)
  }
  const topFielder = sortFielding(players.filter((p) => p.fielding))[0]
  const leaders = [
    { label: 'Top Batsman', icon: Flame, p: topRuns, value: topRuns && topRuns.batting.total_runs, unit: 'runs' },
    { label: 'Top Bowler', icon: Medal, p: topWickets, value: topWickets && topWickets.bowling.total_wickets, unit: 'wkts' },
    { label: 'Top Fielder', icon: Hand, p: topFielder, value: topFielder && topFielder.fielding.total_dismissal, unit: 'dismissals' },
    { label: 'MVP', icon: Star, p: topMvp, value: topMvp && fmt(topMvp.mvp.total, 1), unit: 'pts' },
  ]

  return (
    <div className="space-y-4">
      {champion ? <LeaderBackground team={champion} /> : leader && leader.total > 0 && <LeaderBackground team={leader.team} />}

      <Announcements data={data} persist={persist} isAdmin={isAdmin} />

      <LiveScorecard data={data} persist={persist} isAdmin={isAdmin} />

      <SpartanOfSlot data={data} />

      {champion && <ChampionsShowcase data={data} champion={champion} />}

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

      {!champion && leaders.some((l) => l.p) && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--muted)' }}>Tournament Leaders</p>
          <div className="grid grid-cols-2 gap-2">
            {leaders.map(({ label, icon: Icon, p, value, unit }) => (
              <Card key={label}>
                <p className="text-[10px] uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--muted)' }}><Icon size={10} color="var(--gold)" /> {label}</p>
                {p ? (
                  <>
                    <div className="flex items-center gap-2 mt-2">
                      <PlayerAvatar player={{ name: p.name, photoUrl: leaderPhoto(p) }} team={p.team} size={36} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{p.name}</p>
                        {p.team && <p className="text-[10px] truncate" style={{ color: p.team.color }}>{p.team.name}</p>}
                      </div>
                    </div>
                    <p className="display text-2xl gold-text mt-2">{value} <span className="text-[10px]" style={{ color: 'var(--muted2)' }}>{unit}</span></p>
                  </>
                ) : (
                  <p className="text-sm mt-2" style={{ color: 'var(--muted2)' }}>—</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {!champion && (
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
                  {activeTeamIds(upcoming).map((id) => {
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
                <SlotFavorite data={data} slot={upcoming} key={upcoming.id} />
              </div>
            </>
          ) : (
            <Empty title="No upcoming slots" body="Add a slot from the Schedule tab." />
          )}
        </div>
      )}

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
              <span className="display text-lg gold-text">{recentResults[0].m.result.teamAScore ?? '—'} - {recentResults[0].m.result.teamBScore ?? '—'}</span>
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
