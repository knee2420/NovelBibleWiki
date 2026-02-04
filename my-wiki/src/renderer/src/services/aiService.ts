import { SceneSchema } from '../../../shared/types/scene-schema'

export const aiService = {
  // 1. Analyze Scene (Single)
  analyzeScene: async (text: string): Promise<Partial<SceneSchema>> => {
    // Call Main Process via Preload
    // @ts-ignore
    const result = await window.api.analyzeScene(text)
    
    if (!result.success) {
      throw new Error(result.message || 'AI Analysis Failed')
    }
    
    return result.data
  },

  // 2. Parse Structure (Bulk)
  // Currently we use a heuristic parser (Mock-like) because Gemini might be too expensive/slow for full structure parsing of huge text,
  // OR we can implementation a real one if needed. For now, let's keep the heuristic logic in renderer or move it to main.
  // Let's implement a smart heuristic parser here without AI for structure, 
  // but we can optionally use AI if the heuristic fails.
  // For cost efficiency, regex splitting is better for "Chapter" separation.
  parseStructure: async (fullText: string) => {
    // 1. Split by "제N화" or "***" or "Chapter"
    // This logic is purely local regex
    const chapters: any[] = []
    
    // Normalize newlines
    const text = fullText.replace(/\r\n/g, '\n')
    
    // Regex for Chapter Header: e.g., "제 1 화", "Chapter 1", "1화."
    const chapterRegex = /^(?:제|Chapter)?\s*(\d+)\s*(?:화|장|Chapter)?[\.\s]*(.*)$/gm
    
    // Find all chapter headers
    const matches = [...text.matchAll(chapterRegex)]
    
    if (matches.length === 0) {
      // If no chapters found, treat as single chapter
      chapters.push({
        chapterNumber: 1,
        title: 'Untitled',
        scenes: splitScenes(text) // Helper to split scenes
      })
      return chapters
    }

    // Loop through matches
    for (let i = 0; i < matches.length; i++) {
        const m = matches[i]
        const chapterNum = parseInt(m[1])
        const title = m[2].trim()
        const startIndex = m.index
        const nextMatch = matches[i+1]
        const endIndex = nextMatch ? nextMatch.index : text.length
        
        const content = text.slice(startIndex, endIndex).trim()
        // Remove the header line from content
        const body = content.replace(m[0], '').trim()
        
        chapters.push({
            chapterNumber: chapterNum,
            title: title || `Chapter ${chapterNum}`,
            scenes: splitScenes(body)
        })
    }
    
    return chapters
  },
  
  // Check API Key existence
  hasApiKey: async (): Promise<boolean> => {
     // @ts-ignore
     const key = await window.api.getAIKey()
     return !!key
  },
  
  saveApiKey: async (key: string): Promise<boolean> => {
      // @ts-ignore
      const res = await window.api.saveAIKey(key)
      return res?.success
  }
}

// Helper to split scenes (by *** or blank lines or just one scene)
function splitScenes(text: string) {
    // Delimiter: "***" or large gaps?
    // Let's use "***" as explicit scene divider
    const parts = text.split(/\n\s*\*\*\*\s*\n/)
    
    return parts.map((part, idx) => ({
        sceneNumber: idx + 1,
        title: `Scene ${idx + 1}`,
        content: part.trim()
    }))
}
