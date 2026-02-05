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
  // [Improved] Supports File Markers and Smart Delimiters
  parseStructure: async (fullText: string) => {
    const chapters: any[] = []
    
    // Normalize newlines
    const text = fullText.replace(/\r\n/g, '\n')
    
    // [Strategy 1] Check for "[FILE START: filename]" markers (Added by BulkImportModal)
    // Regex: \[FILE START: (.*?)\]([\s\S]*?)\[FILE END\]
    const fileRegex = /\[FILE START:\s*(.*?)\]([\s\S]*?)\[FILE END\]/g
    const fileMatches = [...text.matchAll(fileRegex)]
    
    if (fileMatches.length > 0) {
        fileMatches.forEach((m, idx) => {
            const fileName = m[1].trim()
            const content = m[2].trim()
            
            // Try to extract chapter number from filename
            const numMatch = fileName.match(/(\d+)/)
            const chapterNum = numMatch ? parseInt(numMatch[0]) : idx + 1
            
            chapters.push({
                chapterNumber: chapterNum,
                title: fileName.replace(/\.[^/.]+$/, ""), // remove extension
                scenes: splitScenes(content)
            })
        })
        return chapters
    }

    // [Strategy 2] Regex based splitting (Traditional)
    // Regex for Chapter Header: e.g., "제 1 화", "Chapter 1", "1화.", "# 1화"
    const chapterRegex = /^(?:#+\s*)?(?:제|Chapter)?\s*(\d+)\s*(?:화|장|Chapter)?[\.\s]*(.*)$/gm
    
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

// Helper to split scenes
function splitScenes(text: string) {
    // Delimiters:
    // 1. "***", "---", "===" (Visual Separators)
    // 2. <br> tags (HTML)
    // 3. Three or more newlines (Gap) => \n\s*\n\s*\n
    
    // Regex explanation:
    // (?: ... ) : Non-capturing group
    // \n\s*[\*\-=_]{3,}\s*\n : Separator lines like ***, ---, ===
    // | : OR
    // \n\s*\n\s*\n : 3+ newlines (Empty line gap >= 2)
    
    const splitter = /\n\s*(?:[\*\-=_]{3,}|<br\s*\/?>)\s*\n|\n\s*\n\s*\n/i
    
    // Split and filter empty parts
    let parts = text.split(splitter).map(p => p.trim()).filter(p => p.length > 0)
    
    // [Refinement] Filter out "Title Only" scenes
    // If a part is very short (< 50 chars) and looks like a header, ignore it.
    parts = parts.filter((part, index) => {
        const isShort = part.length < 50
        // Starts with #, number, "제", "Chapter", "[", "<"
        const isHeaderLike = /^(?:#|제|Chapter|\d+화|\[|<)/i.test(part)
        
        // If we have multiple parts, and this one is short & header-like, drop it.
        // (Usually these are leftovers from the top of the file)
        if (parts.length > 1 && isShort && isHeaderLike) return false
        
        // Ignore extremely short noise (< 5 chars) unless it's the only content
        if (parts.length > 1 && part.length < 5) return false
        
        return true
    })
    
    if (parts.length === 0) {
        return [{ sceneNumber: 1, title: 'Scene 1', content: text }]
    }
    
    return parts.map((part, idx) => ({
        sceneNumber: idx + 1,
        title: `Scene ${idx + 1}`,
        content: part
    }))
}
