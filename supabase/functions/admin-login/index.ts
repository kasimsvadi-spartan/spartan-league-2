// Edge Function: PIN -> Supabase session.
//
// The admin types a PIN into the app's login modal. This function checks it against the
// ADMIN_PIN secret (never shipped to the browser) and, if correct, signs in the one fixed
// "admin" Supabase Auth user and hands the resulting session back to the caller. RLS policies
// on `season`, `poll_votes` (writes), and the `photos` storage bucket all gate on
// auth.role() = 'authenticated', so this session is what unlocks admin writes.
//
// One-time setup (see DEPLOY.md): create the admin user once via the Supabase dashboard
// (Authentication -> Users -> Add user), then set these four secrets with
// `supabase secrets set`: ADMIN_PIN, ADMIN_EMAIL, ADMIN_PASSWORD (matching that user), and
// nothing else — this function only ever calls the public signInWithPassword API, so it
// does not need the service-role key.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { pin } = await req.json()
    const adminPin = Deno.env.get('ADMIN_PIN')
    const adminEmail = Deno.env.get('ADMIN_EMAIL')
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')

    if (!adminPin || !adminEmail || !adminPassword) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (typeof pin !== 'string' || pin !== adminPin) {
      return new Response(JSON.stringify({ error: 'Incorrect PIN' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    )
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })
    if (error || !data.session) {
      return new Response(JSON.stringify({ error: 'Admin sign-in failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ session: data.session }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
