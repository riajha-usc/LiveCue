import { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage } from '../types'

interface ChatPanelProps {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string
  onSend: (message: string) => void
}

export function ChatPanel({
  messages,
  isStreaming,
  streamingContent,
  onSend,
}: ChatPanelProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll as new tokens stream in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const handleSend = () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    onSend(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="panel panel--chat">
      <div className="panel-header">
        <h2 className="panel-title">3. CHAT (DETAILED ANSWERS)</h2>
        <span className="session-label">SESSION-ONLY</span>
      </div>

      <div className="chat-body">
        {messages.length === 0 && !isStreaming && (
          <p className="empty-state">
            Click a suggestion or type a question below.
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message chat-message--${msg.role}`}>
            <div className="message-meta">
              <span className="message-role">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </span>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="message-content">
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {/* Live streaming response — appears word by word */}
        {isStreaming && streamingContent && (
          <div className="chat-message chat-message--assistant">
            <div className="message-meta">
              <span className="message-role">Assistant</span>
              <Loader2 size={12} className="spin" />
            </div>
            <div className="message-content">
              <ReactMarkdown>{streamingContent}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* Waiting for first token */}
        {isStreaming && !streamingContent && (
          <div className="chat-message chat-message--assistant">
            <div className="message-meta">
              <span className="message-role">Assistant</span>
            </div>
            <div className="message-content typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything…"
          rows={2}
          disabled={isStreaming}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}