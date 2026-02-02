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
import { Copy } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { WikiEntry, RelationMood, RelationTense } from '../types/wiki'
import { getRadialPositions, findEntryByName } from '../utils/graphLayout'
import { CharacterNode } from '../components/Board/CharacterNode'
import { FactionNode } from '../components/Board/FactionNode'
import { ItemNode } from '../components/Board/ItemNode'
import { CategoryNode } from '../components/Board/CategoryNode'

interface RelationBoardProps {
  wikiData: WikiEntry[]
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
const getEdgeStyle = (mood?: RelationMood, tense?: RelationTense) => {
  // 1. 색상 (Mood)
  let stroke = '#64748b' // Default (Neutral)
  if (mood === 'FRIENDLY') stroke = '#3b82f6' // Blue
  if (mood === 'HOSTILE') stroke = '#ef4444' // Red

  // 2. 선 스타일 (Tense)
  // PAST(과거)면 점선 + 투명도, CURRENT(현재)면 실선
  const strokeDasharray = tense === 'PAST' ? '5 5' : undefined
  const opacity = tense === 'PAST' ? 0.5 : 1

  return {
    style: { stroke, strokeWidth: 2, strokeDasharray, opacity },
    labelStyle: { fill: stroke, fontWeight: 700, fontSize: 11 },
    markerColor: stroke
  }
}
export const RelationBoard: React.FC<RelationBoardProps> = ({ wikiData }) => {
  // [Optimization 3] nodes, edges 상태 관리 최적화
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null)

  const persistentIds = useRef<Set<string>>(new Set())
  const menuMap = useRef<Map<string, string[]>>(new Map())
  // const expandedMap = useRef<Map<string, string[]>>(new Map()) // (현재 로직상 미사용이면 제거)

  useEffect(() => {
    if (wikiData.length === 0) return

    const newNodes: Node[] = []

    // 주인공 찾기 & 배치 로직 (이전과 동일)
    const protagonist = wikiData.find((e) => e.name.includes('강진우')) || wikiData[0]

    if (protagonist) {
      const { content, ...protagonistRest } = protagonist
      newNodes.push({
        id: protagonist.id,
        type: 'character',
        position: { x: 0, y: 0 },
        data: { label: protagonist.name, image: protagonist.image, ...protagonistRest }
      })
      persistentIds.current.add(protagonist.id)
    }

    const others = wikiData.filter((e) => e.id !== protagonist?.id && e.type === 'character')
    const radius = 600
    const angleStep = (2 * Math.PI) / (others.length || 1)

    others.forEach((entry, index) => {
      const angle = index * angleStep
      const { content, ...entryRest } = entry
      newNodes.push({
        id: entry.id,
        type: 'character',
        position: { x: radius * Math.cos(angle), y: radius * Math.sin(angle) },
        data: { label: entry.name, image: entry.image, ...entryRest }
      })
      persistentIds.current.add(entry.id)
    })

    setNodes(newNodes)
    setEdges([])
  }, [wikiData, setNodes, setEdges])

  const displayData = useMemo(() => {
    if (!selectedNodeData) return null
    const { image, content, ...rest } = selectedNodeData
    if (rest.subItems && Array.isArray(rest.subItems)) {
      rest.subItems = rest.subItems.map((item: any) => {
        const { image, content, ...subRest } = item
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
          const { content, ...cleanTarget } = target
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

      {/* 디버그 패널 */}
      {selectedNodeData && (
        <div className="absolute bottom-4 left-4 z-50 w-96 max-h-80 overflow-auto bg-black/95 border border-green-500/50 rounded p-4 font-mono text-xs text-green-400 shadow-2xl backdrop-blur-md">
          {/* ... (이전과 동일) ... */}
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
