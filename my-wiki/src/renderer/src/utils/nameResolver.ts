import { WikiEntry, CharacterEntry } from '../types/wiki'

/**
 * Finds a WikiEntry that matches the given name, checking:
 * 1. Exact name match
 * 2. Alias match (comma-separated supported)
 */
export const findEntryByName = (name: string, allEntries: WikiEntry[]): WikiEntry | undefined => {
  if (!name) return undefined
  const cleanName = name.trim()
  
  return allEntries.find((entry) => {
    // 1. Name Match
    if (entry.name === cleanName) return true

    // 2. Alias Match (Character Only)
    // Assuming alias is a string, possibly comma-separated
    if (entry.type === 'character') {
      const charEntry = entry as CharacterEntry
      const aliasStr = charEntry.info.alias || ''
      if (!aliasStr) return false
      
      const aliases = aliasStr.includes(',') 
        ? aliasStr.split(',').map(s => s.trim())
        : [aliasStr.trim()]
        
      return aliases.includes(cleanName)
    }
    
    return false
  })
}

/**
 * Resolves a name to its canonical form (the name of the matching WikiEntry).
 * If no match found, returns the original name.
 * Useful for normalizing "Jinwoo" -> "Kang Jinwoo"
 */
export const resolveCanonicalName = (name: string, allEntries: WikiEntry[]): string => {
  const entry = findEntryByName(name, allEntries)
  return entry ? entry.name : name
}
