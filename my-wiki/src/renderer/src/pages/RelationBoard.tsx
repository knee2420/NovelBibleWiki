import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  ProOptions // [Optimization] 옵션 타입
} from '@xyflow/react'
import { Copy, Play, Pause, SkipBack, SkipForward, History, Globe } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { WikiEntry } from '../types/wiki'
import { SceneCard } from '../types/plot'
import { getRadialPositions } from '../utils/graphLayout'
// [Refactor] Use global name resolver
import { findEntryByName, resolveCanonicalName } from '../utils/nameResolver'
import { getEdgeStyle } from '../utils/graphStyles'
import { CharacterNode } from '../components/Board/CharacterNode'
import { FactionNode } from '../components/Board/FactionNode'
import { ItemNode } from '../components/Board/ItemNode'
import { CategoryNode } from '../components/Board/CategoryNode'

interface RelationBoardProps {
  wikiData: WikiEntry[]
  sceneData: SceneCard[]
}

// [Optimization 1] nodeTypes는 컴포넌트 밖에서 선언하여 불필요한 재생성 방지
const nodeTypes = {
  character: CharacterNode,
  faction: FactionNode,
  item: ItemNode,
  category: CategoryNode
}

// [Optimization 2] React Flow 성능 옵션 설정
const proOptions: ProOptions = {
  hideAttribution: true // 로고 숨김 (선택)
}

export const RelationBoard: React.FC<RelationBoardProps> = ({ wikiData, sceneData }) => {
  // [Optimization 3] nodes, edges 상태 관리 최적화
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'static' | 'timeline'>('timeline')
  const [isSceneDebuggerOpen, setIsSceneDebuggerOpen] = useState(true)

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const persistentIds = useRef<Set<string>>(new Set())
  const menuMap = useRef<Map<string, string[]>>(new Map())
  const initialLayoutMap = useRef<Map<string, Node>>(new Map())
  // const expandedMap = useRef<Map<string, string[]>>(new Map()) // (현재 로직상 미사용이면 제거)

  useEffect(() => {
    if (wikiData.length === 0) return

    const newNodes: Node[] = []
    const staticEdges: Edge[] = []

    // 주인공 찾기 & 배치 로직 (이전과 동일)
    const protagonist = wikiData.find((e) => e.name.includes('강진우')) || wikiData[0]

    if (protagonist) {
      const { content: _content, ...protagonistRest } = protagonist
      newNodes.push({
        id: protagonist.id,
        // id: protagonist.name,
        type: 'character',
        position: { x: 0, y: 0 },
        data: { label: protagonist.name, image: protagonist.image, ...protagonistRest },
        hidden: viewMode === 'timeline'
      })
      persistentIds.current.add(protagonist.id)
    }

    const others = wikiData.filter((e) => e.id !== protagonist?.id && e.type === 'character')
    const radius = 600
    const angleStep = (2 * Math.PI) / (others.length || 1)

    others.forEach((entry, index) => {
      const angle = index * angleStep
      const { content: _content, ...entryRest } = entry
      newNodes.push({
        id: entry.id,
        // id: entry.name,
        type: 'character',
        position: { x: radius * Math.cos(angle), y: radius * Math.sin(angle) },
        data: { label: entry.name, image: entry.image, ...entryRest },
        hidden: viewMode === 'timeline'
      })
      persistentIds.current.add(entry.id)

      if (viewMode === 'static') {
        const relations = ((entry.info as any)?.relations || []) as any[]
        relations.forEach((rel) => {
          const targetEntry = findEntryByName(rel.name, wikiData)
          if (targetEntry) {
            const style = getEdgeStyle(rel.mood, rel.tense)
            staticEdges.push({
              id: `static-${entry.id}-${targetEntry.id}`,
              source: entry.id,
              target: targetEntry.id,
              label: rel.display,
              type: 'straight',
              ...style
            })
          }
        })
      }
    })

    newNodes.forEach((node) => initialLayoutMap.current.set(node.data.label as string, node))

    // 씬 데이터가 없으면 다 보여주기 (Fallback)
    if (viewMode === 'static') {
      // 1. Static Mode: 모든 노드 표시 + 최신 관계선 연결
      setNodes(newNodes)
      setEdges(staticEdges)
    } else {
      // 2. Timeline Mode: 초기화 (씬 데이터가 없으면 Fallback)
      if (!sceneData || sceneData.length === 0) {
        setNodes(newNodes.map((n) => ({ ...n, hidden: false })))
        setEdges([])
      } else {
        // 타임라인이면 일단 노드만 세팅 (hidden=true 상태)하고 엣지는 비움 -> useEffect에서 계산
        setNodes(newNodes)
        setEdges([])
      }
    }
  }, [wikiData, setNodes, setEdges, sceneData, viewMode])

  // [Time Machine Logic] 씬 인덱스 변경 시 그래프 상태 재계산
  useEffect(() => {
    // [Check] 타임라인 모드가 아니면 로직 수행 안 함
    if (
      viewMode !== 'timeline' ||
      !sceneData ||
      sceneData.length === 0 ||
      initialLayoutMap.current.size === 0
    )
      return

    // (1) 베이스 노드 복사
    const currentNodesMap = new Map<string, Node>()
    initialLayoutMap.current.forEach((node, label) => {
      currentNodesMap.set(label, JSON.parse(JSON.stringify(node)))
    })

    // (2) 엣지 기록용 Map
    const activeEdges = new Map<string, any>()

    // (3) 0번 ~ 현재 씬까지 변화 누적 (Replay)
    for (let i = 0; i <= currentSceneIndex; i++) {
      const delta = sceneData[i]?.delta
      if (!delta) continue
      const isCurrentStep = i === currentSceneIndex

      // 주인공 찾기 (for fallback connection)
      const protagonistName = wikiData.find((e) => e.name.includes('강진우'))?.name || wikiData[0]?.name

      // A. Appear
      if (delta.appear) {
        delta.appear.forEach((name) => {
          // [Global Alias Resolution]
          const resolvedName = resolveCanonicalName(name, wikiData)
          const node = currentNodesMap.get(resolvedName)

          if (node) {
            node.hidden = false
            if (isCurrentStep) node.data.isNew = true

            // [New Feature] Implicit Connection to Protagonist
            if (protagonistName && resolvedName !== protagonistName) {
                const forwardKey = `${protagonistName}-${resolvedName}`
                const backwardKey = `${resolvedName}-${protagonistName}`
                
                if (!activeEdges.has(forwardKey) && !activeEdges.has(backwardKey)) {
                     activeEdges.set(forwardKey, {
                        source: protagonistName,
                        name: resolvedName,
                        display: '등장',
                        mood: 'neutral',
                        isNew: isCurrentStep,
                        term: 'appear'
                    })
                }
            }
          }
        })
      }

      // B. Update
      if (delta.update) {
        delta.update.forEach((upd) => {
          const resolvedName = resolveCanonicalName(upd.name, wikiData)
          const node = currentNodesMap.get(resolvedName)
          if (node) {
            node.hidden = false
            node.data.info = { ...(node.data.info as any), ...upd.changes }
            if (upd.changes.image) node.data.image = upd.changes.image
            if (isCurrentStep) node.data.isModified = true
          }
        })
      }

      // C. Relations (Edges)
      if (delta.relations) {
        delta.relations.forEach((rel) => {
          const sourceName = resolveCanonicalName(rel.source, wikiData)
          const targetName = resolveCanonicalName(rel.name, wikiData)

          const sourceNode = currentNodesMap.get(sourceName)
          if (sourceNode) sourceNode.hidden = false
          
          const targetNode = currentNodesMap.get(targetName)
          if (targetNode) targetNode.hidden = false

          // Edge Key with resolved names
          const edgeKey = `${sourceName}-${targetName}`
          activeEdges.set(edgeKey, { ...rel, isNew: isCurrentStep })
        })
      }

      // D. Disappear
      if (delta.disappear) {
        delta.disappear.forEach((name) => {
          const resolvedName = resolveCanonicalName(name, wikiData)
          const node = currentNodesMap.get(resolvedName)
          if (node) node.hidden = true
        })
      }
    }

    // (4) 결과 변환
    const calculatedNodes = Array.from(currentNodesMap.values())
    const calculatedEdges: Edge[] = []

    activeEdges.forEach((rel, key) => {
      const [sourceName, targetName] = key.split('-')
      // ID 매핑: 현재 로직상 Node의 ID가 파일경로(id)인지 이름(name)인지 주의 필요.
      // initialLayoutMap key를 'label(이름)'로 잡았으므로 이름으로 검색.
      // 만약 Node의 실제 ID가 파일 경로라면, currentNodesMap.get()으로 가져온 노드의 .id 속성을 써야 함.

      // 여기서는 initialLayoutMap에 저장된 노드의 ID를 그대로 사용 (아마 파일 경로일 것임)
      const sourceNode = currentNodesMap.get(sourceName)
      const targetNode = currentNodesMap.get(targetName)

      if (sourceNode && !sourceNode.hidden && targetNode && !targetNode.hidden) {
        const style = getEdgeStyle(rel.mood, rel.tense)
        const highlightStyle = rel.isNew
          ? { strokeWidth: 3, filter: 'drop-shadow(0 0 4px currentColor)' }
          : {}
        calculatedEdges.push({
          id: `edge-${sourceName}-${targetName}`,
          source: sourceNode.id, // 실제 연결은 Node ID로 해야 함
          target: targetNode.id,
          label: rel.display,
          type: 'straight',
          ...style,
          style: { ...style.style, ...highlightStyle },
          animated: rel.isNew
        })
      }
    })

    setNodes(calculatedNodes)
    setEdges(calculatedEdges)
  }, [currentSceneIndex, sceneData, viewMode]) // viewMode 의존성 추가

  // [Player] 재생 로직
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && sceneData) {
      interval = setInterval(() => {
        setCurrentSceneIndex((prev) => {
          if (prev >= sceneData.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 1500)
    }
    return () => clearInterval(interval)
  }, [isPlaying, sceneData])

  const handleCopySceneDelta = () => {
    const delta = sceneData[currentSceneIndex]?.delta
    if (delta) {
      navigator.clipboard.writeText(JSON.stringify(delta, null, 2))
    }
  }

  const displayData = useMemo(() => {
    if (!selectedNodeData) return null
    const { image: _image, content: _content, ...rest } = selectedNodeData
    if (rest.subItems && Array.isArray(rest.subItems)) {
      rest.subItems = rest.subItems.map((item: any) => {
        const { image: _subImage, content: _subContent, ...subRest } = item
        return subRest
      })
    }
    return rest
  }, [selectedNodeData])

  const handleCopyDebug = () => {
    if (displayData) {
      navigator.clipboard.writeText(JSON.stringify(displayData, null, 2))
    }
  }

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeData(node.data)

      // [Optimization 4] 현재 존재하는 노드 ID를 Set으로 미리 만들어둠 (검색 속도 O(N) -> O(1))
      // 반복문 안에서 nodes.find()를 쓰지 않기 위함
      const currentNodeIds = new Set(nodes.map((n) => n.id))

      // [CASE A] 카테고리 버튼 클릭
      if (node.type === 'category') {
        const { subItems, parentId } = node.data as any
        const firstChildId = subItems[0]?.id

        // 엣지 확인 로직도 최적화 (find 대신 some 사용)
        const isExpanded = edges.some((e) => e.source === parentId && e.target === firstChildId)

        // 메뉴 버튼 닫기
        if (menuMap.current.has(parentId)) {
          const menuIds = menuMap.current.get(parentId)!
          setNodes((nds) => nds.filter((n) => !menuIds.includes(n.id)))
          setEdges((eds) => eds.filter((e) => !menuIds.includes(e.target)))
          menuMap.current.delete(parentId)
        }

        if (isExpanded) {
          // [접기]
          const targetIds = new Set(subItems.map((i: any) => i.id)) // Set으로 변환

          setNodes((nds) =>
            nds.filter((n) => {
              if (!targetIds.has(n.id)) return true // 삭제 대상 아님
              if (persistentIds.current.has(n.id)) return true // 영구 보존 대상
              return false // 삭제
            })
          )

          setEdges((eds) =>
            eds.filter((e) => {
              if (e.source === parentId && targetIds.has(e.target)) return false
              return true
            })
          )
        } else {
          // [펼치기]
          const parentNode = nodes.find((n) => n.id === parentId) || node
          const positions = getRadialPositions(parentNode, subItems.length, 300)

          const newNodes: Node[] = []
          const newEdges: Edge[] = []

          subItems.forEach((target: any, idx: number) => {
            // [Optimization 4 적용] Set을 이용해 O(1) 검색
            if (!currentNodeIds.has(target.id)) {
              newNodes.push({
                id: target.id,
                type: ['character', 'faction', 'item', 'location'].includes(target.type)
                  ? target.type
                  : 'default',
                position: positions[idx],
                data: { label: target.name, image: target.image, ...target }
              })
            }
            const edgeStyle = getEdgeStyle(target.mood, target.tense)

            newEdges.push({
              id: `${parentId}-${target.id}`,
              source: parentId,
              target: target.id,
              label: target.display || target.relationType,
              type: 'straight',
              animated: false,
              style: edgeStyle.style,
              labelStyle: edgeStyle.labelStyle,
              markerEnd: { type: MarkerType.ArrowClosed, color: edgeStyle.markerColor }
            })
          })

          // [Optimization 5] 함수형 업데이트 사용 (Batching 보장)
          setNodes((prev) => [...prev, ...newNodes])
          setEdges((prev) => [...prev, ...newEdges])
        }
        return
      }

      // [CASE B] 캐릭터/세력 노드 클릭 (메뉴 토글)
      if (menuMap.current.has(node.id)) {
        const menuIds = menuMap.current.get(node.id)!
        setNodes((nds) => nds.filter((n) => !menuIds.includes(n.id)))
        setEdges((eds) => eds.filter((e) => !menuIds.includes(e.target)))
        menuMap.current.delete(node.id)
        return
      }

      // 메뉴 열기
      const entry = node.data as unknown as WikiEntry
      // @ts-ignore
      const rawRelations = entry.info?.relations || []
      const affiliation = (entry.info as any)?.affiliation

      const effectiveRelations = [...rawRelations]
      if (affiliation) {
        const exists = effectiveRelations.find((r: any) => r.name === affiliation)
        if (!exists) effectiveRelations.push({ name: affiliation, type: '소속' })
      }

      const resolvedRelations = effectiveRelations
        .map((rel: any) => {
          const target = findEntryByName(rel.name, wikiData)
          if (!target) return null

          // [Fix] 여기서 content를 제거해야 subItems에 무거운 텍스트가 안 쌓임 (성능 핵심)
          // (image는 펼쳤을 때 아바타 보여줘야 하므로 데이터에는 남김 -> displayData에서만 가림)
          const { content: _cleanContent, ...cleanTarget } = target
          return {
            ...cleanTarget,
            relationType: rel.type,
            display: rel.display || rel.type,
            mood: rel.mood,
            tense: rel.tense
          }
        })
        .filter(Boolean)

      if (resolvedRelations.length === 0) return

      const groups: Record<string, any[]> = { character: [], faction: [], item: [], location: [] }
      resolvedRelations.forEach((target: any) => {
        if (target.relationType === '소속' || target.type === 'faction') {
          groups.faction.push(target)
          return
        }
        // 2. 나머지 타입(character, item, location)은 자기 방으로 이동
        if (groups[target.type]) {
          groups[target.type].push(target)
        } else {
          // 타입이 없는 경우 기본적으로 인물(character)로 분류하거나 별도 처리
          groups.character.push(target)
        }
      })
      const labelMap: Record<string, string> = {
        character: '인물관계',
        faction: '소속',
        item: '아이템',
        location: '장소'
      }
      const validGroups = Object.entries(groups)
        .filter(([_, items]) => items.length > 0)
        .map(([key, items]) => ({ type: key, items }))

      const positions = getRadialPositions(node, validGroups.length, 150)
      const newNodes: Node[] = []
      const newEdges: Edge[] = []
      const createdMenuIds: string[] = []

      validGroups.forEach((group, idx) => {
        const categoryId = `${node.id}-cat-${group.type}`
        newNodes.push({
          id: categoryId,
          type: 'category',
          position: positions[idx],
          data: {
            label: labelMap[group.type] || '기타',
            categoryType: group.type,
            subItems: group.items,
            parentId: node.id
          }
        })
        createdMenuIds.push(categoryId)

        newEdges.push({
          id: `${node.id}-${categoryId}`,
          source: node.id,
          target: categoryId,
          type: 'straight',
          style: { stroke: '#94a3b8', strokeDasharray: '4 4' }
        })
      })

      setNodes((nds) => [...nds, ...newNodes])
      setEdges((eds) => [...eds, ...newEdges])
      menuMap.current.set(node.id, createdMenuIds)
    },
    [nodes, wikiData, setNodes, setEdges, edges]
  )

  return (
    <div className="w-full h-[85vh] min-h-[500px] bg-slate-900 text-slate-100 border border-slate-700 rounded-lg overflow-hidden shadow-2xl relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        // [Optimization 6] 성능 핵심 옵션들
        fitView
        minZoom={0.1} // 너무 작게 축소 방지 (연산 줄임)
        maxZoom={4} // 너무 크게 확대 방지
        onlyRenderVisibleElements={true} // [핵심] 화면 밖 노드 렌더링 안 함
        proOptions={proOptions} // 프로 옵션 (로고 숨김 등)
        nodesDraggable={true} // 드래그가 필요 없다면 끄는 게 훨씬 빠름 (필요시 true)
        nodesConnectable={false} // 엣지 연결 불필요시 끔
        elementsSelectable={true}
        colorMode="dark"
      >
        <Background color="#475569" gap={20} />
        <Controls />
        <MiniMap
          nodeColor="#64748b"
          maskColor="rgba(0, 0, 0, 0.3)"
          style={{ backgroundColor: '#1e293b' }}
        />
      </ReactFlow>

      {/* [New] View Mode Toggle Button */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => {
            setViewMode('static')
            setIsPlaying(false)
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg transition-all ${
            viewMode === 'static'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <Globe size={16} /> 전체 보기 (Static)
        </button>
        <button
          onClick={() => {
            setViewMode('timeline')
            setIsSceneDebuggerOpen(true) // [Fix] 버튼 클릭 시 즉시 실행 (useEffect 대체)
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-lg transition-all ${
            viewMode === 'timeline'
              ? 'bg-cyan-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          <History size={16} /> 타임라인 (Timeline)
        </button>
      </div>

      {viewMode === 'timeline' && isSceneDebuggerOpen && sceneData && sceneData.length > 0 && (
        <div className="absolute bottom-4 left-4 z-40 w-80 max-h-[300px] overflow-auto bg-black/90 border border-yellow-500/30 rounded-lg p-3 font-mono text-[10px] text-yellow-200/90 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-2 border-b border-yellow-500/20 pb-1 sticky top-0 bg-black/90">
            <div>
              <span className="font-bold text-yellow-500 mr-2">⚡ SCENE DELTA</span>
              <span className="text-[9px] text-slate-500">
                #{sceneData[currentSceneIndex]?.sceneNumber}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopySceneDelta}
                className="flex items-center gap-1 text-yellow-500 hover:text-yellow-100 transition-colors"
              >
                <Copy size={10} /> COPY
              </button>
              <button
                onClick={() => setIsSceneDebuggerOpen(false)}
                className="text-red-400 hover:text-red-200 transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap break-all leading-tight">
            {JSON.stringify(sceneData[currentSceneIndex]?.delta || { status: 'No Delta' }, null, 2)}
          </pre>
        </div>
      )}

      {/* [New] Timeline UI: 슬라이더 및 재생 컨트롤 */}
      {viewMode === 'timeline' && sceneData && sceneData.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-2/3 max-w-2xl bg-slate-800/90 backdrop-blur border border-slate-600 rounded-xl p-4 shadow-2xl flex flex-col gap-2">
          <div className="flex justify-between items-end mb-1">
            <div>
              <span className="text-xs text-cyan-400 font-bold tracking-wider">
                CH.{sceneData[currentSceneIndex]?.chapterNumber} #{' '}
                {sceneData[currentSceneIndex]?.sceneNumber}
              </span>
              <h3 className="text-lg font-bold text-white leading-tight">
                {sceneData[currentSceneIndex]?.title}
              </h3>
            </div>
            <div className="text-xs text-slate-400">
              {currentSceneIndex + 1} / {sceneData.length}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={sceneData.length - 1}
            value={currentSceneIndex}
            onChange={(e) => {
              setIsPlaying(false)
              setCurrentSceneIndex(Number(e.target.value))
            }}
            className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
          />

          <div className="flex justify-center gap-4 mt-1">
            <button
              onClick={() => setCurrentSceneIndex((p) => Math.max(0, p - 1))}
              className="p-2 hover:bg-slate-700 rounded-full text-slate-300"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center justify-center w-12 h-12 rounded-full ${isPlaying ? 'bg-red-500' : 'bg-cyan-600'} text-white shadow-lg`}
            >
              {isPlaying ? <Pause fill="white" /> : <Play fill="white" className="ml-1" />}
            </button>
            <button
              onClick={() => setCurrentSceneIndex((p) => Math.min(sceneData.length - 1, p + 1))}
              className="p-2 hover:bg-slate-700 rounded-full text-slate-300"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      )}

      {/* 디버그 패널 */}
      {selectedNodeData && (
        <div className="absolute bottom-4 left-4 z-50 w-96 max-h-80 overflow-auto bg-black/95 border border-green-500/50 rounded p-4 font-mono text-xs text-green-400 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-2 border-b border-green-500/30 pb-2">
            <span className="font-bold">PARSED DATA VIEW</span>
            <div className="flex gap-3">
              <button
                onClick={handleCopyDebug}
                className="flex items-center gap-1 text-green-400 hover:text-green-200 transition-colors"
              >
                <Copy size={14} /> COPY
              </button>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap break-all leading-relaxed">
            {displayData ? (
              JSON.stringify(displayData, null, 2)
            ) : (
              <span className="text-gray-500">{/*// No Data*/}</span>
            )}
          </pre>
        </div>
      )}
    </div>
  )
}
