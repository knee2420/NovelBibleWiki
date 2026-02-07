import { useState, useEffect } from 'react'
import { Sparkles, Check, X, RotateCcw, Key, Activity, Box, Map, Shield } from 'lucide-react'
import { aiService } from '../../services/aiService'
import { SceneSchema } from '../../../../shared/types/ai-schema'
import { SceneFieldConfig } from '../../../../shared/types/field-config'
import { WikiDataRenderer } from '../Shared/WikiDataRenderer'

interface AIAnalyzePanelProps {
  initialText?: string
  onApply: (data: any) => void
  onClose: () => void
}

export const AIAnalyzePanel = ({ initialText = '', onApply, onClose }: AIAnalyzePanelProps) => {
  const [inputText, setInputText] = useState(initialText)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<Partial<SceneSchema> | null>(null)
  
  // [NEW] API Key State
  const [hasKey, setHasKey] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)

  // [NEW] Field Config for Dynamic Display
  const [fieldConfig, setFieldConfig] = useState<SceneFieldConfig[]>([])

  useEffect(() => {
    checkKey()
    loadConfig()
  }, [])

  const checkKey = async () => {
    const exists = await aiService.hasApiKey()
    setHasKey(exists)
    if (!exists) setShowKeyInput(true)
  }

  const loadConfig = async () => {
      try {
          // @ts-ignore
          const config = await window.api.getFieldConfig()
          if (config) {
              // Sort by order so preview matches edit form
              setFieldConfig(config.scene.sort((a,b) => (a.order||99) - (b.order||99)))
          }
      } catch (e) {
          console.error(e)
      }
  }

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return
    const success = await aiService.saveApiKey(apiKeyInput)
    if (success) {
      setHasKey(true)
      setShowKeyInput(false)
      alert('API Key saved!')
    }
  }

  const handleAnalyze = async () => {
    if (!inputText.trim()) return
    
    if (!hasKey) {
      setShowKeyInput(true)
      return
    }

    setIsAnalyzing(true)
    try {
      const data = await aiService.analyzeScene(inputText)
      setResult(data)
    } catch (error: any) {
      console.error(error)
      if (error.message.includes('API Key not found')) {
         setHasKey(false)
         setShowKeyInput(true)
         alert('API Key가 없거나 유효하지 않습니다.')
      } else {
         alert('분석 실패: ' + error.message)
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleApply = () => {
    if (result) {
      onApply(result)
      onClose()
    }
  }

  // Helper to render dynamic values
  const renderValue = (_key: string, value: any, type: string) => {
      if (type === 'array' || Array.isArray(value)) {
          return (
             <div className="flex flex-wrap gap-1">
                {(value as string[]).map((v, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] border border-indigo-500/20">{v}</span>
                ))}
             </div>
          )
      }
      if (type === 'textarea' && typeof value === 'string') {
          return (
              <div className="text-slate-300 leading-relaxed bg-slate-900 p-2 rounded border border-slate-800/50 whitespace-pre-wrap">
                  {value}
              </div>
          )
      }
      return <div className="text-slate-200 font-bold break-all">{String(value)}</div>
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700 w-[450px] shadow-2xl animate-in slide-in-from-right duration-300 absolute right-0 top-0 bottom-0 z-30">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          Smart Analyze (Gemini)
        </h3>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* [NEW] API Key Input Area */}
        {(!hasKey || showKeyInput) && (
           <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                 <Key size={14} /> Gemini API Key Required
              </div>
              <p className="text-[10px] text-amber-200/80">
                 Google AI Studio에서 발급받은 키를 입력해주세요.
              </p>
              <div className="flex gap-2">
                 <input 
                   type="password" 
                   value={apiKeyInput}
                   onChange={(e) => setApiKeyInput(e.target.value)}
                   className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                   placeholder="AIzaSy..."
                 />
                 <button 
                   onClick={handleSaveKey}
                   className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold"
                 >
                   Save
                 </button>
              </div>
           </div>
        )}

        {/* Step 1: Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase">1. 본문 텍스트</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-40 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 focus:border-purple-500 outline-none resize-none"
            placeholder="분석할 씬의 본문을 여기에 붙여넣거나 수정하세요."
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputText.trim()}
            className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${
                isAnalyzing
                  ? 'bg-slate-800 text-slate-500 cursor-wait'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20'
              }`}
          >
            {isAnalyzing ? (
              <>Gemini가 분석 중...</>
            ) : (
              <>
                <Sparkles size={14} /> AI 분석 실행
              </>
            )}
          </button>
        </div>

        {/* Step 2: Result Preview */}
        {result && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-green-400 uppercase">2. 분석 결과</label>
              <button 
                onClick={() => setResult(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
              >
                <RotateCcw size={10} /> 다시 하기
              </button>
            </div>
            
            <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 space-y-4 text-xs">
              {/* Dynamic Field Loop */}
              {fieldConfig.map(field => {
                  // Internal fields are handled separately or hidden? 
                  // Title is header, Type/Chapter/Scene usually hidden or header
                  if (field.isInternal && field.key !== 'title' && !field.key.startsWith('wiki-')) return null;
                  
                  const value = result[field.key]
                  if (!value && field.key !== 'wiki-data') return null // Skip empty
                  
                  // Special Header for Title
                  if (field.key === 'title') {
                      return (
                           <div key={field.key} className="pb-3 border-b border-slate-800/50">
                                <span className="text-slate-500 block mb-1">제목 (ep.{result.chapter}-{result.scene})</span>
                                <div className="text-slate-200 font-bold text-lg">{value}</div>
                           </div>
                      )
                  }
                  
                  // Wiki Data Special Renders
                  if (field.key === 'wiki-data') {
                      return <WikiDataRenderer data={result['wiki-data']} key={field.key} title="Character Graph Data" icon={Activity} />
                  }
                  if (field.key === 'wiki-item-data') {
                      return <WikiDataRenderer data={result['wiki-item-data']} key={field.key} title="Item Updates" icon={Box} />
                  }
                  if (field.key === 'wiki-location-data') {
                      return <WikiDataRenderer data={result['wiki-location-data']} key={field.key} title="Location Updates" icon={Map} />
                  }
                  if (field.key === 'wiki-faction-data') {
                      return <WikiDataRenderer data={result['wiki-faction-data']} key={field.key} title="Faction Updates" icon={Shield} />
                  }

                  // Generic Render
                  return (
                      <div key={field.key}>
                          <span className="text-slate-500 block mb-1">{field.label}</span>
                          {renderValue(field.key, value, field.type)}
                      </div>
                  )
              })}
              
              {/* Fallback for keys NOT in config (if any) e.g. leftovers from experiment */}
               <div className="pt-2 border-t border-slate-800/30">
                  {Object.keys(result)
                      .filter(k => 
                          !fieldConfig.some(f => f.key === k) && 
                          !['type', 'chapter', 'scene'].includes(k) // omit these
                      )
                      .map(key => {
                          if (key === 'wiki-data') return <WikiDataRenderer data={result[key]} title="Character Graph Data" icon={Activity} key={key} />
                          if (key === 'wiki-item-data') return <WikiDataRenderer data={result[key]} title="Item Updates" icon={Box} key={key} />
                          if (key === 'wiki-location-data') return <WikiDataRenderer data={result[key]} title="Location Updates" icon={Map} key={key} />
                          if (key === 'wiki-faction-data') return <WikiDataRenderer data={result[key]} title="Faction Updates" icon={Shield} key={key} />
                          
                          return (
                             <div key={key} className="mt-2 text-slate-500">
                                 <div className="uppercase text-[10px] font-bold">{key}</div>
                                 <div className="text-slate-400 break-all">{JSON.stringify(result[key])}</div>
                             </div>
                          )
                      })
                  }
               </div>

            </div>

            <button
              onClick={handleApply}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 transition-all"
            >
              <Check size={16} /> 적용하기 (Apply)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
