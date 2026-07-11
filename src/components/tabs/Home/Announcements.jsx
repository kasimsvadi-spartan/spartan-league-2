import { useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import { uid } from '../../../lib/uid'
import { Card } from '../../layout/Card'

export function Announcements({ data, persist, isAdmin }) {
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const list = [...(data.announcements || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))

  function add() {
    if (!text.trim()) return
    const item = { id: uid('ann'), text: text.trim(), createdAt: new Date().toISOString() }
    persist({ ...data, announcements: [item, ...(data.announcements || [])] })
    setText(''); setShowForm(false)
  }
  function remove(id) {
    persist({ ...data, announcements: (data.announcements || []).filter((a) => a.id !== id) })
  }

  if (list.length === 0 && !isAdmin) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2"><Megaphone size={15} color="var(--gold)" /><p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Announcements</p></div>
        {isAdmin && <button onClick={() => setShowForm((s) => !s)} className="text-xs" style={{ color: 'var(--gold)' }}>{showForm ? 'Cancel' : '+ Add'}</button>}
      </div>
      {isAdmin && showForm && (
        <Card className="mb-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Slot 8 postponed due to rain, rescheduled to Thursday" className="field w-full px-2.5 py-2 text-sm mb-2" rows={2} />
          <button onClick={add} className="gold-btn w-full py-1.5 rounded-md text-sm">Post</button>
        </Card>
      )}
      {list.length === 0 ? (
        isAdmin && <p className="text-xs" style={{ color: 'var(--muted2)' }}>No announcements yet.</p>
      ) : (
        <div className="space-y-1.5">
          {list.slice(0, 3).map((a) => (
            <Card key={a.id} className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm">{a.text}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--muted2)' }}>{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              {isAdmin && <button onClick={() => remove(a.id)}><X size={13} color="var(--muted)" /></button>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
