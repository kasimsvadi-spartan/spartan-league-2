import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Admin session state, backed by the admin-login Edge Function (PIN -> Supabase session).
// A logged-in admin is just a normal Supabase Auth session for the one fixed admin user,
// so it persists across reloads the same way any other Supabase session would.
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const login = useCallback(async (pin) => {
    const { data, error } = await supabase.functions.invoke('admin-login', { body: { pin } })
    if (error || !data?.session) return { ok: false }
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
    return { ok: true }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { isAdmin, checking, login, logout }
}
