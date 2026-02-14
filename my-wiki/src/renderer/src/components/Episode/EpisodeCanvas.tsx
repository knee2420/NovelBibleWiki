import { useState, useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  Edge,
  MiniMap,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WikiEntry } from '../../types/wiki';
import { EpisodeNode, EpisodeNodeComponent } from './EpisodeNode';
import { Search, Save, Download } from 'lucide-react';

const initialNodes: EpisodeNode[] = [];
const initialEdges: Edge[] = [];

// Node Types Registration
const nodeTypes = {
  episode: EpisodeNodeComponent,
};

interface EpisodeCanvasProps {
  wikiEntries: WikiEntry[]; // All wiki entries from parent or fetch
}

export const EpisodeCanvas = ({ wikiEntries = [] }: EpisodeCanvasProps) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter episodes for sidebar (Left Panel)
  const episodes = useMemo(() => 
    wikiEntries.filter(
        e => e.type === 'episode' && 
        (e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         e.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
    ), 
  [wikiEntries, searchTerm]);

  // Handle connection
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    [setEdges],
  );

  // Drag Start Handler (Sidebar)
  const onDragStart = (event: React.DragEvent, entry: WikiEntry) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(entry));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Drag Over Handler (Canvas)
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Drop Handler (Canvas)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const entryString = event.dataTransfer.getData('application/reactflow');
      
      if (!entryString) return;

      const entry: WikiEntry = JSON.parse(entryString);

      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: EpisodeNode = {
        id: `${entry.id}-${Date.now()}`,
        type: 'episode',
        position,
        data: { entry: entry }, // Pass the full entry data
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [rfInstance, setNodes],
  );

  // Save / Export Logic
  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      const exportData = {
          nodes: flow.nodes.map(n => ({ id: n.id, position: n.position, entryId: n.data.entry.id })),
          edges: flow.edges.map(e => ({ source: e.source, target: e.target }))
      }
      console.log('Exported Flow:', exportData);
      alert('Canvas layout exported to console (JSON).');
      // Here you would typically save to file or database
    }
  }, [rfInstance]);

  return (
    <div className="flex h-full w-full bg-[#0b0c15] text-slate-200">
      
      {/* Sidebar (Episode List) */}
      <div className="w-80 border-r border-slate-800 bg-[#11121c] flex flex-col shrink-0 z-10 shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-[#0b0e14]">
            <h2 className="text-lg font-bold mb-1 text-white">Episodes Library</h2>
            <p className="text-xs text-slate-500 mb-3">Drag cards to the board</p>
            
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs focus:border-blue-500 outline-none transition-colors"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            {episodes.map((ep) => (
                <div 
                    key={ep.id}
                    className="p-3 bg-[#1e293b] border border-slate-700 rounded-xl cursor-grab hover:border-blue-500/50 hover:bg-slate-800 transition-all select-none group"
                    draggable
                    onDragStart={(event) => onDragStart(event, ep)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black overflow-hidden shrink-0 border border-slate-700">
                            {ep.image || (ep.info as any)?.image ? (
                                <img src={ep.image || (ep.info as any)?.image} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-800" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h4 className={`text-xs font-bold truncate ${(ep.info as any)?.isUsed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{ep.name}</h4>
                            <p className="text-[10px] text-slate-500 truncate">{ep.tags?.join(', ')}</p>
                        </div>
                    </div>
                </div>
            ))}
            {episodes.length === 0 && (
                <div className="text-center py-10 text-slate-600 text-xs">
                    No episodes found.
                </div>
            )}
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setRfInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#0f172a]"
        >
          <Background color="#1e293b" gap={20} size={1} variant={BackgroundVariant.Dots} />
          <Controls className="bg-[#1e293b] border-slate-700 text-slate-200 fill-slate-200" />
          <MiniMap 
            nodeColor={() => '#3b82f6'} 
            maskColor="rgba(15, 23, 42, 0.8)" 
            className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden" 
          />
          
          <Panel position="top-right" className="bg-[#1e293b] p-2 rounded-lg border border-slate-700 shadow-xl flex gap-2">
            <button onClick={onSave} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-500 transition-colors">
                <Save size={14} /> Save Layout
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-xs font-bold hover:bg-slate-600 transition-colors">
                <Download size={14} /> Export JSON
            </button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};
