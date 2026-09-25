// Shared text helpers for the rulebook: **bold** markup, search-match highlighting, and
// deriving each section's searchable plain text from its block data (src/lib/rulebookContent.js).

export function stripBold(s) {
  return s.replace(/\*\*/g, '')
}

export function blockPlainText(b) {
  if (b.t === 'p' || b.t === 'h' || b.t === 'note') return stripBold(b.text)
  if (b.t === 'ul' || b.t === 'ol') return b.items.map(stripBold).join(' ')
  if (b.t === 'table') return [...b.headers, ...b.rows.flat()].join(' ')
  return ''
}

export function sectionPlainText(section) {
  return [section.title, ...section.blocks.map(blockPlainText)].join(' ')
}

export function sectionMatches(section, query) {
  if (!query.trim()) return true
  return sectionPlainText(section).toLowerCase().includes(query.trim().toLowerCase())
}
