import type { ChatMessage, Suggestion } from '../types'

const GROQ_API_BASE = 'https://api.groq.com/openai/v1'
const TRANSCRIPTION_MODEL = 'whisper-large-v3'
const CHAT_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct'

// ─── 1. TRANSCRIPTION ────────────────────────────────────────────────────────
// Sends a raw audio blob to Groq Whisper and returns transcript text.
// Uses FormData because Whisper expects multipart/form-data, not JSON.
export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.webm')
  formData.append('model', TRANSCRIPTION_MODEL)
  formData.append('response_format', 'text')
  formData.append('language', 'en')

  const response = await fetch(`${GROQ_API_BASE}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Transcription failed: ${error}`)
  }

  return response.text()
}

// ─── 2. SUGGESTIONS ──────────────────────────────────────────────────────────
// Sends recent transcript to the model, parses 3 suggestions from JSON.
export async function fetchSuggestions(
  transcript: string,
  promptTemplate: string,
  apiKey: string
): Promise<Suggestion[]> {
  const prompt = promptTemplate.replace('{transcript}', transcript)

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_tokens: 1000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Suggestions failed: ${error}`)
  }

  const data = await response.json()
  const raw = data.choices[0]?.message?.content ?? ''

  // Strip markdown fences if the model wraps JSON in them anyway
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let parsed: Array<{ type: string; preview: string; expand_prompt: string }>
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Could not parse suggestions JSON: ${cleaned}`)
  }

  return parsed.map((item, i) => ({
    id: `${Date.now()}-${i}`,
    type: item.type as Suggestion['type'],
    preview: item.preview,
    expandPrompt: item.expand_prompt,
  }))
}

// ─── 3. CHAT - STREAMING ─────────────────────────────────────────────────────
// Streams the chat response token by token using an async generator.
// This is what makes the text appear word-by-word in the UI instantly.
export async function* streamChatResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  apiKey: string
): AsyncGenerator<string> {
  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_tokens: 1500,
      temperature: 0.5,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Chat failed: ${error}`)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

    for (const line of lines) {
      const json = line.slice(6) // Remove 'data: ' prefix
      if (json === '[DONE]') return

      try {
        const parsed = JSON.parse(json)
        const token = parsed.choices[0]?.delta?.content
        if (token) yield token
      } catch {
        // Partial chunk - skip
      }
    }
  }
}