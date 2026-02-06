import path from 'path'
import fs from 'fs/promises'
import matter from 'gray-matter'
import { CharacterFrontmatter, CharacterRelation } from '../../shared/types/character-schema'

// [Configuration]
const CHARACTER_DIR = path.join(process.cwd(), 'public/NovelBibleWiki/EX급 귀환자/20_Wiki/1.Characters')
console.log('[CharacterService] Init. CWD:', process.cwd())
console.log('[CharacterService] Target Dir:', CHARACTER_DIR)

// Helper: Ensure directory exists
const ensureDir = async () => {
    try {
        await fs.mkdir(CHARACTER_DIR, { recursive: true })
    } catch (e: any) {
        console.error(`Failed to create character dir: ${e.message}`)
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
  upsertCharacter: async (name: string, aiData: any, sceneInfo: { chapter: number, scene: number, title: string, sourcePath: string }, decision?: any) => {
     if (decision?.action === 'skip') {
         return { type: 'skipped', file: name }
     }
  
     await ensureDir()
     
     let existingFile = await findCharacterFile(name)
     let targetPath = existingFile ? path.join(CHARACTER_DIR, existingFile) : null;

     // [Decision: Merge] Override existingFile
     if (decision?.action === 'merge' && decision.targetId) {
         // Trust the targetId as the absolute path or resolved path from frontend
         // Check if it exists exactly as provided
         try {
             await fs.access(decision.targetId);
             targetPath = decision.targetId;
             existingFile = path.basename(decision.targetId);
             console.log(`[CharacterService] Merging '${name}' into existing file at: ${targetPath}`);
         } catch {
             console.warn(`[CharacterService] Target file for merge not found: ${decision.targetId}. Fallback to default search.`);
             // Fallback logic remains: Check if it's in standard dir
             const potentialName = path.basename(decision.targetId);
             const stdPath = path.join(CHARACTER_DIR, potentialName);
             try {
                await fs.access(stdPath);
                targetPath = stdPath;
                existingFile = potentialName;
             } catch {
                console.error(`[CharacterService] Merge target truly not found. Creating new file instead.`);
                targetPath = null;
                existingFile = null;
             }
         }
     }

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

     if (targetPath && existingFile) {
         // [UPDATE EXISTING]
         // const filePath = path.join(CHARACTER_DIR, existingFile) <--- OLD
         const filePath = targetPath; // Use resolved path
         const fileContent = await fs.readFile(filePath, 'utf-8')
         const parsed = matter(fileContent)
         
         // 1. Verify/Mix Frontmatter
         const newFm = { ...parsed.data } as any
         
         // Merge Relations
         // Strategy: Add NEW relations. If exist, Update?? 
         // For now, we will ADD non-existing relations to the list (so we don't lose old ones).
         // Or should we update existing ones? Usually "Update" is better for 'mood' changes.
         if (aiData.relations && Array.isArray(aiData.relations)) {
             const currentRels = (newFm.relations || []) as CharacterRelation[]
             const newRels = aiData.relations as CharacterRelation[]
             
             newRels.forEach(newRel => {
                 const idx = currentRels.findIndex(r => r.name === newRel.name)
                 if (idx !== -1) {
                     // Update existing
                     currentRels[idx] = { ...currentRels[idx], ...newRel }
                 } else {
                     // Add new
                     currentRels.push(newRel)
                 }
             })
             newFm.relations = currentRels
         }
         
         // Let's just update 'status' for now.
         if (aiData.status) newFm.status = aiData.status
         if (aiData.rank) newFm.rank = aiData.rank // if AI extracts rank
         if (aiData.role && aiData.role.length < 20) newFm.role = aiData.role // Only update role if it's short/new
         if (aiData.affiliation && aiData.affiliation !== 'Unknown') newFm.affiliation = aiData.affiliation // Update affiliation
         
         // [Requirement] Update Grade if provided in decision
         if (decision?.grade) {
             newFm.grade = decision.grade
         }
         
             // [Decision: Merge] Add Alias
             if (decision?.action === 'merge') {
                 let aliases: string[] = []
                 if (typeof newFm.alias === 'string') {
                    aliases = newFm.alias.split(',').map((s: string) => s.trim())
                 } else if (Array.isArray(newFm.alias)) {
                    aliases = [...newFm.alias]
                 }
                 
                 if (!aliases.includes(name)) {
                     aliases.push(name)
                     newFm.alias = aliases.join(', ')
                 }
             }
         
         // Write back
         // [Requirement] Do NOT append detailed logs to body. Only update frontmatter.
         const newContent = matter.stringify(parsed.content, newFm)
         await fs.writeFile(filePath, newContent)
         console.log(`[Character] Updated Frontmatter for ${existingFile} (Path: ${filePath})`)
          return { type: decision?.action === 'merge' ? 'merged' : 'updated', file: existingFile }

     } else {
         // [CREATE NEW]
         const fileName = `${name}.md`
         const filePath = path.join(CHARACTER_DIR, fileName)
         
         const frontmatter: CharacterFrontmatter = {
             name: name,
             role: aiData.role || 'Unknown',
             grade: decision?.grade || 'EXTRA', // [NEW] Use user selected grade
             status: (aiData.status as any) || 'ALIVE',
             affiliation: aiData.affiliation || 'Unknown',
             type: 'character',
             relations: (aiData.relations || []) as CharacterRelation[]
         }
         
         const initialBody = `\n## 개요\n신규 등장한 캐릭터입니다.\n${aiData.summary ? `> ${aiData.summary}\n` : ''}\n${logEntry}`
         
         const newContent = matter.stringify(initialBody, frontmatter)
         await fs.writeFile(filePath, newContent)
         console.log(`[Character] Created ${fileName}`)
         return { type: 'created', file: fileName }
     }
  }
}
