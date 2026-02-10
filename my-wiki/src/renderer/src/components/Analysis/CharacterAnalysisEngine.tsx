// Character Analysis Engine - Main component for the Mindset subtab
import { useState } from 'react'
import { Brain, Zap, Loader2, AlertCircle } from 'lucide-react'
import { WikiEntry } from '../../types/wiki'
import { useSchemaLoader } from '../../hooks/useSchemaLoader'
import { useCharacterAnalysis } from '../../hooks/useCharacterAnalysis'
import { SchemaSelector } from './SchemaSelector'
import { CharacterSceneList } from './CharacterSceneList'
import { AnalysisTopicCard } from './AnalysisTopicCard'

interface CharacterAnalysisEngineProps {
  character: WikiEntry
  aliases?: string[]
  onOpenScene?: (sceneId: string) => void
}

export const CharacterAnalysisEngine = ({
  character,
  aliases = [],
  onOpenScene
}: CharacterAnalysisEngineProps) => {
  const { schemas, loading: schemasLoading } = useSchemaLoader()
  const {
    topics,
    analyzing,
    executeAnalysis,
    updateTopic,
    deleteTopic
  } = useCharacterAnalysis(character.id)

  const [selectedSchemas, setSelectedSchemas] = useState<string[]>([])
  const [selectedScenes, setSelectedScenes] = useState<string[]>([])
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const handleExecuteAnalysis = async () => {
    if (selectedSchemas.length === 0) {
      alert('분석할 스키마를 선택해주세요.')
      return
    }

    if (selectedScenes.length === 0) {
      alert('분석할 씬을 선택해주세요.')
      return
    }

    setAnalysisError(null)

    // Execute analysis for each selected schema
    for (const schemaId of selectedSchemas) {
      const schema = schemas.find(s => s.id === schemaId)
      if (!schema) continue

      // Fetch scene details
      try {
        // @ts-ignore
        const sceneResult = await window.api.getSceneDetails(selectedScenes)
        
        if (!sceneResult.success) {
          setAnalysisError(`씬 정보 로드 실패: ${sceneResult.error}`)
          return
        }

        const result = await executeAnalysis(schema, character, sceneResult.scenes)
        
        if (!result.success) {
          setAnalysisError(`분석 실패 (${schema.name}): ${result.error}`)
          return
        }
      } catch (error) {
        setAnalysisError(`에러: ${String(error)}`)
        return
      }
    }

    // Reset selection after successful analysis
    setSelectedSchemas([])
    setSelectedScenes([])
  }

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col bg-[#0b0e14]">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="text-pink-400" size={24} />
          <h2 className="text-xl font-bold text-slate-100">캐릭터 심층 분석 엔진</h2>
        </div>
        <p className="text-sm text-slate-500">
          다양한 심리학적 프레임워크를 활용하여 캐릭터의 내면을 분석합니다.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-8">
          {/* New Analysis Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-200">새로운 분석 생성</h3>
            </div>

            {/* Schema Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. 분석 스키마 선택
              </label>
              <SchemaSelector
                schemas={schemas}
                selectedSchemas={selectedSchemas}
                onSelectionChange={setSelectedSchemas}
                loading={schemasLoading}
              />
            </div>

            {/* Scene Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. 분석할 씬 선택
              </label>
              <CharacterSceneList
                characterName={character.name}
                aliases={aliases}
                selectedScenes={selectedScenes}
                onSelectionChange={setSelectedScenes}
                onOpenScene={onOpenScene}
              />
            </div>

            {/* Execute Button */}
            <div className="pt-4 border-t border-slate-800">
              {analysisError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2 text-sm text-red-400">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{analysisError}</span>
                </div>
              )}

              <button
                onClick={handleExecuteAnalysis}
                disabled={analyzing || selectedSchemas.length === 0 || selectedScenes.length === 0}
                className={`
                  w-full px-6 py-3 rounded-lg font-bold text-sm
                  flex items-center justify-center gap-2
                  transition-all duration-200
                  ${analyzing
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : selectedSchemas.length === 0 || selectedScenes.length === 0
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-500/20'
                  }
                `}
              >
                {analyzing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Zap size={18} />
                    분석 실행
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Existing Topics Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between border-t border-slate-800 pt-8">
              <h3 className="text-lg font-bold text-slate-200">저장된 분석 결과</h3>
              <span className="text-xs text-slate-500">{topics.length}개</span>
            </div>

            {topics.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic border border-dashed border-slate-800 rounded-lg">
                <Brain size={48} className="mx-auto mb-4 opacity-20" />
                <p>아직 저장된 분석 결과가 없습니다.</p>
                <p className="text-xs mt-2">위에서 스키마와 씬을 선택하여 분석을 시작하세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topics.map(topic => (
                  <AnalysisTopicCard
                    key={topic.id}
                    topic={topic}
                    onUpdate={updateTopic}
                    onDelete={deleteTopic}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
