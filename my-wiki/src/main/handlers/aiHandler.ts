import { ipcMain } from 'electron'
import Store from 'electron-store'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateSceneAnalysisPrompt } from '../lib/ai/promptBuilder'
import { SCENE_DATA_JSON_SCHEMA } from '../lib/ai/geminiSchema'

// Store API Key securely (as much as possible in local)
// We use a specific key for the API token
const STORE_KEY_API_TOKEN = 'gemini_api_key'

import { characterService } from '../services/characterService'

export function setupAIHandlers(store: Store): void {
  // 1. Save API Key
  ipcMain.handle('ai:saveKey', async (_, apiKey: string) => {
    store.set(STORE_KEY_API_TOKEN, apiKey)
    return { success: true }
  })

  // 2. Get API Key (to check if it exists)
  ipcMain.handle('ai:getKey', async () => {
    const key = store.get(STORE_KEY_API_TOKEN)
    return key ? (key as string) : null
  })

  // 3. Analyze Scene
  ipcMain.handle('ai:analyzeScene', async (_, text: string) => {
    try {
      const apiKey = store.get(STORE_KEY_API_TOKEN) as string
      if (!apiKey) {
        throw new Error('API Key not found')
      }

      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: SCENE_DATA_JSON_SCHEMA
        }
      })

      const prompt = generateSceneAnalysisPrompt(text)
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      return { success: true, data: JSON.parse(responseText) }
    } catch (error: any) {
      console.error('Gemini API Error:', error)
      return { success: false, message: error.message }
    }
  })

  // 4. Update Characters
  ipcMain.handle('ai:updateCharacter', async (_, payload: { aiResult: any, sceneInfo: any }) => {
    try {
        const { aiResult, sceneInfo } = payload
        const results: any[] = []

        if (aiResult.characters && Array.isArray(aiResult.characters)) {
            for (const char of aiResult.characters) {
                const res = await characterService.upsertCharacter(char.name, char, sceneInfo)
                results.push(res)
            }
        }
        return { success: true, results }
    } catch (error: any) {
        console.error('Character Update Error:', error)
        return { success: false, message: error.message }
    }
  })
}
