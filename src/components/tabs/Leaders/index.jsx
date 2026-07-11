import { useState } from 'react'
import { BarChart3, Search, UploadCloud } from 'lucide-react'
import { buildPlayerIndex, sortBatting, sortBowling, sortFielding, sortMvp } from '../../../lib/stats'
import { fmt } from '../../../lib/players'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { PlayerModal } from '../../shared/PlayerModal'
import { LeaderList } from './LeaderList'
import { ImportPanel } from './ImportPanel'

export function Leaders({ data, persist, isAdmin }) {
  const [showImport, setShowImport] = useState(false)
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const players = buildPlayerIndex(data)
  const imports = data.statsImports || []

  const topBatting = sortBatting(players.filter((p) => p.batting))
  const topBowling = sortBowling(players.filter((p) => p.bowling))
  const topFielding = sortFielding(players.filter((p) => p.fielding))
  const topMvp = sortMvp(players.filter((p) => p.mvp))

  const hasAny = players.length > 0
  const q = query.trim().toLowerCase()
  const searchResults = q ? players.filter((p) => p.name.toLowerCase().includes(q)) : null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle icon={BarChart3}>Leaderboards</SectionTitle>
        {isAdmin && <button onClick={() => setShowImport((s) => !s)} className="gold-btn flex items-center gap-1 text-xs px-3 py-1.5 rounded-md"><UploadCloud size={13} /> Import</button>}
      </div>

      {isAdmin && showImport && <ImportPanel data={data} persist={persist} onDone={() => setShowImport(false)} />}

      {hasAny && (
        <div className="relative mb-3">
          <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: 10, top: 10 }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search players…" className="field w-full pl-8 pr-3 py-2 text-sm" />
        </div>
      )}

      {imports.length > 0 && !q && (
        <p className="text-[11px] mb-4" style={{ color: 'var(--muted2)' }}>{imports.length} slot{imports.length === 1 ? '' : 's'} imported · {players.length} players tracked</p>
      )}

      {!hasAny ? (
        <Empty title="No stats imported yet" body={isAdmin ? "Tap 'Import' to upload this slot's CricHeroes batting, bowling, fielding and MVP CSV exports." : 'Check back once the admin imports the latest CricHeroes stats.'} />
      ) : searchResults ? (
        searchResults.length === 0 ? (
          <Empty title="No players found" body={`Nobody matching "${query}" in the imported stats.`} />
        ) : (
          <LeaderList title={`${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`} rows={searchResults} onSelect={setSelected} valueFn={(p) => (p.mvp ? fmt(p.mvp.total, 1) : '—')} subFn={(p) => (p.team ? p.team.name : '')} />
        )
      ) : (
        <div className="space-y-6">
          <LeaderList title="MVP Rankings" rows={topMvp} onSelect={setSelected} valueFn={(p) => fmt(p.mvp.total, 1)} subFn={(p) => `${p.mvp.slots} slot${p.mvp.slots === 1 ? '' : 's'} tracked`} />
          <LeaderList title="Most Runs" rows={topBatting} onSelect={setSelected} valueFn={(p) => p.batting.total_runs} subFn={(p) => `Avg ${fmt(p.batting.average)} · SR ${fmt(p.batting.strike_rate)}`} />
          <LeaderList title="Most Wickets" rows={topBowling} onSelect={setSelected} valueFn={(p) => p.bowling.total_wickets} subFn={(p) => `Avg ${fmt(p.bowling.avg)} · Econ ${fmt(p.bowling.economy)}`} />
          <LeaderList title="Best Fielders" rows={topFielding} onSelect={setSelected} valueFn={(p) => p.fielding.total_dismissal} subFn={(p) => `${p.fielding.slots} slot${p.fielding.slots === 1 ? '' : 's'} tracked`} />
        </div>
      )}

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
