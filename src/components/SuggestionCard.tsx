import type { Suggestion } from '../types'

// Label and color for each suggestion type shown as a badge on the card
const TYPE_META: Record<Suggestion['type'], { label: string; className: string }> = {
  question:      { label: 'Ask',        className: 'badge--question' },
  talking_point: { label: 'Raise',      className: 'badge--talking' },
  answer:        { label: 'Answer',     className: 'badge--answer' },
  fact_check:    { label: 'Fact Check', className: 'badge--fact' },
  clarification: { label: 'Context',   className: 'badge--clarify' },
}

interface SuggestionCardProps {
  suggestion: Suggestion
  onClick: (suggestion: Suggestion) => void
}

export function SuggestionCard({ suggestion, onClick }: SuggestionCardProps) {
  const meta = TYPE_META[suggestion.type] ?? { label: suggestion.type, className: '' }

  return (
    <button className="suggestion-card" onClick={() => onClick(suggestion)}>
      <span className={`badge ${meta.className}`}>{meta.label}</span>
      <p className="suggestion-preview">{suggestion.preview}</p>
      <span className="suggestion-cta">Tap for details →</span>
    </button>
  )
}