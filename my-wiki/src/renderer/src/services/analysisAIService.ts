// AI Analysis Service - Handles AI-powered character analysis
import { AnalysisSchema, CharacterAnalysisTopic } from '../types/analysis-schema'
import { WikiEntry } from '../types/wiki'
import { buildAnalysisPrompt } from './schemaService'

interface AnalysisRequest {
  schema: AnalysisSchema
  character: WikiEntry
  scenes: Array<{ id: string; title: string; summary: string; content: string }>
}

/**
 * Execute AI-powered character analysis
 */
export async function analyzeCharacter(
  request: AnalysisRequest
): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
  try {
    // Build the analysis prompt
    const prompt = buildAnalysisPrompt(request.schema, request.character, request.scenes)

    // Call AI service via IPC
    // @ts-ignore
    const result = await window.api.analyzeCharacterWithAI({
      prompt,
      schemaId: request.schema.id,
      characterId: request.character.id,
      sceneIds: request.scenes.map(s => s.id)
    })

    if (!result.success) {
      return { success: false, error: result.error || 'AI 분석 실패' }
    }

    // Parse the AI response
    const analysisData = parseAIResponse(result.response)

    return { success: true, data: analysisData }
  } catch (error) {
    console.error('Analysis error:', error)
    return { success: false, error: String(error) }
  }
}

/**
 * Parse AI response and extract structured data
 */
function parseAIResponse(response: string): Record<string, any> {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      const parsed = JSON.parse(jsonStr)
      return parsed
    }

    // If no JSON found, try to parse the entire response
    return JSON.parse(response)
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error)
    
    // Fallback: return raw response in a structured format
    return {
      raw_response: response,
      parsing_error: true,
      note: 'AI 응답을 JSON으로 파싱할 수 없어 원본 응답을 저장했습니다.'
    }
  }
}

/**
 * Create a new analysis topic from analysis result
 */
export function createAnalysisTopic(
  characterId: string,
  schema: AnalysisSchema,
  sceneIds: string[],
  analysisData: Record<string, any>
): CharacterAnalysisTopic {
  return {
    id: generateUUID(),
    characterId,
    schemaId: schema.id,
    schemaName: schema.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: analysisData,
    sceneIds
  }
}

/**
 * Simple UUID generator
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
