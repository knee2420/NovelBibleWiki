// Schema Service - Handles loading and processing of analysis schemas
import { AnalysisSchema, AnalysisSchemaFrontmatter } from '../types/analysis-schema'
import { WikiEntry } from '../types/wiki'

/**
 * Parse YAML frontmatter from markdown content
 */
export function parseSchemaFrontmatter(content: string): {
  frontmatter: AnalysisSchemaFrontmatter | null
  body: string
} {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { frontmatter: null, body: content }
  }

  const yamlContent = match[1]
  const body = content.slice(match[0].length).trim()

  try {
    // Simple YAML parser for our use case
    // Note: For production, consider using a proper YAML library
    const frontmatter: any = {}
    const lines = yamlContent.split('\n')
    let currentKey = ''

    for (const line of lines) {
      if (!line.trim()) continue

      const indent = line.search(/\S/)
      const trimmed = line.trim()

      if (trimmed.endsWith(':') || trimmed.includes(': ')) {
        const [key, ...valueParts] = trimmed.split(':')
        const value = valueParts.join(':').trim()

        if (indent === 0) {
          currentKey = key
          if (value) {
            frontmatter[key] = parseValue(value)
          } else {
            frontmatter[key] = {}
          }
        } else if (currentKey && frontmatter[currentKey]) {
          if (typeof frontmatter[currentKey] === 'object') {
            if (value) {
              frontmatter[currentKey][key] = parseValue(value)
            } else {
              frontmatter[currentKey][key] = {}
            }
          }
        }
      }
    }

    return { frontmatter: frontmatter as AnalysisSchemaFrontmatter, body }
  } catch (error) {
    console.error('Failed to parse frontmatter:', error)
    return { frontmatter: null, body: content }
  }
}

function parseValue(value: string): any {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  // Handle numbers
  if (!isNaN(Number(value))) {
    return Number(value)
  }
  return value
}

/**
 * Load all available analysis schemas from the filesystem
 */
export async function loadSchemas(): Promise<AnalysisSchema[]> {
  try {
    // @ts-ignore - IPC handler
    const result = await window.api.loadAnalysisSchemas()
    
    if (!result.success) {
      console.error('Failed to load schemas:', result.message)
      return []
    }

    return result.schemas.map((schema: any) => ({
      id: schema.id,
      name: schema.name,
      path: schema.path,
      frontmatter: schema.frontmatter,
      content: schema.content,
      description: extractDescription(schema.content)
    }))
  } catch (error) {
    console.error('Error loading schemas:', error)
    return []
  }
}

/**
 * Extract description from markdown content
 */
function extractDescription(content: string): string {
  // Look for the first paragraph after frontmatter
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---')) {
      return trimmed.slice(0, 200) // First 200 chars
    }
  }
  return ''
}

/**
 * Build AI analysis prompt from schema, character, and scenes
 */
export function buildAnalysisPrompt(
  schema: AnalysisSchema,
  character: WikiEntry,
  scenes: Array<{ id: string; title: string; summary: string; content: string }>
): string {
  const fm = schema.frontmatter

  let prompt = `당신은 ${fm.analysis_persona}입니다.\n\n`
  prompt += `## 분석 모듈\n${fm.analysis_module}\n\n`
  prompt += `## 분석 대상 캐릭터\n이름: ${character.name}\n\n`

  // Add definitions if available
  if (fm.definitions) {
    prompt += `## 정의\n`
    Object.entries(fm.definitions).forEach(([key, value]) => {
      prompt += `- **${key}**: ${value}\n`
    })
    prompt += '\n'
  }

  // Add character information
  if (character.content) {
    prompt += `## 캐릭터 프로필\n${character.content.slice(0, 1000)}\n\n`
  }

  // Add scenes
  if (scenes.length > 0) {
    prompt += `## 분석 대상 씬\n\n`
    scenes.forEach((scene, idx) => {
      prompt += `### [씬 ${idx + 1}] ${scene.title}\n`
      prompt += `**요약**: ${scene.summary}\n\n`
      if (scene.content) {
        prompt += `**내용**:\n${scene.content.slice(0, 2000)}\n\n`
      }
      prompt += '---\n\n'
    })
  }

  // Output requirements
  if (fm.output_requirements) {
    prompt += `## 출력 요구사항\n`
    prompt += `- 형식: ${fm.output_requirements.format}\n`
    prompt += `- 언어: ${fm.output_requirements.language}\n`
    prompt += `- 톤: ${fm.output_requirements.tone}\n\n`
  }

  // Schema structure
  prompt += `## 분석 항목 (Schema Structure)\n\n`
  prompt += `다음 각 필드명(Key)에 대해 분석된 내용을 값(Value)으로 하는 JSON 형식으로만 응답해주세요. 중첩된 구조(type, description 등)는 무시하고, 최종 분석 값만 반환하세요:\n\n`
  
  // Create a simplified example object for the prompt
  const outputExample: Record<string, string> = {}
  if (fm.schema_structure) {
    Object.keys(fm.schema_structure).forEach(key => {
      outputExample[key] = "분석된 내용..."
    })
  }

  prompt += '```json\n'
  prompt += JSON.stringify(outputExample, null, 2)
  prompt += '\n```\n\n'

  if (fm.schema_structure) {
    prompt += `## 필드 상세 설명\n`
    Object.entries(fm.schema_structure).forEach(([key, def]: [string, any]) => {
      prompt += `- **${key}** (${def.type}): ${def.description}\n`
    })
    prompt += '\n'
  }

  prompt += `위 필드들에 대해 캐릭터를 깊이 있게 분석하고, **반드시 유효한 JSON 형식으로만** 결과를 반환해주세요.`

  return prompt
}
