import { useEffect, useRef } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import type { TranscriptChunk } from '../types'

interface TranscriptPanelProps {
  chunks: TranscriptChunk[]
  isRecording: boolean
  isTranscribing: boolean
  error: string | null
  onStart: () => void
  onStop: () => void
}

export function TranscriptPanel({
  chunks,
  isRecording,
  isTranscribing,
  error,
  onStart,
  onStop,
}: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest transcript line whenever chunks update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chunks])

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">1. MIC & TRANSCRIPT</h2>
        <button
          className={`mic-btn ${isRecording ? 'mic-btn--active' : ''}`}
          onClick={isRecording ? onStop : onStart}
        >
          {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          {isRecording ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className="transcript-body">
        {chunks.length === 0 && !isRecording && (
          <p className="empty-state">
            No transcript yet — start the mic.
          </p>
        )}

        {chunks.map((chunk) => (
          <div key={chunk.id} className="transcript-chunk">
            <span className="chunk-time">
              {new Date(chunk.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <p className="chunk-text">{chunk.text}</p>
          </div>
        ))}

        {isRecording && (
          <div className="recording-indicator">
            <span className="pulse-dot" />
            {isTranscribing ? (
              <span className="transcribing-label">
                <Loader2 size={12} className="spin" /> Transcribing…
              </span>
            ) : (
              <span className="transcribing-label">Listening…</span>
            )}
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        {/* Auto-scroll target — always at the bottom */}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}