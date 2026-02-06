import { ipcMain } from 'electron'
import Store from 'electron-store'
import { GoogleGenerativeAI, Schema, SchemaType } from '@google/generative-ai'
import { generateSceneAnalysisPrompt } from '../lib/ai/promptBuilder'
import { SCENE_DATA_JSON_SCHEMA } from '../lib/ai/geminiSchema'
import { characterService } from '../services/characterService'
import { SceneFieldConfig, DEFAULT_SCENE_FIELDS, DEFAULT_CHARACTER_FIELDS, CharacterFieldConfig } from '../../shared/types/field-config'
import { SchemaProperty, DEFAULT_ROOT_SCHEMA, DEFAULT_SCHEMAS } from '../../shared/types/schema-config'
import path from 'path'
import fs from 'fs/promises'

// Store Keys
const STORE_KEY_API_TOKEN = 'gemini_api_key'
const STORE_KEY_CUSTOM_INSTRUCTIONS = 'custom_prompt_instructions'
const STORE_KEY_FIELD_CONFIG = 'scene_field_config'
const STORE_KEY_CHAR_FIELD_CONFIG = 'character_field_config'
const STORE_KEY_CUSTOM_SCHEMA = 'custom_scene_schema'
const STORE_KEY_SCHEMA_ROOT_CONFIG = 'schema_root_config'

// Helper to get keys
function getSchemaStoreKeys(target: string = 'scene') {
    if (target === 'scene') {
        return {
            rootKey: STORE_KEY_SCHEMA_ROOT_CONFIG,
            geminiKey: STORE_KEY_CUSTOM_SCHEMA
        }
    }
    return {
        rootKey: `schema_root_config_${target}`,
        geminiKey: `custom_schema_${target}`
    }
}

// ... (rest of imports and helpers)

// ...



// Helper: Convert Recursive Schema Property to Gemini Schema
function convertConfigToGeminiSchema(prop: SchemaProperty): Schema {
    const geminiType = mapTypeToGemini(prop.type)
    
    const base: any = {
        type: geminiType,
        description: prop.description,
        nullable: prop.nullable ?? false
    }

    if (prop.enum) {
        base.enum = prop.enum
        base.format = 'enum'
    }

    if (prop.type === 'object' && prop.properties) {
        base.properties = {}
        base.required = []
        prop.properties.forEach(p => {
             base.properties[p.key] = convertConfigToGeminiSchema(p)
             if (p.nullable === false) base.required.push(p.key)
        })
    }

    if (prop.type === 'array' && prop.items) {
        base.items = convertConfigToGeminiSchema(prop.items)
    }

    return base as Schema
}

function mapTypeToGemini(t: string): SchemaType {
    switch (t) {
        case 'string': return SchemaType.STRING
        case 'number': return SchemaType.NUMBER
        case 'integer': return SchemaType.INTEGER
        case 'boolean': return SchemaType.BOOLEAN
        case 'array': return SchemaType.ARRAY
        case 'object': return SchemaType.OBJECT
        default: return SchemaType.STRING
    }
}

// Helper: Convert Field Config to Gemini JSON Schema
function generateSchemaFromConfig(fields: SceneFieldConfig[]): Schema {
    const properties: Record<string, Schema> = {}
    const required: string[] = ['type', 'chapter', 'scene']

    // Internal Hardcoded Fields (Protocol)
    properties['type'] = { type: SchemaType.STRING, enum: ['scene'], format: 'enum' }
    properties['chapter'] = { type: SchemaType.NUMBER, description: 'Episode/Chapter number' }
    properties['scene'] = { type: SchemaType.NUMBER, description: 'Scene number within the chapter' }

    fields.forEach(f => {
        // Skip protocol fields we already handled manually above if they appear in config
        if (['type', 'chapter', 'scene'].includes(f.key)) {
             if (f.key !== 'type') required.push(f.key)
             return
        }

        required.push(f.key)

        if (f.type === 'json' && f.key === 'wiki-data') {
             // Use the standard graph protocol for wiki-data
             const baseSchema = SCENE_DATA_JSON_SCHEMA as any;
             if (baseSchema.properties && baseSchema.properties['wiki-data']) {
                 properties['wiki-data'] = baseSchema.properties['wiki-data']
             } else {
                 properties['wiki-data'] = { type: SchemaType.OBJECT, properties: {}, description: 'Graph data' } // Fallback
             }
        } else if (f.type === 'array') {
           properties[f.key] = { 
               type: SchemaType.ARRAY, 
               items: { type: SchemaType.STRING },
               description: f.description 
           }
        } else if (f.type === 'number') {
            properties[f.key] = { type: SchemaType.NUMBER, description: f.description }
        } else if (f.type === 'select') {
            properties[f.key] = { 
                type: SchemaType.STRING, 
                enum: f.options || [],
                format: 'enum',
                description: f.description
            }
        } else {
            // Text, Textarea, etc.
            properties[f.key] = { type: SchemaType.STRING, description: f.description }
        }
    })

    return {
        type: SchemaType.OBJECT,
        properties,
        required
    }
}

// Helper: Generate Instructions from Config
function generateInstructionsFromConfig(fields: SceneFieldConfig[]): string {
    const lines = ['# Field Extraction Rules']
    fields.forEach(f => {
        if (f.description && !f.isInternal) {
            lines.push(`- **${f.key}** (${f.label}): ${f.description}`)
        } else if (f.key === 'title') {
             lines.push(`- **title**: Extract the scene title.`)
        }
    })
    return lines.join('\n')
}

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

  // [NEW] DYNAMIC FIELD MANAGEMENT
  ipcMain.handle('ai:saveSceneFieldConfig', async (_, fields: SceneFieldConfig[]) => {
      try {
          // 1. Save Config
          store.set(STORE_KEY_FIELD_CONFIG, fields)

          // 2. Auto-generate & Save Schema
          const newSchema = generateSchemaFromConfig(fields)
          store.set(STORE_KEY_CUSTOM_SCHEMA, newSchema)

          // 3. Auto-generate & Save Instructions
          const newInstructions = generateInstructionsFromConfig(fields)
          store.set(STORE_KEY_CUSTOM_INSTRUCTIONS, newInstructions)

          return { success: true }
      } catch (e: any) {
          console.error(e)
          return { success: false, message: e.message }
      }
  })

  ipcMain.handle('ai:saveCharacterFieldConfig', async (_, fields: CharacterFieldConfig[]) => {
      try {
          store.set(STORE_KEY_CHAR_FIELD_CONFIG, fields)
          return { success: true }
      } catch (e: any) {
          return { success: false, message: e.message }
      }
  })

  ipcMain.handle('ai:getFieldConfig', async () => {
      const sceneConfig = (store.get(STORE_KEY_FIELD_CONFIG) as SceneFieldConfig[]) || DEFAULT_SCENE_FIELDS
      const charConfig = (store.get(STORE_KEY_CHAR_FIELD_CONFIG) as CharacterFieldConfig[]) || DEFAULT_CHARACTER_FIELDS
      
      return {
          scene: sceneConfig,
          character: charConfig
      }
  })

  // Legacy/Advanced Schema Management
  ipcMain.handle('ai:saveSchema', async (_, schemaStr: string) => {
    try {
        const json = JSON.parse(schemaStr)
        store.set(STORE_KEY_CUSTOM_SCHEMA, json)
        return { success: true }
    } catch (e: any) {
        return { success: false, message: 'Invalid JSON format' }
    }
  })

  ipcMain.handle('ai:getSchema', async () => {
      return store.get(STORE_KEY_CUSTOM_SCHEMA) || SCENE_DATA_JSON_SCHEMA
  })

  ipcMain.handle('ai:saveInstructions', async (_, instructions: string) => {
      store.set(STORE_KEY_CUSTOM_INSTRUCTIONS, instructions)
      return { success: true }
  })

  ipcMain.handle('ai:getInstructions', async () => {
      return store.get(STORE_KEY_CUSTOM_INSTRUCTIONS) || ''
  })
  
  ipcMain.handle('ai:resetSettings', async () => {
      store.delete(STORE_KEY_CUSTOM_SCHEMA)
      store.delete(STORE_KEY_CUSTOM_INSTRUCTIONS)
      store.delete(STORE_KEY_FIELD_CONFIG)
      store.delete(STORE_KEY_SCHEMA_ROOT_CONFIG)
      return { success: true }
  })

  // [NEW] Recursive Schema Handlers (Multi-Target) - Moved inside setupAIHandlers
  ipcMain.handle('ai:saveSchemaConfig', async (_, { root, target }: { root: SchemaProperty, target?: string }) => {
      try {
          const t = target || 'scene'
          const { rootKey, geminiKey } = getSchemaStoreKeys(t)

          // 1. Save UI State
          store.set(rootKey, root)
          
          // 2. Generate and Save Gemini Schema
          const geminiSchema = convertConfigToGeminiSchema(root)
          store.set(geminiKey, geminiSchema)
          
          return { success: true }
      } catch (e: any) {
          console.error(e)
          return { success: false, message: e.message }
      }
  })

  ipcMain.handle('ai:getSchemaConfig', async (_, target?: string) => {
      const t = target || 'scene'
      const { rootKey } = getSchemaStoreKeys(t)
      
      const saved = store.get(rootKey)
      if (saved) return saved

      // Return default if not found
      return DEFAULT_SCHEMAS[t] || DEFAULT_SCHEMAS.scene
  })


  // 3. Analyze Scene
  ipcMain.handle('ai:analyzeScene', async (_, text: string) => {
    try {
      const apiKey = store.get(STORE_KEY_API_TOKEN) as string
      if (!apiKey) {
        throw new Error('API Key not found')
      }

      // [CONFIG] Load Custom Settings
      const customSchema = store.get(STORE_KEY_CUSTOM_SCHEMA)
      const customInstructions = store.get(STORE_KEY_CUSTOM_INSTRUCTIONS) as string
      
      const effectiveSchema = (customSchema || SCENE_DATA_JSON_SCHEMA) as Schema

      const genAI = new GoogleGenerativeAI(apiKey)
      
      const modelName = 'gemma-3-27b-it' 
      const isGemma = modelName.includes('gemma')

      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: isGemma ? undefined : {
          responseMimeType: 'application/json',
          responseSchema: effectiveSchema 
        }
      })

      // 2. Generate Content
      const prompt = generateSceneAnalysisPrompt(text, effectiveSchema, customInstructions)
      
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

      let cleanText = responseText.trim()
      
      if (cleanText.includes('```')) {
          cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '')
      }
      
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
