import { useState, useCallback, useRef, useEffect } from 'react'
import { Settings, Download, AlertCircle } from 'lucide-react'

import { TranscriptPanel } from './components/TranscriptPanel'
import { SuggestionsPanel } from './components/SuggestionsPanel'
import { ChatPanel } from './components/ChatPanel'
import { SettingsModal } from './components/SettingsModal'

import { useSettings } from './hooks/useSettings'
import { useAudioRecorder } from './hooks/useAudioRecorder'

import { transcribeAudio, fetchSuggestions, streamChatResponse } from './lib/groq'
import { exportSession, getRecentTranscript, getFullTranscript } from './lib/export'

import type { TranscriptChunk, SuggestionBatch, ChatMessage, Suggestion } from './types'

const AUTO_REFRESH_MS = 30_000

export default function App() {
  const { settings, updateSettings, resetToDefaults } = useSettings()

  // ── All app state lives here ───────────────────────────────────────────────
  const [transcriptChunks, setTranscriptChunks] = useState<TranscriptChunk[]>([])
  const [suggestionBatches, setSuggestionBatches] = useState<SuggestionBatch[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const [showSettings, setShowSettings] = useState(!settings.groqApiKey)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Ref so async callbacks always see latest transcript without stale closure
  const transcriptChunksRef = useRef<TranscriptChunk[]>([])
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    transcriptChunksRef.current = transcriptChunks
  }, [transcriptChunks])

  // ── Audio chunk → transcription ────────────────────────────────────────────
  const handleAudioChunk = useCallback(async (blob: Blob) => {
    if (!settings.groqApiKey) {
      setGlobalError('No API key — open Settings and paste your Groq key.')
      return
    }
    setIsTranscribing(true)
    try {
      const text = await transcribeAudio(blob, settings.groqApiKey)
      if (!text.trim()) return
      const chunk: TranscriptChunk = {
        id: `chunk-${Date.now()}`,
        timestamp: new Date().toISOString(),
        text: text.trim(),
      }
      setTranscriptChunks((prev) => [...prev, chunk])
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Transcription error')
    } finally {
      setIsTranscribing(false)
    }
  }, [settings.groqApiKey])

  const { isRecording, error: micError, startRecording, stopRecording, forceFlush } =
    useAudioRecorder({ onChunk: handleAudioChunk })

  // ── Fetch suggestions ──────────────────────────────────────────────────────
  const refreshSuggestions = useCallback(async () => {
    const chunks = transcriptChunksRef.current
    if (chunks.length === 0 || !settings.groqApiKey) return

    setIsFetchingSuggestions(true)
    setGlobalError(null)
    try {
      const recentText = getRecentTranscript(chunks, settings.suggestionContextWords)
      const suggestions = await fetchSuggestions(
        recentText,
        settings.suggestionPrompt,
        settings.groqApiKey
      )
      const batch: SuggestionBatch = {
        id: `batch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        suggestions,
      }
      setSuggestionBatches((prev) => [batch, ...prev])
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Suggestions error')
    } finally {
      setIsFetchingSuggestions(false)
    }
  }, [settings])

  // Manual refresh: flush audio first, then suggestions after short delay
  const handleManualRefresh = useCallback(() => {
    forceFlush()
    setTimeout(refreshSuggestions, 2000)
  }, [forceFlush, refreshSuggestions])

  // Auto-refresh suggestions every 30s while recording
  useEffect(() => {
    if (isRecording) {
      autoRefreshRef.current = setInterval(refreshSuggestions, AUTO_REFRESH_MS)
    } else {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current)
        autoRefreshRef.current = null
      }
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [isRecording, refreshSuggestions])

  // ── Chat ───────────────────────────────────────────────────────────────────
  const sendChatMessage = useCallback(async (userText: string) => {
    if (!settings.groqApiKey) {
      setGlobalError('No API key — open Settings.')
      return
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      role: 'user',
      content: userText,
    }
    const updatedMessages = [...chatMessages, userMsg]
    setChatMessages(updatedMessages)
    setIsStreaming(true)
    setStreamingContent('')

    const fullTranscript = getFullTranscript(
      transcriptChunksRef.current,
      settings.chatContextWords
    )
    const systemPrompt = settings.chatSystemPrompt.replace(
      '{transcript}',
      fullTranscript || '(No transcript yet)'
    )

    let fullResponse = ''
    try {
      for await (const token of streamChatResponse(
        updatedMessages,
        systemPrompt,
        settings.groqApiKey
      )) {
        fullResponse += token
        setStreamingContent(fullResponse)
      }
      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        timestamp: new Date().toISOString(),
        role: 'assistant',
        content: fullResponse,
      }
      setChatMessages((prev) => [...prev, assistantMsg])
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : 'Chat error')
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [chatMessages, settings])

  // When a suggestion card is clicked
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    const fullTranscript = getFullTranscript(
      transcriptChunksRef.current,
      settings.chatContextWords
    )
    const expandedPrompt = settings.expandedAnswerPrompt
      .replace('{expand_prompt}', suggestion.expandPrompt)
      .replace('{transcript}', fullTranscript || '(No transcript yet)')

    sendChatMessage(expandedPrompt)
  }, [sendChatMessage, settings])

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    exportSession(transcriptChunks, suggestionBatches, chatMessages)
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">
          <span className="logo-dot" />
          TwinMind
        </div>
        <div className="header-actions">
          {globalError && (
            <div className="global-error">
              <AlertCircle size={14} />
              <span>{globalError}</span>
              <button onClick={() => setGlobalError(null)}>✕</button>
            </div>
          )}
          <button className="header-btn" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button className="header-btn" onClick={() => setShowSettings(true)}>
            <Settings size={16} /> Settings
          </button>
        </div>
      </header>

      <main className="app-columns">
        <TranscriptPanel
          chunks={transcriptChunks}
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          error={micError}
          onStart={startRecording}
          onStop={stopRecording}
        />
        <SuggestionsPanel
          batches={suggestionBatches}
          isLoading={isFetchingSuggestions}
          onRefresh={handleManualRefresh}
          onSuggestionClick={handleSuggestionClick}
          hasTranscript={transcriptChunks.length > 0}
        />
        <ChatPanel
          messages={chatMessages}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          onSend={sendChatMessage}
        />
      </main>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={updateSettings}
          onReset={resetToDefaults}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}