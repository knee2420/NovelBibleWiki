import path from 'path'
import fs from 'fs/promises'
import matter from 'gray-matter'


const BASE_WIKI_DIR = path.join(process.cwd(), 'public/NovelBibleWiki/EX급 귀환자/20_Wiki')

const TYPE_DIR_MAP: Record<string, string> = {
    'character': '1.Characters',
    'faction': '2. 세력 및 단체',
    'item': '기술 및 아이템',
    'location': '장소',
    'monster': '몬스터',
    'system': '세계 시스템',
    'symbol': '상징'
}

// Helper: Resolve file path (Name or Alias)
const findWikiFile = async (dir: string, name: string): Promise<string | null> => {
    try {
        await fs.mkdir(dir, { recursive: true })
        const files = await fs.readdir(dir)
        for (const file of files) {
            if (!file.endsWith('.md')) continue
            
            const filePath = path.join(dir, file)
            const content = await fs.readFile(filePath, 'utf-8')
            const { data } = matter(content)

            // 1. Name Match
            if (data.name === name || file.replace('.md', '') === name) return file
            
            // 2. Alias Match
            if (data.alias) {
                const aliases = typeof data.alias === 'string' 
                    ? data.alias.split(',').map((s: string) => s.trim()) 
                    : Array.isArray(data.alias) ? data.alias : []
                if (aliases.includes(name)) return file
            }
        }
    } catch (e) {
        console.error(`Error searching in ${dir}:`, e)
    }
    return null
}

export const wikiService = {
  upsertWikiEntry: async (
      type: string, 
      name: string, 
      aiData: any, 
      sceneInfo: { chapter: number, scene: number, title: string }, 
      decision?: any
  ) => {
     if (decision?.action === 'skip') {
         return { type: 'skipped', file: name }
     }

     const subDir = TYPE_DIR_MAP[type] || 'Etc'
     const targetDir = path.join(BASE_WIKI_DIR, subDir)
     
     try {
        await fs.mkdir(targetDir, { recursive: true })
     } catch (e) {
        console.error(`Dir creation failed: ${targetDir}`, e)
     }

     let existingFile = await findWikiFile(targetDir, name)
     let targetPath = existingFile ? path.join(targetDir, existingFile) : null;

     // [Merge Logic]
     if (decision?.action === 'merge' && decision.targetId) {
         try {
             const mergeTargetName = decision.targetId.replace('.md', '')
             const found = await findWikiFile(targetDir, mergeTargetName)
             if (found) {
                 targetPath = path.join(targetDir, found)
                 existingFile = found
             } else {
                 targetPath = path.join(targetDir, `${mergeTargetName}.md`)
                 existingFile = `${mergeTargetName}.md`
             }
         } catch {
             console.warn(`Merge target resolution failed: ${decision.targetId}`)
             targetPath = null
         }
     }

     if (targetPath && existingFile) {
         // [UPDATE / MERGE]
         try {
             await fs.access(targetPath)

             const fileContent = await fs.readFile(targetPath, 'utf-8')
             const parsed = matter(fileContent)
             const newFm = { ...parsed.data }

             // 1. Apply Decision Overrides (High Priority)
             if (decision && type === 'character') {
                 if (decision.grade) {
                     newFm.grade = decision.grade
                 }
             }

             // 2. Apply AI Data (Low Priority)
             // [CHANGED] If implicit update (no decision), DO NOT overwrite existing fields.
             // "No need to update existing characters" per user.
             const exclude = ['name', 'summary', 'grade', 'relations', 'alias', 'type']
             Object.keys(aiData).forEach(key => {
                 if (exclude.includes(key)) return
                 
                 // Only set if not already present (Keep existing Manual Data)
                 if (newFm[key] === undefined || newFm[key] === null || newFm[key] === '') {
                      if (aiData[key]) newFm[key] = aiData[key]
                 }
                 // If we strongly want to overwrite on 'Merge' decision, check decision?.action === 'merge'
                 // But for now, let's become conservative for all updates to prevent jitter.
             })

             // 3. Special Handling
             
             // Aliases (Merge)
             if (decision?.action === 'merge') {
                 let aliases: string[] = []
                 if (typeof newFm.alias === 'string') aliases = newFm.alias.split(',').map((s: string) => s.trim())
                 else if (Array.isArray(newFm.alias)) aliases = [...newFm.alias]
                 
                 if (name && name !== newFm.name && !aliases.includes(name)) {
                     aliases.push(name)
                     newFm.alias = aliases // Keep as array
                 }
             }

             // Relations (Append Only - No Update)
             if (aiData.relations && Array.isArray(aiData.relations)) {
                 const currentRels = (newFm.relations || []) as any[]
                 aiData.relations.forEach((nr: any) => {
                     const idx = currentRels.findIndex((r: any) => r.name === nr.name)
                     if (idx >= 0) {
                         // [CHANGED] Exist? Do NOTHING.
                         // User said: "No need to update... scene has info".
                         // Preserves manual edits to relations.
                     } else {
                         // [CHANGED] Do NOT add new relations automatically.
                         // User feedback: "How to manage if 200 chapters?"
                         // Relations accumulate too fast and scenes cover them.
                         // Only manual addition or explicit "Overwrite" decision (future feature) should allow this.
                         // currentRels.push(nr) 
                     }
                 })
                 newFm.relations = currentRels
             }

             const newContent = matter.stringify(parsed.content, newFm)
             await fs.writeFile(targetPath, newContent)
             return { type: decision?.action === 'merge' ? 'merged' : 'updated', file: existingFile }

         } catch (e: any) {
             console.error(`Failed to update ${targetPath}:`, e.message)
             throw e
         }
     } else {
         // [CREATE]
         if (decision?.action !== 'create') {
             console.log(`[WikiService] Skipping creation of '${name}' (Action: ${decision?.action || 'None'})`)
             return { type: 'skipped', file: name }
         }

         const fileName = `${name}.md`
         const filePath = path.join(targetDir, fileName)
         
         const frontmatter: any = {
             name: name,
             type: type,
             ...aiData
         }

         // [FIX] Apply Decision Overrides for Creation
         if (decision && type === 'character') {
             // Use explicit grade or default to EXTRA
             frontmatter.grade = decision.grade || 'EXTRA'
         }
         
         // Cleanup
         delete frontmatter['summary'] 

         // Initial Body
         let body = `\n## 개요\n${aiData.summary ? `> ${aiData.summary}\n` : ''}\n`
         
         const newContent = matter.stringify(body, frontmatter)
         await fs.writeFile(filePath, newContent)
         return { type: 'created', file: fileName }
     }
  }
}
