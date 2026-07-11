import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Loads the single `season` row and keeps it live via Supabase Realtime, so every open
// tab/device sees admin writes as they happen — this replaces the old `persist` prop that
// wrote to window.storage. Components that were written against `persist(next)` in the
// original artifact can keep calling it exactly the same way.
export function useSeasonData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState(false)
  const applyingRemote = useRef(false)

  useEffect(() => {
    let channel
    ;(async () => {
      const { data: row, error } = await supabase.from('season').select('data').eq('id', 1).single()
      if (!error && row) setData(row.data)
      setLoading(false)

      channel = supabase
        .channel('season-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'season', filter: 'id=eq.1' }, (payload) => {
          applyingRemote.current = true
          setData(payload.new.data)
        })
        .subscribe()
    })()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  const persist = useCallback(async (next) => {
    setData(next)
    const { error } = await supabase.from('season').update({ data: next, updated_at: new Date().toISOString() }).eq('id', 1)
    setSaveError(!!error)
    return !error
  }, [])

  return { data, loading, saveError, persist }
}
