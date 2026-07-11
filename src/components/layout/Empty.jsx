import { Card } from './Card'

export function Empty({ title, body }) {
  return (
    <Card className="text-center py-8">
      <p className="font-semibold">{title}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{body}</p>
    </Card>
  )
}
