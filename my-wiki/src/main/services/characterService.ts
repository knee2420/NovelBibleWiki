import path from 'path'
import fs from 'fs/promises'
import matter from 'gray-matter'

// [Configuration]
const CHARACTER_DIR = path.join(process.cwd(), 'public/NovelBibleWiki/EX급 귀환자/20_Wiki/1.Characters')

// Helper: Ensure directory exists
const ensureDir = async () => {
    try {
        await fs.access(CHARACTER_DIR)
    } catch {
        // public folder structure should exist, but safety check
        console.error(`Character Directory not found: ${CHARACTER_DIR}`)
    }
}

// Helper: Resolve Name (Simple version for backend)
// In a full implementation, we might share the 'nameResolver' logic or pass resolved names from frontend.
// For now, we'll do a simple file search.
const findCharacterFile = async (name: string): Promise<string | null> => {
    try {
        const files = await fs.readdir(CHARACTER_DIR)
        for (const file of files) {
            if (!file.endsWith('.md')) continue
            
            const filePath = path.join(CHARACTER_DIR, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const { data } = matter(content)

            // 1. Name Match
            if (data.name === name || file.replace('.md', '') === name) return file
            
            // 2. Alias Match
            if (data.alias) {
                const aliases = data.alias.split(',').map((s: string) => s.trim())
                if (aliases.includes(name)) return file
            }
        }
    } catch (e) {
        console.error(e)
    }
    return null
}

export const characterService = {
  /**
   * Main Entry: Update or Create Character
   */
  upsertCharacter: async (name: string, aiData: any, sceneInfo: { chapter: number, scene: number, title: string, sourcePath: string }) => {
     await ensureDir()
     const existingFile = await findCharacterFile(name)

     const timestamp = new Date().toISOString()
     const sourceHeader = `[[${sceneInfo.chapter}화.${sceneInfo.title.replace(/ /g, '_')} - SCENE${sceneInfo.scene}]]`
     
     // [Log Entry Construction]
     let logEntry = `\n### Source: ${sourceHeader}\n\n`
     
     // 1. Summary (if available in aiData specific to this character? )
     // The raw aiData structure for 'characters' usually has: { name, role, ... } 
     // It might NOT have a specific summary for *that* character unless we parse the 'summary' field or 'actions'.
     // For now, let's assume aiData IS the character object from the AI Analysis result.
     
     if (aiData.role) logEntry += `- **역할(Role)**: ${aiData.role}\n`
     if (aiData.status) logEntry += `- **상태(Status)**: ${aiData.status}\n`
     
     // 2. Updates (Action/Appearance/Psychology?)
     // If the AI provides 'actions' or 'description', we append it.
     // Currently our schema has 'desc' or similar? Let's check schema.
     // In 'promptBuilder', we request: { name, role, status, relations }
     // We don't have a 'summary of action' per character yet.
     // We will use the generic scene summary or add a placeholder for now.
     
     // [Improvement]: We might need to ask AI for "Character specific summary" later.
     // For now, we will log the *Updates* detected.
     
     // 3. Relations
     if (aiData.relations && aiData.relations.length > 0) {
         logEntry += `- **관계 변화(Relations)**:\n`
         aiData.relations.forEach((rel: any) => {
             logEntry += `    - **${rel.name}**: ${rel.display} (${rel.mood})\n`
         })
     }

     if (existingFile) {
         // [UPDATE EXISTING]
         const filePath = path.join(CHARACTER_DIR, existingFile)
         const fileContent = await fs.readFile(filePath, 'utf-8')
         const parsed = matter(fileContent)
         
         // 1. Verify/Mix Frontmatter
         const newFm = { ...parsed.data }
         
         // Merge Relations (Simple append/overwrite logic)
         // We'll trust the latest if exists, or append.
         // Actually, 'relations' in FM should be a cumulative current state.
         // Let's just update 'status' for now.
         if (aiData.status) newFm.status = aiData.status
         if (aiData.rank) newFm.rank = aiData.rank // if AI extracts rank
         
         // Write back
         const newContent = matter.stringify(parsed.content + logEntry, newFm)
         await fs.writeFile(filePath, newContent)
         console.log(`[Character] Updated ${existingFile}`)
         return { type: 'updated', file: existingFile }

     } else {
         // [CREATE NEW]
         const fileName = `${name}.md`
         const filePath = path.join(CHARACTER_DIR, fileName)
         
         const frontmatter = {
             name: name,
             role: aiData.role || 'Unknown',
             grade: 'EXTRA', // Default
             status: aiData.status || 'Active',
             affiliation: 'Unknown',
             type: 'character',
             relations: aiData.relations || []
         }
         
         const initialBody = `\n## 개요\n신규 등장한 캐릭터입니다.\n${logEntry}`
         
         const newContent = matter.stringify(initialBody, frontmatter)
         await fs.writeFile(filePath, newContent)
         console.log(`[Character] Created ${fileName}`)
         return { type: 'created', file: fileName }
     }
  }
}
