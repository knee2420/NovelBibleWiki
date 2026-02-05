import { useState, useRef } from 'react'
import { WikiEntry } from '../types/wiki'
import { findEntryByName } from '../utils/nameResolver'
import { CharacterDecision, PendingReview } from '../components/AI/CharacterReviewModal'

interface UseCharacterReviewReturn {
  isReviewing: boolean
  pendingReviews: PendingReview[]
  reviewIndex: number
  decisions: Record<string, CharacterDecision>
  detectNewCharacters: (aiResult: any) => boolean // Returns true if review needed
  handleReviewAction: (action: 'create' | 'merge' | 'skip', targetId?: string, targetName?: string) => void
  waitForReview: () => Promise<void>
  resetReview: () => void
}

export const useCharacterReview = (wikiData: WikiEntry[]): UseCharacterReviewReturn => {
  const [isReviewing, setIsReviewing] = useState(false)
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([])
  const [reviewIndex, setReviewIndex] = useState(0)
  const [decisions, setDecisions] = useState<Record<string, CharacterDecision>>({})

  const resolveRef = useRef<(() => void) | null>(null)

  const detectNewCharacters = (aiResult: any): boolean => {
    if (!aiResult.characters || !Array.isArray(aiResult.characters)) return false

    // [FIX] aiResult.characters is string[], not object[]
    // We need to map it to objects and enrich with info from wiki-data.update
    const charList: string[] = aiResult.characters || []
    const updates = aiResult['wiki-data']?.update || []

    const newChars = charList
      .filter((charName: string) => {
        if (!charName || typeof charName !== 'string' || charName.trim() === '') return false

        // 1. Check if we already made a decision for this name (skip check)
        if (decisions[charName]) return false

        // 2. Check if exists in WikiData
        const exists = findEntryByName(charName, wikiData)
        if (exists) return false

        return true
      })
      .map((charName: string) => {
        // Try to find status/role info from updates
        const updateInfo = updates.find((u: any) => u.name === charName)
        const changes = updateInfo?.changes || {}
        
        return {
          name: charName,
          role: changes.role || 'Role Unknown',
          info: {
             desc: changes.mental || changes.action || 'No description available',
             ...changes
          }
        }
      })

    if (newChars.length > 0) {
      console.log('[CharacterReview] New characters detected:', newChars)
      setPendingReviews(newChars)
      setReviewIndex(0)
      setIsReviewing(true)
      return true
    }

    return false
  }

  const handleReviewAction = (
    action: 'create' | 'merge' | 'skip',
    targetId?: string,
    targetName?: string
  ) => {
    const currentReview = pendingReviews[reviewIndex]
    if (!currentReview) return

    // Save Decision
    setDecisions((prev) => ({
      ...prev,
      [currentReview.name]: {
        name: currentReview.name,
        action,
        targetId,
        targetName
      }
    }))

    // Move to Next or Finish
    if (reviewIndex < pendingReviews.length - 1) {
      setReviewIndex((prev) => prev + 1)
    } else {
      // All Done
      finishReview()
    }
  }

  const finishReview = () => {
    setIsReviewing(false)
    setPendingReviews([])
    setReviewIndex(0)
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
    setPendingReviews([])
    setReviewIndex(0)
    setDecisions({})
    resolveRef.current = null
  }

  return {
    isReviewing,
    pendingReviews,
    reviewIndex,
    decisions,
    detectNewCharacters,
    handleReviewAction,
    waitForReview,
    resetReview
  }
}
