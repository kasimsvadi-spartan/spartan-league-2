import { useState } from 'react'
import { Download, Lock, RefreshCw, Unlock, UploadCloud } from 'lucide-react'
import logoMain from '../../assets/logos/spartan-league-main.png'
import { exportData } from '../../lib/exportImport'
import { TOTAL_SLOTS } from '../../lib/scoring'

export function Header({ data, isAdmin, onAdminClick, onImportFile }) {
  const [refreshing, setRefreshing] = useState(false)

  // A full reload rather than a soft re-fetch on purpose: it guarantees both the freshest
  // data AND the latest deployed app version in one tap (a stuck PWA service-worker cache
  // is the other common cause of "I don't see what the admin just added"), which is the
  // simplest thing to tell a non-technical viewer to reach for when something looks stale.
  function handleRefresh() {
    setRefreshing(true)
    window.location.reload()
  }

  return (
    <header className="header-wrap">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={logoMain}
            alt="Spartan League 2"
            className="w-32 h-32 object-contain"
            style={{ filter: 'drop-shadow(0 0 10px rgba(232,185,35,0.4))' }}
          />
          <div>
            <h1 className="display gold-text" style={{ fontSize: 48, lineHeight: 1 }}>SPARTAN LEAGUE 2</h1>
            <p className="text-[10px] uppercase tracking-[0.25em] mt-1" style={{ color: 'var(--muted)' }}>Season 2 · {TOTAL_SLOTS} Slots · {data.teams.length} Team{data.teams.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-2 rounded-full" style={{ border: '1px solid var(--hair2)', color: 'var(--muted)' }} title="Refresh — see the latest data">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <>
              <button onClick={() => exportData(data)} className="p-2 rounded-full" style={{ border: '1px solid var(--hair2)', color: 'var(--muted)' }} title="Export season data">
                <Download size={16} />
              </button>
              <label className="p-2 rounded-full" style={{ border: '1px solid var(--hair2)', color: 'var(--muted)', cursor: 'pointer' }} title="Import a backup">
                <UploadCloud size={16} />
                <input type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => onImportFile(e.target.files[0])} />
              </label>
            </>
          )}
          <button
            onClick={onAdminClick}
            className={`p-2 rounded-full ${isAdmin ? 'gold-outline' : ''}`}
            style={!isAdmin ? { border: '1px solid var(--hair2)', color: 'var(--muted)' } : {}}
          >
            {isAdmin ? <Unlock size={16} /> : <Lock size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
