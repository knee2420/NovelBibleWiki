import { useState, useRef } from 'react'
import { WikiEntry } from '../types/wiki'
import { findEntryByName } from '../utils/nameResolver'

export interface PendingEntity {
  type: 'character' | 'item' | 'location' | 'faction'
  name: string
  desc: string
  info: any
}

export interface EntityDecision {
  type: string
  name: string
  action: 'create' | 'merge' | 'skip'
  targetId?: string // if merge
  targetName?: string // if merge
  // Char spec
  grade?: 'MAIN' | 'SUB' | 'MINOR' | 'EXTRA'
}

interface UseEntityReviewReturn {
  isReviewing: boolean
  pendingEntities: Record<string, PendingEntity[]>
  decisions: Record<string, Record<string, EntityDecision>> // type -> name -> decision
  detectEntities: (aiResult: any) => boolean
  handleDecision: (decision: EntityDecision) => void
  waitForReview: () => Promise<void>
  finishReview: () => void
  resetReview: () => void
  hasPendingDecisions: boolean
}

export const useEntityReview = (wikiData: WikiEntry[]): UseEntityReviewReturn => {
  const [isReviewing, setIsReviewing] = useState(false)
  const [pendingEntities, setPendingEntities] = useState<Record<string, PendingEntity[]>>({
      character: [],
      item: [],
      location: [],
      faction: []
  })
  const [decisions, setDecisions] = useState<Record<string, Record<string, EntityDecision>>>({})
  
  const resolveRef = useRef<(() => void) | null>(null)
  const decisionsRef = useRef<Record<string, Record<string, EntityDecision>>>({})

  const updateDecisions = (newDecisions: Record<string, Record<string, EntityDecision>>) => {
      setDecisions(newDecisions)
      decisionsRef.current = newDecisions
  }

  const detectEntities = (aiResult: any): boolean => {
      const newPending: Record<string, PendingEntity[]> = {
          character: [],
          item: [],
          location: [],
          faction: []
      }
      let foundAny = false

      // Helper
      const processType = (type: string, dataKey: string) => {
          const data = aiResult[dataKey]
          if (!data) return

          const appearing = data.appear || [] // string[]
          const updates = data.update || []   // object[]

          appearing.forEach((name: string) => {
               if (!name || typeof name !== 'string') return
               
               // Check if decision exists already (skip)
               if (decisions[type]?.[name]) return

               // Check if exists in WikiData (skip)
               // Note: findEntryByName checks all types by default?
               // We should filter by type ideally.
               // Existing function: findEntryByName(name, wikiData) returns entry.
               // We should check entry.type === type?
               // Actually names should be unique globally? Or per type?
               // Usually globally unique is safer.
               const exists = findEntryByName(name, wikiData)
               if (exists && exists.type === type) return 

               // Find info
               const updateInfo = updates.find((u: any) => u.name === name)
               const changes = updateInfo?.changes || {}
               
               // Description
               let desc = 'No description'
               if (type === 'character') desc = changes.role || changes.status
               if (type === 'item') desc = changes.status || 'Item'
               if (type === 'location') desc = changes.status || 'Location'
               if (type === 'faction') desc = changes.leader ? `Leader: ${changes.leader}` : 'Faction'

               newPending[type].push({
                   type: type as any,
                   name,
                   desc,
                   info: changes
               })
               foundAny = true
          })
      }

      processType('character', 'wiki-data')
      processType('item', 'wiki-item-data')
      processType('location', 'wiki-location-data')
      processType('faction', 'wiki-faction-data')

      if (foundAny) {
          setPendingEntities(newPending)
          setIsReviewing(true)
          return true
      }
      return false
  }

  const handleDecision = (decision: EntityDecision) => {
      const { type, name } = decision
      setDecisions(prev => {
          const next = { ...prev }
          if (!next[type]) next[type] = {}
          next[type][name] = decision
          
          decisionsRef.current = next
          return next
      })
  }

  const finishReview = () => {
      setIsReviewing(false)
      setPendingEntities({ character: [], item: [], location: [], faction: [] })
      if (resolveRef.current) {
          resolveRef.current()
          resolveRef.current = null
      }
  }

  const waitForReview = () => {
      return new Promise<void>((resolve) => {
          resolveRef.current = resolve
      })
  }

  const resetReview = () => {
      setIsReviewing(false)
      setPendingEntities({ character: [], item: [], location: [], faction: [] })
      updateDecisions({})
      resolveRef.current = null
  }

  // Helper to check progress?
  // We don't enforce "All Reviewed" strictly here, UI handles it.
  
  return {
      isReviewing,
      pendingEntities,
      decisions,
      detectEntities,
      handleDecision,
      waitForReview,
      finishReview,
      resetReview,
      hasPendingDecisions: Object.keys(decisions).some(k => Object.keys(decisions[k]).length > 0)
  }
}
