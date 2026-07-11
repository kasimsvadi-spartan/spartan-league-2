// Real in-app confirmation modal — the original artifact's window.confirm() is silently
// blocked in a sandboxed iframe, which is exactly the bug this replaces.
export function ConfirmModal({ title, body, confirmLabel = 'Delete', onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="ember-card w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
        <p className="display text-lg gold-text mb-2">{title}</p>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{body}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="plain-btn flex-1 py-2 rounded-md text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2 rounded-md text-sm" style={{ background: 'var(--red)', color: '#fff', fontWeight: 700 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
