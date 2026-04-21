import type { TranscriptChunk, SuggestionBatch, ChatMessage } from '../types'

// ─── EXPORT SESSION ───────────────────────────────────────────────────────────
// Downloads the full session as a JSON file.
// The interviewers use this to evaluate your submission — don't skip it.
export function exportSession(
  transcriptChunks: TranscriptChunk[],
  suggestionBatches: SuggestionBatch[],
  chatMessages: ChatMessage[]
) {
  const session = {
    exported_at: new Date().toISOString(),
    transcript: transcriptChunks.map((c) => ({
      timestamp: c.timestamp,
      text: c.text,
    })),
    suggestion_batches: suggestionBatches.map((batch) => ({
      timestamp: batch.timestamp,
      suggestions: batch.suggestions.map((s) => ({
        type: s.type,
        preview: s.preview,
        expand_prompt: s.expandPrompt,
      })),
    })),
    chat_history: chatMessages.map((m) => ({
      timestamp: m.timestamp,
      role: m.role,
      content: m.content,
    })),
  }

  const blob = new Blob([JSON.stringify(session, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `twinmind-session-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── GET RECENT TRANSCRIPT ────────────────────────────────────────────────────
// Returns the last N words from all transcript chunks joined together.
// Used for suggestions — we only want recent context, not the whole meeting.
export function getRecentTranscript(
  chunks: TranscriptChunk[],
  wordLimit: number
): string {
  const full = chunks.map((c) => c.text).join(' ')
  const words = full.trim().split(/\s+/)
  return words.slice(-wordLimit).join(' ')
}

// ─── GET FULL TRANSCRIPT ──────────────────────────────────────────────────────
// Returns up to N words from the full transcript.
// Used for chat — detailed answers need more context than suggestions.
export function getFullTranscript(
  chunks: TranscriptChunk[],
  wordLimit: number
): string {
  const full = chunks.map((c) => c.text).join('\n\n')
  const words = full.trim().split(/\s+/)
  return words.slice(-wordLimit).join(' ')
}