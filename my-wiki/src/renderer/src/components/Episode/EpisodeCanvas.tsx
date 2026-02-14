import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
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
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { WikiEntry } from '../../types/wiki';
import { EpisodeNode, EpisodeNodeComponent } from './EpisodeNode';
import { TextNode, TextNodeComponent } from './nodes/TextNode';
import { FrameNode, FrameNodeComponent } from './nodes/FrameNode';
import { Search, Save, Download, ChevronLeft, ChevronRight, MousePointer2, Type, SquareDashed, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const initialNodes: (EpisodeNode | TextNode | FrameNode)[] = [];
const initialEdges: Edge[] = [];

// Node Types Registration
const nodeTypes = {
  episode: EpisodeNodeComponent,
  text: TextNodeComponent,
  frame: FrameNodeComponent,
};

// Define Combined Node Types
type CanvasNode = EpisodeNode | TextNode | FrameNode;

interface EpisodeCanvasProps {
  wikiEntries: WikiEntry[]; // All wiki entries from parent or fetch
  onEditEpisode?: (entry: WikiEntry) => void;
  onCreateEpisode?: () => void;
}

const STORAGE_KEY = 'novel-bible-episode-canvas-state';

const loadFromStorage = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Failed to load canvas state:', e);
    }
    return { nodes: [], edges: [] };
};

export const EpisodeCanvas = ({ wikiEntries = [], onEditEpisode, onCreateEpisode }: EpisodeCanvasProps) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
      const { nodes: savedNodes, edges: savedEdges } = loadFromStorage();
      if (savedNodes && savedNodes.length > 0) {
          setNodes(savedNodes);
      }
      if (savedEdges && savedEdges.length > 0) {
          setEdges(savedEdges);
      }
      setIsLoaded(true);
  }, []);

  // Save to storage on change
  useEffect(() => {
      if (isLoaded) { // Only save if we have loaded initial state
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
      }
  }, [nodes, edges, isLoaded]);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Current Tool State
  const [currTool, setCurrTool] = useState<'default' | 'text' | 'frame' | 'edge'>('default');
  const [connectionSource, setConnectionSource] = useState<string | null>(null);

  // Hover State for Sidebar Items
  const [hoveredItem, setHoveredItem] = useState<WikiEntry | null>(null);
  const [hoverPos, setHoverPos] = useState<{ top: number, left: number } | null>(null);

  // Sync Node Data with wikiEntries (Important for CRUD updates)
  // Sync Node Data with wikiEntries (Important for CRUD updates)
  useEffect(() => {
    if (!isLoaded) return;
    
    setNodes((nds) => 
      nds.map((node) => {
        if (node.type === 'episode') {
           const freshEntry = wikiEntries.find(e => e.id === node.data.entry.id);
            if (freshEntry) {
              return { ...node, data: { ...node.data, entry: freshEntry } } as EpisodeNode;
            }
        }
        return node;
      })
    );
  }, [wikiEntries, setNodes, isLoaded]); // Re-run when loaded or entries change

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

  // Double Click to Edit
  const onNodeDoubleClick = useCallback((_, node: Node) => {
      // Only trigger for episode nodes
      if (node.type === 'episode' && onEditEpisode && node.data.entry) {
          onEditEpisode(node.data.entry as WikiEntry);
      }
  }, [onEditEpisode]);

  // Handle adding nodes (Text/Frame)
  const handleAddNode = useCallback((event: React.MouseEvent) => {
      if (currTool === 'default' || currTool === 'edge') return;

      const position = rfInstance?.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
      }) || { x: 0, y: 0 };

      if (currTool === 'text') {
        const newNode: TextNode = {
            id: `text-${Date.now()}`,
            type: 'text',
            position: { x: position.x - 100, y: position.y - 50 }, // Center on click
            data: { text: '', color: '#fbbf24' },
            style: { width: 200, height: 100 }, // Default size for resizer
        };
        setNodes((nds) => nds.concat(newNode));
        setCurrTool('default');
      }

      if (currTool === 'frame') {
          const newNode: FrameNode = {
              id: `frame-${Date.now()}`,
              type: 'frame',
              position: { x: position.x - 250, y: position.y - 200 }, // Center
              data: { label: 'New Frame' },
              style: { width: 500, height: 400, zIndex: -1 }, // Default large size
          };
          setNodes((nds) => [newNode, ...nds]); // Add to beginning (behind others)
          setCurrTool('default');
      }
  }, [currTool, rfInstance, setNodes]);

  // Pane Click Handler
  const onPaneClick = handleAddNode;

  // Node Click Handler (for placing items on top of frames or Creating Edges)
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
      // Tool: Edge Creation
      if (currTool === 'edge') {
          if (!connectionSource) {
              setConnectionSource(node.id);
          } else {
              // Create edge
              if (connectionSource !== node.id) {
                 const newEdge: Edge = {
                     id: `e${connectionSource}-${node.id}`,
                     source: connectionSource,
                     target: node.id,
                     animated: true,
                     style: { stroke: '#3b82f6', strokeWidth: 2 }
                 };
                 setEdges((eds) => addEdge(newEdge, eds));
                 setConnectionSource(null); // Reset
                 setCurrTool('default'); // Optional: reset tool after connection
              } else {
                 setConnectionSource(null); // Deselect if clicking same node
              }
          }
          return;
      }

      // Tool: Text/Frame Placement
      if (currTool !== 'default') {
          handleAddNode(event);
      }
  }, [currTool, handleAddNode, connectionSource, setEdges, setConnectionSource]);

  // Node Drag Stop Handler (Grouping Logic)
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // 1. Find potential parent frame
      // We look for FrameNodes that intersect with the dragged node
      const intersections = rfInstance.getIntersectingNodes(node).filter((n: Node) => n.type === 'frame');
      const parentFrame = intersections[intersections.length - 1]; // Take the last one (top-most usually)

      if (parentFrame) {
         // Moving INTO a Frame
         if (node.parentId !== parentFrame.id) {
             const parentNode = parentFrame;
             
             // Calculate relative position
             const relativePosition = {
                 x: node.position.x - parentNode.position.x,
                 y: node.position.y - parentNode.position.y,
             };

             setNodes((nds) => 
               nds.map((n) => {
                 if (n.id === node.id) {
                   return {
                     ...n,
                     parentId: parentNode.id,
                     position: relativePosition,
                     extent: 'parent', // Optional: clip to parent
                   };
                 }
                 return n;
               })
             );
         }
      } else {
          // Moving OUT of a Frame
          if (node.parentId) {
               // We need the absolute position to detach it
               // Since checking 'intersections' might fail if we dragged it partially out, 
               // but getIntersectingNodes checks overlap. If valid 'intersections' is empty, we are out.
               
               // To get absolute position, we need the parent's position.
               const parentNode = nodes.find(n => n.id === node.parentId);
               
               if (parentNode) {
                   const absolutePosition = {
                       x: parentNode.position.x + node.position.x,
                       y: parentNode.position.y + node.position.y,
                   };

                   setNodes((nds) => 
                       nds.map((n) => {
                           if (n.id === node.id) {
                               const { parentId, extent, ...rest } = n;
                               return {
                                   ...rest,
                                   position: absolutePosition,
                               };
                           }
                           return n;
                       })
                   );
               }
          }
      }
    },
    [rfInstance, nodes, setNodes]
  );

  // Delete Selected Nodes
  const handleDeleteSelected = useCallback(() => {
      setNodes((nds) => nds.filter((node) => !node.selected));
      setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);


  // Save / Export Logic
  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      const exportData = {
          nodes: flow.nodes.map(n => ({ 
              id: n.id, 
              type: n.type,
              position: n.position, 
              width: n.style?.width,
              height: n.style?.height,
              data: n.data, // Include text/label data
              entryId: n.data.entry?.id 
          })),
          edges: flow.edges.map(e => ({ source: e.source, target: e.target }))
      }
      console.log('Exported Flow:', exportData);
      alert('Canvas layout exported to console (JSON).');
    }
  }, [rfInstance]);

  return (
    <div className="flex h-full w-full bg-[#0b0c15] text-slate-200 relative overflow-hidden">
      
      {/* Floating Toolbar (Top Center) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 bg-[#1e293b]/90 backdrop-blur-md border border-slate-700/50 rounded-lg shadow-2xl">
          <button 
                onClick={() => setCurrTool('default')}
                className={`p-2 rounded-md transition-all ${currTool === 'default' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'}`}
                title="Select (Pointer)"
            >
                <MousePointer2 size={18} />
          </button>
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <button 
                onClick={() => setCurrTool('frame')}
                className={`p-2 rounded-md transition-all ${currTool === 'frame' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'}`}
                title="Add Frame"
            >
                <SquareDashed size={18} />
          </button>
          <button 
                onClick={() => setCurrTool('text')}
                className={`p-2 rounded-md transition-all ${currTool === 'text' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'}`}
                title="Add Text"
            >
                <Type size={18} />
          </button>
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <button 
                onClick={() => setCurrTool('edge')}
                className={`p-2 rounded-md transition-all ${currTool === 'edge' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100'}`}
                title="Connect (Edge)"
            >
                <ArrowRight size={18} />
          </button>
          <div className="w-px h-6 bg-slate-700 mx-1" />
          <button 
                onClick={onCreateEpisode}
                className="p-2 rounded-md transition-all text-green-400 hover:bg-green-500/20 hover:text-green-300"
                title="Create New Episode"
            >
                <Plus size={18} />
          </button>
          <button 
                onClick={handleDeleteSelected}
                className="p-2 rounded-md transition-all text-red-400 hover:bg-red-500/20 hover:text-red-300"
                title="Delete Selected"
            >
                <Trash2 size={18} />
          </button>
      </div>

      {/* Sidebar (Episode List) */}
      <motion.div 
        animate={{ width: isSidebarOpen ? 320 : 0, opacity: isSidebarOpen ? 1 : 0 }}
        initial={{ width: 320, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="border-r border-slate-800 bg-[#11121c] flex flex-col shrink-0 z-10 shadow-2xl relative overflow-hidden"
      >
        <div className="p-4 border-b border-slate-800 bg-[#0b0e14] whitespace-nowrap">
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
                    onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredItem(ep);
                        setHoverPos({ top: rect.top, left: rect.right + 10 });
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
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
      </motion.div>

      {/* Sidebar Item Hover Popup (Fixed Position) */}
      <AnimatePresence>
        {hoveredItem && hoverPos && (
            <motion.div 
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{ 
                    position: 'fixed', 
                    top: hoverPos.top, 
                    left: hoverPos.left,
                    zIndex: 100
                }}
                className="pointer-events-none"
            >
                 <div className="bg-slate-800/95 backdrop-blur-md border border-slate-600 p-4 rounded-xl shadow-2xl text-xs text-slate-200 w-72 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700/50">
                        {hoveredItem.image && <img src={hoveredItem.image} className="w-8 h-8 rounded object-cover border border-slate-600"/>}
                        <h4 className="font-bold text-slate-100 truncate flex-1">{hoveredItem.name}</h4>
                    </div>

                    {/* Summary */}
                    <div>
                        <h5 className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                            <span className="w-1 h-3 bg-blue-500 rounded-full"/> 요약
                        </h5>
                        <p className="leading-relaxed text-slate-300 line-clamp-4">
                            {hoveredItem.content?.replace(/[#*`]/g, '').slice(0, 150) || '내용 없음'}
                        </p>
                    </div>

                    {/* Comment */}
                    {(hoveredItem.info as any)?.comment && (
                        <div>
                            <h5 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                                <span className="w-1 h-3 bg-amber-500 rounded-full"/> 코멘트
                            </h5>
                            <p className="leading-relaxed text-slate-300 italic">
                                "{ (hoveredItem.info as any).comment }"
                            </p>
                        </div>
                    )}

                    {/* Tags */}
                    {hoveredItem.tags && hoveredItem.tags.length > 0 && (
                        <div>
                            <h5 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                                <span className="w-1 h-3 bg-emerald-500 rounded-full"/> 태그
                            </h5>
                            <div className="flex flex-wrap gap-1">
                                {hoveredItem.tags.map(tag => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-slate-700 text-slate-300 rounded text-[10px]">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse Toggle Button (Floating) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-4 z-20 transition-all duration-300 p-2 bg-[#1e293b] border border-slate-700 rounded-md shadow-lg text-slate-300 hover:text-white hover:border-blue-500
            ${isSidebarOpen ? 'left-[328px]' : 'left-4'}
        `}
      >
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

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
          onNodeDoubleClick={onNodeDoubleClick}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          panOnDrag={currTool === 'default'}
          selectionOnDrag={currTool === 'default'} 
          zoomOnDoubleClick={currTool === 'default'}
          panOnScroll={true} // Allow scrolling even when placing items
          className={`bg-[#0f172a] ${currTool !== 'default' ? '!cursor-crosshair' : ''}`}
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
