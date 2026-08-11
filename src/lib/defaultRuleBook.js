import { uid } from './uid'

// Sections 1-7 mirror the app's actual scoring/qualification logic (src/lib/scoring.js) as
// prose, so they're accurate by construction rather than a second, driftable copy of the
// rules. Sections 8+ are genuine league policy the app has no way to know on its own
// (match conduct, eligibility, discipline, etc.) - they ship as empty, titled placeholders
// for the admin to fill in directly, same pattern as the Season 1 archive.
export function defaultRuleBook() {
  return [
    {
      id: uid('rule'),
      title: '1. League Format',
      body: 'Spartan League 2 is a 9-a-side underarm turf cricket league. The season features 7 teams competing across 23 total slots (21 league-stage slots plus a Semi-Final and Grand Final) over roughly 3 months. Each team plays 9 of the 21 league slots.',
    },
    {
      id: uid('rule'),
      title: '2. Slot Format',
      body: 'Each slot brings 3 teams together for 6 matches:\n1. League Match 1 — Team A vs Team B\n2. League Match 2 — Team B vs Team C\n3. League Match 3 — Team A vs Team C\n(a round robin — each pair of teams meets once)\n4. Qualifier — the top 2 teams from the round robin (ranked by wins, then Net Run Rate)\n5. Eliminator — the Qualifier\'s loser vs the 3rd-placed team\n6. Final — the Qualifier\'s winner vs the Eliminator\'s winner',
    },
    {
      id: uid('rule'),
      title: '3. Slot Points',
      body: 'Final winner: 4 points\nFinal loser: 2 points\nEliminator loser: 0 points',
    },
    {
      id: uid('rule'),
      title: '4. Bonus & Penalty Points',
      body: 'Bonus points apply only to full 7-over matches (not shortened or rain-affected ones):\n+1 for winning by 30+ runs, or successfully chasing in 4 overs or fewer\n+2 for winning by 60+ runs, or successfully chasing in 2 overs or fewer\nThe losing team has the same amount deducted as a penalty.',
    },
    {
      id: uid('rule'),
      title: '5. Net Run Rate (NRR)',
      body: 'NRR = (runs scored ÷ overs faced) − (runs conceded ÷ overs bowled), calculated from the actual overs each team faced and bowled per match. NRR is used as a tiebreaker within a slot\'s round robin (to seed the Qualifier and Eliminator) and for season standings.',
    },
    {
      id: uid('rule'),
      title: '6. Season Qualification',
      body: 'After all 21 league slots are complete: the top 2 teams (by total points, NRR as tiebreaker) go straight to the Grand Final. 3rd, 4th and 5th place play a Semi-Final slot; its winner joins the top 2 in the Grand Final. The remaining team(s) are eliminated from the season.',
    },
    {
      id: uid('rule'),
      title: '7. Squad Rules',
      body: 'Each team\'s squad is capped at 9 players. (Eligibility and transfer rules: to be added.)',
    },
    { id: uid('rule'), title: '8. Match Conduct', body: '' },
    { id: uid('rule'), title: '9. Squad Eligibility', body: '' },
    { id: uid('rule'), title: '10. Code of Conduct & Discipline', body: '' },
    { id: uid('rule'), title: '11. Forfeits, Rescheduling & Weather', body: '' },
    { id: uid('rule'), title: '12. Awards', body: '' },
    { id: uid('rule'), title: '13. Disputes & Admin Authority', body: '' },
  ]
}
