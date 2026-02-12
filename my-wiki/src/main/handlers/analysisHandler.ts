import { ipcMain } from 'electron'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs-extra'
import path from 'path'
import matter from 'gray-matter'

export function setupAnalysisHandlers(store?: any) {
  /**
   * Load all available analysis schemas by category
   */
  ipcMain.handle('load-analysis-schemas', async (_, category: string = 'Characters') => {
    try {
      const projectPath = store?.get('vaultPath') as string
      if (!projectPath) {
        return { success: false, message: 'No project selected' }
      }

      // Map category to directory
      const categoryMap: Record<string, string> = {
        'Characters': '1.Characters/캐릭터 엔진 스키마',
        'Items': '2.Items/아이템 엔진 스키마',
        'Factions': '3.Factions/세력 엔진 스키마'
      }

      const categoryDir = categoryMap[category] || categoryMap['Characters']
      const schemaPath = path.join(projectPath, '77_Prompt_Library', categoryDir)

      // If directory doesn't exist, return empty array
      if (!fs.existsSync(schemaPath)) {
        console.log(`[Schema] Directory not found: ${schemaPath}`)
        return { success: true, schemas: [] }
      }

      const files = fs.readdirSync(schemaPath)
      const schemas = files
        .filter(file => file.endsWith('.md'))
        .map(file => {
          const filePath = path.join(schemaPath, file)
          const fileContent = fs.readFileSync(filePath, 'utf-8')
          const { data, content } = matter(fileContent)

          const schemaId = file.replace('.md', '')
          return {
            id: schemaId,
            name: schemaId,
            path: filePath,
            frontmatter: data,
            content
          }
        })

      return { success: true, schemas }
    } catch (error) {
      console.error('Failed to load schemas:', error)
      return { success: false, message: String(error), schemas: [] }
    }
  })

  /**
   * Save/Update schema file
   */
  ipcMain.handle('save-analysis-schema', async (_, schemaPath: string, content: string) => {
    try {
      if (!fs.existsSync(schemaPath)) {
        return { success: false, error: 'Schema file not found' }
      }

      fs.writeFileSync(schemaPath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      console.error('Failed to save schema:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Delete schema file
   */
  ipcMain.handle('delete-analysis-schema', async (_, schemaPath: string) => {
    try {
      if (!fs.existsSync(schemaPath)) {
        return { success: false, error: 'Schema file not found' }
      }

      fs.unlinkSync(schemaPath)
      return { success: true }
    } catch (error) {
      console.error('Failed to delete schema:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Create new schema file
   */
  ipcMain.handle('create-analysis-schema', async (_, schemaName: string, category: string = 'Characters') => {
    try {
      const projectPath = store?.get('vaultPath') as string
      if (!projectPath) {
        return { success: false, error: 'No project selected' }
      }

      // Determine directory based on category
      const categoryPath = category === 'Characters' ? '1.Characters' : category
      const schemaDir = path.join(projectPath, `77_Prompt_Library/${categoryPath}/캐릭터 엔진 스키마`)

      // Ensure directory exists
      if (!fs.existsSync(schemaDir)) {
        fs.mkdirSync(schemaDir, { recursive: true })
      }

      const filePath = path.join(schemaDir, `${schemaName}.md`)

      // Check if file already exists
      if (fs.existsSync(filePath)) {
        return { success: false, error: '같은 이름의 스키마가 이미 존재합니다.' }
      }

      // Create default schema content
      const defaultContent = `---
analysis_module: "${schemaName} 분석"
target_character: "분석 대상 캐릭터"
context_scope: "전체 씬"
analysis_persona: "심리학자/분석가"
definitions:
  key1: "정의 1"
  key2: "정의 2"
output_requirements:
  format: "JSON"
  language: "한국어"
  tone: "객관적이고 분석적인 어조"
schema_structure:
  field1:
    type: string
    description: "필드 설명"
---

# ${schemaName} 분석 프롬프트

여기에 AI 프롬프트 내용을 작성하세요.
`

      fs.writeFileSync(filePath, defaultContent, 'utf-8')

      return { success: true, path: filePath }
    } catch (error) {
      console.error('Failed to create schema:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Parse frontmatter and content from raw markdown
   */
  ipcMain.handle('parse-analysis-schema', async (_, rawContent: string) => {
    try {
      const { data, content } = matter(rawContent)
      return { success: true, frontmatter: data, content }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  /**
   * Stringify frontmatter and content into raw markdown
   */
  ipcMain.handle('stringify-analysis-schema', async (_, frontmatter: any, content: string) => {
    try {
      const raw = matter.stringify(content, frontmatter)
      return { success: true, raw }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  })

  /**
   * Get scenes where a character appears
   */
  ipcMain.handle('get-character-scenes', async (_, characterName: string, aliases: string[] = []) => {
    try {
      const projectPath = store?.get('vaultPath') as string
      if (!projectPath) {
        return { success: false, error: 'No project selected' }
      }

      const plotPath = path.join(projectPath, '10_Plot')
      if (!fs.existsSync(plotPath)) {
        return { success: false, error: 'Plot directory not found', scenes: [] }
      }

      const scenes: any[] = []
      const allNames = [characterName, ...aliases].map(n => n.toLowerCase())

      // Recursively scan plot directory
      function scanDirectory(dir: string, actTitle = '', chapterTitle = '') {
        const items = fs.readdirSync(dir)

        for (const item of items) {
          const itemPath = path.join(dir, item)
          const stat = fs.statSync(itemPath)

          if (stat.isDirectory()) {
            // Extract act or chapter title from folder name
            const match = item.match(/^(\d+)_(.+)$/)
            const title = match ? match[2] : item

            if (item.includes('막') || item.includes('Act')) {
              scanDirectory(itemPath, title, '')
            } else if (item.includes('화') || item.includes('Chapter')) {
              scanDirectory(itemPath, actTitle, title)
            } else {
              scanDirectory(itemPath, actTitle, chapterTitle)
            }
          } else if (item.endsWith('.md')) {
            // Parse scene file
            const content = fs.readFileSync(itemPath, 'utf-8')
            const { data } = matter(content)

            // Check if character appears in this scene
            const wikiData = data['wiki-data'] || {}
            const appearList = (wikiData.appear || []) as string[]

            const appearsInScene = appearList.some(name =>
              allNames.some(charName => name.toLowerCase().includes(charName))
            )

            if (appearsInScene) {
              const match = item.match(/^(\d+)_/)
              const sceneNumber = match ? parseInt(match[1]) : 0

              scenes.push({
                id: itemPath,
                fileName: item,
                chapterNumber: data.chapter || 0, // Extract from frontmatter
                sceneNumber: data.scene || sceneNumber, // Use frontmatter first, fallback to filename
                title: data.title || item.replace('.md', ''),
                summary: data.summary || '',
                actTitle,
                chapterTitle
              })
            }
          }
        }
      }

      scanDirectory(plotPath)

      // Sort by chapter number, then scene number
      scenes.sort((a, b) => {
        if (a.chapterNumber !== b.chapterNumber) {
          return a.chapterNumber - b.chapterNumber
        }
        return a.sceneNumber - b.sceneNumber
      })

      return { success: true, scenes }
    } catch (error) {
      console.error('Failed to get character scenes:', error)
      return { success: false, error: String(error), scenes: [] }
    }
  })

  /**
   * Get detailed scene content for analysis
   */
  ipcMain.handle('get-scene-details', async (_, sceneIds: string[]) => {
    try {
      const scenes = sceneIds.map(sceneId => {
        if (!fs.existsSync(sceneId)) {
          return null
        }

        const content = fs.readFileSync(sceneId, 'utf-8')
        const { data, content: body } = matter(content)

        return {
          id: sceneId,
          title: data.title || '',
          summary: data.summary || '',
          content: body
        }
      }).filter(Boolean)

      return { success: true, scenes }
    } catch (error) {
      console.error('Failed to get scene details:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Execute AI analysis for character
   */
  ipcMain.handle('analyze-character-with-ai', async (_, { prompt }) => {
    try {
      const apiKey = store?.get('gemini_api_key') as string
      if (!apiKey) {
        return { success: false, error: 'Gemini API key not configured. Please set it in Settings.' }
      }

      // Use the selected model, default to flash for character analysis
      const selectedModel = (store?.get('ai_model_selection') as string) || 'gemini-1.5-flash'
      const modelName = selectedModel.toLowerCase()
      const isGemma = modelName.includes('gemma')
      
      // Gemma models don't support JSON mode, so we disable it
      const genAI = new GoogleGenerativeAI(apiKey)
      
      const model = genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: isGemma ? {} : {
          responseMimeType: 'application/json'
        }
      })

      // [LOGGING] Setup log directory
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const logDir = path.join(process.cwd(), 'logs/analysis')
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }

      // [LOGGING] Save Prompt
      fs.writeFileSync(path.join(logDir, `prompt_${timestamp}.txt`), prompt, 'utf-8')

      // Retry logic
      let responseText = ''
      let attempt = 0
      const maxRetries = 3
      let lastError: any

      while (attempt < maxRetries) {
        try {
          console.log(`[Character Analysis] Attempt ${attempt + 1}/${maxRetries}...`)
          const result = await model.generateContent(prompt)
          const response = await result.response
          responseText = response.text()
          
          // Track usage stats
          const usage = response.usageMetadata
          if (usage) {
            try {
              const today = new Date().toISOString().split('T')[0]
              const stats = (store?.get('ai_usage_stats_daily') as any) || {}
              
              if (!stats[today]) stats[today] = {}
              if (!stats[today][selectedModel]) {
                stats[today][selectedModel] = { requests: 0, tokens: 0 }
              }
              
              stats[today][selectedModel].requests += 1
              stats[today][selectedModel].tokens += (usage.totalTokenCount || 0)
              
              store?.set('ai_usage_stats_daily', stats)
            } catch (e) {
              console.error('[AI] Failed to update usage stats', e)
            }
          }
          
          break // Success
        } catch (e: any) {
          lastError = e
          attempt++
          console.error(`[Character Analysis] Attempt ${attempt} failed: ${e.message}`)
          
          if (attempt >= maxRetries) break
          
          // Exponential backoff
          const delay = 1000 * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      if (!responseText) {
        throw new Error(`AI analysis failed after ${maxRetries} attempts. Last error: ${lastError?.message}`)
      }

      // [LOGGING] Save Raw Response
      fs.writeFileSync(path.join(logDir, `response_${timestamp}.json`), responseText, 'utf-8')
      console.log(`[Analysis Log] Saved prompt/response to ${logDir}`)

      return { success: true, response: responseText }
    } catch (error) {
      console.error('AI analysis failed:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Get character's analysis topics from separate files in character_engine folder
   */
  ipcMain.handle('get-character-analysis-topics', async (_, characterId: string) => {
    try {
      if (!fs.existsSync(characterId)) {
        return { success: false, error: 'Character file not found', topics: [] }
      }

      const characterDir = path.dirname(characterId)
      const characterName = path.basename(characterId).replace('.md', '')
      const engineDir = path.join(characterDir, 'character_engine')

      if (!fs.existsSync(engineDir)) {
        return { success: true, topics: [] }
      }

      // Find all files starting with {characterName}_ in engineDir
      const files = fs.readdirSync(engineDir)
      const topics = files
        .filter(file => file.startsWith(`${characterName}_`) && file.endsWith('.md'))
        .map(file => {
          try {
            const filePath = path.join(engineDir, file)
            const content = fs.readFileSync(filePath, 'utf-8')
            const { data } = matter(content)
            
            // Handle both legacy (mindset_analysis array) and simple format
            let entries: any[] = []
            if (Array.isArray(data.mindset_analysis)) {
              entries = data.mindset_analysis
            } else if (data.id && data.data) {
              entries = [data]
            }
            
            return entries
              .map((t: any) => ({
                ...t,
                filePath // Essential for updates/deletion
              }))
          } catch (e) {
            console.error(`Error parsing analysis file ${file}:`, e)
            return []
          }
        })
        .flat()
        .filter(t => t.id && t.data) // Safety filter: must be a valid topic

      return { success: true, topics }
    } catch (error) {
      console.error('Failed to load analysis topics from files:', error)
      return { success: false, error: String(error), topics: [] }
    }
  })

  /**
   * Save analysis topic to a separate file in character_engine folder
   */
  ipcMain.handle('save-character-analysis', async (_, characterId: string, topic: any) => {
    try {
      if (!fs.existsSync(characterId)) {
        return { success: false, error: 'Character file not found' }
      }

      const characterDir = path.dirname(characterId)
      const characterName = path.basename(characterId).replace('.md', '')
      const engineDir = path.join(characterDir, 'character_engine')

      // Ensure directory exists
      if (!fs.existsSync(engineDir)) {
        fs.mkdirSync(engineDir, { recursive: true })
      }

      // Filename format: {character_name}_{schema_name}.md
      const safeSchemaName = topic.schemaName.replace(/[\\/:"*?<>|]/g, '_')
      const targetFilePath = path.join(engineDir, `${characterName}_${safeSchemaName}.md`)

      // If file exists, we might want to append or update.
      // For now, let's treat each run as an entry in the 'mindset_analysis' array within that file.
      let existingTopics: any[] = []
      let bodyContent = `# ${characterName} - ${topic.schemaName} 분석 기록\n\n이 파일은 AI 엔진에 의해 자동으로 생성되었습니다.`

      if (fs.existsSync(targetFilePath)) {
        const fileContent = fs.readFileSync(targetFilePath, 'utf-8')
        const parsed = matter(fileContent)
        existingTopics = parsed.data.mindset_analysis || []
        bodyContent = parsed.content
      }

      // Add character_id metadata for linking
      const topicWithLink = { ...topic, character_id: characterId }
      existingTopics.push(topicWithLink)

      const updatedContent = matter.stringify(bodyContent, {
        character_name: characterName,
        schema_name: topic.schemaName,
        last_updated: new Date().toISOString(),
        mindset_analysis: existingTopics
      })

      fs.writeFileSync(targetFilePath, updatedContent, 'utf-8')

      return { success: true }
    } catch (error) {
      console.error('Failed to save analysis to file:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Update existing analysis topic (find in external file)
   */
  ipcMain.handle('update-character-analysis', async (_, _characterId: string, updatedTopic: any) => {
    try {
      const filePath = updatedTopic.filePath
      if (!filePath || !fs.existsSync(filePath)) {
        return { success: false, error: 'Target analysis file not found' }
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8')
      const { data, content: body } = matter(fileContent)
      const topics = data.mindset_analysis || []

      const index = topics.findIndex((t: any) => t.id === updatedTopic.id)
      if (index !== -1) {
        topics[index] = { ...updatedTopic, updatedAt: new Date().toISOString() }
      }

      data.mindset_analysis = topics
      const updatedContent = matter.stringify(body, data)
      fs.writeFileSync(filePath, updatedContent, 'utf-8')

      return { success: true }
    } catch (error) {
      console.error('Failed to update external analysis file:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Delete analysis topic from external file
   */
  ipcMain.handle('delete-character-analysis', async (_, characterId: string, topicId: string) => {
    try {
      // Since we don't have the filename directly in the UI for deletion easily, 
      // we need to scan the character_engine directory for the topic with the ID.
      const characterDir = path.dirname(characterId)
      const characterName = path.basename(characterId).replace('.md', '')
      const engineDir = path.join(characterDir, 'character_engine')

      if (!fs.existsSync(engineDir)) return { success: true }

      const files = fs.readdirSync(engineDir)
      for (const file of files) {
        if (!file.startsWith(`${characterName}_`)) continue
        
        const filePath = path.join(engineDir, file)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const { data, content: body } = matter(fileContent)
        const topics = data.mindset_analysis || []

        const originalCount = topics.length
        const filteredTopics = topics.filter((t: any) => t.id !== topicId)

        if (filteredTopics.length !== originalCount) {
          if (filteredTopics.length === 0) {
            // Delete the file if it's now empty
            fs.unlinkSync(filePath)
          } else {
            data.mindset_analysis = filteredTopics
            const updatedContent = matter.stringify(body, data)
            fs.writeFileSync(filePath, updatedContent, 'utf-8')
          }
          return { success: true }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to delete analysis from file:', error)
      return { success: false, error: String(error) }
    }
  })
  /**
   * Generate or Refine Analysis Schema Draft using AI
   */
  ipcMain.handle('generate-analysis-schema-draft', async (_, { topic, currentDraft, feedback }: { topic: string, currentDraft?: string, feedback?: string }) => {
    try {
      const apiKey = store?.get('gemini_api_key') as string
      if (!apiKey) {
        return { success: false, error: 'Gemini API key not configured.' }
      }

      // Use the selected model
      const selectedModel = (store?.get('ai_model_selection') as string) || 'gemini-1.5-flash'
      const modelName = selectedModel.toLowerCase()
      const isGemma = modelName.includes('gemma')
      
      const genAI = new GoogleGenerativeAI(apiKey)
      
      const model = genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: isGemma ? {} : {
          responseMimeType: 'text/plain' // We want markdown text, not JSON
        }
      })

      let prompt = ''
      
      if (!currentDraft) {
        // Initial Generation
        prompt = `
You are an expert Narrative Architect and System Engineer.
Your task is to design a high-quality "Character Analysis Schema" for a database system based on the user's requested topic.

TOPIC: "${topic}"

The schema must follow this exact YAML Frontmatter + Markdown format.
DO NOT deviate from this structure. Each section is mandatory.

---
analysis_module: (snake_case_name)
target_character: "{character_name}"
context_scope: "{selected_scenes_or_entire_script}"
analysis_persona: (Role)
output_requirements:
  format: JSON
  language: Korean
  tone: Analytical
definitions:
  (key): (value)
schema_structure:
  field_name:
    type: string
    description: "Description"
---

# System Instruction

(Write the system instruction here)

IMPORTANT CONSTRAINTS:
1. Start immediately with '---'. Do not write "Here is the schema".
2. Ensure 'schema_structure' is valid YAML nested under the frontmatter.
3. Do NOT use markdown code blocks (like \`\`\`yaml). Return raw text.
4. Indentation is critical in YAML. use 2 spaces.
`
      } else {
        // Refinement
        prompt = `
You are refining a "Character Analysis Schema".

CURRENT DRAFT:
${currentDraft}

USER FEEDBACK / REQUEST:
"${feedback}"

INSTRUCTIONS:
1. Modify the Current Draft according to the User Feedback.
2. Keep the valid YAML Frontmatter + Markdown structure.
3. If the user asks to "Fix" or "Lock" certain parts, do not change them (implied by context).
4. Return the FULL updated content (YAML + Markdown).
5. Return ONLY the content. No wrapping code blocks.
`
      }

      console.log('[Schema Wizard] Generating draft for:', topic)
      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text()
      
      // Clean up markdown blocks if present
      if (text.startsWith('```markdown')) text = text.replace(/^```markdown\s*/, '').replace(/\s*```$/, '')
      if (text.startsWith('```yaml')) text = text.replace(/^```yaml\s*/, '').replace(/\s*```$/, '')
      if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')

      return { success: true, draft: text.trim() }

    } catch (error) {
      console.error('Failed to generate schema draft:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Generate Single Field for Schema
   */
  ipcMain.handle('generate-analysis-schema-field', async (_, { currentDraft, feedback }: { currentDraft: string, feedback: string }) => {
    try {
      const apiKey = store?.get('gemini_api_key') as string
      if (!apiKey) {
        return { success: false, error: 'Gemini API key not configured.' }
      }

      const selectedModel = (store?.get('ai_model_selection') as string) || 'gemini-1.5-flash'
      const modelName = selectedModel.toLowerCase()
      const isGemma = modelName.includes('gemma')
      
      const genAI = new GoogleGenerativeAI(apiKey)
      
      const model = genAI.getGenerativeModel({
        model: selectedModel,
        generationConfig: isGemma ? {} : {
          responseMimeType: 'text/plain'
        }
      })

      const prompt = `
You are an expert Narrative Architect helper.
Your task is to generate ONE SINGLE new field definition for a "Character Analysis Schema" in YAML format.

CURRENT DRAFT CONTEXT:
${currentDraft}

USER REQUEST:
"${feedback}"

INSTRUCTIONS:
1. Analyze the Current Draft to understand the context and style.
2. Generate a NEW field that complements the existing ones. Do NOT duplicate existing fields.
3. Return ONLY the YAML definition for that single field.
   Example format:
   new_field_name:
     type: string
     description: "Description in Korean"

4. Do NOT include "schema_structure:" header. Just the field key and its properties.
5. Do NOT include markdown code blocks.
`

      console.log('[Schema Wizard] Generating single field...')
      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text()
      
      if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')

      return { success: true, fieldYaml: text.trim() }

    } catch (error) {
      console.error('Failed to generate schema field:', error)
      return { success: false, error: String(error) }
    }
  })

  /**
   * Regenerate Specific Section
   */
  ipcMain.handle('regenerate-analysis-schema-section', async (_, { section, currentContent, lockedItems }: { section: string, currentContent: string, lockedItems?: string[] }) => {
    try {
      const apiKey = store?.get('gemini_api_key') as string
      if (!apiKey) {
        return { success: false, error: 'Gemini API key not configured.' }
      }

      const selectedModel = (store?.get('ai_model_selection') as string) || 'gemini-1.5-flash'
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: selectedModel })

      const prompt = `
You are an expert Narrative Architect acting as a creative schema editor.
Your task is to REGENERATE the content of a specific section.

SECTION TYPE: "${section}"

CURRENT CONTENT (YAML/Markdown):
${currentContent}

Locked Fields (Keys that MUST NOT change): [${lockedItems?.join(', ') || 'None'}]

INSTRUCTIONS:
1. **LOCKED FIELDS**: For any key listed in "Locked Fields", you MUST copy its definition (type, description, sub-fields) EXACTLY as it appears in CURRENT CONTENT. Word-for-word.
2. **UNLOCKED FIELDS**: For fields NOT listed in "Locked Fields", you MUST CHANGE AND IMPROVE THEM.
   - Do NOT just keep them the same.
   - Make the descriptions more specific to the genre or topic.
   - Add new psychological depth or analytical nuances.
   - You MAY rename them slightly if it makes the analysis sharper (e.g., change 'fear' to 'core_trauma_response').
3. **NO ZOMBIE FIELDS**: Do NOT add back fields that are missing from the input.
4. **NO DELETIONS**: Do NOT remove fields that are currently present.
5. **CREATIVITY**: Be bold with the unlocked fields. The user wants to see a DIFFERENT perspective on them.

Output ONLY the raw content (YAML or Markdown body). No code blocks.
`
      console.log(`[Schema Wizard] Regenerating section: ${section} (Locked: ${lockedItems?.length || 0})`)
      const result = await model.generateContent(prompt)
      const response = await result.response
      let text = response.text()

      // Cleanup
      if (text.startsWith('```yaml')) text = text.replace(/^```yaml\s*/, '').replace(/\s*```$/, '')
      if (text.startsWith('```markdown')) text = text.replace(/^```markdown\s*/, '').replace(/\s*```$/, '')
      if (text.startsWith('```')) text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')

      return { success: true, content: text.trim() }

    } catch (error) {
       console.error('Failed to regenerate section:', error)
       return { success: false, error: String(error) }
    }
  })
  /**
   * GenUI: Interactive Schema Agent
   * Uses Function Calling to propose specific UI actions
   */
  ipcMain.handle('interact-schema-agent', async (_, { currentDraft, userMessage, history }: { currentDraft: string, userMessage: string, history: any[] }) => {
    try {
      const apiKey = store?.get('gemini_api_key') as string
      if (!apiKey) return { success: false, error: 'Gemini API key not configured.' }

      const selectedModel = (store?.get('ai_model_selection') as string) || 'gemini-2.5-flash'
      const genAI = new GoogleGenerativeAI(apiKey)

      // Define Tools
      const tools = [{
        functionDeclarations: [
          {
            name: "propose_new_field",
            description: "Propose adding a new field to the schema. Use this when the user asks to add a field or when you suggest a missing aspect.",
            parameters: {
              type: "OBJECT" as any,
              properties: {
                key: { type: "STRING", description: "The field key (snake_case, english)" },
                type: { type: "STRING", description: "The data type (string, list<string>, list<object>)" },
                description: { type: "STRING", description: "Detailed description in Korean" },
                reason: { type: "STRING", description: "Why this field is relevant" }
              },
              required: ["key", "type", "description"]
            }
          }
        ]
      }]

      const model = genAI.getGenerativeModel({ 
        model: selectedModel,
        tools: tools as any
      })

      const chat = model.startChat({
        history: history.map(h => ({
           role: h.role === 'client' ? 'user' : 'model',
           parts: [{ text: h.content }] 
        }))
      })

      const systemPrompt = `
You are an intelligent Schema Architect.
You help the user refine their Character Analysis Schema.

Current Schema Draft:
${currentDraft}

User Request: "${userMessage}"

INSTRUCTIONS:
1. Understanding: Analyze the user's request. Do they want to ADD something, REMOVE something, or CHANGE something?
2. Action:
   - If User wants to ADD a field: You MUST use the 'propose_new_field' tool. Do NOT just say "I can add it". Call the tool.
   - If User wants to change/remove: Reply with text explaining you will do it (the frontend handles text commands via another path for now, but you can guide them).
   - If User asks a question: Answer efficiently.

CONSTRAINT:
- When calling 'propose_new_field', ensure the 'key' is in English snake_case (e.g., 'hidden_trauma').
- The 'description' must be in Korean and very detailed/analytical.
- The 'type' should be 'string' (for detailed text) or 'list<string>' (for keywords) or 'list<object>' (for complex items).
`

      const result = await chat.sendMessage(systemPrompt)
      const response = await result.response
      
      // Check for function calls
      const calls = response.functionCalls()
      if (calls && calls.length > 0) {
          const call = calls[0]
          return { 
              success: true, 
              type: 'tool_call', 
              toolName: call.name, 
              args: call.args 
          }
      }

      return { success: true, type: 'text', content: response.text() }

    } catch (error) {
       console.error('Schema Agent Error:', error)
       return { success: false, error: String(error) }
    }
  })
  /**
   * GenUI: Scene Writer Agent
   * Agentic AI that helps write scene content with context awareness
   */
  ipcMain.handle('interact-scene-writer-agent', async (_, { currentContent, userMessage, history, context }: { currentContent: string, userMessage: string, history: any[], context: any }) => {
    try {
      const apiKey = store?.get('gemini_api_key') as string
      if (!apiKey) return { success: false, error: 'Gemini API key not configured.' }

      const selectedModel = (store?.get('ai_model_selection') as string) || 'gemini-1.5-flash'
      const genAI = new GoogleGenerativeAI(apiKey)

      // Define Tools
      const tools = [{
        functionDeclarations: [
          {
            name: "read_previous_scenes",
            description: "Read summaries of previous scenes to understand context.",
            parameters: {
              type: "OBJECT" as any,
              properties: {
                count: { type: "NUMBER", description: "Number of previous scenes to read (max 5)" }
              },
              required: ["count"]
            }
          },
          {
            name: "get_character_info",
            description: "Get detailed information about specific characters from the Wiki.",
            parameters: {
              type: "OBJECT" as any,
              properties: {
                names: { 
                  type: "ARRAY", 
                  items: { type: "STRING" },
                  description: "List of character names to lookup" 
                }
              },
              required: ["names"]
            }
          },
          {
            name: "propose_plot_options",
            description: "Propose 3 distinct plot directions for the user to choose from. (GenUI)",
            parameters: {
              type: "OBJECT" as any,
              properties: {
                options: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING" },
                      description: { type: "STRING" },
                      tone: { type: "STRING" }
                    },
                    required: ["title", "description", "tone"]
                  },
                  description: "List of 3 plot options"
                }
              },
              required: ["options"]
            }
          },
          {
            name: "write_scene_content",
            description: "Generate the actual scene text based on an outline.",
            parameters: {
              type: "OBJECT" as any,
              properties: {
                outline: { type: "STRING", description: "The agreed outline or plot direction" },
                focus: { type: "STRING", description: "Specific focus (e.g., dialogue, action, emotion)" },
                tone: { type: "STRING" }
              },
              required: ["outline"]
            }
          }
        ]
      }]

      // Mock Handler Logic for V1 Demo
      // In a real implementation, this would involve a complex ReAct loop.
      // For now, we simulate the 'Thinking' process by checking if the user request implies a tool needs to be called.
      // Since Gemini handles tool selection, we let it decide.
      
      const model = genAI.getGenerativeModel({ 
        model: selectedModel,
        tools: tools as any
      })

      // Sanitize History for Gemini (Must start with 'user')
      let mappedHistory = history.map(h => ({
           role: h.role === 'client' ? 'user' : 'model',
           parts: h.tool_response ? [{ functionResponse: h.tool_response }] : (h.tool_call ? [{ functionCall: h.tool_call }] : [{ text: h.content }])
      }))

      // Remove leading 'model' messages (e.g. initial greeting)
      while (mappedHistory.length > 0 && mappedHistory[0].role === 'model') {
          mappedHistory.shift()
      }

      const chat = model.startChat({
        history: mappedHistory
      })

      // Initial context injection if new chat OR just a continuation
      // We always append critical context to the latest message to ensure "Vibe"
      
      const contextPrompt = `
Context: Scene #${context.scene}, Chapter #${context.chapter}
Current Draft Length: ${currentContent.length} chars
Existing Draft Preview: "${currentContent.substring(0, 300)}..."

User Request: "${userMessage}"

SYSTEM INSTRUCTIONS:
You are an "Agentic Creative Writing Assistant" (Vibe Mode) for a Korean Web Novel.
Your goal is to actively help the user write, not just chat.

PROTOCOL:
1. **ANALYZE**: If the user's request is vague (e.g., "What should I write?"), YOU MUST first check context.
   - Call 'read_previous_scenes' to see what happened before.
   - Call 'get_character_info' if key characters are mentioned but unknown.
2. **PROPOSE**: Once you have context, use 'propose_plot_options' to give 3 distinct choices.
3. **DRAFT**: If the user chose an option, use 'write_scene_content'.

CRITICAL RULES:
- **ALWAYS SPEAK IN KOREAN.** (Unless the user writes in English, but even then prefer Korean).
- When using 'propose_plot_options' or 'write_scene_content', the content within the tools MUST be in Korean.
- ACT like a pro editor who looks up files before speaking.
`
      
      let msg = contextPrompt
      if (mappedHistory.length > 0) {
          // If history exists, we just send the user message but with invisible context appended?
          // Or just send the user message? 
          // Better to reinforce the instruction.
          msg = userMessage + `\n\n[SYSTEM: Remember to use tools! 'read_previous_scenes' or 'propose_plot_options' are recommended if you lack context.]`
      } else {
          // First turn
          msg = contextPrompt
      }

      const result = await chat.sendMessage(msg)
      const response = await result.response
      
      const calls = response.functionCalls()
      
      if (calls && calls.length > 0) {
          const call = calls[0]
          
          // Case 1: UI Interaction (Proposal) -> Return to Frontend
          if (call.name === 'propose_plot_options' || call.name === 'write_scene_content') {
               return { 
                  success: true, 
                  type: 'tool_call', 
                  toolName: call.name, 
                  args: call.args 
              }
          }

          // Case 2: Data Retrieval -> Execute & Loop (Simplified for Demo)
          // Since we can't do full loop easily without risking timeout in this single turn,
          // for this V1 'Vibe' demo, if the model calls a Read tool, we will just return a text response describing what it found (Mock).
          // OR, we can just return the tool call to frontend, and let frontend show "Agent is searching..." and loop back.
          // Let's return the tool call so frontend can visualize "Agent is thinking/reading...".
          return { 
              success: true, 
              type: 'tool_call', // Treat all as tool calls for visualization
              toolName: call.name, 
              args: call.args 
          }
      }

      return { success: true, type: 'text', content: response.text() }

    } catch (error) {
       console.error('Writer Agent Error:', error)
       return { success: false, error: String(error) }
    }
  })
}
