import { useState } from 'react'
import { IndianRupee, Plus, Trash2, Trophy, Users } from 'lucide-react'
import { uid } from '../../../lib/uid'
import { findPoolPhoto, normName } from '../../../lib/players'
import { Card } from '../../layout/Card'
import { SectionTitle } from '../../layout/SectionTitle'
import { Empty } from '../../layout/Empty'
import { ConfirmModal } from '../../layout/ConfirmModal'
import { PlayerAvatar } from '../../shared/PlayerAvatar'

const CATEGORIES = {
  slot: [
    { key: 'winningTeamPlayer', label: 'Winning Team Player', amount: 500, teamReward: true },
    { key: 'bestBatsmanSlot', label: 'Best Batsman (Slot)', amount: 300 },
    { key: 'bestBowlerSlot', label: 'Best Bowler (Slot)', amount: 300 },
    { key: 'bestFielderSlot', label: 'Best Fielder (Slot)', amount: 300 },
    { key: 'mvpSlot', label: 'MVP (Slot)', amount: 300 },
    { key: 'categoryWinner', label: 'Category Winner', amount: 200 },
    { key: 'challenge', label: 'Challenge Reward', amount: 0 },
  ],
  tournament: [
    { key: 'ownerWinner', label: 'Winning Team Owner', amount: 83000 },
    { key: 'ownerRunnerUp', label: 'Runner-Up Team Owner', amount: 40000 },
    { key: 'winningTeamPlayerFinal', label: 'Winning Team Player', amount: 6000, teamReward: true },
    { key: 'runnerUpTeamPlayerFinal', label: 'Runner-Up Team Player', amount: 1500, teamReward: true },
    { key: 'bestBatsmanSeason', label: 'Best Batsman (Season)', amount: 2000 },
    { key: 'bestBowlerSeason', label: 'Best Bowler (Season)', amount: 2000 },
    { key: 'bestFielderSeason', label: 'Best Fielder (Season)', amount: 2000 },
    { key: 'mvpSeason', label: 'MVP (Season)', amount: 2000 },
  ],
}
const ALL_CATEGORIES = { ...Object.fromEntries(CATEGORIES.slot.map((c) => [c.key, c])), ...Object.fromEntries(CATEGORIES.tournament.map((c) => [c.key, c])) }

function inr(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}

export function Rewards({ data, persist, isAdmin }) {
  const entries = data.rewardEntries || []
  const [showAdd, setShowAdd] = useState(false)
  const [scope, setScope] = useState('slot')
  const [slotId, setSlotId] = useState('')
  const [category, setCategory] = useState(CATEGORIES.slot[0].key)
  const [recipientName, setRecipientName] = useState('')
  const [teamId, setTeamId] = useState('')
  const [amount, setAmount] = useState(CATEGORIES.slot[0].amount)
  const [note, setNote] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const sortedSlots = [...data.slots].filter((s) => s.date).sort((a, b) => a.date.localeCompare(b.date))
  const teamById = (id) => data.teams.find((t) => t.id === id)

  function save(next) {
    persist({ ...data, rewardEntries: next })
  }

  function pickCategory(key) {
    setCategory(key)
    const c = ALL_CATEGORIES[key]
    setAmount(c ? c.amount : 0)
  }

  function addEntry() {
    if (!recipientName.trim() || amount === '' || amount == null) return
    const slot = slotId ? sortedSlots.find((s) => s.id === slotId) : null
    const entry = {
      id: uid('reward'),
      scope,
      slotId: scope === 'slot' ? slotId : null,
      slotLabel: scope === 'slot' && slot ? new Date(slot.date + 'T00:00').toDateString() : 'Tournament Awards',
      category,
      categoryLabel: ALL_CATEGORIES[category]?.label || category,
      recipientName: recipientName.trim(),
      team: teamId ? teamById(teamId)?.name || '' : '',
      amount: Number(amount) || 0,
      note: note.trim(),
    }
    save([entry, ...entries])
    setRecipientName(''); setNote('')
  }

  function addWholeTeam() {
    if (!teamId) return
    const team = teamById(teamId)
    if (!team || team.players.length === 0) return
    const slot = slotId ? sortedSlots.find((s) => s.id === slotId) : null
    const base = {
      scope,
      slotId: scope === 'slot' ? slotId : null,
      slotLabel: scope === 'slot' && slot ? new Date(slot.date + 'T00:00').toDateString() : 'Tournament Awards',
      category,
      categoryLabel: ALL_CATEGORIES[category]?.label || category,
      team: team.name,
      amount: Number(amount) || 0,
      note: note.trim(),
    }
    const newEntries = team.players.map((p) => ({ id: uid('reward'), ...base, recipientName: p.name }))
    save([...newEntries, ...entries])
  }

  function deleteEntry(id) {
    save(entries.filter((e) => e.id !== id))
    setConfirmDeleteId(null)
  }

  const selectedCategory = ALL_CATEGORIES[category]

  const earnings = (() => {
    const byName = new Map()
    entries.forEach((e) => {
      const key = normName(e.recipientName)
      if (!key) return
      const cur = byName.get(key) || { name: e.recipientName, team: e.team, total: 0 }
      cur.total += e.amount
      if (!cur.team && e.team) cur.team = e.team
      byName.set(key, cur)
    })
    return [...byName.values()].sort((a, b) => b.total - a.total)
  })()

  return (
    <div className="space-y-6">
      <SectionTitle icon={IndianRupee}>Rewards</SectionTitle>

      <div>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Per-Slot Structure</p>
        <Card className="mb-2">
          <p className="text-sm font-semibold mb-1">Entry Fee</p>
          <p className="text-xs" style={{ color: 'var(--muted2)' }}>₹600 per player × 27 players = <span className="gold-text font-semibold">₹16,200</span> per slot</p>
        </Card>
        <Card className="mb-2">
          <p className="text-sm font-semibold mb-2">Expenses</p>
          <div className="text-xs space-y-1" style={{ color: 'var(--muted2)' }}>
            <div className="flex justify-between"><span>Turf Expense + Chairs</span><span>{inr(5000)}</span></div>
            <div className="flex justify-between"><span>Balls</span><span>{inr(350)}</span></div>
            <div className="flex justify-between"><span>Water</span><span>{inr(400)}+</span></div>
            <div className="flex justify-between"><span>Umpire Fees</span><span>{inr(1800)}</span></div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold mb-2">Rewards</p>
          <div className="text-xs space-y-1" style={{ color: 'var(--muted2)' }}>
            <div className="flex justify-between"><span>Winning Team Players (₹500 × 9)</span><span>{inr(4500)}</span></div>
            <div className="flex justify-between"><span>Performance Rewards (₹300 × 4)</span><span>{inr(1200)}</span></div>
            <div className="flex justify-between"><span>Category Rewards (₹200 × 9)</span><span>{inr(1800)}</span></div>
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--faint)' }}>Remaining balance goes toward Challenge Rewards and reel-making expenses.</p>
        </Card>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Player Fines</p>
        <Card>
          <div className="text-xs space-y-2" style={{ color: 'var(--muted2)' }}>
            <div className="flex justify-between"><span>Late (after 9:01 PM, 9:10 PM for suburb travellers)</span><span className="font-semibold" style={{ color: 'var(--red)' }}>{inr(200)}</span></div>
            <div className="flex justify-between"><span>Backout — no replacement found</span><span className="font-semibold" style={{ color: 'var(--red)' }}>{inr(600)}</span></div>
            <div className="flex justify-between"><span>Backout — replacement found</span><span className="font-semibold" style={{ color: 'var(--red)' }}>{inr(300)}</span></div>
            <div className="flex justify-between"><span>Not wearing team jersey/tracks</span><span className="font-semibold" style={{ color: 'var(--red)' }}>{inr(200)}</span></div>
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--faint)' }}>Fines are added to the league pool. No jersey fine for a replacement player.</p>
        </Card>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--muted)' }}>Tournament Prize Pool — <span className="gold-text">{inr(198500)}</span></p>
        <Card className="mb-2">
          <p className="text-sm font-semibold mb-2">Team Owner Rewards</p>
          <div className="text-xs space-y-1" style={{ color: 'var(--muted2)' }}>
            <div className="flex justify-between"><span>Winning Team Owner</span><span>{inr(83000)}</span></div>
            <div className="flex justify-between"><span>Runner-Up Team Owner</span><span>{inr(40000)}</span></div>
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold mb-2">Player Rewards</p>
          <div className="text-xs space-y-1" style={{ color: 'var(--muted2)' }}>
            <div className="flex justify-between"><span>Winning Team Players (₹6,000 × 9)</span><span>{inr(54000)}</span></div>
            <div className="flex justify-between"><span>Runner-Up Team Players (₹1,500 × 9)</span><span>{inr(13500)}</span></div>
            <div className="flex justify-between"><span>Individual Awards (₹2,000 × 4)</span><span>{inr(8000)}</span></div>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Slot & Tournament Winners</p>
          {isAdmin && <button onClick={() => setShowAdd((s) => !s)} className="gold-btn flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md"><Plus size={13} /> Add</button>}
        </div>

        {isAdmin && showAdd && (
          <Card className="mb-3">
            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Scope</label>
            <select value={scope} onChange={(e) => { setScope(e.target.value); pickCategory(CATEGORIES[e.target.value][0].key) }} className="field w-full mt-1 mb-2 px-2 py-1.5 text-sm">
              <option value="slot">This slot</option>
              <option value="tournament">Tournament-end award</option>
            </select>

            {scope === 'slot' && (
              <>
                <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Slot</label>
                <select value={slotId} onChange={(e) => setSlotId(e.target.value)} className="field w-full mt-1 mb-2 px-2 py-1.5 text-sm">
                  <option value="">Select a slot…</option>
                  {sortedSlots.map((s) => <option key={s.id} value={s.id}>{new Date(s.date + 'T00:00').toDateString()} · {s.slotType || 'League'}</option>)}
                </select>
              </>
            )}

            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Category</label>
            <select value={category} onChange={(e) => pickCategory(e.target.value)} className="field w-full mt-1 mb-2 px-2 py-1.5 text-sm">
              {CATEGORIES[scope].map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>

            {selectedCategory?.teamReward && (
              <>
                <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Team (pays every current squad player)</label>
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="field w-full mt-1 mb-2 px-2 py-1.5 text-sm">
                  <option value="">Select a team…</option>
                  {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Amount per player (₹)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="field w-full mt-1 mb-2 px-2 py-1.5 text-sm" />
                <button disabled={!teamId} onClick={addWholeTeam} className="gold-btn w-full py-2 rounded-md text-sm flex items-center justify-center gap-1.5 mb-3">
                  <Users size={14} /> Pay {teamId ? teamById(teamId)?.players.length || 0 : 0} players {inr(amount)} each
                </button>
                <p className="text-[10px] mb-2" style={{ color: 'var(--muted2)' }}>Or log a single player instead:</p>
              </>
            )}

            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Recipient name</label>
            <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Player or owner name" className="field w-full mt-1 mb-2 px-2 py-1.5 text-sm" />
            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Team (optional)</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className="field w-full mt-1 mb-2 px-2 py-1.5 text-sm">
              <option value="">—</option>
              {data.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="field w-full mt-1 mb-2 px-2 py-1.5 text-sm" />
            {category === 'challenge' && (
              <>
                <label className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--muted)' }}>What challenge?</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Fastest 20 runs" className="field w-full mt-1 mb-2 px-2 py-1.5 text-sm" />
              </>
            )}
            <button disabled={!recipientName.trim()} onClick={addEntry} className="plain-btn w-full py-2 rounded-md text-sm">Log this reward</button>
          </Card>
        )}

        {entries.length === 0 ? (
          <Empty title="No rewards logged yet" body={isAdmin ? "Tap 'Add' after a slot to record who won what." : 'Check back once the admin logs this slot\'s winners.'} />
        ) : (
          <div className="space-y-1.5">
            {entries.map((e) => {
              const photo = findPoolPhoto(data.playerPool, e.recipientName)
              return (
                <div key={e.id} className="flex items-center justify-between px-2.5 py-2 rounded" style={{ background: 'var(--ink)' }}>
                  <div className="flex items-center gap-2.5">
                    <PlayerAvatar player={{ name: e.recipientName, photoUrl: photo }} size={30} />
                    <div>
                      <p className="text-sm font-medium">{e.recipientName} {e.team && <span className="text-[11px]" style={{ color: 'var(--muted2)' }}>· {e.team}</span>}</p>
                      <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{e.categoryLabel}{e.note ? ` — ${e.note}` : ''} · {e.slotLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="display text-lg gold-text">{inr(e.amount)}</span>
                    {isAdmin && <button onClick={() => setConfirmDeleteId(e.id)}><Trash2 size={13} color="var(--muted)" /></button>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {earnings.length > 0 && (
        <div>
          <SectionTitle icon={Trophy}>Player Earnings</SectionTitle>
          <div className="space-y-1.5">
            {earnings.map((p, i) => {
              const photo = findPoolPhoto(data.playerPool, p.name)
              return (
                <div key={p.name + i} className="ember-card flex items-center justify-between" style={{ padding: '10px 14px' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="display text-lg w-5" style={{ color: 'var(--muted)' }}>{i + 1}</span>
                    <PlayerAvatar player={{ name: p.name, photoUrl: photo }} size={32} />
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      {p.team && <p className="text-[11px]" style={{ color: 'var(--muted2)' }}>{p.team}</p>}
                    </div>
                  </div>
                  <span className="display text-xl gold-text">{inr(p.total)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmModal
          title="Delete this reward entry?"
          body="This removes it from the winners log and from that player's total earnings. This can't be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmDeleteId(null)}
          onConfirm={() => deleteEntry(confirmDeleteId)}
        />
      )}
    </div>
  )
}
