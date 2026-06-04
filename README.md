# LiveCue - Live Suggestions

An AI meeting copilot that listens to your microphone and shows you 3 useful suggestions in real time while a conversation is happening. Click any suggestion to get a detailed answer in the chat panel.

---

## What it does

- **Listens** to your mic and converts speech to text every 30 seconds
- **Suggests** 3 contextually relevant cards based on what's being said - could be a question to ask, a fact to check, a talking point, or an answer to something just raised
- **Chats** - click any suggestion or type your own question to get a detailed AI answer
- **Exports** the full session (transcript + suggestions + chat) as a JSON file

---

## Tech stack

- **React + TypeScript** - the UI framework.
- **Vite** - the build tool.
- **Groq** - the AI provider. We use two of their models:
  - **Whisper Large V3** for speech-to-text (turning your mic audio into readable transcript)
  - **GPT-OSS 120B** for generating suggestions and chat answers

All AI calls go directly from your browser to Groq using the API key. Nothing is stored on any server.

---

## Prompt strategy

The hardest part of this assignment isn't the code - it's making the suggestions actually useful.

**For suggestions**, the app sends the last 400 words of transcript to the AI. Why 400? It's roughly 2-3 minutes of speech - enough to understand what's happening right now without getting distracted by what was said 20 minutes ago.

The prompt forces 3 rules:
1. Every suggestion must be a different type (question, answer, fact-check, talking point, or clarification)
2. If someone just asked a question in the conversation, one suggestion must directly answer it
3. The preview text on each card must be useful on its own - not just "click for more"

**For chat**, the app sends up to 800 words of transcript as context. More context here makes sense because detailed answers need the full picture, not just the last few minutes.

**Streaming** is used for chat responses so the first word appears almost instantly instead of waiting for the full answer.

---

## Tradeoffs

- **No backend** - all API calls go directly from the browser. Simple and fast, and fine here because each user supplies their own API key.
- **30 second chunks** - audio is collected in 30 second blobs before being sent to Whisper. There's a small chance a word gets cut at the boundary, but it's rare and keeps the architecture simple.
- **400 words for suggestions, 800 for chat** - these are editable in Settings if you want to experiment.
