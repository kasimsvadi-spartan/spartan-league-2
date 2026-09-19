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
  const [saveError, setSaveError] = useState(null)
  const suppressRemoteUntil = useRef(0)
  // The row's updated_at as of our last known-good read - persist() uses this to detect
  // whether someone else has written in between (see persist below).
  const knownUpdatedAt = useRef(null)

  const fetchNow = useCallback(async () => {
    const { data: row, error } = await supabase.from('season').select('data, updated_at').eq('id', 1).single()
    if (!error && row) {
      setData(row.data)
      knownUpdatedAt.current = row.updated_at
    }
    return !error
  }, [])

  useEffect(() => {
    let channel
    ;(async () => {
      await fetchNow()
      setLoading(false)

      channel = supabase
        .channel('season-changes')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'season', filter: 'id=eq.1' }, (payload) => {
          if (Date.now() < suppressRemoteUntil.current) return
          setData(payload.new.data)
          knownUpdatedAt.current = payload.new.updated_at
        })
        .subscribe()
    })()

    // Realtime can silently stop delivering updates — a phone locking/backgrounding the tab
    // is the big one, since mobile browsers routinely suspend WebSockets in the background
    // without the app ever finding out the connection died. Re-fetching whenever the tab
    // becomes visible again catches everything that happened while it was away, without
    // requiring anyone to know to hit refresh.
    function onVisible() {
      if (document.visibilityState === 'visible') fetchNow()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      if (channel) supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [fetchNow])

  // Every write is serialized through this chain, and each one is conditioned on the
  // updated_at we last confirmed (see knownUpdatedAt above). That combination is what makes
  // this safe: serializing rules out our own rapid-fire writes ever racing each other (e.g.
  // typing fast triggers a persist() per keystroke), while the updated_at check catches a
  // genuinely different writer - another tab, another device, another admin - landing a
  // change in the gap between our read and our write. Without it, that write pattern is a
  // classic lost update: whichever save reaches the database last silently wins, and the
  // other one vanishes with no error. (This project already lost real data to exactly that
  // shape of bug once, from a narrower cause - see git history.)
  const writeChain = useRef(Promise.resolve())

  const persist = useCallback((next) => {
    setData(next)
    suppressRemoteUntil.current = Date.now() + REMOTE_SUPPRESS_MS

    const run = async () => {
      const expected = knownUpdatedAt.current
      const nowIso = new Date().toISOString()
      let query = supabase.from('season').update({ data: next, updated_at: nowIso }).eq('id', 1)
      if (expected) query = query.eq('updated_at', expected)
      const { data: rows, error } = await query.select('updated_at')

      if (error) {
        setSaveError({ message: "Couldn't save your last change — check your connection and try again." })
        return false
      }
      if (!rows || rows.length === 0) {
        // Our conditional update matched no row: the updated_at we expected is stale, so
        // someone else's write landed first. Refuse the overwrite rather than clobber it,
        // and refetch so local state (and the next attempt) starts from what's actually saved.
        setSaveError({ message: "Someone else updated the data at the same moment, so this change wasn't saved. Refreshed to the latest version — please redo it." })
        await fetchNow()
        return false
      }
      knownUpdatedAt.current = rows[0].updated_at
      setSaveError(null)
      return true
    }

    const result = writeChain.current.then(run)
    writeChain.current = result.then(() => {}, () => {})
    return result
  }, [fetchNow])

  return { data, loading, saveError, clearSaveError: () => setSaveError(null), persist, refetch: fetchNow }
}
