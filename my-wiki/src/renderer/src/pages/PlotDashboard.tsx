import { useState, useEffect, useRef } from 'react'
import { ActBoard } from '../types/plot'
import { Columns, Plus, MoreHorizontal, X, Edit2, Trash2 } from 'lucide-react'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import { SceneCard } from '../components/Plot/SceneCard'
import { SceneDetailModal } from '../components/Plot/SceneDetailModal'

export const PlotDashboard = () => {
  const [plotData, setPlotData] = useState<ActBoard[]>([])
  const [currentActIndex, setCurrentActIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedScenePath, setSelectedScenePath] = useState<string | null>(null)
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', path: '', title: '' })
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadPlotData()
  }, [])

  const loadPlotData = async () => {
    try {
      // @ts-ignore
      const data = await window.api.getPlotData()
      setPlotData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  const refresh = () => loadPlotData()

  const handleCreateAct = async () => {
    setModalConfig({ isOpen: true, type: 'CREATE_ACT', path: '', title: '' })
  }
  const handleRenameAct = async (act: any) => {
    setModalConfig({ isOpen: true, type: 'RENAME', path: act.path, title: act.title })
  }
  const handleDeleteAct = async (act: any) => {
    if (!window.confirm(`'${act.title}'을(를) 삭제하시겠습니까?\n하위 데이터가 모두 삭제됩니다.`))
      return
    // @ts-ignore
    await window.api.deleteItem(act.path)
    refresh()
  }

  const handleCreateChapter = async () => {
    if (currentAct)
      setModalConfig({ isOpen: true, type: 'CREATE_CHAPTER', path: currentAct.path, title: '' })
  }
  const handleRenameChapter = async (chapter: any) => {
    setModalConfig({ isOpen: true, type: 'RENAME', path: chapter.id, title: chapter.title })
  }
  const handleDeleteChapter = async (chapter: any) => {
    if (!window.confirm(`'${chapter.title}' 삭제?`)) return
    // @ts-ignore
    await window.api.deleteItem(chapter.id)
    refresh()
  }

  const handleCreateScene = async (chapterPath: string) => {
    // @ts-ignore
    await window.api.createScene(chapterPath, '새로운 씬')
    refresh()
  }
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { type, path, title } = modalConfig
    if (!title.trim()) return

    try {
      // @ts-ignore
      if (type === 'CREATE_ACT') await window.api.createAct(title)
      // @ts-ignore
      if (type === 'CREATE_CHAPTER') await window.api.createChapter(path, title)
      // @ts-ignore
      if (type === 'RENAME') await window.api.renameItem(path, title)

      setModalConfig({ ...modalConfig, isOpen: false })
      refresh()
    } catch (err) {
      console.error(err)
    }
  }
  // 드래그 종료 핸들러
  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result
    if (!destination) return

    const newPlotData = [...plotData]
    const currentAct = newPlotData[currentActIndex]

    // [NEW] 1. 챕터(컬럼) 이동 처리
    if (type === 'chapter') {
      const newChapters = Array.from(currentAct.chapters)
      const [movedChapter] = newChapters.splice(source.index, 1)
      newChapters.splice(destination.index, 0, movedChapter)

      currentAct.chapters = newChapters
      setPlotData(newPlotData)
      return
    }

    // 2. 씬(카드) 이동 처리 (기존 로직)
    if (source.droppableId === destination.droppableId) {
      // 같은 챕터 내 이동
      const chapter = currentAct.chapters.find((c) => c.id === source.droppableId)
      if (chapter) {
        const newScenes = Array.from(chapter.scenes)
        const [moved] = newScenes.splice(source.index, 1)
        newScenes.splice(destination.index, 0, moved)
        chapter.scenes = newScenes
      }
    } else {
      // 다른 챕터로 이동
      const sourceChapter = currentAct.chapters.find((c) => c.id === source.droppableId)
      const destChapter = currentAct.chapters.find((c) => c.id === destination.droppableId)

      if (sourceChapter && destChapter) {
        const sourceScenes = Array.from(sourceChapter.scenes)
        const destScenes = Array.from(destChapter.scenes)
        const [moved] = sourceScenes.splice(source.index, 1)
        destScenes.splice(destination.index, 0, moved)

        sourceChapter.scenes = sourceScenes
        destChapter.scenes = destScenes
      }
    }

    setPlotData(newPlotData)
  }

  useEffect(() => {
    if (modalConfig.isOpen) {
      // 애니메이션/렌더링 딜레이를 고려해 100ms 후 포커스
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [modalConfig.isOpen])

  const currentAct = plotData[currentActIndex]

  if (loading) return <div className="text-white p-8">로딩 중...</div>
  if (!currentAct) return <div className="text-slate-500 p-8">데이터 없음</div>

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0b0c15]">
      {' '}
      {/* 배경색 더 어둡게 */}
      {/* 1. Top Bar */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-800 bg-[#0f111a]">
        {plotData.map((act, idx) => (
          <div
            key={act.actNumber}
            onContextMenu={(e) => {
              e.preventDefault()
              handleDeleteAct(act)
            }}
            onDoubleClick={() => handleRenameAct(act)}
            onClick={() => setCurrentActIndex(idx)}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all cursor-pointer select-none ${
              idx === currentActIndex
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            {act.title}
          </div>
        ))}
        <button
          onClick={handleCreateAct}
          className="p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
        <span className="ml-auto text-xs text-slate-600 flex items-center gap-1">
          <Columns className="w-3 h-3" /> 드래그로 씬 이동 가능
        </span>
      </div>
      {/* 2. Kanban Board Area (DnD Context) */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="chapter" direction="horizontal">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 p-6">
              <div className="flex flex-wrap items-start gap-3">
                {currentAct.chapters.map((chapter, index) => (
                  // [NEW] 각 챕터를 Draggable로 감싸기
                  <Draggable key={chapter.id} draggableId={chapter.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`w-[300px] flex flex-col flex-shrink-0 bg-[#161822] rounded-xl border shadow-sm transition-colors ${
                          snapshot.isDragging
                            ? 'border-blue-500 z-50 shadow-2xl'
                            : 'border-slate-800/60'
                        }`}
                      >
                        {/* Column Header (여기가 드래그 손잡이!) */}
                        <div
                          {...provided.dragHandleProps}
                          className="p-3 flex items-center justify-between border-b border-slate-800/60 cursor-grab active:cursor-grabbing hover:bg-slate-800/30 rounded-t-xl"
                        >
                          <h3 className="font-bold text-slate-300 text-sm truncate px-1">
                            <span className="text-blue-500 mr-2 opacity-80">
                              #{chapter.chapterNumber}
                            </span>
                            {chapter.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                              {chapter.scenes.length}
                            </span>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation() // 헤더 클릭 방지
                                  setActiveMenuId(activeMenuId === chapter.id ? null : chapter.id)
                                }}
                                className={`p-1 rounded hover:bg-slate-700 transition-colors ${activeMenuId === chapter.id ? 'text-white bg-slate-700' : 'text-slate-600'}`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {activeMenuId === chapter.id && (
                                <>
                                  {/* Backdrop (클릭 시 닫기용) */}
                                  <div
                                    className="fixed inset-0 z-40 cursor-default"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setActiveMenuId(null)
                                    }}
                                  />

                                  {/* Menu Items */}
                                  <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 flex flex-col py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleRenameChapter(chapter)
                                        setActiveMenuId(null)
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-blue-600 transition-colors text-left"
                                    >
                                      <Edit2 size={12} /> 제목 수정
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteChapter(chapter)
                                        setActiveMenuId(null)
                                      }}
                                      className="flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:text-white hover:bg-red-600 transition-colors text-left"
                                    >
                                      <Trash2 size={12} /> 삭제하기
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Droppable Area (Existing Scene List) */}
                        <Droppable droppableId={chapter.id} type="scene">
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`p-2 min-h-[150px] space-y-2 transition-colors rounded-b-xl ${
                                snapshot.isDraggingOver ? 'bg-slate-800/30' : ''
                              }`}
                            >
                              {chapter.scenes.map((scene, index) => (
                                <SceneCard
                                  key={scene.id}
                                  scene={scene}
                                  index={index}
                                  onClick={setSelectedScenePath}
                                  onDelete={() => {
                                    if (window.confirm('씬 삭제?')) {
                                      // @ts-ignore
                                      window.api.deleteItem(scene.id).then(refresh)
                                    }
                                  }}
                                />
                              ))}
                              {provided.placeholder}

                              {chapter.scenes.length === 0 && (
                                <div className="h-full flex items-center justify-center text-slate-700 text-xs py-10 border-2 border-dashed border-slate-800 rounded-lg mx-2">
                                  빈 챕터
                                </div>
                              )}
                              <button
                                onClick={() => handleCreateScene(chapter.id)}
                                className="w-full py-2 mt-2 flex items-center justify-center gap-1 text-xs text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 rounded-lg transition-colors border border-transparent hover:border-slate-800 dashed"
                              >
                                <Plus className="w-3 h-3" /> 씬 추가
                              </button>
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <button
                  onClick={handleCreateChapter}
                  className="w-[300px] flex-shrink-0 h-[100px] border-2 border-dashed border-slate-800 rounded-xl flex items-center justify-center text-slate-600 hover:text-slate-400 hover:border-slate-600 hover:bg-slate-800/20 transition-all"
                >
                  <span className="flex items-center gap-2 font-bold">
                    <Plus className="w-5 h-5" /> 챕터 추가
                  </span>
                </button>
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {/* Modal */}
      <SceneDetailModal
        isOpen={!!selectedScenePath}
        filePath={selectedScenePath || ''}
        onUpdate={refresh}
        onClose={() => setSelectedScenePath(null)}
      />
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h3 className="font-bold text-white">
                {modalConfig.type === 'RENAME' ? '이름 변경' : '새 항목 생성'}
              </h3>
              <button
                onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                className="text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleModalSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">제목</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={modalConfig.title}
                  onChange={(e) => setModalConfig({ ...modalConfig, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
