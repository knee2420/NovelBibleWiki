// Hook for loading analysis schemas from filesystem
import { useState, useEffect } from 'react'
import { AnalysisSchema } from '../types/analysis-schema'
import { loadSchemas } from '../services/schemaService'

export function useSchemaLoader() {
  const [schemas, setSchemas] = useState<AnalysisSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAvailableSchemas = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const loadedSchemas = await loadSchemas()
      setSchemas(loadedSchemas)
    } catch (err) {
      console.error('Failed to load schemas:', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAvailableSchemas()
  }, [])

  return {
    schemas,
    loading,
    error,
    reload: loadAvailableSchemas
  }
}
