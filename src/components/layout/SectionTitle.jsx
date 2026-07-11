export function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} color="var(--gold)" />
      <h2 className="display text-lg tracking-wide gold-text">{children}</h2>
    </div>
  )
}
