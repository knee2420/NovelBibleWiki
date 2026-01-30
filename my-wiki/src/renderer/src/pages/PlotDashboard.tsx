import { useState, useEffect } from 'react'
import { ActBoard, SceneCard as SceneCardType } from '../types/plot'
import { Columns } from 'lucide-react'
import { DragDropContext, Draggable, Droppable, DropResult } from '@hello-pangea/dnd'
import { SceneCard } from '../components/Plot/SceneCard'
import { SceneDetailModal } from '../components/Plot/SceneDetailModal'

export const PlotDashboard = () => {
  const [plotData, setPlotData] = useState<ActBoard[]>([])
  const [currentActIndex, setCurrentActIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedScenePath, setSelectedScenePath] = useState<string | null>(null)

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
          <button
            key={act.actNumber}
            onClick={() => setCurrentActIndex(idx)}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
              idx === currentActIndex
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            {act.title}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-600 flex items-center gap-1">
          <Columns className="w-3 h-3" /> 드래그로 씬 이동 가능
        </span>
      </div>
      {/* 2. Kanban Board Area (DnD Context) */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" type="chapter" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex-1 overflow-y-auto p-6 custom-scrollbar"
            >
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
                          <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-mono">
                            {chapter.scenes.length}
                          </span>
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
                                />
                              ))}
                              {provided.placeholder}

                              {chapter.scenes.length === 0 && (
                                <div className="h-full flex items-center justify-center text-slate-700 text-xs py-10 border-2 border-dashed border-slate-800 rounded-lg mx-2">
                                  빈 챕터
                                </div>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {/* Modal */}
      <SceneDetailModal
        isOpen={!!selectedScenePath}
        filePath={selectedScenePath || ''}
        onClose={() => setSelectedScenePath(null)}
      />
    </div>
  )
}
