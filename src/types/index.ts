export type SuggestionType =
  | 'question'        
  | 'talking_point'   
  | 'answer'          
  | 'fact_check'      
  | 'clarification'   

export interface Suggestion {
  id: string
  type: SuggestionType
  preview: string       
  expandPrompt: string  
}

export interface SuggestionBatch {
  id: string
  timestamp: string
  suggestions: Suggestion[]
}

export interface TranscriptChunk {
  id: string
  timestamp: string
  text: string
}

export interface ChatMessage {
  id: string
  timestamp: string
  role: 'user' | 'assistant'
  content: string
}

export interface AppSettings {
  groqApiKey: string
  suggestionPrompt: string
  chatSystemPrompt: string
  expandedAnswerPrompt: string
  suggestionContextWords: number
  chatContextWords: number
}