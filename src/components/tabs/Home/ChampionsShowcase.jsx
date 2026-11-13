import { Crown, Flame, Hand, IndianRupee, Medal, Star, Trophy, Users } from 'lucide-react'
import { computeRecords } from '../../../lib/records'
import { computeEarnings, inr } from '../../../lib/rewards'
import { findPoolPhoto, fmt, normName } from '../../../lib/players'
import { buildPlayerIndex, sortBatting, sortBowling, sortFielding, sortMvp } from '../../../lib/stats'
import { Card } from '../../layout/Card'
import { PlayerAvatar } from '../../shared/PlayerAvatar'
import { TeamLogo } from '../../shared/TeamLogo'

const Heading = ({ icon: Icon, children }) => (
  <p className="text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
    <Icon size={11} color="var(--gold)" /> {children}
  </p>
)

// Everything Home shows once the Grand Final is done: the champions with their whole squad,
// the season's best performers, its records, and who earned the most from rewards.
export function ChampionsShowcase({ data, champion }) {
  const photoFor = (name, team) => {
    const sq = team ? team.players.find((sp) => normName(sp.name) === normName(name)) : null
    return (sq && sq.photoUrl) || findPoolPhoto(data.playerPool, name)
  }

  // Grand Final line: score and runner-up.
  const finalSlot = data.slots.find((s) => s.slotType === 'Final')
  const finalMatch = finalSlot && finalSlot.matches.find((m) => m.type === 'final' && m.result)
  const fr = finalMatch && finalMatch.result
  const runnerUp = fr ? data.teams.find((t) => t.id === (fr.winner === fr.teamA ? fr.teamB : fr.teamA)) : null
  const champIsA = fr && fr.winner === fr.teamA
  const score = fr && !fr.walkover ? `${champIsA ? fr.teamAScore : fr.teamBScore} – ${champIsA ? fr.teamBScore : fr.teamAScore}` : null

  // Best performers of the whole tournament.
  const players = buildPlayerIndex(data)
  const top = {
    bat: sortBatting(players.filter((p) => p.batting))[0],
    bowl: sortBowling(players.filter((p) => p.bowling))[0],
    field: sortFielding(players.filter((p) => p.fielding))[0],
    mvp: sortMvp(players.filter((p) => p.mvp))[0],
  }
  const performers = [
    { label: 'Top Batsman', icon: Flame, p: top.bat, value: top.bat && `${top.bat.batting.total_runs} runs` },
    { label: 'Top Bowler', icon: Medal, p: top.bowl, value: top.bowl && `${top.bowl.bowling.total_wickets} wkts` },
    { label: 'Top Fielder', icon: Hand, p: top.field, value: top.field && `${top.field.fielding.total_dismissal} dismissals` },
    { label: 'MVP', icon: Star, p: top.mvp, value: top.mvp && `${fmt(top.mvp.mvp.total, 1)} pts` },
  ]

  // Season records (manual corrections win, same as the Records tab).
  const rec = computeRecords(data)
  const manual = data.manualRecords || {}
  const hs = manual.highestScore || rec.highestScore
  const bb = manual.bestBowling || rec.bestBowling
  const records = [
    hs && { label: 'Highest individual score', who: hs.name, value: hs.value },
    bb && { label: 'Best bowling figures', who: bb.name, value: `${bb.wickets}/${bb.runs ?? '—'}` },
    rec.bestSR && { label: 'Best strike rate', who: rec.bestSR.name, value: fmt(rec.bestSR.value, 1) },
    rec.highestTotal && { label: 'Highest team total', who: rec.highestTotal.team?.name, value: rec.highestTotal.value },
    rec.lowestTotal && { label: 'Lowest team total', who: rec.lowestTotal.team?.name, value: rec.lowestTotal.value },
    rec.highestChased && { label: 'Highest score chased', who: rec.highestChased.team?.name, value: rec.highestChased.value },
    rec.lowestDefended && { label: 'Lowest score defended', who: rec.lowestDefended.team?.name, value: rec.lowestDefended.value },
  ].filter(Boolean)

  const earners = computeEarnings(data.rewardEntries).slice(0, 5)
  const squad = champion.players || []

  return (
    <>
      <Card className="text-center py-6" style={{ borderColor: 'var(--gold)' }}>
        <p className="text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-1" style={{ color: 'var(--muted)' }}><Crown size={12} color="var(--gold)" /> Season 2 Champions</p>
        <div className="flex justify-center mt-3 mb-1"><TeamLogo team={champion} size={96} /></div>
        <p className="display text-3xl gold-text mt-1">{champion.name}</p>
        {score && runnerUp && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Won the Grand Final {score} against {runnerUp.name}</p>}
        {(champion.captain || champion.owner) && (
          <p className="text-[11px] mt-1" style={{ color: 'var(--muted2)' }}>{champion.captain && `Captain ${champion.captain}`}{champion.captain && champion.owner ? ' · ' : ''}{champion.owner && `Owner ${champion.owner}`}</p>
        )}
        {squad.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-1.5" style={{ color: 'var(--muted)' }}><Users size={11} color="var(--gold)" /> The squad</p>
            <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-2">
              {squad.map((p) => (
                <div key={p.id || p.name} className="flex flex-col items-center">
                  <PlayerAvatar player={{ name: p.name, photoUrl: p.photoUrl || findPoolPhoto(data.playerPool, p.name) }} team={champion} size={64} />
                  <p className="text-[11px] mt-1 leading-tight">{p.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div>
        <Heading icon={Trophy}>Best performers of the tournament</Heading>
        <div className="grid grid-cols-2 gap-2">
          {performers.map(({ label, icon: Icon, p, value }) => (
            <Card key={label}>
              <p className="text-[10px] uppercase tracking-wide flex items-center gap-1" style={{ color: 'var(--muted)' }}><Icon size={10} color="var(--gold)" /> {label}</p>
              {p ? (
                <>
                  <div className="flex items-center gap-2 mt-2">
                    <PlayerAvatar player={{ name: p.name, photoUrl: photoFor(p.name, p.team) }} team={p.team} size={36} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      {p.team && <p className="text-[10px] truncate" style={{ color: p.team.color }}>{p.team.name}</p>}
                    </div>
                  </div>
                  <p className="display text-xl gold-text mt-2">{value}</p>
                </>
              ) : <p className="text-sm mt-2" style={{ color: 'var(--muted2)' }}>—</p>}
            </Card>
          ))}
        </div>
      </div>

      {records.length > 0 && (
        <div>
          <Heading icon={Medal}>Season records</Heading>
          <Card style={{ padding: '4px 14px' }}>
            {records.map((r, i) => (
              <div key={r.label} className="flex items-center justify-between py-2.5 gap-3" style={{ borderTop: i ? '1px solid var(--hair3)' : 'none' }}>
                <div className="min-w-0">
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{r.label}</p>
                  <p className="text-sm font-medium truncate">{r.who || '—'}</p>
                </div>
                <span className="display text-xl gold-text shrink-0">{r.value}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {earners.length > 0 && (
        <div>
          <Heading icon={IndianRupee}>Top reward earners</Heading>
          <div className="space-y-1.5">
            {earners.map((p, i) => (
              <div key={p.name} className="ember-card flex items-center justify-between" style={{ padding: '10px 14px' }}>
                <div className="flex items-center gap-2.5">
                  <span className="display text-lg w-5" style={{ color: 'var(--muted)' }}>{i + 1}</span>
                  <PlayerAvatar player={{ name: p.name, photoUrl: findPoolPhoto(data.playerPool, p.name) }} size={32} />
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    {p.team && <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{p.team}</p>}
                  </div>
                </div>
                <span className="display text-xl gold-text">{inr(p.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
