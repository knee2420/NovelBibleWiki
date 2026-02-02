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
  MarkerType
} from '@xyflow/react'
import { Copy } from 'lucide-react'
import '@xyflow/react/dist/style.css'
import { WikiEntry } from '../types/wiki'
import { getRadialPositions, findEntryByName } from '../utils/graphLayout'
import { CharacterNode } from '../components/Board/CharacterNode'
import { FactionNode } from '../components/Board/FactionNode'
import { ItemNode } from '../components/Board/ItemNode'
import { CategoryNode } from '../components/Board/CategoryNode'

interface RelationBoardProps {
  wikiData: WikiEntry[]
}

const nodeTypes = {
  character: CharacterNode,
  faction: FactionNode,
  item: ItemNode,
  category: CategoryNode
}

export const RelationBoard: React.FC<RelationBoardProps> = ({ wikiData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null)

  // [NEW] 영구 보존할 노드 ID 목록 (주인공 및 주요 등장인물)
  // 이 목록에 있는 ID는 '접기'를 눌러도 화면에서 사라지지 않습니다.
  const persistentIds = useRef<Set<string>>(new Set())

  // 상태 추적용 Refs
  const menuMap = useRef<Map<string, string[]>>(new Map())
  const expandedMap = useRef<Map<string, string[]>>(new Map())

  // 1. 초기화: 주인공을 찾아서 중앙에 배치하고 나머지는 주변에 배치
  useEffect(() => {
    if (wikiData.length === 0) return

    const newNodes: Node[] = []
    const newEdges: Edge[] = [] // 초기에는 선 없음

    // 1-1. 주인공 찾기 (이름이나 ID로 식별, 여기서는 '강진우' 혹은 리스트의 첫 번째)
    // 실제 데이터에 'role: protagonist' 같은게 있다면 그걸 쓰면 좋지만, 일단 이름으로 찾습니다.
    const protagonist = wikiData.find((e) => e.name.includes('강진우')) || wikiData[0]

    // 1-2. 주인공 배치 (0,0)
    if (protagonist) {
      newNodes.push({
        id: protagonist.id,
        type: 'character',
        position: { x: 0, y: 0 },
        data: { label: protagonist.name, image: protagonist.image, ...protagonist }
        // 주인공은 드래그해도 위치를 기억하거나 고정할 수 있음 (선택사항)
      })
      persistentIds.current.add(protagonist.id)
    }

    // 1-3. 조연들 배치 (주인공 주변으로 원형 배치)
    const others = wikiData.filter((e) => e.id !== protagonist?.id && e.type === 'character')
    const radius = 600 // 주인공과의 거리
    const angleStep = (2 * Math.PI) / (others.length || 1)

    others.forEach((entry, index) => {
      const angle = index * angleStep
      newNodes.push({
        id: entry.id,
        type: 'character',
        // 원형 배치 공식 (x = r * cos, y = r * sin)
        position: {
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle)
        },
        data: { label: entry.name, image: entry.image, ...entry }
      })
      persistentIds.current.add(entry.id)
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [wikiData, setNodes, setEdges])

  // 2. 디버그 데이터 최적화
  const displayData = useMemo(() => {
    if (!selectedNodeData) return null
    const { image, content, ...rest } = selectedNodeData
    return rest
  }, [selectedNodeData])

  const handleCopyDebug = () => {
    if (displayData) {
      navigator.clipboard.writeText(JSON.stringify(displayData, null, 2))
    }
  }

  // 3. 노드 클릭 핸들러
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setSelectedNodeData(node.data)

      // =================================================================
      // [CASE A] 카테고리 버튼 클릭
      // =================================================================
      if (node.type === 'category') {
        const { subItems, parentId } = node.data as any

        const firstChildId = subItems[0]?.id
        // 이미 펼쳐져 있는지 확인 (엣지가 연결되어 있는지로 판단하는게 더 정확함)
        // 여기서는 '첫번째 아이템과 부모를 잇는 엣지'가 있는지 확인
        const isExpanded = edges.some((e) => e.source === parentId && e.target === firstChildId)

        // [공통] 메뉴 버튼 닫기 (항상 닫힘)
        if (menuMap.current.has(parentId)) {
          const menuIds = menuMap.current.get(parentId)!
          setNodes((nds) => nds.filter((n) => !menuIds.includes(n.id)))
          // 카테고리 버튼으로 가는 점선 엣지만 삭제
          setEdges((eds) => eds.filter((e) => !menuIds.includes(e.target)))
          menuMap.current.delete(parentId)
        }

        if (isExpanded) {
          // [접기 로직 수정]
          // *중요*: persistentIds에 있는 노드(주요 캐릭터)는 삭제하지 말고 '엣지'만 끊어야 함.
          // 아이템 등 임시 노드는 삭제해도 됨.

          const targetIds = subItems.map((i: any) => i.id)

          // 1. 노드 삭제: 영구 보존 ID가 아닌 것만 삭제
          setNodes((nds) =>
            nds.filter((n) => {
              // 삭제 대상이 아니면 유지
              if (!targetIds.includes(n.id)) return true
              // 삭제 대상이라도 영구 보존 ID면 유지 (강진우 등)
              if (persistentIds.current.has(n.id)) return true
              // 그 외(아이템 등)는 삭제
              return false
            })
          )

          // 2. 엣지 삭제: 부모와 타겟을 잇는 엣지는 무조건 삭제
          setEdges((eds) =>
            eds.filter((e) => {
              // 이 카테고리에 포함된 관계선이면 삭제
              if (e.source === parentId && targetIds.includes(e.target)) return false
              return true
            })
          )
        } else {
          // [펼치기 로직]
          const parentNode = nodes.find((n) => n.id === parentId) || node
          const positions = getRadialPositions(parentNode, subItems.length, 300) // 거리 300

          const newNodes: Node[] = []
          const newEdges: Edge[] = []

          subItems.forEach((target: any, idx: number) => {
            // 노드가 없으면 생성 (이미 있으면 생성 안함 -> 위치 유지)
            if (!nodes.find((n) => n.id === target.id)) {
              newNodes.push({
                id: target.id,
                type: ['character', 'faction', 'item', 'location'].includes(target.type)
                  ? target.type
                  : 'default',
                position: positions[idx],
                data: { label: target.name, image: target.image, ...target }
              })
            }

            // 엣지는 항상 새로 연결 (부모 -> 타겟)
            newEdges.push({
              id: `${parentId}-${target.id}`,
              source: parentId,
              target: target.id,
              label: target.relationType,
              type: 'straight',
              animated: false,
              style: { stroke: '#64748b', strokeWidth: 1.5 },
              labelStyle: { fill: '#94a3b8', fontSize: 10 },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }
            })
          })

          setNodes((nds) => [...nds, ...newNodes])
          setEdges((eds) => [...eds, ...newEdges])
        }
        return
      }

      // =================================================================
      // [CASE B] 캐릭터/세력 노드 클릭 (메뉴 토글)
      // =================================================================
      if (menuMap.current.has(node.id)) {
        // 메뉴 닫기
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
          return target ? { ...target, relationType: rel.type } : null
        })
        .filter(Boolean)

      if (resolvedRelations.length === 0) return

      const groups = { relations: [] as any[], items: [] as any[], faction: [] as any[] }
      resolvedRelations.forEach((target: any) => {
        if (target.relationType === '소속' || target.type === 'faction') groups.faction.push(target)
        else if (target.type === 'item') groups.items.push(target)
        else groups.relations.push(target)
      })

      const validGroups = Object.entries(groups)
        .filter(([_, items]) => items.length > 0)
        .map(([key, items]) => ({ type: key, items }))

      // 메뉴 버튼 거리 (150)
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
            label:
              group.type === 'faction' ? '소속' : group.type === 'items' ? '아이템' : '인물관계',
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
    [nodes, wikiData, setNodes, setEdges, edges] // edges 의존성 추가
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
        fitView
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
