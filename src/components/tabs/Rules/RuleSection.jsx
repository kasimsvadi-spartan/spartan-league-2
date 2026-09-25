import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card } from '../../layout/Card'
import { BlockRenderer } from './BlockRenderer'

export function RuleSection({ section, open, onToggle, query }) {
  return (
    <Card id={section.id} className="mb-2" style={{ scrollMarginTop: 96 }}>
      <button onClick={onToggle} className="w-full flex items-center justify-between gap-2 text-left">
        <p className="display text-base gold-text">{section.number}. {section.title}</p>
        {open ? <ChevronDown size={16} color="var(--muted)" /> : <ChevronRight size={16} color="var(--muted)" />}
      </button>
      {open && (
        <div>
          {section.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} query={query} />
          ))}
        </div>
      )}
    </Card>
  )
}
