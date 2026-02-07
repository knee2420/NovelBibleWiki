
export interface AIModelConfig {
  id: string
  name: string
  type: 'text' | 'image' | 'mixed'
  limits: {
    rpm: number // Requests Per Minute
    tpm: number // Tokens Per Minute
    rpd: number // Requests Per Day
  }
}

export const AI_MODELS: AIModelConfig[] = [
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    type: 'text', // Screenshot says 'Text Output Model'
    limits: { rpm: 10, tpm: 250000, rpd: 20 }
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    type: 'text',
    limits: { rpm: 5, tpm: 250000, rpd: 20 }
  },
  {
    id: 'gemini-3-flash',
    name: 'Gemini 3 Flash',
    type: 'text',
    limits: { rpm: 5, tpm: 250000, rpd: 20 }
  },
  {
    id: 'gemma-3-27b-it',
    name: 'Gemma 3 27B',
    type: 'text', // Screenshot says 'Other Model' but usually text
    limits: { rpm: 30, tpm: 15000, rpd: 14400 }
  }
]

export const DEFAULT_AI_MODEL = 'gemini-2.5-flash'
