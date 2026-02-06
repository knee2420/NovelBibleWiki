import { ipcMain } from 'electron'
import Store from 'electron-store'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { generateSceneAnalysisPrompt } from '../lib/ai/promptBuilder'
import { SCENE_DATA_JSON_SCHEMA } from '../lib/ai/geminiSchema'
import { characterService } from '../services/characterService'
import path from 'path'
import fs from 'fs/promises'

// Store API Key securely (as much as possible in local)
// We use a specific key for the API token
const STORE_KEY_API_TOKEN = 'gemini_api_key'

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
      
      // [CONFIG] Select Model
      // gemini-2.0-flash is recommended for speed/cost.
      // gemma-3-27b-it is allowed but does NOT support JSON mode.
      const modelName = 'gemma-3-27b-it' 
      
      const isGemma = modelName.includes('gemma')

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: isGemma ? undefined : {
          responseMimeType: 'application/json',
          responseSchema: SCENE_DATA_JSON_SCHEMA
        }
      })

      // 2. Generate Content
      const prompt = generateSceneAnalysisPrompt(text)
      
      // [LOGGING] Save Prompt
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const logDir = path.join(process.cwd(), 'logs/ai')
      await fs.mkdir(logDir, { recursive: true })
      
      await fs.writeFile(path.join(logDir, `prompt_${timestamp}.txt`), prompt, 'utf-8')

      // [Retry Logic]
      let responseText = ''
      let attempt = 0
      const maxRetries = 3
      let lastError: any

      while (attempt < maxRetries) {
        try {
          console.log(`[AI] Attempt ${attempt + 1}/${maxRetries}...`)
          const result = await model.generateContent(prompt)
          const response = await result.response
          responseText = response.text()
          break // Success
        } catch (e: any) {
          lastError = e
          attempt++
          console.error(`[AI] Attempt ${attempt} failed: ${e.message}`)
          
          if (attempt >= maxRetries) break
          
          // Wait before retry (1s, 2s, 4s...)
          const delay = 1000 * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      if (!responseText) {
        throw new Error(`AI Generation failed after ${maxRetries} attempts. Last error: ${lastError?.message}`)
      }
      
      // [LOGGING] Save Raw Response
      await fs.writeFile(path.join(logDir, `response_${timestamp}.json`), responseText, 'utf-8')
      console.log(`[AI Log] Saved prompt/response to ${logDir}`)

      // [Sanitization] Extract JSON from potential Markdown or Chain-of-Thought
      let cleanText = responseText.trim()
      
      // 1. Remove Markdown Code Blocks (```json ... ```)
      if (cleanText.includes('```')) {
          cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '')
      }
      
      // 2. Extract outermost JSON object
      const jsonStartIndex = cleanText.indexOf('{')
      const jsonEndIndex = cleanText.lastIndexOf('}')
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          cleanText = cleanText.substring(jsonStartIndex, jsonEndIndex + 1)
      } else {
          throw new Error('No JSON object found in AI response')
      }

      const aiResult = JSON.parse(cleanText)
      
      return { success: true, data: aiResult }
    } catch (error: any) {
      console.error('Gemini API Error:', error)
      return { success: false, message: error.message }
    }
  })

  // 4. Update Characters
  ipcMain.handle('ai:updateCharacter', async (_, payload: { aiResult: any, sceneInfo: any, decisions?: any[] }) => {
    try {
        const { aiResult, sceneInfo, decisions } = payload
        const results: any[] = []

        if (aiResult.characters && Array.isArray(aiResult.characters)) {
            const updates = aiResult['wiki-data']?.update || []

            for (const charName of aiResult.characters) {
                if (typeof charName !== 'string') continue;

                // Find matching update data to use as AI Data
                const updateInfo = updates.find((u: any) => u.name === charName)
                const aiData = updateInfo?.changes || { role: 'Unknown', desc: 'Auto-generated' }
                
                // User decision
                const decision = decisions?.find((d: any) => d.name === charName)
                
                // [FIX] Only call upsertCharacter if a decision was made or if it's a new character that needs review
                // This prevents unintended creation of factions etc.
                if (decision || !updateInfo) { 
                    const res = await characterService.upsertCharacter(charName, aiData, sceneInfo, decision)
                    results.push(res)
                } else {
                    console.log(`[AI Handler] Skipping character '${charName}' as no decision was made and it's not a new detection.`)
                }
            }
        }
        return { success: true, results }
    } catch (error: any) {
        console.error('Character Update Error:', error)
        return { success: false, message: error.message }
    }
  })
}
