import { useState } from 'react'

export function AdminLoginModal({ onLogin, onCancel }) {
  const [pin, setPin] = useState('')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErr(false)
    const { ok } = await onLogin(pin)
    setBusy(false)
    if (!ok) { setErr(true); setPin('') }
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form onSubmit={submit} className="ember-card w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <p className="display text-lg gold-text mb-2">Admin Login</p>
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Enter the league PIN to make changes.</p>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="field w-full px-3 py-2 mb-2"
          placeholder="PIN"
        />
        {err && <p className="text-sm mb-2" style={{ color: 'var(--red)' }}>Incorrect PIN.</p>}
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onCancel} className="plain-btn flex-1 py-2 rounded-md text-sm">Cancel</button>
          <button type="submit" disabled={busy || !pin} className="gold-btn flex-1 py-2 rounded-md text-sm">{busy ? 'Checking…' : 'Login'}</button>
        </div>
      </form>
    </div>
  )
}
