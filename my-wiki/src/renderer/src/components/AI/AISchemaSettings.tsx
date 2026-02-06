import { useState, useEffect } from 'react'
import { Save, RotateCcw, AlertCircle, CheckCircle2, Sparkles, Layers, User, Box, Map, Shield } from 'lucide-react'
import { SchemaProperty, DEFAULT_SCHEMAS } from '../../../../shared/types/schema-config'
import { SchemaBuilder } from './SchemaBuilder'

type SchemaTarget = 'scene' | 'character' | 'item' | 'location' | 'faction'

export const AISchemaSettings = () => {
  const [selectedTarget, setSelectedTarget] = useState<SchemaTarget>('scene')
  const [rootSchema, setRootSchema] = useState<SchemaProperty>(DEFAULT_SCHEMAS.scene)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadSettings(selectedTarget)
  }, [selectedTarget])

  const loadSettings = async (target: SchemaTarget) => {
    try {
      setLoading(true)
      // @ts-ignore
      const loaded = await window.api.getSchemaConfig(target)
      if (loaded) {
          setRootSchema(loaded)
      } else {
          setRootSchema(DEFAULT_SCHEMAS[target] || DEFAULT_SCHEMAS.scene)
      }
    } catch (e) {
      console.error(e)
      setMsg({ type: 'error', text: 'Failed to load schema config' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setMsg(null)
      // @ts-ignore
      const res = await window.api.saveSchemaConfig({ root: rootSchema, target: selectedTarget })

      if (res && res.success) {
          setMsg({ type: 'success', text: '스키마가 저장되었습니다!' })
      } else {
          setMsg({ type: 'error', text: res?.message || '저장 실패' })
      }
    } catch (e) {
      setMsg({ type: 'error', text: '저장 오류 발생' })
      console.error(e)
    }
  }

  const handleReset = async () => {
      if(!confirm('기본 설정으로 초기화하시겠습니까? 커스텀 설정이 삭제됩니다.')) return
      const defaultSchema = DEFAULT_SCHEMAS[selectedTarget]
      setRootSchema(defaultSchema)
      setMsg({ type: 'success', text: '기본값으로 초기화됨 (저장 필요)' })
  }

  const targets: { id: SchemaTarget, label: string, icon: any }[] = [
      { id: 'scene', label: '장면 분석 (Scene)', icon: Layers },
      { id: 'character', label: '캐릭터 (Character)', icon: User },
      { id: 'item', label: '아이템 (Item)', icon: Box },
      { id: 'location', label: '장소 (Location)', icon: Map },
      { id: 'faction', label: '세력 (Faction)', icon: Shield },
  ]

  return (
    <div className="flex h-full bg-[#1e1e1e] rounded-xl border border-slate-800 overflow-hidden text-slate-300 font-sans">
        
        {/* Sidebar */}
        <div className="w-48 bg-slate-900 border-r border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-800 font-bold text-slate-400 text-xs uppercase tracking-wider">
                Schemas
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {targets.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSelectedTarget(t.id)}
                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors
                            ${selectedTarget === t.id ? 'bg-[#2a2d3e] text-blue-300 border-r-2 border-blue-500' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                    >
                        <t.icon size={16} />
                        {t.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
             {/* Header */}
            <div className="px-6 py-4 border-b border-slate-700 bg-[#1e1e1e] flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-white flex items-center gap-2">
                        {targets.find(t => t.id === selectedTarget)?.label} 스키마
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                        {selectedTarget === 'scene' ? 'AI 장면 분석 시 추출할 데이터 구조입니다.' : `Wiki의 ${selectedTarget} 기본 데이터 구조입니다.`}
                    </p>
                </div>
                
                {msg && (
                    <div className={`px-3 py-1 rounded text-xs flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                        {msg.text}
                    </div>
                )}
            </div>

            {/* Builder Content */}
            <div className="flex-1 overflow-auto p-6 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500 gap-2">
                        <Sparkles className="animate-spin" /> 불러오는 중...
                    </div>
                ) : (
                    <div className="w-full">
                        <SchemaBuilder root={rootSchema} onChange={setRootSchema} />
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-700 bg-[#1e1e1e] flex justify-end gap-3">
                <button 
                    onClick={handleReset}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                >
                    <RotateCcw size={14} /> 초기화 ({targets.find(t => t.id === selectedTarget)?.id})
                </button>
                <button 
                    onClick={handleSave}
                    className="px-5 py-2 text-xs font-bold text-[#1e1e1e] bg-[#8ab4f8] hover:bg-[#a1c3f9] rounded flex items-center gap-2 transition-all"
                >
                    <Save size={14} /> 저장
                </button>
            </div>
        </div>
    </div>
  )
}
