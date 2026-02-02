import React, { useEffect, useCallback, useRef, useState } from 'react'
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

interface RelationBoardProps {
  wikiData: WikiEntry[]
}

const nodeTypes = {
  character: CharacterNode
}
export const RelationBoard: React.FC<RelationBoardProps> = ({ wikiData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null)
  const expandedMap = useRef<Map<string, string[]>>(new Map())

  // 데이터가 변경되면 그래프 다시 그리기
  useEffect(() => {
    if (wikiData.length === 0) return

    // 초기에는 주인공 혹은 캐릭터만 그리드로 배치 (관계선 없음)
    const initialNodes = wikiData
      .filter((entry) => entry.type === 'character')
      .map((entry, index) => ({
        id: entry.id,
        type: 'character',
        position: { x: (index % 5) * 300, y: Math.floor(index / 5) * 350 },
        data: { label: entry.name, image: entry.image, ...entry }
      }))

    setNodes(initialNodes)
    setEdges([]) // 초기 엣지 없음
  }, [wikiData, setNodes, setEdges])

  // [수정] 디버그 데이터 처리 함수 (더 안전한 방식)
  const getCleanDebugData = () => {
    if (!selectedNodeData) return null

    // 1. 원본 데이터를 복사 (불변성 유지)
    const dataCopy = { ...selectedNodeData }

    // 2. image 키가 있다면 삭제 (메모리 낭비 방지 및 가독성)
    if ('image' in dataCopy) {
      delete dataCopy.image
    }
    if ('content' in dataCopy) {
      delete dataCopy.content
    }
    // [디버깅용] 브라우저 콘솔(F12)을 켜서 이 로그가 찍히는지 확인해보세요.
    console.log('Cleaned Data:', dataCopy)

    return dataCopy
  }

  const handleCopyDebug = () => {
    const data = getCleanDebugData()
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      alert('데이터가 클립보드에 복사되었습니다.') // 알림 추가 (선택사항)
    }
  }

  // 렌더링 헬퍼: 데이터가 유효한지 확인
  const displayData = getCleanDebugData()

  // 노드 클릭 핸들러 (나중에 방사형 메뉴 트리거가 될 곳)
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNodeData(node.data)

      // 2. Radical Menu (펼치기/접기) 로직
      const entry = node.data as unknown as WikiEntry
      // @ts-ignore: relations 접근
      const relations = entry.info?.relations || []

      // 관계 데이터가 없으면 중단
      if (!relations.length) return

      if (expandedMap.current.has(node.id)) {
        // [접기] : 이미 펼쳐져 있다면 자식 노드와 엣지 삭제
        const childIds = expandedMap.current.get(node.id)!
        setNodes((nds) => nds.filter((n) => !childIds.includes(n.id)))
        setEdges((eds) => eds.filter((e) => e.source !== node.id))
        expandedMap.current.delete(node.id)
      } else {
        // [펼치기] : 주변에 원형으로 노드 생성
        const validRelations = relations
          .map((rel: any) => ({ ...rel, targetEntry: findEntryByName(rel.name, wikiData) }))
          .filter((item: any) => item.targetEntry !== undefined)

        if (validRelations.length === 0) return

        const positions = getRadialPositions(node, validRelations.length)
        const newNodes: Node[] = []
        const newEdges: Edge[] = []
        const createdChildIds: string[] = []

        validRelations.forEach((relItem: any, idx: number) => {
          const target = relItem.targetEntry

          // 이미 화면에 있는 노드인지 확인 (중복 생성 방지용, 여기서는 단순화하여 새로 생성하거나 연결)
          // *실제 UX: 이미 있으면 Edge만 연결하는게 좋으나, 여기서는 'Radial Pop-up' 느낌을 위해
          // 현재 화면에 없는 경우만 새로 생성한다고 가정
          const exists = nodes.find((n) => n.id === target.id)

          if (!exists) {
            newNodes.push({
              id: target.id,
              type: target.type === 'character' ? 'character' : 'default', // 노드 타입 설정
              position: positions[idx],
              data: { label: target.name, image: target.image, ...target }
            })
            createdChildIds.push(target.id)
          } else {
            // 이미 존재하면 ID만 추적 (접을 때 같이 사라질지 여부는 기획에 따라 결정)
            createdChildIds.push(target.id)
          }

          newEdges.push({
            id: `${node.id}-${target.id}`,
            source: node.id,
            target: target.id,
            label: relItem.type,
            animated: true,
            style: { stroke: '#06b6d4' },
            labelStyle: { fill: '#cbd5e1', fontWeight: 700 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }
          })
        })

        setNodes((nds) => [...nds, ...newNodes])
        setEdges((eds) => [...eds, ...newEdges])
        expandedMap.current.set(node.id, createdChildIds)
      }
    },
    [nodes, wikiData, setNodes, setEdges]
  )

  return (
    // [수정] h-full -> h-[85vh] (화면 높이의 85% 강제 지정)
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
        <div className="absolute bottom-4 left-4 z-50 w-80 max-h-60 overflow-auto bg-black/90 border border-green-500/50 rounded p-4 font-mono text-xs text-green-400 shadow-2xl backdrop-blur">
          <div className="flex justify-between items-center mb-2 border-b border-green-500/30 pb-2">
            <span className="font-bold">PARSED DATA VIEW</span>
            <div className="flex gap-3">
              {/* [NEW] 복사 버튼 */}
              <button
                onClick={handleCopyDebug}
                className="flex items-center gap-1 text-green-400 hover:text-green-200 transition-colors"
                title="Copy JSON"
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
            {displayData && Object.keys(displayData).length > 0 ? (
              JSON.stringify(displayData, null, 2)
            ) : (
              <span className="text-gray-500 italic">{/* No Data or Parsing Error */}</span>
            )}
          </pre>
        </div>
      )}
    </div>
  )
}
