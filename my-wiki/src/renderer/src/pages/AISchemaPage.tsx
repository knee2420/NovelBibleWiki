// AI Schema Management Dashboard - Final Robust Version with Full Editing Support & Prompt Selection Options
import { useState, useEffect } from 'react'
import { Database, Plus, Trash2, Edit2, Save, Check, Loader2, BookOpen, X } from 'lucide-react'
import { SchemaWizard } from '../components/Analysis/SchemaWizard'

// Define the API interface for internal typing
interface WikiApi {
  loadAnalysisSchemas: (category: string) => Promise<{ success: boolean; schemas: SchemaFile[]; message?: string }>
  saveAnalysisSchema: (path: string, content: string) => Promise<{ success: boolean; error?: string }>
  deleteAnalysisSchema: (path: string) => Promise<{ success: boolean; error?: string }>
  createAnalysisSchema: (name: string, category: string) => Promise<{ success: boolean; path?: string; error?: string }>
  parseAnalysisSchema: (raw: string) => Promise<{ success: boolean; frontmatter: any; content: string; error?: string }>
  stringifyAnalysisSchema: (fm: any, content: string) => Promise<{ success: boolean; raw: string; error?: string }>
}

const api = window.api as unknown as WikiApi

interface SchemaFile {
  id: string
  name: string
  path: string
  frontmatter: any
  content: string
}

type Category = 'Characters' | 'Items' | 'Factions'

export const AISchemaPage = () => {
  const [category, setCategory] = useState<Category>('Characters')
  const [schemas, setSchemas] = useState<SchemaFile[]>([])
  const [selectedSchema, setSelectedSchema] = useState<SchemaFile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  // Manual Creation States
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false)
  const [isCreateManualOpen, setIsCreateManualOpen] = useState(false)
  const [newSchemaName, setNewSchemaName] = useState('')

  const [actionLoading, setActionLoading] = useState(false)
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const handleWizardSave = async (draft: string) => {
    setActionLoading(true)
    try {
      // 1. Parse draft to get name/module
      const parseRes = await api.parseAnalysisSchema(draft)
      let schemaName = 'New Schema'
      if (parseRes.success && parseRes.frontmatter) {
          schemaName = parseRes.frontmatter.analysis_module || 'New Schema'
      }

      // 2. Create file
      const createRes = await api.createAnalysisSchema(schemaName, category)
      if (createRes.success && createRes.path) {
          // 3. Save content
          await api.saveAnalysisSchema(createRes.path, draft)
          await loadSchemas()
          setIsWizardOpen(false)
      } else {
          alert(`Failed to create schema: ${createRes.error}`)
      }
    } catch (e) {
        console.error(e)
        alert('Failed to save schema wizard draft')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateManualSchema = async () => {
    if (!newSchemaName.trim()) return
    setActionLoading(true)
    try {
      const result = await api.createAnalysisSchema(newSchemaName.trim(), category)
      if (result.success) {
        setIsCreateManualOpen(false)
        setNewSchemaName('')
        await loadSchemas()
      } else {
        alert(result.error)
      }
    } finally {
      setActionLoading(false)
    }
  }

  // Manual Editing States
  const [isEditingManual, setIsEditingManual] = useState(false)
  const [manualEditValue, setManualEditValue] = useState('')

  // Item Modal State (For Add & Edit)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [itemModalConfig, setItemModalConfig] = useState<{
    section: string;
    mode: 'add' | 'edit';
    title: string;
    originalKey?: string;
    fields: { key: string; label: string; placeholder: string; type: string; options?: string[] }[];
  } | null>(null)
  const [itemModalValues, setItemModalValues] = useState<Record<string, string>>({})

  useEffect(() => {
    loadSchemas()
  }, [category])

  const loadSchemas = async () => {
    setSelectedSchema(null)
    try {
      const result = await api.loadAnalysisSchemas(category)
      if (result.success) {
        setSchemas(result.schemas || [])
      }
    } catch (error) {
      console.error('Error loading schemas:', error)
    }
  }

  const handleSelectSchema = (schema: SchemaFile) => {
    setSelectedSchema(schema)
    setIsEditing(false)
    setIsEditingManual(false)
  }

  const handleEditSource = async () => {
    if (!selectedSchema) return
    setActionLoading(true)
    try {
      const result = await api.stringifyAnalysisSchema(selectedSchema.frontmatter, selectedSchema.content)
      if (result.success) {
        setEditContent(result.raw)
        setIsEditing(true)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveSource = async () => {
    if (!selectedSchema) return
    setActionLoading(true)
    try {
      const result = await api.saveAnalysisSchema(selectedSchema.path, editContent)
      if (result.success) {
        setIsEditing(false)
        await refreshData()
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveManual = async () => {
    if (!selectedSchema) return
    setActionLoading(true)
    try {
      const stringRes = await api.stringifyAnalysisSchema(selectedSchema.frontmatter, manualEditValue)
      if (stringRes.success) {
        const saveRes = await api.saveAnalysisSchema(selectedSchema.path, stringRes.raw)
        if (saveRes.success) {
          setIsEditingManual(false)
          await refreshData()
        }
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteSchema = async () => {
    if (!selectedSchema) return
    if (!confirm('정말 삭제하시겠습니까?')) return
    setActionLoading(true)
    try {
      const result = await api.deleteAnalysisSchema(selectedSchema.path)
      if (result.success) {
        setSelectedSchema(null)
        await loadSchemas()
      }
    } finally {
      setActionLoading(false)
    }
  }



  const refreshData = async () => {
    if (!selectedSchema) return
    const result = await api.loadAnalysisSchemas(category)
    if (result.success) {
      setSchemas(result.schemas || [])
      const updated = result.schemas?.find(s => s.id === selectedSchema.id)
      if (updated) setSelectedSchema(updated)
    }
  }

  // Generic Field Update
  const updateFrontmatter = async (newFm: any) => {
    if (!selectedSchema) return
    setActionLoading(true)
    try {
      const stringRes = await api.stringifyAnalysisSchema(newFm, selectedSchema.content)
      if (stringRes.success) {
        const saveRes = await api.saveAnalysisSchema(selectedSchema.path, stringRes.raw)
        if (saveRes.success) {
          await refreshData()
        }
      }
    } finally {
      setActionLoading(false)
    }
  }

  const deleteField = async (section: string, key: string) => {
    if (!selectedSchema || !confirm(`${key} 항목을 삭제하시겠습니까?`)) return
    const fm = { ...selectedSchema.frontmatter }
    if (fm[section]) {
      const sectionCopy = { ...fm[section] }
      delete sectionCopy[key]
      fm[section] = sectionCopy
      await updateFrontmatter(fm)
    }
  }

  // Edit Modal Open Logic
  const openItemModal = (section: string, mode: 'add' | 'edit', initialData?: any) => {
    const configMap: Record<string, any> = {
      core: {
        section: 'core',
        title: '핵심 설정 수정',
        fields: [
          { 
            key: 'target_character', 
            label: '분석 대상 캐릭터', 
            placeholder: '분석 대상 선택', 
            type: 'select',
            options: ['{character_name}', '{all_characters}']
          },
          { 
            key: 'context_scope', 
            label: '컨텍스트 범위', 
            placeholder: '분석 범위 선택', 
            type: 'select',
            options: ['{selected_scenes}', '{entire_script}', '{selected_scenes_or_entire_script}']
          }
        ]
      },
      definitions: {
        section: 'definitions',
        title: mode === 'add' ? '새 정의 추가' : '정의 수정',
        fields: [
          { key: 'key', label: '키(Key)', placeholder: '예: key1', type: 'text' },
          { key: 'value', label: '설명(Value)', placeholder: '항목에 대한 설명 입력', type: 'textarea' }
        ]
      },
      output_requirements: {
        section: 'output_requirements',
        title: mode === 'add' ? '새 출력 요구사항 추가' : '요구사항 수정',
        fields: [
          { key: 'key', label: '항목명', placeholder: '예: language', type: 'text' },
          { key: 'value', label: '요구사항', placeholder: '예: 한국어', type: 'text' }
        ]
      },
      schema_structure: {
        section: 'schema_structure',
        title: mode === 'add' ? '새 출력 구조 필드 추가' : '구조 필드 수정',
        fields: [
          { key: 'name', label: '필드 이름', placeholder: '예: character_trait', type: 'text', disabled: mode === 'edit' },
          { key: 'type', label: '데이터 타입', placeholder: 'string / number / boolean', type: 'text' },
          { key: 'description', label: '필드 설명', placeholder: 'AI에게 전달할 필드 설명', type: 'textarea' }
        ]
      }
    }

    const config = configMap[section]
    if (config) {
      setItemModalConfig({ ...config, mode, originalKey: initialData?.key })
      setItemModalValues(initialData || {})
      setIsItemModalOpen(true)
    }
  }

  const handleItemModalSubmit = async () => {
    if (!selectedSchema || !itemModalConfig) return
    const fm = { ...selectedSchema.frontmatter }
    const { section, mode, originalKey } = itemModalConfig

    if (section === 'core') {
      fm.target_character = itemModalValues.target_character
      fm.context_scope = itemModalValues.context_scope
    } else if (section === 'schema_structure') {
      const { name, type, description } = itemModalValues
      if (!name) return
      if (!fm[section]) fm[section] = {}
      fm[section][name] = { type: type || 'string', description: description || '' }
    } else {
      const { key, value } = itemModalValues
      if (!key) return
      if (!fm[section]) fm[section] = {}
      if (mode === 'edit' && originalKey && originalKey !== key) {
        delete fm[section][originalKey]
      }
      fm[section][key] = value || ''
    }

    await updateFrontmatter(fm)
    setIsItemModalOpen(false)
  }

  const renderSchemaInfo = () => {
    if (!selectedSchema) return null
    const fm = selectedSchema.frontmatter

    return (
      <div className="space-y-6">
        {/* Module Header */}
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
              <Database size={24} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-purple-200 tracking-tight">
                {fm?.analysis_module || '분석 모듈 명칭 미지정'}
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                {fm?.analysis_persona || '시스템 가이드 미작성'}
              </p>
            </div>
          </div>
        </div>

        {/* Core Settings */}
        <div className="grid grid-cols-2 gap-4">
          <EditableVariableCard 
            label="분석 대상 캐릭터 (Input)" 
            value={fm?.target_character} 
            onEdit={() => openItemModal('core', 'edit', { target_character: fm.target_character, context_scope: fm.context_scope })}
          />
          <EditableVariableCard 
            label="컨텍스트 영역 (Range)" 
            value={fm?.context_scope} 
            onEdit={() => openItemModal('core', 'edit', { target_character: fm.target_character, context_scope: fm.context_scope })}
          />
        </div>

        {/* Definitions Section */}
        <Section title="기초 정의 (DEFINITIONS)" icon="📚" onAdd={() => openItemModal('definitions', 'add')}>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(fm?.definitions || {}).map(([key, value]) => (
              <EditableDefinitionCard
                key={key}
                term={key}
                definition={String(value)}
                onDelete={() => deleteField('definitions', key)}
                onStartEdit={() => openItemModal('definitions', 'edit', { key, value })}
              />
            ))}
          </div>
        </Section>

        {/* Structure Section */}
        <Section title="데이터 구조 (SCHEMA STRUCTURE)" icon="🔧" onAdd={() => openItemModal('schema_structure', 'add')}>
          <div className="space-y-2">
            {Object.entries(fm?.schema_structure || {}).map(([name, def]: [string, any]) => (
              <EditableFieldCard
                key={name}
                name={name}
                definition={def}
                onEdit={() => openItemModal('schema_structure', 'edit', { name, type: def.type, description: def.description })}
                onDelete={() => deleteField('schema_structure', name)}
              />
            ))}
          </div>
        </Section>

        {/* Requirements Section */}
        <Section title="출력 규칙 (OUTPUT REQUIREMENTS)" icon="✅" onAdd={() => openItemModal('output_requirements', 'add')}>
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
            {Object.entries(fm?.output_requirements || {}).map(([key, value]) => (
              <EditableOutputField
                key={key}
                fieldKey={key}
                value={String(value)}
                onStartEdit={() => openItemModal('output_requirements', 'edit', { key, value })}
                onDelete={() => deleteField('output_requirements', key)}
              />
            ))}
          </div>
        </Section>

        {/* Usage Manual Section (RE-DESIGNED) */}
        <div className="mt-12 group/manual pt-8 border-t border-white/5">
          <div className="flex items-center justify-between mb-4 px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <BookOpen size={16} className="text-blue-400" />
              사용법 및 분석 가이드 (MANUAL)
            </h4>
            {!isEditingManual && (
              <button 
                onClick={() => { setIsEditingManual(true); setManualEditValue(selectedSchema.content); }}
                className="p-1.5 hover:bg-blue-500/20 rounded-lg text-slate-500 hover:text-blue-400 border border-transparent hover:border-blue-500/30 transition-all cursor-pointer shadow-lg"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          
          {isEditingManual ? (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <textarea
                value={manualEditValue}
                onChange={(e) => setManualEditValue(e.target.value)}
                className="w-full h-80 bg-slate-950/50 border border-blue-500/30 rounded-[2.5rem] p-8 text-base font-medium text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10 leading-relaxed shadow-inner custom-scrollbar"
                placeholder="일반 사용자도 이해할 수 있도록 스키마의 목적과 사용법을 작성하세요..."
              />
              <div className="flex gap-3">
                <button 
                  onClick={handleSaveManual}
                  className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={18} /> SAVE GUIDE
                </button>
                <button 
                  onClick={() => setIsEditingManual(false)}
                  className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-500 font-black rounded-2xl cursor-pointer transition-all"
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-white/5 rounded-[2.5rem] p-10 shadow-inner min-h-[200px]">
              {selectedSchema.content ? (
                <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {selectedSchema.content}
                </pre>
              ) : (
                <div className="text-slate-700 italic flex items-center justify-center h-20 font-medium">
                  작성된 사용 가이드가 없습니다. 편집 버튼을 눌러 내용을 추가하세요.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-[2rem] border border-purple-500/30 shadow-2xl">
            <Database size={36} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent tracking-tighter">
              AI SCHEMA SETTINGS
            </h1>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mt-1 ml-1 opacity-60">Engine Protocol Management Console</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-12 bg-slate-900/50 p-2 rounded-2xl border border-white/5 w-fit shadow-inner">
        {(['Characters', 'Items', 'Factions'] as Category[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-10 py-4 rounded-xl text-sm font-black transition-all cursor-pointer ${
              category === cat
                ? 'bg-purple-600 text-white shadow-2xl shadow-purple-600/40 translate-y-[-2px]'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-10 items-start">
        {/* Sidebar */}
        <div className="col-span-4 sticky top-10">
          <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-2xl shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                SCHEMA REPOSITORY
              </h2>
              <button onClick={() => setIsSelectionModalOpen(true)} className="p-2.5 bg-white/5 hover:bg-purple-500/20 rounded-xl transition-all cursor-pointer text-slate-300 hover:text-purple-400 border border-transparent hover:border-purple-500/30">
                <Plus size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
              {schemas.map((schema) => (
                <button
                  key={schema.id}
                  onClick={() => handleSelectSchema(schema)}
                  className={`w-full text-left px-6 py-6 rounded-3xl transition-all border group cursor-pointer ${
                    selectedSchema?.id === schema.id ? 'bg-purple-600/10 border-purple-500/40 shadow-xl' : 'bg-transparent border-transparent hover:bg-white/[0.03]'
                  }`}
                >
                  <span className={`text-lg font-black tracking-tight ${selectedSchema?.id === schema.id ? 'text-purple-300' : 'text-slate-300'}`}>
                    {schema.name}
                  </span>
                  <div className="mt-1 opacity-40 text-[9px] font-black uppercase tracking-widest">{schema.frontmatter?.analysis_module || 'Parser'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="col-span-8">
          {selectedSchema ? (
            <div className="bg-slate-900/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-2xl shadow-2xl">
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.03]">
                <div>
                  <h3 className="text-4xl font-black text-white tracking-tighter uppercase">{selectedSchema.name}</h3>
                  <div className="text-[10px] text-slate-600 font-mono mt-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    {selectedSchema.path}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {isEditing ? (
                    <button onClick={handleSaveSource} disabled={actionLoading} className="flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white text-sm font-black rounded-2xl cursor-pointer shadow-2xl shadow-purple-600/30 active:scale-95">
                      {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={20} />} SAVE SOURCE
                    </button>
                  ) : (
                    <button onClick={handleEditSource} className="flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-white/5 text-slate-200 text-sm font-black rounded-2xl cursor-pointer active:scale-95">
                      <Edit2 size={20} /> SOURCE EDIT
                    </button>
                  )}
                  <button onClick={handleDeleteSchema} className="p-4 bg-red-900/10 hover:bg-red-900/40 text-red-500 rounded-2xl cursor-pointer active:scale-95">
                    <Trash2 size={24} />
                  </button>
                </div>
              </div>
              <div className="p-10">
                {isEditing ? (
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-[700px] bg-slate-950/50 border border-slate-700 rounded-[2.5rem] p-10 text-sm font-mono text-slate-300 outline-none focus:ring-4 focus:ring-purple-500/20 leading-8 resize-none shadow-inner" />
                ) : renderSchemaInfo()}
              </div>
            </div>
          ) : (
            <div className="h-[700px] flex flex-col items-center justify-center border-4 border-dashed border-slate-900 rounded-[4rem] bg-slate-900/5 p-20 text-center group">
              <div className="w-32 h-32 bg-slate-900/50 rounded-[3rem] flex items-center justify-center mb-10 transition-transform group-hover:scale-110 duration-500 shadow-2xl">
                <Database size={56} className="text-slate-800" />
              </div>
              <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-sm">Select Schema Protocol</p>
            </div>
          )}
        </div>
      </div>

      {/* Mode Selection Modal */}
      {isSelectionModalOpen && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[200] p-10 animate-in fade-in duration-300">
           <div className="w-full max-w-4xl grid grid-cols-2 gap-8 relative">
              <button onClick={() => setIsSelectionModalOpen(false)} className="absolute -top-16 right-0 text-slate-500 hover:text-white transition-colors cursor-pointer">
                <X size={32} />
              </button>

              {/* Option 1: AI Wizard */}
              <button 
                onClick={() => { setIsSelectionModalOpen(false); setIsWizardOpen(true); }}
                className="group relative bg-gradient-to-br from-purple-900/10 to-slate-900 border border-purple-500/20 hover:border-purple-500/50 rounded-[3rem] p-12 text-left transition-all hover:scale-[1.02] shadow-2xl hover:shadow-purple-500/20 flex flex-col justify-between h-[400px] cursor-pointer"
              >
                 <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all border border-purple-500/20">
                    <Database size={40} />
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-white mb-4 group-hover:text-purple-400 transition-colors uppercase tracking-tight">AI Architect</h3>
                    <p className="text-slate-400 text-sm font-bold leading-relaxed opacity-80">
                       Start with an interactive AI session. Discuss your analytical goals (e.g., "Villain Psychology") and let the AI design the perfect schema for you.
                    </p>
                 </div>
              </button>

              {/* Option 2: Manual */}
              <button 
                onClick={() => { setIsSelectionModalOpen(false); setIsCreateManualOpen(true); }}
                className="group relative bg-gradient-to-br from-blue-900/10 to-slate-900 border border-blue-500/20 hover:border-blue-500/50 rounded-[3rem] p-12 text-left transition-all hover:scale-[1.02] shadow-2xl hover:shadow-blue-500/20 flex flex-col justify-between h-[400px] cursor-pointer"
              >
                 <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all border border-blue-500/20">
                    <Edit2 size={40} />
                 </div>
                 <div>
                    <h3 className="text-4xl font-black text-white mb-4 group-hover:text-blue-400 transition-colors uppercase tracking-tight">Manual Engineer</h3>
                    <p className="text-slate-400 text-sm font-bold leading-relaxed opacity-80">
                       Create a blank schema protocol and manually configure every field, definition, and output requirement from scratch.
                    </p>
                 </div>
              </button>
           </div>
        </div>
      )}

      {/* Manual Creation Modal */}
      {isCreateManualOpen && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[200] p-10 animate-in fade-in duration-300">
           <div className="bg-slate-900 border border-white/10 rounded-[4rem] p-16 w-full max-w-xl shadow-inner relative">
            <button onClick={() => setIsCreateManualOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white cursor-pointer"><X size={24} /></button>
            <h3 className="text-4xl font-black text-white mb-12 tracking-tighter uppercase">MANUAL PROTOCOL</h3>
            <div className="mb-16">
              <label className="block text-[11px] text-slate-500 uppercase font-black tracking-[0.3em] mb-6 ml-4">Identifier</label>
              <input
                type="text"
                value={newSchemaName}
                onChange={(e) => setNewSchemaName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateManualSchema()}
                placeholder="e.g., character_dynamic_relations"
                className="w-full px-8 py-6 bg-slate-950 border border-slate-800 rounded-[2rem] text-white outline-none focus:ring-4 focus:ring-blue-500/20 text-xl shadow-inner placeholder-slate-700"
              />
            </div>
            <button onClick={handleCreateManualSchema} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] transition-all active:scale-95 shadow-2xl shadow-blue-600/20 text-lg cursor-pointer">INITIALIZE</button>
           </div>
        </div>
      )}

      {/* Dynamic Item Modal */}
      {isItemModalOpen && itemModalConfig && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[200] p-10 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 rounded-[4rem] p-16 w-full max-w-2xl shadow-[0_0_200px_rgba(168,85,247,0.2)] animate-in zoom-in-95 duration-300">
            <h3 className="text-5xl font-black text-white mb-12 tracking-tighter uppercase">{itemModalConfig.title}</h3>
            <div className="space-y-10 mb-16 max-h-[60vh] overflow-y-auto custom-scrollbar pr-4">
              {itemModalConfig.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-[11px] text-slate-500 font-black tracking-[0.3em] uppercase mb-4 ml-4">{field.label}</label>
                  
                  {field.type === 'select' && field.options ? (
                    <div className="grid grid-cols-1 gap-3">
                      {field.options.map(opt => (
                        <button
                          key={opt}
                          onClick={() => setItemModalValues({ ...itemModalValues, [field.key]: opt })}
                          className={`w-full px-8 py-5 rounded-[2rem] text-left transition-all border font-bold ${
                            itemModalValues[field.key] === opt 
                              ? 'bg-purple-600 border-purple-500 text-white shadow-lg' 
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono">{opt}</span>
                            {itemModalValues[field.key] === opt && <Check size={20} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={itemModalValues[field.key] || ''}
                      onChange={(e) => setItemModalValues({ ...itemModalValues, [field.key]: e.target.value })}
                      rows={6}
                      className="w-full px-8 py-6 bg-slate-950 border border-slate-800 rounded-[3rem] text-white outline-none focus:ring-4 focus:ring-purple-500/20 text-lg shadow-inner leading-relaxed resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={itemModalValues[field.key] || ''}
                      onChange={(e) => setItemModalValues({ ...itemModalValues, [field.key]: e.target.value })}
                      disabled={(field as any).disabled}
                      className="w-full px-8 py-6 bg-slate-950 border border-slate-800 rounded-[2rem] text-white outline-none focus:ring-4 focus:ring-purple-500/20 text-lg shadow-inner disabled:opacity-40"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-6">
              <button onClick={handleItemModalSubmit} className="flex-1 py-6 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-[2rem] transition-all shadow-2xl shadow-purple-600/30 cursor-pointer active:scale-95 text-lg">
                CONFIRM & UPDATE
              </button>
              <button onClick={() => setIsItemModalOpen(false)} className="px-12 py-6 bg-slate-800 hover:bg-slate-700 text-slate-500 font-black rounded-[2rem] cursor-pointer transition-all">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      <SchemaWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onSave={handleWizardSave} />
    </div>
  )
}

// ──────── Internal UI Components ──────────────────────────────────────────────

const Section = ({ title, icon, onAdd, children }: { title: string; icon: string; onAdd: () => void; children: React.ReactNode }) => (
  <div className="group/section">
    <div className="flex items-center justify-between mb-5 px-1">
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
        <span className="text-xl opacity-80 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{icon}</span> {title}
      </h4>
      <button onClick={onAdd} className="p-2.5 bg-white/5 hover:bg-blue-500/20 rounded-xl transition-all cursor-pointer text-slate-500 hover:text-blue-400 border border-transparent hover:border-blue-500/30 shadow-lg">
        <Plus size={20} />
      </button>
    </div>
    {children}
  </div>
)

const EditableVariableCard = ({ label, value, onEdit }: { label: string; value: any; onEdit: () => void }) => (
  <div className="bg-slate-950/40 border border-purple-500/10 rounded-[2rem] p-6 shadow-inner group relative transition-all hover:border-purple-500/40 hover:bg-purple-500/[0.02]">
    <div className="text-[9px] text-purple-400 uppercase font-black tracking-widest mb-2 opacity-60">{label}</div>
    <div className="text-base text-slate-200 font-mono font-bold tracking-tight">{String(value || 'UNSET')}</div>
    <button onClick={onEdit} className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl cursor-pointer shadow-lg"><Edit2 size={16} /></button>
  </div>
)

const EditableDefinitionCard = ({ term, definition, onDelete, onStartEdit }: any) => (
  <div className="bg-slate-950/40 border border-blue-500/5 hover:border-blue-500/20 rounded-[2rem] p-6 group relative transition-all shadow-xl">
    <div className="text-sm text-blue-400 font-black mb-3 tracking-tight uppercase flex items-center justify-between pr-10">
      {term}
    </div>
    <div className="text-xs text-slate-500 leading-relaxed pr-8 font-medium line-clamp-3">{definition}</div>
    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2">
      <button onClick={onStartEdit} className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl cursor-pointer shadow-lg"><Edit2 size={14} /></button>
      <button onClick={onDelete} className="p-2 bg-red-900/10 hover:bg-red-900/40 text-red-500 rounded-xl cursor-pointer shadow-lg"><Trash2 size={14} /></button>
    </div>
  </div>
)

const EditableFieldCard = ({ name, definition, onEdit, onDelete }: any) => (
  <div className="bg-slate-950/40 border border-white/5 hover:border-purple-500/20 rounded-[2rem] p-7 group relative transition-all shadow-inner">
    <div className="flex items-start gap-5 pr-20">
      <div className="flex-1">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xl text-purple-400 font-mono font-black tracking-tighter">{name}</span>
          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-500 text-[9px] rounded-xl font-black tracking-[0.3em] uppercase">{definition.type}</span>
        </div>
        <p className="text-sm text-slate-600 font-bold leading-relaxed">{definition.description}</p>
      </div>
      <div className="absolute top-7 right-7 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2">
        <button onClick={onEdit} className="p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl cursor-pointer shadow-lg"><Edit2 size={16} /></button>
        <button onClick={onDelete} className="p-2.5 bg-red-900/10 hover:bg-red-900/40 text-red-500 rounded-xl cursor-pointer shadow-lg"><Trash2 size={16} /></button>
      </div>
    </div>
  </div>
)

const EditableOutputField = ({ fieldKey, value, onStartEdit, onDelete }: any) => (
  <div className="flex items-center gap-6 group relative py-4 px-6 hover:bg-white/[0.04] rounded-[1.5rem] transition-all border border-transparent hover:border-white/5">
    <span className="text-[10px] text-slate-600 uppercase font-black tracking-[0.3em] w-36 shrink-0">{fieldKey}</span>
    <span className="text-base text-slate-300 font-black tracking-tight flex-1">{value}</span>
    <div className="absolute top-1/2 -translate-y-1/2 right-6 opacity-0 group-hover:opacity-100 transition-all flex gap-3">
      <button onClick={onStartEdit} className="p-2.5 hover:bg-blue-500/20 text-blue-400 rounded-xl cursor-pointer shadow-lg"><Edit2 size={16} /></button>
      <button onClick={onDelete} className="p-2.5 hover:bg-red-500/20 text-red-500 rounded-xl cursor-pointer shadow-lg"><Trash2 size={16} /></button>
    </div>
  </div>
)
