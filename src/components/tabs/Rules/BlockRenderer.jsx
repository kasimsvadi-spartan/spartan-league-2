import { ArrowDown, Info } from 'lucide-react'
import { RichText } from './RichText.jsx'

function SlotFlowDiagram() {
  const box = (label, sub) => (
    <div className="text-center px-3 py-2 rounded-md" style={{ background: 'var(--ink)', border: '1px solid var(--hair2)' }}>
      <p className="text-xs font-semibold" style={{ color: 'var(--cream)' }}>{label}</p>
      {sub && <p className="text-[10px]" style={{ color: 'var(--muted2)' }}>{sub}</p>}
    </div>
  )
  const arrow = (label) => (
    <div className="flex flex-col items-center py-1">
      <ArrowDown size={14} color="var(--muted2)" />
      {label && <p className="text-[10px]" style={{ color: 'var(--gold)' }}>{label}</p>}
    </div>
  )
  return (
    <div className="my-2 py-3 px-2 rounded-md" style={{ background: 'var(--ink2)', border: '1px solid var(--hair3)' }}>
      {box('Round robin', '3 matches')}
      {arrow()}
      {box('Qualifier', '1st v 2nd')}
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="flex flex-col items-center">
          {arrow('winner')}
          {box('Final')}
        </div>
        <div className="flex flex-col items-center">
          {arrow('loser')}
          {box('Eliminator', 'v 3rd')}
          {arrow('winner')}
          {box('Final')}
        </div>
      </div>
    </div>
  )
}

function ResponsiveTable({ headers, rows, query }) {
  if (rows.length === 0) return null
  return (
    <div className="my-2 -mx-1 overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <table className="text-xs w-full" style={{ borderCollapse: 'collapse', minWidth: 280 }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-2 py-1.5 whitespace-nowrap" style={{ color: 'var(--gold)', borderBottom: '1px solid var(--hair2)', background: 'var(--chip)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1.5 align-top" style={{ color: 'var(--cream)', borderBottom: '1px solid var(--hair3)' }}>
                  <RichText text={cell} query={query} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function BlockRenderer({ block, query }) {
  switch (block.t) {
    case 'h':
      return <p className="text-sm font-semibold mt-3 mb-1" style={{ color: 'var(--gold)' }}><RichText text={block.text} query={query} /></p>
    case 'p':
      return <p className="text-sm mt-1.5 leading-relaxed" style={{ color: 'var(--cream)' }}><RichText text={block.text} query={query} /></p>
    case 'ul':
      return (
        <ul className="text-sm mt-1.5 space-y-1 pl-4" style={{ color: 'var(--cream)', listStyle: 'disc' }}>
          {block.items.map((item, i) => (
            <li key={i}><RichText text={item} query={query} /></li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol className="text-sm mt-1.5 space-y-1 pl-4" style={{ color: 'var(--cream)', listStyle: 'decimal' }}>
          {block.items.map((item, i) => (
            <li key={i}><RichText text={item} query={query} /></li>
          ))}
        </ol>
      )
    case 'table':
      return <ResponsiveTable headers={block.headers} rows={block.rows} query={query} />
    case 'note':
      return (
        <div className="mt-2 flex items-start gap-2 px-2.5 py-2 rounded-md" style={{ background: 'rgba(239, 193, 58, 0.1)', border: '1px solid var(--hair2)' }}>
          <Info size={14} color="var(--gold)" style={{ marginTop: 2, flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--muted)' }}><RichText text={block.text} query={query} /></p>
        </div>
      )
    case 'flow':
      return <SlotFlowDiagram />
    default:
      return null
  }
}
