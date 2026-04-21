import { useState } from 'react'
import { X, RotateCcw, Eye, EyeOff } from 'lucide-react'
import type { AppSettings } from '../types'

interface SettingsModalProps {
  settings: AppSettings
  onUpdate: (updates: Partial<AppSettings>) => void
  onReset: () => void
  onClose: () => void
}

export function SettingsModal({
  settings,
  onUpdate,
  onReset,
  onClose,
}: SettingsModalProps) {
  const [showKey, setShowKey] = useState(false)

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Settings</h2>
          <div className="modal-header-actions">
            <button className="icon-btn" onClick={onReset} title="Reset to defaults">
              <RotateCcw size={16} />
            </button>
            <button className="icon-btn" onClick={onClose} title="Close">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body">

          {/* API Key */}
          <section className="settings-section">
            <h3 className="settings-section-title">Groq API Key</h3>
            <div className="api-key-row">
              <input
                className="settings-input"
                type={showKey ? 'text' : 'password'}
                value={settings.groqApiKey}
                onChange={(e) => onUpdate({ groqApiKey: e.target.value })}
                placeholder="gsk_..."
              />
              <button
                className="icon-btn"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="settings-hint">
              Stored locally in your browser. Never sent anywhere except Groq.
            </p>
          </section>

          {/* Context Windows */}
          <section className="settings-section">
            <h3 className="settings-section-title">Context Windows</h3>
            <label className="settings-label">
              Suggestion context (words)
              <input
                className="settings-input settings-input--small"
                type="number"
                min={100}
                max={2000}
                value={settings.suggestionContextWords}
                onChange={(e) =>
                  onUpdate({ suggestionContextWords: Number(e.target.value) })
                }
              />
            </label>
            <label className="settings-label">
              Chat context (words)
              <input
                className="settings-input settings-input--small"
                type="number"
                min={100}
                max={4000}
                value={settings.chatContextWords}
                onChange={(e) =>
                  onUpdate({ chatContextWords: Number(e.target.value) })
                }
              />
            </label>
          </section>

          {/* Prompts */}
          <section className="settings-section">
            <h3 className="settings-section-title">Live Suggestion Prompt</h3>
            <textarea
              className="settings-textarea"
              value={settings.suggestionPrompt}
              onChange={(e) => onUpdate({ suggestionPrompt: e.target.value })}
              rows={10}
            />
          </section>

          <section className="settings-section">
            <h3 className="settings-section-title">Chat System Prompt</h3>
            <textarea
              className="settings-textarea"
              value={settings.chatSystemPrompt}
              onChange={(e) => onUpdate({ chatSystemPrompt: e.target.value })}
              rows={8}
            />
          </section>

          <section className="settings-section">
            <h3 className="settings-section-title">Expanded Answer Prompt</h3>
            <textarea
              className="settings-textarea"
              value={settings.expandedAnswerPrompt}
              onChange={(e) =>
                onUpdate({ expandedAnswerPrompt: e.target.value })
              }
              rows={8}
            />
          </section>

        </div>
      </div>
    </div>
  )
}