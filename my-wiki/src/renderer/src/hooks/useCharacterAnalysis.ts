// Hook for managing character analysis topics (CRUD operations)
import { useState, useEffect } from 'react'
import { CharacterAnalysisTopic, AnalysisSchema } from '../types/analysis-schema'
import { WikiEntry } from '../types/wiki'
import { analyzeCharacter, createAnalysisTopic } from '../services/analysisAIService'

export function useCharacterAnalysis(characterId: string) {
  const [topics, setTopics] = useState<CharacterAnalysisTopic[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  // Load existing analysis topics from character frontmatter
  useEffect(() => {
    loadTopics()
  }, [characterId])

  const loadTopics = async () => {
    setLoading(true)
    try {
      // @ts-ignore
      const result = await window.api.getCharacterAnalysisTopics(characterId)
      if (result.success) {
        setTopics(result.topics || [])
      }
    } catch (error) {
      console.error('Failed to load analysis topics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Create new analysis topic
  const executeAnalysis = async (
    schema: AnalysisSchema,
    character: WikiEntry,
    scenes: Array<{ id: string; title: string; summary: string; content: string }>
  ): Promise<{ success: boolean; error?: string }> => {
    setAnalyzing(true)
    
    try {
      // Call AI analysis service
      const result = await analyzeCharacter({ schema, character, scenes })
      
      if (!result.success) {
        return { success: false, error: result.error }
      }

      // Create new topic
      const newTopic = createAnalysisTopic(
        characterId,
        schema,
        scenes.map(s => s.id),
        result.data!
      )

      // Save to backend
      // @ts-ignore
      const saveResult = await window.api.saveCharacterAnalysis(characterId, newTopic)
      
      if (!saveResult.success) {
        return { success: false, error: saveResult.error }
      }

      // Update local state
      setTopics(prev => [...prev, newTopic])
      
      return { success: true }
    } catch (error) {
      console.error('Analysis execution error:', error)
      return { success: false, error: String(error) }
    } finally {
      setAnalyzing(false)
    }
  }

  // Update existing topic
  const updateTopic = async (
    topicId: string,
    updatedData: Partial<CharacterAnalysisTopic>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedTopic = {
        ...topics.find(t => t.id === topicId)!,
        ...updatedData,
        updatedAt: new Date().toISOString()
      }

      // @ts-ignore
      const result = await window.api.updateCharacterAnalysis(characterId, updatedTopic)
      
      if (!result.success) {
        return { success: false, error: result.error }
      }

      setTopics(prev => prev.map(t => t.id === topicId ? updatedTopic : t))
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  // Delete topic
  const deleteTopic = async (topicId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // @ts-ignore
      const result = await window.api.deleteCharacterAnalysis(characterId, topicId)
      
      if (!result.success) {
        return { success: false, error: result.error }
      }

      setTopics(prev => prev.filter(t => t.id !== topicId))
      return { success: true }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  return {
    topics,
    loading,
    analyzing,
    executeAnalysis,
    updateTopic,
    deleteTopic,
    reload: loadTopics
  }
}
