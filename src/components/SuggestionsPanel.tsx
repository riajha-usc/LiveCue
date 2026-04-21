import { RefreshCw, Loader2 } from 'lucide-react'
import type { SuggestionBatch, Suggestion } from '../types'
import { SuggestionCard } from './SuggestionCard'

interface SuggestionsPanelProps {
  batches: SuggestionBatch[]
  isLoading: boolean
  onRefresh: () => void
  onSuggestionClick: (suggestion: Suggestion) => void
  hasTranscript: boolean
}

export function SuggestionsPanel({
  batches,
  isLoading,
  onRefresh,
  onSuggestionClick,
  hasTranscript,
}: SuggestionsPanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          2. LIVE SUGGESTIONS
          <span className="batch-count">{batches.length} BATCHES</span>
        </h2>
        <button
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isLoading || !hasTranscript}
        >
          {isLoading
            ? <Loader2 size={14} className="spin" />
            : <RefreshCw size={14} />
          }
          Reload suggestions
        </button>
      </div>

      <div className="suggestions-body">
        {isLoading && (
          <div className="loading-batch">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        )}

        {batches.length === 0 && !isLoading && (
          <p className="empty-state">
            {hasTranscript
              ? 'Click Reload to generate suggestions.'
              : 'Suggestions appear here once recording starts.'}
          </p>
        )}

        {batches.map((batch, batchIndex) => (
          <div key={batch.id} className="suggestion-batch">
            <div className="batch-header">
              <span className="batch-label">
                {batchIndex === 0
                  ? 'Latest'
                  : new Date(batch.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
              </span>
            </div>
            <div className="batch-cards">
              {batch.suggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  onClick={onSuggestionClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}