import { useState } from 'react'
import { ChevronDown, ChevronUp, Pencil, Plus, ScrollText, X } from 'lucide-react'
import { uid } from '../../../lib/uid'
import { defaultRuleBook } from '../../../lib/defaultRuleBook'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { ConfirmModal } from '../../layout/ConfirmModal'

export function Rules({ data, persist, isAdmin }) {
  const sections = data.ruleBook || []
  const [editingId, setEditingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function save(next) {
    persist({ ...data, ruleBook: next })
  }
  function loadDefaults() {
    save(defaultRuleBook())
  }
  function updateSection(id, patch) {
    save(sections.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }
  function addSection() {
    const section = { id: uid('rule'), title: 'New section', body: '' }
    save([...sections, section])
    setEditingId(section.id)
  }
  function deleteSection(id) {
    save(sections.filter((s) => s.id !== id))
    setConfirmDeleteId(null)
  }
  function moveSection(id, direction) {
    const i = sections.findIndex((s) => s.id === id)
    const j = i + direction
    if (j < 0 || j >= sections.length) return
    const next = [...sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    save(next)
  }

  return (
    <div>
      <SectionTitle icon={ScrollText}>Rule Book</SectionTitle>

      {sections.length === 0 ? (
        <Empty
          title={isAdmin ? 'No rules yet' : 'Coming soon'}
          body={isAdmin ? 'Load the starter rule book (league format, scoring, qualification) and fill in the rest.' : "The admin hasn't published the rule book yet."}
        />
      ) : (
        <div className="space-y-2">
          {sections.map((s, i) => {
            const isEditing = editingId === s.id
            return (
              <Card key={s.id}>
                <div className="flex items-start justify-between gap-2">
                  {isEditing ? (
                    <input
                      value={s.title}
                      onChange={(e) => updateSection(s.id, { title: e.target.value })}
                      className="field flex-1 px-2 py-1.5 text-sm display"
                    />
                  ) : (
                    <p className="display text-lg gold-text">{s.title}</p>
                  )}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => moveSection(s.id, -1)} disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }}><ChevronUp size={14} color="var(--muted)" /></button>
                      <button onClick={() => moveSection(s.id, 1)} disabled={i === sections.length - 1} style={{ opacity: i === sections.length - 1 ? 0.3 : 1 }}><ChevronDown size={14} color="var(--muted)" /></button>
                      <button onClick={() => setEditingId(isEditing ? null : s.id)}><Pencil size={13} color="var(--muted)" /></button>
                      <button onClick={() => setConfirmDeleteId(s.id)}><X size={14} color="var(--muted)" /></button>
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <textarea
                    value={s.body}
                    onChange={(e) => updateSection(s.id, { body: e.target.value })}
                    placeholder="Section text…"
                    rows={5}
                    className="field w-full mt-2 px-2.5 py-2 text-sm"
                  />
                ) : s.body ? (
                  <p className="text-sm mt-1.5" style={{ color: 'var(--cream)', whiteSpace: 'pre-wrap' }}>{s.body}</p>
                ) : (
                  isAdmin && <p className="text-xs mt-1.5" style={{ color: 'var(--muted2)' }}>Not written yet — tap the pencil to add this section.</p>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {isAdmin && (
        <div className="flex gap-2 mt-3">
          <button onClick={addSection} className="gold-btn flex-1 flex items-center justify-center gap-1 text-sm px-3 py-2 rounded-md"><Plus size={14} /> Add section</button>
          {sections.length === 0 && (
            <button onClick={loadDefaults} className="plain-btn flex-1 text-sm px-3 py-2 rounded-md">Load starter rule book</button>
          )}
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          title="Delete this section?"
          body="This removes the section from the rule book. This can't be undone."
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteSection(confirmDeleteId)}
        />
      )}
    </div>
  )
}
