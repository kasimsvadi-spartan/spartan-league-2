import { uid } from './uid'

// Seed shape for a brand-new season row. Note: unlike the original artifact, there is no
// `adminPin` field here — the PIN now lives server-side as a Supabase Edge Function secret
// and is never part of the shared season document (see supabase/functions/admin-login).
export function defaultData() {
  return {
    teams: [
      { id: uid('team'), name: 'Blue Falcon', color: '#3A6BC4', logo: '/team-logos/blue-falcon.png', captain: '', owner: '', players: [] },
      { id: uid('team'), name: 'Radiance Gaming', color: '#E0512A', logo: '/team-logos/radiance-gaming.png', captain: '', owner: '', players: [] },
      { id: uid('team'), name: 'White Caps', color: '#2FA84F', logo: '/team-logos/white-caps.png', captain: '', owner: '', players: [] },
      { id: uid('team'), name: 'Pinky Boys', color: '#D6247A', logo: '/team-logos/pinky-boys.png', captain: '', owner: '', players: [] },
      { id: uid('team'), name: 'Desi Boyz', color: '#F0A83C', logo: '/team-logos/desi-boyz.png', captain: '', owner: '', players: [] },
      { id: uid('team'), name: 'MMT Rangers', color: '#1E9E97', logo: '/team-logos/mmt-rangers.png', captain: '', owner: '', players: [] },
    ],
    slots: [],
    statsImports: [],
    announcements: [],
    manualRecords: { highestScore: null, bestBowling: null },
    polls: {},
    liveScorecardUrl: '',
  }
}
