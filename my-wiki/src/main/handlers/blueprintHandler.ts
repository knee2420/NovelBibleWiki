import { ipcMain } from 'electron'
import fs from 'fs-extra'
import { join, basename, extname } from 'path'
import matter from 'gray-matter'
import { DEFAULT_BLUEPRINT } from '../../shared/types/character-engine'

function getBlueprintPath(vaultPath: string, characterId: string): string {
  // characterId is the absolute path to the character's markdown file.
  // We extract the base name (e.g., "GangJinWoo") and save it to the engine folder as a markdown file.
  const fileName = basename(characterId, extname(characterId))
  
  // Target Directory: 20_Wiki/1.Characters/character_engine/[Name]_성장곡선.md
  return join(vaultPath, '20_Wiki', '1.Characters', 'character_engine', `${fileName}_성장곡선.md`)
}

export function setupBlueprintHandlers(store: any): void {
  ipcMain.handle('get-character-blueprint', async (_, characterId: string) => {
    const vaultPath = store.get('vaultPath') as string
    if (!vaultPath || !characterId) return DEFAULT_BLUEPRINT

    const filePath = getBlueprintPath(vaultPath, characterId)
    
    try {
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf-8')
        const { data } = matter(content)
        
        // Return existing data or default if empty
        // The data is stored directly in frontmatter fields (axes, nodes)
        return { 
            ...DEFAULT_BLUEPRINT, 
            ...data, 
            characterId 
        }
      }
    } catch (error) {
      console.error('Failed to load blueprint:', error)
    }

    return { ...DEFAULT_BLUEPRINT, characterId }
  })

  ipcMain.handle('save-character-blueprint', async (_, blueprint: any) => {
    const vaultPath = store.get('vaultPath') as string
    if (!vaultPath || !blueprint.characterId) return { success: false }

    const filePath = getBlueprintPath(vaultPath, blueprint.characterId)

    try {
      // Ensure the directory exists
      await fs.ensureDir(join(vaultPath, '20_Wiki', '1.Characters', 'character_engine'))
      
      // Prepare Frontmatter Data
      const { characterId, ...dataToSave } = blueprint
      
      let fileContentToSave = ''

      if (await fs.pathExists(filePath)) {
          // Update existing file: preserve body, merge frontmatter
          const fileContent = await fs.readFile(filePath, 'utf-8')
          const { content: body, data: existingData } = matter(fileContent)
          
          const newData = {
              ...existingData,
              ...dataToSave
          }
          fileContentToSave = matter.stringify(body, newData)
      } else {
          // Create new file
          fileContentToSave = matter.stringify('', dataToSave)
      }

      await fs.writeFile(filePath, fileContentToSave, 'utf-8')
      
      return { success: true }
    } catch (error) {
      console.error('Failed to save blueprint:', error)
      return { success: false, message: (error as any).message }
    }
  })
}
