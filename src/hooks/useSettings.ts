import { useState, useCallback } from 'react'
import type { AppSettings } from '../types'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '../lib/prompts'

// Loads settings from localStorage on first render.
// Falls back to DEFAULT_SETTINGS for any missing fields.
function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings)

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...updates }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    // Keep the API key — user shouldn't have to re-paste it on reset
    setSettingsState((prev) => {
      const next = { ...DEFAULT_SETTINGS, groqApiKey: prev.groqApiKey }
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { settings, updateSettings, resetToDefaults }
}