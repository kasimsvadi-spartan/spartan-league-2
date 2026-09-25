// Renders text that may contain **bold** markup, additionally wrapping any substring that
// matches the live search query in <mark>. Bold and highlighting are independent, so a
// match can land inside or across a bold span without either one breaking.
function highlightSegment(text, query, keyPrefix) {
  if (!query) return text
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const out = []
  let i = 0
  let n = 0
  while (i < text.length) {
    const idx = lower.indexOf(q, i)
    if (idx === -1) {
      out.push(text.slice(i))
      break
    }
    if (idx > i) out.push(text.slice(i, idx))
    out.push(
      <mark key={`${keyPrefix}-${n++}`} style={{ background: 'var(--gold)', color: '#1A1409', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
    )
    i = idx + q.length
  }
  return out
}

export function RichText({ text, query = '' }) {
  const parts = text.split('**')
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} style={{ color: 'var(--gold-light)' }}>{highlightSegment(part, query, `b${i}`)}</strong>
        ) : (
          <span key={i}>{highlightSegment(part, query, `s${i}`)}</span>
        )
      )}
    </>
  )
}
