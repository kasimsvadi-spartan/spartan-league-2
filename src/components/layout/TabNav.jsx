import { Award, BarChart3, BookUser, CalendarDays, Home as HomeIcon, ListOrdered, Medal, Trophy, Users } from 'lucide-react'

export const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'points', label: 'Points', icon: Trophy },
  { id: 'qualify', label: 'Qualify', icon: Award },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays },
  { id: 'results', label: 'Results', icon: ListOrdered },
  { id: 'leaders', label: 'Leaders', icon: BarChart3 },
  { id: 'records', label: 'Records', icon: Medal },
  { id: 'teams', label: 'Squads', icon: Users },
  { id: 'pool', label: 'Player Pool', icon: BookUser },
]

export function TabNav({ tab, setTab }) {
  return (
    <nav className="flex gap-1 mt-4 overflow-x-auto no-scrollbar pb-1 px-4">
      {TABS.map((t) => {
        const Icon = t.icon
        const active = tab === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap ${active ? 'active-tab' : 'inactive-tab'}`}
          >
            <Icon size={14} />
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
