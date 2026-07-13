import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useSeasonData } from './hooks/useSeasonData'
import { useAdmin } from './hooks/useAdmin'
import { Header } from './components/layout/Header'
import { TabNav } from './components/layout/TabNav'
import { ConfirmModal } from './components/layout/ConfirmModal'
import { AdminLoginModal } from './components/admin/AdminLoginModal'
import { defaultData } from './lib/defaultData'
import { parseImportFile } from './lib/exportImport'
import { Home } from './components/tabs/Home'
import { PointsTable } from './components/tabs/PointsTable'
import { Qualify } from './components/tabs/Qualify'
import { Schedule } from './components/tabs/Schedule'
import { Results } from './components/tabs/Results'
import { Leaders } from './components/tabs/Leaders'
import { Records } from './components/tabs/Records'
import { Teams } from './components/tabs/Teams'
import { PlayerPool } from './components/tabs/PlayerPool'

const TAB_COMPONENTS = {
  home: Home,
  points: PointsTable,
  qualify: Qualify,
  schedule: Schedule,
  results: Results,
  leaders: Leaders,
  records: Records,
  teams: Teams,
  pool: PlayerPool,
}

export default function App() {
  const { data, loading, persist } = useSeasonData()
  const { isAdmin, checking, login, logout } = useAdmin()
  const [tab, setTab] = useState('home')
  const [showPin, setShowPin] = useState(false)
  const [pendingImport, setPendingImport] = useState(null)
  const [importErr, setImportErr] = useState('')
  const [scheduleDraft, setScheduleDraft] = useState(null)

  function goToScheduleWithDraft(draft) {
    setScheduleDraft(draft)
    setTab('schedule')
  }

  async function handleImportFile(file) {
    if (!file) return
    setImportErr('')
    try {
      setPendingImport(await parseImportFile(file))
    } catch (e) {
      setImportErr(e.message)
    }
  }

  if (loading || checking || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2" style={{ color: 'var(--cream)' }}>
        <Loader2 className="animate-spin" size={20} /> Loading Spartan League 2…
      </div>
    )
  }

  const TabComponent = TAB_COMPONENTS[tab]

  return (
    <div className="min-h-screen">
      <Header data={data} isAdmin={isAdmin} onAdminClick={() => (isAdmin ? logout() : setShowPin(true))} onImportFile={handleImportFile} />
      <TabNav tab={tab} setTab={setTab} />

      <main className="p-4 max-w-2xl mx-auto">
        {isAdmin && data.teams.length === 0 && (
          <div className="ember-card mb-4 flex items-center justify-between gap-3">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No teams yet — load the {defaultData().teams.length} Spartan League teams to get started.</p>
            <button className="gold-btn text-sm whitespace-nowrap" onClick={() => persist({ ...defaultData(), ...data, teams: defaultData().teams })}>
              Load default teams
            </button>
          </div>
        )}
        {importErr && <p className="alert-red text-sm mb-4">{importErr}</p>}
        <TabComponent
          data={data}
          persist={persist}
          isAdmin={isAdmin}
          setTab={setTab}
          draft={tab === 'schedule' ? scheduleDraft : null}
          clearDraft={() => setScheduleDraft(null)}
          onCreateSlot={goToScheduleWithDraft}
        />
      </main>

      {showPin && (
        <AdminLoginModal
          onCancel={() => setShowPin(false)}
          onLogin={async (pin) => {
            const res = await login(pin)
            if (res.ok) setShowPin(false)
            return res
          }}
        />
      )}

      {pendingImport && (
        <ConfirmModal
          title="Restore backup?"
          body="This replaces all current season data — teams, schedule, results, everything — with the contents of the file you picked. This can't be undone."
          confirmLabel="Restore"
          onCancel={() => setPendingImport(null)}
          onConfirm={async () => { await persist(pendingImport); setPendingImport(null) }}
        />
      )}
    </div>
  )
}
