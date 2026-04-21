import { useState, useRef, useCallback } from 'react'

const CHUNK_INTERVAL_MS = 30_000 // 30 seconds per chunk

interface UseAudioRecorderOptions {
  onChunk: (blob: Blob) => void // Called every 30s with a new audio chunk
}

export function useAudioRecorder({ onChunk }: UseAudioRecorderOptions) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Flushes current audio buffer as a Blob and resets for the next chunk.
  const flushChunk = useCallback(() => {
    if (chunksRef.current.length === 0) return
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    chunksRef.current = []
    onChunk(blob)
  }, [onChunk])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.start(1000) // Collect data every 1 second
      setIsRecording(true)

      // Every 30s: flush the buffer as a transcript chunk
      intervalRef.current = setInterval(flushChunk, CHUNK_INTERVAL_MS)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied'
      setError(msg)
    }
  }, [flushChunk])

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop()
    }
    flushChunk() // Flush whatever audio is left
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setIsRecording(false)
  }, [flushChunk])

  // Manually trigger a flush + reset the 30s timer
  // Used by the manual Refresh button
  const forceFlush = useCallback(() => {
    if (!isRecording) return
    flushChunk()
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(flushChunk, CHUNK_INTERVAL_MS)
  }, [isRecording, flushChunk])

  return { isRecording, error, startRecording, stopRecording, forceFlush }
}