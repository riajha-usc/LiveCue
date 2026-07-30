import { useState } from 'react'
import { X, RotateCcw, Eye, EyeOff, ExternalLink } from 'lucide-react'
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

  // First run = no key stored yet. Lead with an explanation instead of
  // dropping a new visitor straight into the prompt-tuning controls.
  const isFirstRun = !settings.groqApiKey

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {isFirstRun ? 'Welcome to LiveCue' : 'Settings'}
          </h2>
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

          {isFirstRun && (
            <section className="settings-intro">
              <p>
                LiveCue listens to your meeting, transcribes it live, and
                suggests questions and talking points as the conversation
                happens.
              </p>
              <p>
                It runs entirely in your browser — there is no backend, so
                you'll need your own Groq API key to start. Groq's free tier
                is enough to try it.
              </p>
              <a
                className="settings-link"
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
              >
                Get a free Groq API key <ExternalLink size={12} />
              </a>
            </section>
          )}

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
              Kept in this browser's local storage and sent directly to Groq.
              LiveCue has no backend, so your key never reaches a server of
              ours.
            </p>
          </section>

          <details className="settings-advanced" open={!isFirstRun}>
            <summary className="settings-advanced-summary">
              Advanced — context windows &amp; prompts
            </summary>

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
          </details>

        </div>
      </div>
    </div>
  )
}