import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Loads the single `season` row and keeps it live via Supabase Realtime, so every open
// tab/device sees admin writes as they happen — this replaces the old `persist` prop that
// wrote to window.storage. Components that were written against `persist(next)` in the
// original artifact can keep calling it exactly the same way.
//
// Every persist() writes on every keystroke (that's how every text field in this app is
// wired), and each write round-trips back through this same Realtime subscription. Without
// suppressing that echo, a slower-arriving echo of an OLDER keystroke can land after a
// NEWER keystroke's optimistic update and stomp it — which looks exactly like the field
// spontaneously backspacing while you type. While local edits are actively landing, we trust
// local state over the echo and skip applying it; once edits stop for a beat, incoming
// updates (e.g. from another tab/device) resume applying normally.
const REMOTE_SUPPRESS_MS = 3000

export function useSeasonData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState(false)
  const suppressRemoteUntil = useRef(0)

  useEffect(() => {
    let channel
    ;(async () => {
      const { data: row, error } = await supabase.from('season').select('data').eq('id', 1).single()
      if (!error && row) setData(row.data)
      setLoading(false)

      channel = supabase
        .channel('season-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'season', filter: 'id=eq.1' }, (payload) => {
          if (Date.now() < suppressRemoteUntil.current) return
          setData(payload.new.data)
        })
        .subscribe()
    })()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const persist = useCallback(async (next) => {
    setData(next)
    suppressRemoteUntil.current = Date.now() + REMOTE_SUPPRESS_MS
    const { error } = await supabase.from('season').update({ data: next, updated_at: new Date().toISOString() }).eq('id', 1)
    setSaveError(!!error)
    return !error
  }, [])

  return { data, loading, saveError, persist }
}
