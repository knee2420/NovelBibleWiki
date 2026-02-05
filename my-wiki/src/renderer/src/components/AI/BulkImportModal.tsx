import { useState } from 'react'
import { X, Sparkles, UploadCloud, Play, CheckCircle, FileText, ArrowRight, Trash2, Plus } from 'lucide-react'
import { aiService } from '../../services/aiService'
import { WikiEntry } from '../../types/wiki'
import { CharacterReviewModal } from './CharacterReviewModal'
import { useCharacterReview } from '../../hooks/useCharacterReview'

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: any) => void
  actPath?: string
  wikiData?: WikiEntry[] // [NEW]
}

interface SourceFile {
  id: string
  name: string
  content: string
  size: number
}

// Removed inline interfaces as they are imported or used in hook

export const BulkImportModal = ({ isOpen, onClose, onComplete, actPath, wikiData = [] }: BulkImportModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1) // 1: Input, 2: Structure Review, 3: Processing
  const [sources, setSources] = useState<SourceFile[]>([])
  const [inputText, setInputText] = useState('') // Direct text input
  
  const [structure, setStructure] = useState<any[]>([])
  const [processingLog, setProcessingLog] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // [Hook] Use Character Review
  const { 
      isReviewing, 
      pendingReviews, 
      reviewIndex, 
      decisions, 
      detectNewCharacters, 
      handleReviewAction, 
      waitForReview,
      resetReview
  } = useCharacterReview(wikiData)

  // [New] Selection State: "chapIdx-sceneIdx" -> boolean
  const [selection, setSelection] = useState<Record<string, boolean>>({})

  const toggleScene = (chapIdx: number, sceneIdx: number) => {
    const key = `${chapIdx}-${sceneIdx}`
    setSelection(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleChapter = (chapIdx: number, checked: boolean) => {
    setStructure(prev => {
        // Find how many scenes this chapter has
        const chapter = prev[chapIdx]
        const newSelection = { ...selection }
        chapter.scenes.forEach((_:any, j:number) => {
            newSelection[`${chapIdx}-${j}`] = checked
        })
        setSelection(newSelection)
        return prev
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleSelectFiles = async () => {
    try {
      // @ts-ignore
      const files = await window.api.selectMultipleFiles()
      if (files && files.length > 0) {
        const newSources = files.map((f: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          name: f.name,
          content: f.content,
          size: f.content.length
        }))
        setSources((prev) => [...prev, ...newSources])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setSources((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            content: text,
            size: text.length
          }
        ])
      }
      reader.readAsText(file)
    })
  }

  const removeSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id))
  }

  const handleParseStructure = async () => {
    const combinedText = [
      ...sources.map((s) => `\n\n[FILE START: ${s.name}]\n${s.content}\n[FILE END]\n`),
      inputText
    ].join('\n')

    if (!combinedText.trim()) {
        alert('분석할 내용이 없습니다.')
        return
    }

    setIsProcessing(true)
    try {
      const result = await aiService.parseStructure(combinedText)
      setStructure(result)

      // [New] Initialize Selection (All Selected)
      const initialSelection: Record<string, boolean> = {}
      result.forEach((chap: any, i: number) => {
          chap.scenes.forEach((_: any, j: number) => {
              initialSelection[`${i}-${j}`] = true
          })
      })
      setSelection(initialSelection)

      setStep(2)
    } catch (error) {
      console.error(error)
      alert('구조 분석 실패')
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Removed detectNewCharacters and handleReviewAction (using hook)


  const handleProcessImport = async () => {
    // 0. Check Act Path
    if (!actPath) {
        alert('저장할 막(Act)이 선택되지 않았습니다. 메인 화면에서 막을 선택해주세요.')
        return
    }

    // 1. Check API Key
    const hasKey = await aiService.hasApiKey()
    if (!hasKey) {
        const key = prompt('Gemini API Key가 필요합니다. 키를 입력해주세요:')
        if (!key) return
        await aiService.saveApiKey(key)
    }

    setStep(3)
    setProcessingLog([])
    setIsProcessing(true)

    try {
      // Real Processing Loop
      for (let i = 0; i < structure.length; i++) {
        const chapter = structure[i]
        
        // [New] Filter Selected Scenes
        const selectedScenes = chapter.scenes.filter((_:any, j:number) => selection[`${i}-${j}`])
        
        if (selectedScenes.length === 0) {
            setProcessingLog((prev) => [...prev, `⏭️ 챕터 건너뜀 (선택된 씬 없음): ${chapter.title}`])
            continue
        }

        setProcessingLog((prev) => [...prev, `📂 챕터 생성 중: ${chapter.title}...`])
        
        // 1. Create Chapter
        // @ts-ignore
        const createdChapterPath = await window.api.createChapter(actPath, chapter.title)
        
        if (!createdChapterPath) {
             setProcessingLog((prev) => [...prev, `    ❌ 챕터 생성 실패: ${chapter.title}`])
             continue
        }

        for (const scene of selectedScenes) {
          setProcessingLog((prev) => [...prev, `  └─ 📝 씬 생성 및 분석 (Gemini): ${scene.title}...`])
          
          try {
             // 2. Create Scene File
             // @ts-ignore
             const createdScenePath = await window.api.createScene(createdChapterPath, scene.title)
             
             if (!createdScenePath) {
                 throw new Error('씬 파일 생성 실패')
             }

             // 3. AI Analysis
             const aiResult = await aiService.analyzeScene(scene.content)
             setProcessingLog((prev) => [...prev, `     ✨ AI 분석 완료. 저장 중...`])

             // [NEW] Check for New Characters & Pause if needed
             const needsReview = detectNewCharacters(aiResult)
             if (needsReview) {
                 setProcessingLog((prev) => [...prev, `     ⚠️ 신규 캐릭터 감지. 검토 대기 중...`])
                 await waitForReview()
                 setProcessingLog((prev) => [...prev, `     ✨ 캐릭터 검토 완료. 저장 계속...`])
             }

             // [FIX] Extract Real Numbers from Path to ensure consistency
             const chapterNumMatch = createdChapterPath?.match(/(\d+)화_/)
             const sceneNumMatch = createdScenePath?.match(/SCENE-(\d+)/i)
             
             const realChapterNum = chapterNumMatch ? parseInt(chapterNumMatch[1]) : chapter.chapterNumber
             const realSceneNum = sceneNumMatch ? parseInt(sceneNumMatch[1]) : scene.sceneNumber

             // Overwrite metadata with real numbers
             const finalData = {
                 ...aiResult,
                 chapter: realChapterNum,
                 scene: realSceneNum
             }

             // 4. Save Content & Metadata
             // 4. Save Content & Metadata
             // @ts-ignore
             await window.api.updateScene({
                 path: createdScenePath,
                 content: scene.content, // 본문 저장
                 data: finalData // Front-matter 저장
             })

             // [NEW] 5. Sync Character Data
             setProcessingLog((prev) => [...prev, `     👤 캐릭터 정보 동기화 중...`])
             
             // Include Decisions
             // [FIX] aiResult.characters is string[], so use 'c' directly key
             const decisionsForScene = aiResult.characters?.map((c: any) => {
                 const name = typeof c === 'string' ? c : c.name
                 return decisions[name]
             }).filter(Boolean) || []

             // @ts-ignore
             const syncResult = await window.api.updateCharacter({
                 aiResult: finalData,
                 sceneInfo: {
                     chapter: realChapterNum,
                     scene: realSceneNum,
                     title: scene.title,
                     sourcePath: createdScenePath
                 },
                 decisions: decisionsForScene // [NEW] Pass decisions
             })
             
             // Log Results
             if (syncResult && syncResult.results) {
                 syncResult.results.forEach((res: any) => {
                     if (res.type === 'created') {
                         setProcessingLog(prev => [...prev, `     ✨ [신규] 캐릭터 등록됨: ${res.file}`])
                     } else if (res.type === 'merged') {
                         setProcessingLog(prev => [...prev, `     🔗 [병합] 캐릭터 별칭 추가됨: ${res.file}`])
                     }
                 })
             }

             setProcessingLog((prev) => [...prev, `     ✅ 저장 및 동기화 완료`])

          } catch (e: any) {
             console.error(e)
             setProcessingLog((prev) => [...prev, `     ❌ 실패: ${e.message}`])
          }
        }
      }
      
      setProcessingLog((prev) => [...prev, '✅ 모든 작업 완료!'])
      // Call onComplete to refresh dashboard, but keep modal open
      onComplete(null) 
    } catch (err) {
      console.error(err)
      setProcessingLog((prev) => [...prev, '❌ 치명적 오류 발생'])
    } finally {
      setIsProcessing(false)
      // Remove auto-close
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0b0c15]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            AI Bulk Import Wizard
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-[#0b0c15]">
          {step === 1 && (
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Sources List */}
              <div 
                className={`flex-1 p-6 flex flex-col gap-4 overflow-y-auto transition-colors ${isDragging ? 'bg-purple-900/10' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-bold text-lg">Sources ({sources.length})</h3>
                    <button 
                       onClick={handleSelectFiles}
                       className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                       <Plus size={14} /> 파일 추가
                    </button>
                 </div>

                 {sources.length === 0 && !inputText && (
                    <div 
                      onClick={handleSelectFiles}
                      className="flex-1 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:border-purple-500/50 hover:bg-slate-900 transition-all group"
                    >
                        <UploadCloud size={48} className="mb-4 text-slate-700 group-hover:text-purple-500 transition-colors" />
                        <p className="font-bold text-lg">Drop files here</p>
                        <p className="text-sm">or click to upload .txt, .md, .json</p>
                    </div>
                 )}

                 <div className="grid grid-cols-2 gap-3">
                    {sources.map(source => (
                       <div key={source.id} className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl flex items-start gap-3 group hover:border-slate-700 transition-colors">
                          <div className="mt-1 p-2 bg-slate-800 rounded-lg">
                             <FileText size={16} className="text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-bold text-slate-200 truncate">{source.name}</h4>
                             <p className="text-xs text-slate-500">{source.size.toLocaleString()} chars</p>
                          </div>
                          <button onClick={() => removeSource(source.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                             <Trash2 size={14} />
                          </button>
                       </div>
                    ))}
                 </div>

                 <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Direct Input / Clipboard</label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Or paste your text here..."
                      className="w-full h-40 bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-300 text-sm focus:border-purple-500 outline-none resize-none font-mono leading-relaxed placeholder:text-slate-700 transition-colors"
                    />
                 </div>
              </div>
              
              {/* Right: Action Area */}
              <div className="w-64 border-l border-slate-800 bg-[#0f111a] p-6 flex flex-col justify-end">
                  <div className="mb-auto">
                     <h4 className="font-bold text-slate-400 mb-4 text-sm">SUMMARY</h4>
                     <ul className="space-y-2 text-xs text-slate-500">
                        <li className="flex justify-between">
                           <span>Files</span>
                           <span className="text-slate-300">{sources.length}</span>
                        </li>
                        <li className="flex justify-between">
                           <span>Total Length</span>
                           <span className="text-slate-300">{(sources.reduce((acc, c) => acc + c.size, 0) + inputText.length).toLocaleString()}</span>
                        </li>
                     </ul>
                  </div>

                  <button
                    onClick={handleParseStructure}
                    disabled={isProcessing || (sources.length === 0 && !inputText.trim())}
                    className="w-full py-3 bg-white text-black hover:bg-slate-200 font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Analyzing...' : 'Next Step'} <ArrowRight size={16} />
                  </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6 h-full flex flex-col space-y-4 animate-in slide-in-from-right duration-300">
              <h3 className="text-white font-bold text-lg">Review Structure</h3>
              <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 custom-scrollbar">
                {structure.length === 0 && <div className="text-slate-500 text-center py-20">구조를 찾지 못했습니다.</div>}
                {structure.map((chap: any, i: number) => {
                  const sceneKeys = chap.scenes.map((_:any, j:number) => `${i}-${j}`);
                  const isAllSelected = sceneKeys.every((key:string) => selection[key]);
                  const isSomeSelected = sceneKeys.some((key:string) => selection[key]);
                  
                  return (
                  <div key={i} className={`border rounded-xl overflow-hidden transition-all ${isSomeSelected ? 'border-slate-800 bg-slate-950' : 'border-slate-800/50 bg-slate-950/50 opacity-60'}`}>
                    <div className="bg-slate-900 px-4 py-3 flex items-center gap-3 border-b border-slate-800">
                      <input 
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={(e) => toggleChapter(i, e.target.checked)}
                        className="w-5 h-5 rounded border-slate-600 accent-purple-600 cursor-pointer"
                      />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="font-bold text-slate-200">
                          Chapter {chap.chapterNumber}: {chap.title}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">{chap.scenes.filter((_:any, j:number) => selection[`${i}-${j}`]).length} / {chap.scenes.length} Scenes</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      {chap.scenes.map((scene: any, j: number) => {
                        const isSelected = selection[`${i}-${j}`] || false;
                        return (
                        <div key={j} 
                             onClick={() => toggleScene(i, j)}
                             className={`flex gap-3 text-sm items-start p-2 rounded-lg transition-colors cursor-pointer select-none ${isSelected ? 'bg-slate-900/50 hover:bg-slate-900 text-slate-300' : 'bg-transparent text-slate-600 hover:bg-slate-900/30'}`}
                        >
                          <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleScene(i, j)}
                                className="w-4 h-4 rounded border-slate-600 accent-purple-600 cursor-pointer"
                              />
                          </div>
                          <div>
                            <div className={`font-bold transition-colors ${isSelected ? 'text-slate-300' : 'text-slate-600 line-through'}`}>Scene {scene.sceneNumber} - {scene.title}</div>
                            <div className="text-xs text-slate-600 line-clamp-1 mt-1">{scene.content.substring(0, 60)}...</div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )})}
              </div>
              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  &lt; Back
                </button>
                <div className="flex items-center gap-4">
                    <div className="text-right text-xs text-slate-500 mr-2">
                        Total {Object.values(selection).filter(Boolean).length} Scenes Selected
                    </div>
                    <button
                    onClick={handleProcessImport}
                    disabled={Object.values(selection).filter(Boolean).length === 0}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:grayscale"
                    >
                    <Play size={16} fill="currentColor" /> Start Import
                    </button>
                </div>
              </div>
            </div>
          )}

           {step === 3 && (
            <div className="relative p-10 h-full flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-500">
               {/* Review Overlay Component */}
               <CharacterReviewModal
                   isOpen={isReviewing}
                   pendingReviews={pendingReviews}
                   reviewIndex={reviewIndex}
                   wikiData={wikiData}
                   onAction={handleReviewAction}
               />

               {isProcessing ? (
                 <div className="w-16 h-16 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin"></div>
               ) : (
                 <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/50 animate-bounce">
                   <CheckCircle size={32} />
                 </div>
               )}
               
               <h3 className="text-2xl font-bold text-white">
                 {isProcessing ? 'AI Processing...' : 'Done!'}
               </h3>

               <div className="w-full max-w-lg bg-black/40 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs text-purple-300 border border-slate-800 shadow-inner">
                 {processingLog.map((log, i) => (
                   <div key={i} className="mb-1 border-b border-purple-900/30 pb-1 last:border-0">{log}</div>
                 ))}
                 {isProcessing && <div className="animate-pulse">_</div>}
               </div>

               {/* [NEW] Buttons for Step 3 */}
               {!isProcessing && (
                   <div className="flex gap-4 mt-6">
                       <button 
                           onClick={() => {
                               setStep(1)
                               setStructure([])
                               setProcessingLog([])
                               resetReview() // Reset hook state
                           }}
                           className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-bold"
                       >
                           처음으로 (Reset)
                       </button>
                       <button 
                           onClick={onClose}
                           className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-bold"
                       >
                           닫기 (Close)
                       </button>
                   </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
