import React, { useEffect, useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node // [추가] 타입 임포트
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { WikiEntry } from '../types/wiki'
import { generateGraphFromWikiData } from '../utils/graphTransformer'
import { CharacterNode } from '../components/Board/CharacterNode'

interface RelationBoardProps {
  wikiData: WikiEntry[]
}

const nodeTypes = {
  character: CharacterNode
}
export const RelationBoard: React.FC<RelationBoardProps> = ({ wikiData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // 데이터가 변경되면 그래프 다시 그리기
  useEffect(() => {
    if (wikiData.length > 0) {
      const { nodes: newNodes, edges: newEdges } = generateGraphFromWikiData(wikiData)
      // @ts-ignore: GraphNode와 ReactFlow Node 타입 호환성 문제 임시 해결
      setNodes(newNodes)
      // @ts-ignore
      setEdges(newEdges)
    }
  }, [wikiData, setNodes, setEdges])

  // 노드 클릭 핸들러 (나중에 방사형 메뉴 트리거가 될 곳)
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Clicked node:', node)
  }, [])

  return (
    // [수정] h-full -> h-[85vh] (화면 높이의 85% 강제 지정)
    <div className="w-full h-[85vh] min-h-[500px] bg-slate-900 text-slate-100 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
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
    </div>
  )
}
