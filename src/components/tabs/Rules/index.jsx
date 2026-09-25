import { useEffect, useState } from 'react'
import { ScrollText, Search, X } from 'lucide-react'
import { RULEBOOK_AUTHOR, RULEBOOK_SECTIONS, RULEBOOK_UPDATED, RULEBOOK_VERSION } from '../../../lib/rulebookContent'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { RuleSection } from './RuleSection'
import { sectionMatches } from './rulebookSearch'

export function Rules() {
  const [query, setQuery] = useState('')
  const [openIds, setOpenIds] = useState(() => new Set())
  const [headerH, setHeaderH] = useState(0)
  const searching = query.trim().length > 0

  // The sticky search bar needs to dock just below the app's own sticky header rather than
  // under it — the header's height isn't fixed (it reflows with title wrapping at narrow
  // widths), so we measure it live instead of hardcoding a pixel offset.
  useEffect(() => {
    const el = document.querySelector('.header-wrap')
    if (!el) return
    const update = () => setHeaderH(el.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const visibleSections = RULEBOOK_SECTIONS.filter((s) => sectionMatches(s, query))

  function toggle(id) {
    if (searching) return
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function jumpTo(section) {
    setQuery('')
    setOpenIds(new Set([section.id]))
    setTimeout(() => {
      document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  return (
    <div>
      <SectionTitle icon={ScrollText}>Official Rulebook</SectionTitle>

      <Card className="mb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Version {RULEBOOK_VERSION} · Last updated {RULEBOOK_UPDATED}</p>
          <p className="text-xs" style={{ color: 'var(--muted2)' }}>{RULEBOOK_AUTHOR}</p>
        </div>
      </Card>

      <div className="sticky -mx-4 px-4 py-2 mb-3" style={{ top: headerH, zIndex: 5, background: 'var(--ink)', borderBottom: '1px solid var(--hair)' }}>
        <div className="relative mb-2">
          <Search size={14} color="var(--muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the rulebook — e.g. roof net, mankad, guest…"
            className="field w-full text-sm"
            style={{ paddingLeft: 30 }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
              <X size={14} color="var(--muted)" />
            </button>
          )}
        </div>
        {!searching && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {RULEBOOK_SECTIONS.map((s) => (
              <button key={s.id} onClick={() => jumpTo(s)} className="chip-outline text-xs whitespace-nowrap shrink-0">
                {s.number}
              </button>
            ))}
          </div>
        )}
        {searching && (
          <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>
            {visibleSections.length === 0 ? 'No matches' : `${visibleSections.length} section${visibleSections.length === 1 ? '' : 's'} match`}
          </p>
        )}
      </div>

      {visibleSections.map((s) => (
        <RuleSection key={s.id} section={s} open={searching || openIds.has(s.id)} onToggle={() => toggle(s.id)} query={query} />
      ))}
    </div>
  )
}
