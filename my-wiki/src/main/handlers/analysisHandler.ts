import { ipcMain } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import matter from 'gray-matter'
import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * Setup all analysis-related IPC handlers
 */
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
}
