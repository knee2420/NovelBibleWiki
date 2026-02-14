
import {
    Book,
    FileText,
    Folder,
    MessageSquare,
    Plus,
    Sparkles,
    Search,
    LayoutTemplate,
    Settings,
    Bot,
    User,
    X,
    Upload,
    ChevronRight,
    ChevronDown,
    CheckSquare,
    Square,
    FolderOpen,
    FilePlus,
    FolderPlus,
    Edit2,
    Trash2,

    Save,
    MapPin,
    Users,
    Shield,
    Scroll,
    BookOpen,
    GitBranch,
    RefreshCw,
    Loader2
} from 'lucide-react'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Message } from './AIWriterPanel'
import { WikiEntry } from '../../types/wiki'
import { ActBoard } from '../../types/plot'

interface StorySandboxProps {
    initialHistory?: Message[]
    wikiData?: WikiEntry[]
    plotData?: ActBoard[]
    sceneContext?: { chapter: number, scene: number }
    onRefresh?: () => void
}



type SourceItem = {
    id: string
    title: string
    type: 'wiki' | 'file' | 'plot' // Added 'plot'
    icon?: any
    meta?: string
    isFolder?: boolean
    path?: string
    children?: SourceItem[]
}

type TabItem = {
    id: string
    title: string
    type: 'wiki' | 'file' | 'plot'
    path: string
    content?: string
    isDirty?: boolean
}


type TreeNode = {
    id: string
    name: string
    path: string
    type: 'directory' | 'file'
    children: TreeNode[]
    entry?: WikiEntry
    plotData?: any // To hold scene/chapter info
}

interface CollectedItem {
    id: string
    type: string // e.g. 'Character', 'Location'
    name: string
    timestamp: number
    sourceText?: string
}

interface ResearchTask {
    id: string
    title: string
    items: CollectedItem[]
    createdAt: number
}

// -- Improved Story Node Structure for Tree --
interface StoryNode {
    id: string
    parentId: string | null
    title: string
    summary: string
    content: string
    reasoning?: string
    children: string[]
    timestamp: number
    selected?: boolean
}


const buildFileTree = (entries: WikiEntry[]): TreeNode[] => {
    const root: TreeNode[] = []
    const map = new Map<string, TreeNode>()

    entries.forEach(entry => {
        const path = entry.id.replace(/\\/g, '/')
        const parts = path.split('/')
        const fileName = parts.pop()!

        let currentPath = ''
        let currentLevel = root

        parts.forEach((part) => {
            currentPath = currentPath ? `${currentPath}/${part}` : part
            let node = map.get(currentPath)

            if (!node) {
                node = {
                    id: currentPath,
                    name: part,
                    path: currentPath,
                    type: 'directory',
                    children: []
                }
                map.set(currentPath, node)
                currentLevel.push(node)
            }
            currentLevel = node.children
        })

        currentLevel.push({
            id: entry.id,
            name: entry.name || fileName.replace(/\.md$/, ''),
            path: entry.id,
            type: 'file',
            children: [],
            entry
        })
    })

    const pruneSingleChild = (nodes: TreeNode[]): TreeNode[] => {
        if (nodes.length === 1 && nodes[0].type === 'directory') {
            return pruneSingleChild(nodes[0].children)
        }
        return nodes
    }

    return pruneSingleChild(root)
}

// Build Tree from PlotData
const buildPlotTree = (acts: ActBoard[]): TreeNode[] => {
    return acts.map(act => ({
        id: act.id,
        name: act.title,
        path: act.path,
        type: 'directory',
        children: act.chapters.map(chap => ({
            id: chap.id,
            name: `${chap.chapterNumber}화 ${chap.title}`,
            path: chap.id,
            type: 'directory', // Chapter is a folder
            children: chap.scenes.map(scene => ({
                id: scene.id,
                name: `${scene.sceneNumber}씬 ${scene.title}`,
                path: scene.id,
                type: 'file',
                plotData: scene,
                children: [] // Scenes are files
            }))
        }))
    }))
}

const ReadingCard = ({ args, name, status, result }: { args: any, name: string, status?: string, result?: any }) => {
    return (
        <div className={`bg-slate-800/50 border ${status === 'success' ? 'border-emerald-500/30' : 'border-blue-500/20'} rounded-lg p-3 my-2 w-[90%] ${status !== 'success' && 'animate-pulse'} flex flex-col gap-2`}>
            <div className="flex items-center gap-3">
                <div className={`p-1.5 ${status === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'} rounded-full`}>
                    {status === 'success' ? <CheckSquare size={14} /> : (name === 'read_previous_scenes' ? <Book size={14} /> : <Search size={14} />)}
                </div>
                <div className="flex-1">
                    <p className={`text-xs ${status === 'success' ? 'text-emerald-200' : 'text-blue-200'} font-bold`}>
                        {status === 'success' ? "분석 완료" : (name === 'read_previous_scenes' ? "문맥 파악 중..." : "위키 데이터 검색 중...")}
                    </p>
                    <p className="text-[10px] text-slate-400">
                        {status === 'success' && result ? (
                            <span className="text-slate-300 block mt-1">
                                {name === 'read_previous_scenes' ? `읽은 파일: ${result}` : result}
                            </span>
                        ) : (
                            name === 'read_previous_scenes'
                                ? `이전 ${args.count}개 씬의 내용을 분석하고 있습니다.`
                                : `관련 항목: ${args.names?.join(', ') || ''}`
                        )}
                    </p>
                </div>
            </div>
        </div>
    )
}

const FileTreeItem = ({
    node,
    level = 0,
    expanded,
    selected,
    onToggleExpand,
    onToggleSelect
}: {
    node: TreeNode,
    level?: number,
    expanded: Set<string>,
    selected: Set<string>,
    onToggleExpand: (id: string) => void,
    onToggleSelect: (node: TreeNode) => void
}) => {
    const isExpanded = expanded.has(node.id)
    const isSelected = selected.has(node.id)

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800/50 rounded cursor-pointer group transition-colors ${isSelected ? 'bg-indigo-900/20' : ''}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}
                    className={`p-0.5 rounded hover:bg-slate-700 ${node.type === 'file' ? 'opacity-0 disabled' : 'text-slate-500'}`}
                    disabled={node.type === 'file'}
                >
                    {node.type === 'directory' && (
                        isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                    )}
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(node); }}
                    className={`shrink-0 ${isSelected ? 'text-indigo-500' : 'text-slate-600 group-hover:text-slate-500'}`}
                >
                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>

                <div
                    className="flex items-center gap-2 flex-1 min-w-0"
                    onClick={() => node.type === 'directory' ? onToggleExpand(node.id) : onToggleSelect(node)}
                >
                    {node.type === 'directory' ? (
                        <div className={`p-1 rounded ${isSelected ? 'text-indigo-400' : 'text-blue-400/80'}`}>
                            {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
                        </div>
                    ) : (
                        <div className={`p-1 rounded ${isSelected ? 'text-indigo-300' : 'text-slate-500'}`}>
                            {node.plotData ? <FileText size={14} /> : (node.entry?.type === 'character' ? <User size={14} /> : <FileText size={14} />)}
                        </div>
                    )}
                    <span className={`text-xs truncate ${isSelected ? 'text-indigo-200 font-medium' : 'text-slate-400'}`}>
                        {node.name}
                    </span>
                    {node.entry && node.entry.type !== 'file' as any && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 uppercase">{node.entry.type}</span>
                    )}
                    {node.plotData && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 uppercase">Scene</span>
                    )}
                </div>
            </div>

            {node.type === 'directory' && isExpanded && (
                <div>
                    {node.children.map(child => (
                        <FileTreeItem
                            key={child.id}
                            node={child}
                            level={level + 1}
                            expanded={expanded}
                            selected={selected}
                            onToggleExpand={onToggleExpand}
                            onToggleSelect={onToggleSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const BinderTreeItem = ({
    item,
    level = 0,
    expandedItems,
    onToggle,
    activeId,
    onCreate,
    onRename,
    onDelete,
    onSelect
}: {
    item: SourceItem,
    level: number,
    expandedItems: Set<string>,
    onToggle: (id: string) => void,
    activeId?: string
    onCreate?: (parentPath: string) => void
    onRename?: (path: string, newName: string) => void
    onDelete?: (path: string) => void
    onSelect?: (item: SourceItem) => void
}) => {
    const isExpanded = expandedItems.has(item.id)
    const hasChildren = item.children && item.children.length > 0
    const isActive = activeId === item.id
    const isFolder = item.isFolder

    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(item.title)

    const handleRenameSubmit = () => {
        if (editName.trim() && editName !== item.title && onRename) {
            onRename(item.id, editName)
        }
        setIsEditing(false)
    }

    return (
        <div>
            <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 text-xs cursor-pointer group select-none transition-all ${isActive ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 font-bold' : ''}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={() => hasChildren ? onToggle(item.id) : (onSelect && onSelect(item))}
            >
                {hasChildren ? (
                    <span className="text-slate-600 group-hover:text-slate-500">
                        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                ) : <span className="w-3" />}

                {item.type === 'plot' ? (
                    item.isFolder ? <Folder size={12} className={isActive ? 'text-indigo-400' : 'text-pink-500/50'} /> : <FileText size={12} className={isActive ? 'text-indigo-400' : 'text-pink-400'} />
                ) : (
                    item.isFolder ? <Folder size={12} className="text-indigo-500/50" /> : <Book size={12} className="text-indigo-400" />
                )}

                {isEditing ? (
                    <input
                        // @ts-ignore
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit()
                            if (e.key === 'Escape') setIsEditing(false)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black/50 text-white px-1 py-0.5 rounded outline-none w-full min-w-[50px]"
                    />
                ) : (
                    <span className={`truncate flex-1 ${hasChildren ? 'font-bold text-slate-300' : ''}`}>{item.title}</span>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isFolder && onCreate && !isEditing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onCreate(item.id); }}
                            className="p-1 hover:bg-indigo-500/20 rounded text-slate-500 hover:text-indigo-300 transition-all"
                            title="Create New"
                        >
                            <Plus size={10} />
                        </button>
                    )}
                    {onRename && !isEditing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            className="p-1 hover:bg-blue-500/20 rounded text-slate-500 hover:text-blue-300 transition-all"
                            title="Rename"
                        >
                            <Edit2 size={10} />
                        </button>
                    )}
                    {onDelete && !isEditing && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete '${item.title}'?`)) {
                                    onDelete(item.id);
                                }
                            }}
                            className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-300 transition-all"
                            title="Delete"
                        >
                            <Trash2 size={10} />
                        </button>
                    )}
                </div>

                {!hasChildren && item.meta && !isEditing && (
                    <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-500 uppercase opacity-70">{item.meta}</span>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="border-l border-white/5 ml-[15px]">
                    {item.children!.map(child => (
                        <BinderTreeItem
                            key={child.id}
                            item={child}
                            level={level + 1}
                            expandedItems={expandedItems}
                            onToggle={onToggle}
                            activeId={activeId}
                            onCreate={onCreate}
                            onRename={onRename}
                            onDelete={onDelete}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export const StorySandbox = ({ initialHistory = [], wikiData = [], plotData = [], sceneContext, onRefresh }: StorySandboxProps) => {
    const [isSourceModalOpen, setIsSourceModalOpen] = useState(false)
    const [sourceTab, setSourceTab] = useState<'wiki' | 'plot' | 'upload'>('wiki')
    const [sources, setSources] = useState<SourceItem[]>([
        { id: '1', title: 'World Settings_v2.pdf', type: 'file', meta: 'PDF' },
        { id: '2', title: 'Character Notes', type: 'wiki', meta: 'Wiki' }
    ])

    // -- Tree State --
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())

    // -- Creation State --
    const [isCreationMenuOpen, setIsCreationMenuOpen] = useState(false)
    const [creationType, setCreationType] = useState<'file' | 'folder' | null>(null)
    const [creationParentPath, setCreationParentPath] = useState<string | null>(null) // Path where item is created
    const [newItemName, setNewItemName] = useState('')

    // -- Work Directory State --
    const [workDirectory, setWorkDirectory] = useState<{ root: SourceItem, activeSceneId: string | null } | null>(null)

    // -- Binder State --
    const [expandedBinderItems, setExpandedBinderItems] = useState<Set<string>>(new Set())

    // -- Tab State --
    const [tabs, setTabs] = useState<TabItem[]>([])

    const [activeTabId, setActiveTabId] = useState<string | null>(null)

    // -- Preview State --
    const [previewSource, setPreviewSource] = useState<{ id: string, title: string, content: string, type: 'wiki' | 'file' | 'plot' } | null>(null)

    // -- Resize State --
    const [leftPanelWidth, setLeftPanelWidth] = useState(250)
    const [rightPanelWidth, setRightPanelWidth] = useState(300)
    const [previewHeight, setPreviewHeight] = useState(250)

    const [isResizingLeft, setIsResizingLeft] = useState(false)
    const [isResizingRight, setIsResizingRight] = useState(false)
    const [isResizingPreview, setIsResizingPreview] = useState(false)

    // -- Chat State --
    const [chatInput, setChatInput] = useState('')
    const chatInputRef = useRef<HTMLInputElement>(null) // Ref for input

    // --- Task / Collection State ---
    const [tasks, setTasks] = useState<ResearchTask[]>([
        { id: 'default-1', title: 'Main Research', items: [], createdAt: Date.now() }
    ])
    const [selectedTaskId, setSelectedTaskId] = useState<string>('default-1')
    const [isNewTaskOpen, setIsNewTaskOpen] = useState(false)
    const [newTaskName, setNewTaskName] = useState('')
    const [activeCollectionTab, setActiveCollectionTab] = useState<'character' | 'event' | 'object'>('character')

    // -- Collection Board Resize State --
    const [collectionHeight, setCollectionHeight] = useState(300)
    const [isResizingCollection, setIsResizingCollection] = useState(false)

    // -- Context Action State --
    const [selectedActionItems, setSelectedActionItems] = useState<Set<string>>(new Set())

    const [isBranchPanelOpen, setIsBranchPanelOpen] = useState(false)
    const [storyNodes, setStoryNodes] = useState<StoryNode[]>([])
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
    const [isGeneratingBranches, setIsGeneratingBranches] = useState(false)

    // UI Loading State for Refinement
    const [isRefiningNode, setIsRefiningNode] = useState(false)
    const [branchCount, setBranchCount] = useState<number>(3)

    // Helper to find node by ID
    const getNode = (id: string) => storyNodes.find(n => n.id === id)

    // Helper to get children
    const getChildren = (id: string) => storyNodes.filter(n => n.parentId === id)

    const [tempBranchData, setTempBranchData] = useState<{ title: string, content: string, reasoning: string }>({ title: '', content: '', reasoning: '' })

    const toggleActionItem = (itemId: string) => {
        setSelectedActionItems(prev => {
            const next = new Set(prev)
            if (next.has(itemId)) next.delete(itemId)
            else next.add(itemId)
            return next
        })
    }

    const handleContextAction = (action: 'draft' | 'analyze' | 'ask' | 'suggest_beats') => {
        const currentTask = tasks.find(t => t.id === selectedTaskId)
        if (!currentTask) return

        const selectedItems = currentTask.items.filter(i => selectedActionItems.has(i.id))
        const contextString = selectedItems.map(i => `[[${i.type}::${i.name}]]`).join(', ')

        let prompt = ''
        if (action === 'draft') {
            prompt = `Write a scene featuring ${contextString}. Focus on their interaction.`
        } else if (action === 'analyze') {
            prompt = `Analyze the relationship and potential conflicts between ${contextString}.`
        } else if (action === 'ask') {
            prompt = `With context of ${contextString}, `
        } else if (action === 'suggest_beats') {
            prompt = `[SYSTEM] Suggest ${branchCount} interesting distinct story beats (plot options) involving ${contextString}, considering the story context.
FORMAT REQUIREMENT: You MUST return a JSON Array. Do not wrap in markdown code blocks.
Example: [{"title": "Conflict Arises", "summary": "A fights B", "content": "Full scene description...", "reasoning": "Creates tension"}]`
        }

        setChatInput(prompt)
        // Auto-submit if it's a command
        if (action === 'suggest_beats') {
            // We will handle the auto-send in the effect or just let user press enter.
            // For better UX, let's auto-fill and focus.
        }
        if (chatInputRef.current) chatInputRef.current.focus()
    }

    const handleAddEntityToTask = useCallback((entityType: string, entityName: string) => {
        if (!selectedTaskId) {
            console.warn('No task selected')
            return
        }

        setTasks(prev => prev.map(t => {
            if (t.id === selectedTaskId) {
                // Avoid duplicates
                if (t.items.some(i => i.name === entityName && i.type === entityType)) {
                    console.log('Duplicate item, skipping:', entityName)
                    return t;
                }

                return {
                    ...t,
                    items: [
                        ...t.items,
                        {
                            id: Math.random().toString(36).substr(2, 9),
                            type: entityType,
                            name: entityName,
                            timestamp: Date.now()
                        }
                    ]
                }
            }
            return t
        }))
    }, [selectedTaskId])

    const handleCreateTask = () => {
        if (!newTaskName.trim()) return;
        const newTask: ResearchTask = {
            id: Math.random().toString(36).substr(2, 9),
            title: newTaskName,
            items: [],
            createdAt: Date.now()
        }
        setTasks([...tasks, newTask])
        setSelectedTaskId(newTask.id)
        setNewTaskName('')
        setIsNewTaskOpen(false)
    }

    const handleDeleteTask = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation()
        if (tasks.length <= 1) return // Prevent deleting last task

        const newTasks = tasks.filter(t => t.id !== id)
        setTasks(newTasks)

        if (selectedTaskId === id) {
            setSelectedTaskId(newTasks[0].id)
        }
    }

    // --- Mention Logic State ---
    const [mentionState, setMentionState] = useState<{ active: boolean, query: string, index: number }>({ active: false, query: '', index: 0 })

    // Filtered items for mention
    const mentionItems = useMemo(() => {
        if (!mentionState.active) return []
        const query = mentionState.query.toLowerCase()
        return (wikiData || [])
            .filter(w => w.name.toLowerCase().includes(query) || (w.id || '').toLowerCase().includes(query))
            .slice(0, 10) // Limit results
    }, [mentionState.active, mentionState.query, wikiData])

    const getIconForType = (type: string) => {
        switch (type) {
            case 'character': return <User size={14} className="shrink-0" />
            case 'location': return <MapPin size={14} className="shrink-0" />
            case 'item': return <Shield size={14} className="shrink-0" />
            case 'faction': return <Users size={14} className="shrink-0" />
            case 'scene': return <FileText size={14} className="shrink-0" />
            default: return <Scroll size={14} className="shrink-0" />
        }
    }

    const confirmMention = (item: WikiEntry) => {
        if (!chatInputRef.current) return
        const cursor = chatInputRef.current.selectionStart || 0
        const textBefore = chatInput.slice(0, cursor)
        const match = textBefore.match(/@([^\s]*)$/)

        if (match) {
            const prefix = chatInput.slice(0, cursor - match[0].length)
            const suffix = chatInput.slice(cursor)
            const insertion = `[[${item.name}]]`
            const newValue = prefix + insertion + ' ' + suffix
            setChatInput(newValue)
            setMentionState({ active: false, query: '', index: 0 })

            // Focus will remain on inputRef
            setTimeout(() => {
                if (chatInputRef.current) chatInputRef.current.focus()
            }, 0)
        }
    }

    const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setChatInput(val)

        const cursor = e.target.selectionStart || 0
        const textBefore = val.slice(0, cursor)
        // Check for @ followed by non-space chars at end of string
        const match = textBefore.match(/@([^\s]*)$/)

        if (match) {
            setMentionState({ active: true, query: match[1], index: 0 })
        } else {
            setMentionState(prev => prev.active ? { ...prev, active: false } : prev)
        }
    }

    const handleChatInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (mentionState.active && mentionItems.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionState(prev => ({ ...prev, index: Math.max(0, prev.index - 1) }))
            } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionState(prev => ({ ...prev, index: Math.min(mentionItems.length - 1, prev.index + 1) }))
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                confirmMention(mentionItems[mentionState.index])
            } else if (e.key === 'Escape') {
                e.preventDefault()
                setMentionState(prev => ({ ...prev, active: false }))
            }
        } else {
            if (e.key === 'Enter') {
                handleSendMessage()
            }
        }
    }

    // --- Mention Chips Logic ---
    const mentionedFiles = useMemo(() => {
        const matches = chatInput.match(/\[\[(.*?)\]\]/g) || []
        const uniqueNames = Array.from(new Set(matches.map(m => m.slice(2, -2))))
        return uniqueNames.map(name => {
            const entry = (wikiData || []).find(w => w.name === name)
            return entry || { name, type: 'other' as const, id: 'Not found in wiki', description: '', tags: [], content: '', info: {} } as WikiEntry
        })
    }, [chatInput, wikiData])

    const removeMention = (name: string) => {
        const token = `[[${name}]]`
        setChatInput(prev => prev.replace(token, ''))
    }

    const [chatHistory, setChatHistory] = useState<Message[]>(initialHistory || [])
    const [isSending, setIsSending] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new message
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [chatHistory])

    // Handle Resize
    const startResizingLeft = useCallback(() => setIsResizingLeft(true), [])
    const startResizingRight = useCallback(() => setIsResizingRight(true), [])
    const startResizingPreview = useCallback(() => setIsResizingPreview(true), []) // Top resize of preview pane
    // Remove if unused, but we need startResizingCollection defined here or used inline

    const stopResizing = useCallback(() => {
        setIsResizingLeft(false)
        setIsResizingRight(false)
        setIsResizingPreview(false)
        setIsResizingCollection(false)
    }, [])

    const handleResize = useCallback((e: MouseEvent) => {
        if (isResizingLeft) {
            const newWidth = e.clientX
            if (newWidth > 200 && newWidth < 500) setLeftPanelWidth(newWidth)
        }
        if (isResizingRight) {
            const newWidth = window.innerWidth - e.clientX
            if (newWidth > 200 && newWidth < 600) setRightPanelWidth(newWidth)
        }
        if (isResizingPreview) {
            setPreviewHeight(prev => {
                const newH = prev - e.movementY
                return Math.max(100, Math.min(newH, 600))
            })
        }
        if (isResizingCollection) {
            setCollectionHeight(prev => {
                const newH = prev + e.movementY
                // Min 150px, Max constraints
                return Math.max(150, Math.min(newH, window.innerHeight - 200))
            })
        }
    }, [isResizingLeft, isResizingRight, isResizingPreview, isResizingCollection])

    useEffect(() => {
        if (isResizingLeft || isResizingRight || isResizingPreview || isResizingCollection) {
            window.addEventListener('mousemove', handleResize)
            window.addEventListener('mouseup', stopResizing)
            return () => {
                window.removeEventListener('mousemove', handleResize)
                window.removeEventListener('mouseup', stopResizing)
            }
        }
    }, [isResizingLeft, isResizingRight, isResizingPreview, isResizingCollection, handleResize, stopResizing])

    // Initial expansion for Binder (Expand first Act and first Chapter by default)
    useMemo(() => {
        if (plotData.length > 0) {
            const firstAct = plotData[0]
            const initial = new Set<string>()
            initial.add(firstAct.id)
            if (firstAct.chapters.length > 0) {
                initial.add(firstAct.chapters[0].id)
            }
            // Use a ref or simple check to avoid resetting if user collapses
            // For now, just simplistic or empty. 
            // To properly init only once, we'd need a Ref to track "initialized".
            // Let's rely on user interaction, start collapsed or minimal.
        }
    }, [plotData])

    const toggleBinderItem = (id: string) => {
        setExpandedBinderItems(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const treeData = useMemo(() => buildFileTree(wikiData), [wikiData])
    const plotTreeData = useMemo(() => buildPlotTree(plotData), [plotData])

    const activeTreeData = sourceTab === 'wiki' ? treeData : (sourceTab === 'plot' ? plotTreeData : [])

    // -- Work Directory Computation (Replaced with State + API) --
    // const workDirectory = useMemo(() => { ... }) 

    const fetchWorkDirectory = useCallback(async () => {
        if (!plotData || !sceneContext) return

        let activeChapter: any = null
        let activeSceneId: string | null = null

        for (const act of plotData) {
            const chapter = act.chapters.find(c => c.chapterNumber === sceneContext.chapter)
            if (chapter) {
                activeChapter = chapter
                const scene = chapter.scenes.find(s => s.sceneNumber === sceneContext.scene)
                if (scene) activeSceneId = scene.id
                break
            }
        }

        if (!activeChapter) return

        // Fetch real file tree
        // @ts-ignore
        if (window.api && window.api.getDirectoryTree) {
            // @ts-ignore
            const rootTree = await window.api.getDirectoryTree(activeChapter.id)
            if (rootTree) {
                setWorkDirectory({ root: rootTree, activeSceneId })
            }
        }
    }, [plotData, sceneContext])

    useEffect(() => {
        fetchWorkDirectory()
    }, [fetchWorkDirectory])

    const handleRenameItem = async (path: string, newName: string) => {
        // @ts-ignore
        if (window.api && window.api.renameFile) {
            // @ts-ignore
            const success = await window.api.renameFile(path, newName)
            if (success) {
                fetchWorkDirectory()
            } else {
                alert('Rename failed')
            }
        }
    }

    const handleDeleteItem = async (path: string) => {
        // @ts-ignore
        if (window.api && window.api.deleteItem) {
            // @ts-ignore
            const success = await window.api.deleteItem(path)
            if (success) {
                fetchWorkDirectory()
                if (onRefresh) onRefresh()
                // Close tab if deleted
                const tabId = path // assuming ID is path for work items
                handleCloseTab(tabId)
            } else {
                alert('Delete failed')
            }
        }
    }

    const handleOpenTab = async (item: SourceItem) => {
        // If folder, just toggle? Already handled by toggleBinderItem.
        // If file, open tab.
        if (item.isFolder) return

        const existingTab = tabs.find(t => t.id === item.id)
        if (existingTab) {
            setActiveTabId(existingTab.id)
            return
        }

        // Create new tab
        const newTab: TabItem = {
            id: item.id,
            title: item.title,
            type: item.type,
            path: item.id, // ID is path or fetching path
            content: '' // Loading...
        }

        setTabs(prev => [...prev, newTab])
        setActiveTabId(newTab.id)

        // Fetch Content
        // @ts-ignore
        if (window.api && window.api.readFile) {
            // @ts-ignore
            const content = await window.api.readFile(item.id) // item.id is path
            if (content !== null) {
                setTabs(prev => prev.map(t => t.id === item.id ? { ...t, content } : t))
            }
        }
    }

    const handleContentChange = (tabId: string, newContent: string) => {
        setTabs(prev => prev.map(t => t.id === tabId ? { ...t, content: newContent, isDirty: true } : t))
    }

    const handleSaveContent = async (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId)
        if (!tab || !tab.isDirty) return

        // @ts-ignore
        if (window.api && window.api.saveFile) {
            // @ts-ignore
            await window.api.saveFile(tab.path, tab.content || '')
            setTabs(prev => prev.map(t => t.id === tabId ? { ...t, isDirty: false } : t))
            console.log('Saved', tab.path)
        }
    }

    // Helper to gather all file paths from a folder structure
    const getAllLeafPaths = (node: SourceItem): { path: string, title: string }[] => {
        let results: { path: string, title: string }[] = []
        if (!node.isFolder && node.path) {
            results.push({ path: node.path, title: node.title })
        } else if (node.children) {
            node.children.forEach(child => {
                results = results.concat(getAllLeafPaths(child))
            })
        }
        return results
    }

    const getAllSourcesContent = async () => {
        let contextText = ''

        // 1. Wiki Sources
        const wikiSources = sources.filter(s => s.type === 'wiki')
        for (const s of wikiSources) {
            const entry = wikiData?.find(w => w.id === s.id)
            if (entry && entry.content) {
                contextText += `\n\n[Wiki: ${entry.name} (${entry.type})]\n${entry.content}`
            }
        }

        // 2. File/Plot Sources
        const fileSources = sources.filter(s => s.type !== 'wiki')
        for (const s of fileSources) {
            const leaves = getAllLeafPaths(s)
            for (const leaf of leaves) {
                try {
                    // @ts-ignore
                    if (window.api && window.api.readFile) {
                        // @ts-ignore
                        const content = await window.api.readFile(leaf.path)
                        if (content) {
                            contextText += `\n\n[Ref: ${leaf.title}]\n${content}`
                        }
                    }
                } catch (e) {
                    console.error('Failed to read source for context:', leaf.path)
                }
            }
        }
        return contextText
    }

    const handleSendMessage = async () => {
        if (!chatInput.trim() || isSending) return

        const userMsg: Message = { role: 'user', content: chatInput }
        // Optimistic UI update
        const newHistory = [...chatHistory, userMsg]
        setChatHistory(newHistory)
        setChatInput('')
        setIsSending(true)

        try {
            // 1. Validate API
            // @ts-ignore
            if (!window.api || !window.api.interactSceneWriterAgent) {
                throw new Error('AI API not available')
            }

            // 2. Prepare Context
            const activeTab = tabs.find(t => t.id === activeTabId)
            const currentContent = activeTab?.content || ''

            // 3. Gather Source Context
            const sourceContext = await getAllSourcesContent()

            // --- MENTION CONTEXT INJECTION START ---
            // Extract and inject referenced wiki entries (WikiLinks)
            const wikiLinkMatches = userMsg.content?.match(/\[\[(.*?)\]\]/g) || []
            const uniqueNames = Array.from(new Set(wikiLinkMatches.map(m => m.slice(2, -2))))

            let referencedContext = ''
            if (uniqueNames.length > 0) {
                referencedContext = '\n\n[REFERENCED WIKI ENTRIES - 사용자가 명시적으로 언급한 자료입니다. 반드시 이 내용을 바탕으로 답변하세요]\n'

                for (const name of uniqueNames) {
                    // Strategy 1: Exact Name Match
                    let entry = (wikiData || []).find(w => w.name === name)

                    // Strategy 2: Filename Match (fallback)
                    if (!entry) {
                        const targetName = name.trim().normalize()
                        entry = (wikiData || []).find(w => {
                            const filename = w.id.split(/[\\/]/).pop()?.replace(/\.md$/i, '').normalize() || ''
                            return filename === targetName
                        })
                    }

                    if (entry) {
                        // Ensure content is available. If not in memory, read from disk.
                        let content = entry.content
                        if (!content && window.api && (window.api as any).readFile) {
                            try {
                                console.log(`[StorySandbox] Reading content for mention: ${entry.name} (${entry.id})`)
                                // @ts-ignore
                                content = await window.api.readFile(entry.id)
                            } catch (e) {
                                console.error(`[StorySandbox] Failed to read content for ${entry.id}`, e)
                                content = '(파일 읽기 실패)'
                            }
                        }

                        referencedContext += `\n## [[${entry.name}]] (${entry.type})\n`
                        referencedContext += `파일: ${entry.id}\n`
                        if (entry.description) referencedContext += `설명: ${entry.description}\n`

                        // Inject Frontmatter
                        if (entry.info && Object.keys(entry.info).length > 0) {
                            referencedContext += `\n[메타데이터/속성 정보]:\n${JSON.stringify(entry.info, null, 2)}\n`
                        }

                        referencedContext += `\n[본문 내용]:\n${content || '(본문 없음)'}\n`
                        referencedContext += `\n---\n`
                    }
                }
            }
            // --- MENTION CONTEXT INJECTION END ---

            const enrichedMessage = `${userMsg.content}${referencedContext}\n\n[CONTEXT FROM SOURCES]\n${sourceContext}`

            // Helper to format history for backend (preserving tool calls)
            const formatHistory = (hist: Message[]) => hist.map(m => ({
                role: m.role === 'user' ? 'client' : 'model',
                content: m.content || '',
                // Ensure tool calls are passed if present
                tool_call: m.toolCall ? { name: m.toolCall.name, args: m.toolCall.args } : undefined,
                // Ensure tool responses are passed if present (though we don't store them explicitly yet, maybe context?)
            }))

            // Recursive handler for Agent Results
            const handleAgentResult = async (result: any, currentHistory: Message[]) => {
                if (!result.success) {
                    setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error: ' + (result.message || 'Unknown error') }])
                    return
                }

                if (result.type === 'tool_call') {
                    // 1. Add Assistant's Tool Call message to UI
                    const toolCallMsg: Message = {
                        role: 'assistant',
                        toolCall: { name: result.toolName, args: result.args, status: 'pending' }
                    }
                    setChatHistory(prev => [...prev, toolCallMsg])

                    // 2. Execute Tool
                    if (result.toolName === 'read_previous_scenes') {
                        // @ts-ignore
                        window.api.getPreviousScenes(sceneContext?.chapter || 0, sceneContext?.scene || 0, result.args.count || 3)
                            .then(async (scenes: any[]) => {
                                const contextText = scenes.map(s => `
[File: ${s.fileName}]
(Title: ${s.title})
${s.content}
--------------------------------------------------
`).join('\n')

                                const fileNames = scenes.map(s => s.fileName).join(', ')

                                // 3. Update UI with Tool Result (Success State)
                                setChatHistory(prev => {
                                    const next = [...prev]
                                    const last = next[next.length - 1]
                                    if (last.toolCall && last.toolCall.status === 'pending') {
                                        last.toolCall.status = 'success'
                                        last.toolCall.result = fileNames
                                    }
                                    return next
                                })

                                // 4. Recursive call with tool result
                                // Construct history including the tool call we just processed
                                const historyWithTool = [
                                    ...currentHistory,
                                    {
                                        role: 'assistant',
                                        content: '',
                                        toolCall: { name: result.toolName, args: result.args, status: 'success' }
                                    } as Message
                                ]

                                // Call Agent again with tool output as user message
                                // @ts-ignore
                                const nextResult = await window.api.interactSceneWriterAgent({
                                    currentContent,
                                    userMessage: `[TOOL_RESULT]\n${contextText}\n\n(Proceed with analysis based on this context.)`,
                                    context: sceneContext || { chapter: 0, scene: 0 },
                                    history: formatHistory(historyWithTool)
                                })

                                // Handle the NEXT result recursively
                                await handleAgentResult(nextResult, [...historyWithTool, { role: 'user', content: '[System: Tool Result Processed]' }])
                                // Note: We don't display the system msg in UI, just for history tracking consistency if needed, 
                                // but actually handleAgentResult uses `currentHistory` for the NEXT call.
                                // Since `interactSceneWriterAgent` handles history + userMessage, we just need to pass the updated history.
                                // Wait, `handleAgentResult`'s second arg is `currentHistory` which is the history BEFORE the *result* we are processing.
                                // So for the NEXT call, we need `historyWithTool` + `User Message (Tool Result)`.
                                // However, `interactSceneWriterAgent` takes `history` (context) and `userMessage` (new input).
                                // The `nextResult` is the *response* to that new input.
                                // So when we call `handleAgentResult(nextResult, ...)`, the `currentHistory` should be:
                                // `historyWithTool` + `User Message describing tool result`.

                            })
                            .catch((e) => {
                                console.error(e)
                                setChatHistory(prev => [...prev, { role: 'assistant', content: 'Failed to read previous scenes.' }])
                            })
                    } else {
                        // Generic Tool Handling (propose_*, analyze_*, etc.)
                        // These tools usually return their content in `result.args` directly from the AI.

                        // 1. Update UI to show success
                        const argsStr = JSON.stringify(result.args, null, 2)
                        setChatHistory(prev => {
                            const next = [...prev]
                            const last = next[next.length - 1]
                            if (last.toolCall) {
                                last.toolCall.status = 'success'
                                last.toolCall.result = 'Content Generated' // Simple UI status
                            }
                            return next
                        })

                        // 2. Recursive call to force AI to generate text response
                        // Construct history including this tool execution
                        const historyWithTool = [
                            ...currentHistory,
                            {
                                role: 'assistant',
                                content: '',
                                toolCall: { name: result.toolName, args: result.args, status: 'success', result: argsStr }
                            } as Message
                        ]

                        // Call Agent again with system instruction to summarize/explain
                        // @ts-ignore
                        const nextResult = await window.api.interactSceneWriterAgent({
                            currentContent,
                            // We tell the AI the tool was executed and displayed, so it should now speak to the user.
                            userMessage: `[SYSTEM: Tool '${result.toolName}' was successfully executed. The content has been generated. Please provide a natural text response to the user summarizing the result or answering their specific question.]`,
                            context: sceneContext || { chapter: 0, scene: 0 },
                            history: formatHistory(historyWithTool)
                        })

                        await handleAgentResult(nextResult, [...historyWithTool, { role: 'user', content: '[System: Tool Executed]' }])
                    }
                } else {
                    // Normal Text Response
                    const assistantMsg: Message = {
                        role: 'assistant',
                        content: result.reply || result.content // Handle both keys if backend varies
                    }
                    if (assistantMsg.content) {
                        setChatHistory(prev => [...prev, assistantMsg])
                    }
                }
            }

            // 4. Call Agent (Initial)
            // @ts-ignore
            const result = await window.api.interactSceneWriterAgent({
                currentContent,
                userMessage: enrichedMessage,
                context: sceneContext || { chapter: 0, scene: 0 },
                history: formatHistory(chatHistory) // Use history BEFORE the current message, userMessage is current
            })

            // Handle the Initial Result
            await handleAgentResult(result, [...chatHistory, userMsg])


        } catch (e) {
            console.error(e)
            setChatHistory(prev => [...prev, { role: 'assistant', content: 'Failed to send message.' }])
        } finally {
            setIsSending(false)
        }
    }

    const handlePreviewSource = async (item: SourceItem) => {
        if (item.isFolder) {
            const leaves = getAllLeafPaths(item)
            if (leaves.length === 0) {
                setPreviewSource({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    content: '📂 Directory: ' + item.title + '\n(No files found in this folder)'
                })
                return
            }

            // Show loading state
            setPreviewSource({
                id: item.id,
                title: item.title,
                type: item.type,
                content: `Loading content from ${leaves.length} files...`
            })

            try {
                // Sort leaves by title or path if needed to ensure order? 
                // Usually file system order is alphabetical. 
                // Let's assume the tree order is correct for now.

                const contents = await Promise.all(leaves.map(async (leaf) => {
                    // @ts-ignore
                    if (window.api && window.api.readFile) {
                        // @ts-ignore
                        const fileContent = await window.api.readFile(leaf.path)
                        return `## ${leaf.title}\n\n${fileContent || '(Empty)'}\n\n`
                    }
                    return `## ${leaf.title}\n\n(Read Error)\n\n`
                }))

                setPreviewSource({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    content: contents.join('---\n\n')
                })
            } catch (e) {
                setPreviewSource({
                    id: item.id,
                    title: item.title,
                    type: item.type,
                    content: `Error loading folder content: ${e}`
                })
            }
            return
        }

        let content = ''
        let debugInfo = ''

        if (item.type === 'wiki') {
            const entry = wikiData?.find(w => w.id === item.id)
            if (entry) {
                content = entry.content || ''
                if (!content) debugInfo += '[WikiData] Entry found but content is empty.\n'
            } else {
                debugInfo += '[WikiData] Entry not found in loaded WikiData.\n'
            }
        }

        // If content is empty (or failed wiki lookup), try reading file if path exists
        if (!content && item.path) {
            try {
                // @ts-ignore
                if (window.api && window.api.readFile) {
                    // @ts-ignore
                    const fileContent = await window.api.readFile(item.path)
                    if (fileContent !== null) {
                        content = fileContent
                    } else {
                        debugInfo += `[FileRead] File not found or read failed at: ${item.path}\n`
                    }
                } else {
                    debugInfo += '[FileRead] window.api.readFile is not available.\n'
                }
            } catch (e) {
                console.error('Failed to read file:', e)
                debugInfo += `[FileRead] Exception: ${e}\n`
            }
        } else if (!content && !item.path) {
            debugInfo += '[Error] No path available for this item.\n'
        }

        if (!content) {
            content = 'No content found.\n\n--- Debug Info ---\n' + debugInfo + '\nPath: ' + (item.path || 'N/A') + '\nID: ' + item.id
        }

        setPreviewSource({
            id: item.id,
            title: item.title,
            type: item.type,
            content
        })
    }

    const handleCloseTab = (tabId: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== tabId)
            if (activeTabId === tabId) {
                // Determine new active tab
                if (newTabs.length > 0) {
                    setActiveTabId(newTabs[newTabs.length - 1].id)
                } else {
                    setActiveTabId(null)
                }
            }
            return newTabs
        })
    }

    const openCreationMenu = (parentPath?: string) => {
        setCreationParentPath(parentPath || workDirectory?.root.id || null)
        setIsCreationMenuOpen(true)
    }

    const handleCreateItem = async () => {
        try {
            if (!newItemName.trim() || !workDirectory || !creationType) return

            const parentPath = creationParentPath || workDirectory.root.id

            // Detect separator
            const separator = parentPath.includes('\\') ? '\\' : '/'
            const fullPath = `${parentPath}${separator}${newItemName}${creationType === 'file' && !newItemName.endsWith('.md') ? '.md' : ''}`

            // @ts-ignore
            if (!window.api.createDirectory) {
                alert('API not found. Please restart the application.')
                return
            }

            let success = false
            if (creationType === 'file') {
                // @ts-ignore
                success = await window.api.createFile(fullPath, '')
            } else {
                // @ts-ignore
                success = await window.api.createDirectory(fullPath)
            }

            if (success) {
                setCreationType(null)
                setNewItemName('')
                setCreationParentPath(null)
                setIsCreationMenuOpen(false)
                fetchWorkDirectory() // Refresh specifically Work Directory
                if (onRefresh) onRefresh() // Also refresh plot data if needed
            } else {
                alert(`Failed to create ${creationType}. Check permissions or duplicate name.`)
            }
        } catch (e: any) {
            console.error('Creation Error:', e)
            alert(`Error: ${e.message}`)
        }
    }

    // Auto-expand active chapter in Work Directory
    useEffect(() => {
        if (workDirectory?.root) {
            setExpandedBinderItems(prev => new Set([...prev, workDirectory.root.id]))
        }
    }, [workDirectory])



    const toggleExpand = useCallback((id: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }, [])

    const toggleSelect = useCallback((node: TreeNode) => {
        setSelectedNodes(prev => {
            const next = new Set(prev)
            const isSelected = next.has(node.id)

            // Helper to process all children recursively
            const processChildren = (n: TreeNode, select: boolean) => {
                if (select) next.add(n.id)
                else next.delete(n.id)
                n.children.forEach(c => processChildren(c, select))
            }

            processChildren(node, !isSelected)
            return next
        })
    }, [])

    const handleAddSelected = () => {
        // Recursive helper to build source tree from selected nodes
        const buildSelectedSourceTree = (nodes: TreeNode[], type: 'wiki' | 'plot'): SourceItem[] => {
            const result: SourceItem[] = []

            nodes.forEach(node => {
                const isSelected = selectedNodes.has(node.id)
                const childSources = buildSelectedSourceTree(node.children, type)
                const hasSelectedChildren = childSources.length > 0

                // If node is selected OR has children that are selected, we include it
                if (isSelected || hasSelectedChildren) {
                    const item: SourceItem = {
                        id: node.id,
                        title: node.entry?.name || node.plotData?.title || node.name,
                        type: type,
                        isFolder: node.type === 'directory',
                        path: node.path,
                        children: childSources,
                        meta: node.plotData ? 'SCENE' : (node.entry?.type)
                    }
                    result.push(item)
                }
            })

            return result
        }

        const newWikiItems = buildSelectedSourceTree(treeData, 'wiki')
        const newPlotItems = buildSelectedSourceTree(plotTreeData, 'plot')

        setSources(prev => {
            // Simple approach: append new trees. 
            // Deduplication is hard with trees, so passing for now assuming user manages it.
            return [...prev, ...newWikiItems, ...newPlotItems]
        })

        setSelectedNodes(new Set())
        setIsSourceModalOpen(false)
    }

    const handleGenerateBranches = async (parentNodeId?: string) => {
        if (!activeTabId) return
        setIsGeneratingBranches(true)
        setIsBranchPanelOpen(true)

        // If specific parent triggered this, set it as active for visual feedback
        const effectiveParentId = parentNodeId || activeNodeId || null
        if (effectiveParentId) setActiveNodeId(effectiveParentId)

        try {
            const currentContent = tabs.find(t => t.id === activeTabId)?.content || ''

            // Context from Parent Node if exists
            let parentContext = ''
            if (effectiveParentId) {
                const parentNode = getNode(effectiveParentId)
                if (parentNode) {
                    parentContext = `\n[PREVIOUS BEAT CONTEXT]\nTitle: ${parentNode.title}\nSummary: ${parentNode.summary}\nContent: ${parentNode.content}\n`
                }
            }

            // Ask AI for branches
            // @ts-ignore
            const result: any = await window.api.interactSceneWriterAgent({
                currentContent,
                userMessage: `[SYSTEM: Generate ${branchCount} distinct NEXT story beats following the previous beat.
${parentContext ? parentContext : "Context: Start of a new sequence based on current scene."}

 instructions:
 1. Continue the narrative flow naturally from the Previous Beat.
 2. Provide NEW distinct options for what happens NEXT.
 3. Return ONLY a valid JSON Array with exactly ${branchCount} items.

Format: [{"title": "Short Title", "summary": "One sentence summary", "content": "Detailed event description...", "reasoning": "Narrative purpose..."}]
]`,
                context: sceneContext || { chapter: 0, scene: 0 },
                history: []
            })

            if (result.success) {
                console.log('AI Reply:', result.reply)
                let newNodes: StoryNode[] = []

                // 1. Try JSON Parsing
                try {
                    const cleanJson = result.reply.replace(/```json/g, '').replace(/```/g, '').trim()
                    const arrayMatch = cleanJson.match(/\[.*\]/s)
                    const jsonStr = arrayMatch ? arrayMatch[0] : cleanJson
                    const branches = JSON.parse(jsonStr)

                    if (Array.isArray(branches)) {
                        newNodes = branches.map((b: any) => ({
                            id: Date.now().toString() + Math.random().toString().slice(2, 6),
                            parentId: effectiveParentId,
                            title: b.title,
                            summary: b.summary || b.title,
                            content: b.content,
                            reasoning: b.reasoning,
                            children: [],
                            timestamp: Date.now()
                        }))
                    }
                } catch (e) {
                    console.log('JSON Parse failed, trying Markdown...', e)
                }

                // 2. Fallback: Markdown List Parsing
                if (newNodes.length === 0) {
                    const lines = result.reply.split('\n')
                    let currentBeat: any = null

                    // Strategy: Check if the text uses Numbered list (1. ...)
                    // If it does, we ONLY treat Numbered lines as new beats.
                    // Flatten everything else (including bullets) into the content.
                    const hasNumberedList = lines.some(l => /^\s*(?:\*\*)?\d+\./.test(l))

                    lines.forEach(line => {
                        const trimmed = line.trim()
                        if (!trimmed) return

                        let isNewBeat = false
                        let title = ''
                        let content = ''

                        // Regex for Numbered Beat: "1. Title", "**1. Title**", "**1.** Title"
                        const numberMatch = trimmed.match(/^\s*(?:\*\*)?(\d+)\.\s*(?:\*\*)?\s*(.*?)$/)

                        // Regex for Bullet Beat: "* Title", "- Title", "* **Title**"
                        const bulletMatch = !hasNumberedList ? trimmed.match(/^\s*[*\\-]\s*(.*?)$/) : null

                        if (hasNumberedList && numberMatch) {
                            isNewBeat = true
                            // Clean title
                            let raw = numberMatch[2]
                            // Remove trailing ** if present
                            if (raw.endsWith('**')) raw = raw.slice(0, -2)
                            // Split by colon if present
                            const colonIdx = raw.indexOf(':')
                            if (colonIdx !== -1) {
                                title = raw.substring(0, colonIdx).trim()
                                content = raw.substring(colonIdx + 1).trim()
                            } else {
                                title = raw.trim()
                            }
                        } else if (bulletMatch) {
                            isNewBeat = true
                            let raw = bulletMatch[1]
                            const colonIdx = raw.indexOf(':')
                            if (colonIdx !== -1) {
                                title = raw.substring(0, colonIdx).replace(/\*\*/g, '').trim()
                                content = raw.substring(colonIdx + 1).trim()
                            } else {
                                // Check for bold title "**Title** Content"
                                const boldMatch = raw.match(/^\*\*(.*?)\*\*\s*(.*)$/)
                                if (boldMatch) {
                                    title = boldMatch[1].trim()
                                    content = boldMatch[2].trim()
                                } else {
                                    title = raw.replace(/\*\*/g, '').trim()
                                }
                            }
                        }

                        if (isNewBeat) {
                            if (currentBeat) {
                                newNodes.push({
                                    id: Date.now().toString() + Math.random().toString().slice(2, 6),
                                    parentId: effectiveParentId,
                                    title: currentBeat.title,
                                    summary: currentBeat.content.slice(0, 100) + '...',
                                    content: currentBeat.content,
                                    reasoning: 'Extracted from list',
                                    children: [],
                                    timestamp: Date.now()
                                })
                            }
                            currentBeat = {
                                title: title || 'New Beat',
                                content: content
                            }
                        } else {
                            if (currentBeat) {
                                currentBeat.content += '\n' + trimmed
                            }
                        }
                    })

                    // Push last one
                    if (currentBeat) {
                        newNodes.push({
                            id: Date.now().toString() + Math.random().toString().slice(2, 6),
                            parentId: effectiveParentId,
                            title: currentBeat.title,
                            summary: currentBeat.content.slice(0, 100) + '...',
                            content: currentBeat.content,
                            reasoning: 'Extracted from list',
                            children: [],
                            timestamp: Date.now()
                        })
                    }
                }

                if (newNodes.length > 0) {
                    setStoryNodes(prev => [...prev, ...newNodes])
                } else {
                    console.warn('No beats parsed from AI reply')
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsGeneratingBranches(false)
        }
    }

    // Add suggested beats from Chat to the Tree
    const addBeatsFromChat = (beats: any[], parentId: string | null) => {
        const newNodes: StoryNode[] = beats.map((b: any) => ({
            id: Date.now().toString() + Math.random().toString().slice(2, 6),
            parentId: parentId,
            title: b.title,
            summary: b.summary || b.title,
            content: b.content,
            reasoning: b.reasoning,
            children: [],
            timestamp: Date.now()
        }))
        setStoryNodes(prev => [...prev, ...newNodes])
        setIsBranchPanelOpen(true)
    }

    const handleRefineNode = async (nodeId: string) => {
        const node = getNode(nodeId)
        if (!node) return

        // Get Collection Context
        const currentTask = tasks.find(t => t.id === selectedTaskId)
        const selectedItems = currentTask ? currentTask.items.filter(i => selectedActionItems.has(i.id)) : []

        if (selectedItems.length === 0) {
            alert("Please select items from the Collection Board to refine this node with.")
            return
        }

        const contextString = selectedItems.map(i => `[[${i.type}::${i.name}]]`).join(', ')
        setIsRefiningNode(true)

        try {
            // @ts-ignore
            const result: any = await window.api.interactSceneWriterAgent({
                currentContent: "",
                userMessage: `[SYSTEM: Refine the following story beat based on the integrated entities: ${contextString}.
Original Title: ${node.title}
Original Content: ${node.content}

Instructions: Rewrite the content to deeply involve the selected characters/items/events. Update the title if necessary.
Return JSON: {"title": "...", "content": "...", "reasoning": "..."}]`,
                context: sceneContext || { chapter: 0, scene: 0 },
                history: []
            })

            if (result.success) {
                const cleanJson = result.reply.replace(/```json/g, '').replace(/```/g, '').trim()
                // Simple object parsing
                const match = cleanJson.match(/\{.*\}/s)
                if (match) {
                    const refined = JSON.parse(match[0])
                    // Update Node
                    setStoryNodes(prev => prev.map(n => n.id === nodeId ? { ...n, title: refined.title, content: refined.content, reasoning: refined.reasoning } : n))
                }
            }

        } catch (e) {
            console.error(e)
        } finally {
            setIsRefiningNode(false)
        }
    }

    // CRUD for Nodes
    const handleAddManualNode = (parentId: string | null) => {
        const newNode: StoryNode = {
            id: Date.now().toString(),
            parentId: parentId,
            title: 'New Beat',
            summary: 'Summary...',
            content: '',
            children: [],
            timestamp: Date.now()
        }
        setStoryNodes(prev => [...prev, newNode])
        setActiveNodeId(newNode.id)
    }

    const handleDeleteNode = (id: string) => {
        // Recursive Delete
        setStoryNodes(prev => {
            const toDelete = new Set<string>()
            const markForDeletion = (nodeId: string) => {
                toDelete.add(nodeId)
                prev.filter(n => n.parentId === nodeId).forEach(c => markForDeletion(c.id))
            }
            markForDeletion(id)
            return prev.filter(n => !toDelete.has(n.id))
        })
        if (activeNodeId === id) setActiveNodeId(null)
    }

    const updateNode = (id: string, updates: Partial<StoryNode>) => {
        setStoryNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n))
    }

    const applyNodeToEditor = (content: string) => {
        if (!activeTabId) return
        const currentContent = tabs.find(t => t.id === activeTabId)?.content || ''
        const newContent = currentContent + '\n\n' + content
        handleContentChange(activeTabId, newContent)
        handleSaveContent(activeTabId) // Persist
        // Don't close panel, allow multiple
    }

    // -- Visual Components for Tree --

    const renderNodeTree = (parentId: string | null, depth: number = 0) => {
        const nodes = storyNodes.filter(n => n.parentId === parentId)
        if (nodes.length === 0) return null

        return (
            <div className="flex flex-col gap-4">
                {nodes.map(node => (
                    <div key={node.id} className="flex flex-row items-start gap-2">
                        {/* Node Card */}
                        <div className={`
                            relative flex flex-col min-w-[200px] w-[220px] p-3 rounded-lg border transition-all cursor-pointer bg-[#1A1A1D] group
                            ${activeNodeId === node.id ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-500/50' : 'border-white/10 hover:border-indigo-500/30'}
                        `}
                            onClick={(e) => {
                                e.stopPropagation()
                                setActiveNodeId(node.id)
                            }}
                        >
                            {/* Connection Line Input */}
                            {parentId && (
                                <div className="absolute top-1/2 -left-3 w-3 h-[1px] bg-white/20" />
                            )}

                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-bold text-xs text-slate-200 truncate pr-2 w-full">{node.title}</h4>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 absolute top-2 right-2 bg-[#1A1A1D] pl-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRefineNode(node.id) }}
                                        className="text-slate-500 hover:text-indigo-400"
                                        title={selectedActionItems.size > 0 ? "Refine with selected Items" : "Select items to refine"}
                                    >
                                        <Sparkles size={10} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id) }}
                                        className="text-slate-500 hover:text-red-400"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-3 mb-2">{node.summary || node.content}</p>

                            <div className="mt-auto flex gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleGenerateBranches(node.id); }}
                                    className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-slate-400 flex justify-center items-center"
                                    title="Generate Next Options"
                                >
                                    <GitBranch size={8} className="mr-1" /> Next
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); applyNodeToEditor(node.content); }}
                                    className="flex-1 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 rounded text-[9px] font-bold"
                                    title="Append to Editor"
                                >
                                    Apply
                                </button>
                            </div>

                            {/* Children Connector Output */}
                            {getChildren(node.id).length > 0 && (
                                <div className="absolute top-1/2 -right-2 w-2 h-[1px] bg-white/20" />
                            )}
                        </div>

                        {/* Recursive Children */}
                        {getChildren(node.id).length > 0 && (
                            <div className="flex flex-col gap-2 ml-4 relative">
                                {/* Vertical Line for children */}
                                <div className="absolute top-0 bottom-0 -left-4 w-[1px] bg-white/10" />
                                {renderNodeTree(node.id, depth + 1)}
                            </div>
                        )}

                        {/* Placeholder for "Add Branch" visual if focused? Maybe overkill. */}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-[#0F0F12] text-slate-300 animate-in fade-in duration-300">
            {/* Sandbox Toolbar */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/20">
                        <LayoutTemplate size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-amber-500/90">Story Sandbox</h3>
                        <p className="text-[10px] text-slate-500">Scrivener × NotebookLM Mode</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {/* Toolbar actions */}
                    <button className="p-2 hover:bg-white/10 rounded-full text-slate-400 transition-colors">
                        <Settings size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Sources / Binder (NotebookLM + Scrivener style) */}
                <div
                    className="border-r border-white/5 flex flex-col bg-[#141417] relative transition-none"
                    style={{ width: leftPanelWidth }}
                >
                    {/* Resize Handle (Right edge of Left Panel) */}
                    <div
                        className={`absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 z-20 ${isResizingLeft ? 'bg-indigo-500' : 'bg-transparent'}`}
                        onMouseDown={startResizingLeft}
                    />
                    <div className="p-3 border-b border-white/5">
                        <button
                            onClick={() => setIsSourceModalOpen(true)}
                            className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg py-2 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                            <Plus size={12} />
                            Add Source
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {/* Work Directory */}
                        {workDirectory && (
                            <div className="mt-2 mb-4">
                                <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider flex justify-between items-center bg-indigo-900/10 rounded mb-1 border border-indigo-500/10">
                                    <span className="text-indigo-400">Work Directory</span>
                                    <div className="flex items-center gap-1 relative">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-2"></div>

                                        <button
                                            onClick={() => openCreationMenu()}
                                            className="p-1 hover:bg-indigo-500/20 rounded text-indigo-400 transition-colors"
                                        >
                                            <Plus size={12} />
                                        </button>

                                        {isCreationMenuOpen && (
                                            <div className="absolute top-6 right-0 w-32 bg-[#1A1A1D] border border-slate-700 rounded-lg shadow-xl z-50 py-1 flex flex-col">
                                                <button
                                                    onClick={() => { setCreationType('file'); setIsCreationMenuOpen(false); }}
                                                    className="px-3 py-1.5 text-left text-xs hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 flex items-center gap-2"
                                                >
                                                    <FilePlus size={12} /> New File
                                                </button>
                                                <button
                                                    onClick={() => { setCreationType('folder'); setIsCreationMenuOpen(false); }}
                                                    className="px-3 py-1.5 text-left text-xs hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 flex items-center gap-2"
                                                >
                                                    <FolderPlus size={12} /> New Folder
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {creationType && (
                                    <div className="px-2 py-1 mb-2 flex flex-col gap-1 animate-in slide-in-from-top-2 bg-zinc-900/50 p-2 rounded border border-white/5">
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            Creating in: <span className="text-indigo-400 truncate max-w-[150px]">{creationParentPath ? '.../' + creationParentPath.split(/[/\\]/).pop() : 'Root'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {creationType === 'file' ? <FileText size={12} className="text-slate-500" /> : <Folder size={12} className="text-indigo-500" />}
                                            <input
                                                autoFocus
                                                type="text"
                                                value={newItemName}
                                                onChange={(e) => setNewItemName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleCreateItem()
                                                    if (e.key === 'Escape') setCreationType(null)
                                                }}
                                                placeholder={`New ${creationType}...`}
                                                className="bg-black/20 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 w-full outline-none focus:border-indigo-500"
                                            />
                                            <button onClick={() => setCreationType(null)}><X size={12} className="text-slate-500 hover:text-red-400" /></button>
                                        </div>
                                    </div>
                                )}

                                <BinderTreeItem
                                    item={workDirectory.root}
                                    level={0}
                                    expandedItems={expandedBinderItems}
                                    onToggle={toggleBinderItem}
                                    onCreate={(path) => {
                                        setCreationParentPath(path)
                                        setIsCreationMenuOpen(true)
                                    }}
                                    onRename={handleRenameItem}
                                    onDelete={handleDeleteItem}
                                    onSelect={handleOpenTab}
                                    activeId={activeTabId || workDirectory.activeSceneId || undefined}
                                />
                            </div>
                        )}



                        {/* Plot Sources (Added via Modal) */}
                        <div className="mt-2">
                            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider flex justify-between items-center bg-zinc-900/50 rounded mb-1">
                                <span>Reference Scenes</span>
                                <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-400">{sources.filter(s => s.type === 'plot').length}</span>
                            </div>

                            {sources.filter(s => s.type === 'plot').map(source => (
                                <BinderTreeItem
                                    key={source.id}
                                    item={source}
                                    level={0}
                                    expandedItems={expandedBinderItems}
                                    onToggle={toggleBinderItem}
                                    onSelect={() => handlePreviewSource(source)}
                                />
                            ))}

                            {sources.filter(s => s.type === 'plot').length === 0 && (
                                <div className="text-[10px] text-slate-600 px-2 py-1 italic">No scenes selected</div>
                            )}
                        </div>

                        {/* Wiki Sources */}
                        <div className="mt-4 pt-2 border-t border-white/5">
                            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider flex justify-between items-center bg-zinc-900/50 rounded mb-1">
                                <span>Wiki Sources</span>
                                <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-400">{sources.filter(s => s.type === 'wiki').length}</span>
                            </div>

                            {sources.filter(s => s.type === 'wiki').map(source => (
                                <BinderTreeItem
                                    key={source.id}
                                    item={source}
                                    level={0}
                                    expandedItems={expandedBinderItems}
                                    onToggle={toggleBinderItem}
                                    onSelect={() => handlePreviewSource(source)}
                                />
                            ))}

                            {sources.filter(s => s.type === 'wiki').length === 0 && (
                                <div className="text-[10px] text-slate-600 px-2 py-1 italic">No wiki sources</div>
                            )}
                        </div>

                        <div className="mt-4">
                            <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 tracking-wider flex justify-between items-center bg-zinc-900/50 rounded mb-1">
                                <span>Local Uploads</span>
                                <span className="text-[9px] bg-slate-800 px-1 rounded text-slate-400">{sources.filter(s => s.type === 'file').length}</span>
                            </div>
                            {sources.filter(s => s.type === 'file').map(source => (
                                <div
                                    key={source.id}
                                    className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 text-slate-400 text-xs cursor-pointer group"
                                    onClick={() => handlePreviewSource(source)}
                                >
                                    <FileText size={12} className="text-emerald-500 group-hover:text-emerald-400 transition-colors shrink-0" />
                                    <span className="truncate">{source.title}</span>
                                </div>
                            ))}
                            {sources.filter(s => s.type === 'file').length === 0 && (
                                <div className="text-[10px] text-slate-600 px-2 py-1 italic">No files uploaded</div>
                            )}
                        </div>
                    </div>

                    {/* Preview Pane (Bottom Left) */}
                    {previewSource && (
                        <div
                            className="border-t border-white/10 bg-[#0b0c15] flex flex-col shrink-0 animate-in slide-in-from-bottom-5 relative transition-none"
                            style={{ height: previewHeight }}
                        >
                            {/* Resize Handle (Top edge of Preview) */}
                            <div
                                className={`absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-indigo-500/50 z-20 ${isResizingPreview ? 'bg-indigo-500' : 'bg-transparent'}`}
                                onMouseDown={startResizingPreview}
                            />

                            <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between bg-black/20">
                                <div className="flex items-center gap-2 truncate">
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${previewSource.type === 'wiki' ? 'bg-indigo-500/20 text-indigo-400' :
                                        previewSource.type === 'plot' ? 'bg-pink-500/20 text-pink-400' : 'bg-emerald-500/20 text-emerald-400'
                                        }`}>
                                        {previewSource.type}
                                    </span>
                                    <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]" title={previewSource.title}>
                                        {previewSource.title}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setPreviewSource(null)}
                                    className="p-1 hover:bg-white/10 rounded text-slate-500 hover:text-white transition-colors"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                <div className="prose prose-invert prose-xs max-w-none text-slate-400/90 leading-relaxed whitespace-pre-wrap font-serif">
                                    {previewSource.content}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Center Panel (Editor) */}
                <div className="flex-1 bg-[#1A1A1D] flex flex-col min-w-0">
                    {/* Header with Tabs */}
                    <div className="h-10 flex bg-[#0b0c15] border-b border-black select-none z-10 w-full overflow-x-auto custom-scrollbar">
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={`
                                    group flex items-center gap-2 px-3 min-w-[120px] max-w-[200px] border-r border-white/5 cursor-pointer transition-colors
                                    ${activeTabId === tab.id ? 'bg-[#1A1A1D] text-indigo-300 border-t-2 border-t-indigo-500' : 'bg-[#121215] text-slate-500 hover:bg-[#1A1A1D] hover:text-slate-400'}
                                `}
                            >
                                {tab.type === 'file' || tab.type === 'plot' ? <FileText size={12} className={activeTabId === tab.id ? 'text-indigo-400' : 'text-slate-600'} /> : <Book size={12} className={activeTabId === tab.id ? 'text-pink-400' : 'text-slate-600'} />}
                                <span className="text-xs truncate flex-1">{tab.title.replace(/\.md$/, '')}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleCloseTab(tab.id); }}
                                    className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 ${activeTabId === tab.id ? 'text-indigo-400' : 'text-slate-500'}`}
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="h-14 border-b border-white/5 flex items-center px-6 justify-between bg-[#1A1A1D]/50 backdrop-blur-md">
                        <div className="text-lg font-bold text-slate-100 flex items-center gap-2">
                            {tabs.find(t => t.id === activeTabId)?.title?.replace(/\.md$/, '') || 'No File Selected'}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded">Visual Mode</span>
                        </div>
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1A1A1D]">
                        <div className="max-w-3xl mx-auto py-12 px-8 min-h-full">
                            {activeTabId ? (
                                <div className="animate-in fade-in duration-300 h-full flex flex-col">
                                    <h1 className="text-3xl font-bold text-slate-100 mb-6 font-serif px-1">
                                        {tabs.find(t => t.id === activeTabId)?.title?.replace(/\.md$/, '')}
                                    </h1>
                                    <textarea
                                        className="w-full flex-1 bg-transparent text-slate-300 font-serif text-lg leading-relaxed outline-none resize-none px-1 py-2 selection:bg-indigo-500/30 min-h-[500px]"
                                        value={tabs.find(t => t.id === activeTabId)?.content || ''}
                                        onChange={(e) => handleContentChange(activeTabId, e.target.value)}
                                        onBlur={() => handleSaveContent(activeTabId)}
                                        placeholder="Start writing..."
                                    />

                                    {!isBranchPanelOpen ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsBranchPanelOpen(true)}
                                                className="flex-1 py-3 rounded-lg border border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-slate-500 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                                            >
                                                <GitBranch size={16} />
                                                <span>Open Story Branching</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-900/50 rounded-xl border border-white/5 p-4 animate-in slide-in-from-bottom-5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2 text-indigo-400">
                                                    <GitBranch size={16} />
                                                    <span className="font-bold text-sm">Story Branch Tree</span>
                                                    <span className="text-xs text-slate-500 px-2 py-0.5 bg-white/5 rounded-full">{storyNodes.length}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1 bg-black/20 rounded p-0.5 border border-white/5 mr-2">
                                                        {[1, 2, 3].map(num => (
                                                            <button
                                                                key={num}
                                                                onClick={() => setBranchCount(num)}
                                                                className={`px-1.5 py-0.5 text-[9px] rounded ${branchCount === num ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                                            >
                                                                {num}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddManualNode(activeNodeId)}
                                                        className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                                                        title="Add Node to Current"
                                                    >
                                                        <Plus size={14} />
                                                        <span className="text-[10px] font-bold">ADD</span>
                                                    </button>
                                                    <div className="h-4 w-[1px] bg-white/10 mx-1" />
                                                    <button
                                                        onClick={() => handleGenerateBranches(activeNodeId || undefined)}
                                                        className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                                                        title={`Generate ${branchCount} Next Options from Active`}
                                                        disabled={isGeneratingBranches}
                                                    >
                                                        <RefreshCw size={14} className={isGeneratingBranches ? 'animate-spin' : ''} />
                                                    </button>
                                                    <button
                                                        onClick={() => setIsBranchPanelOpen(false)}
                                                        className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {isGeneratingBranches ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-3">
                                                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                                                    <span className="text-xs">Analyzing context & generating paths...</span>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {storyNodes.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-lg bg-black/20 gap-3">
                                                            <GitBranch size={32} className="text-slate-700" />
                                                            <p className="text-slate-500 text-xs">Start your story tree.</p>
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    onClick={() => handleGenerateBranches(undefined)}
                                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded shadow-lg transition-colors flex items-center gap-1"
                                                                >
                                                                    <Sparkles size={12} /> Generate Root Options
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAddManualNode(null)}
                                                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded transition-colors flex items-center gap-1"
                                                                >
                                                                    <Plus size={12} /> Add Root
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Tree View Container */}
                                                    <div className="overflow-x-auto pb-4 pt-2">
                                                        <div className="min-w-full">
                                                            {renderNodeTree(null)}
                                                        </div>
                                                    </div>

                                                    {/* Active Node Detail View */}
                                                    {activeNodeId && (
                                                        <div className="mt-4 pt-4 border-t border-white/10">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h4 className="font-bold text-indigo-400 text-sm">
                                                                    Selected: {getNode(activeNodeId)?.title}
                                                                </h4>
                                                                <span className="text-[10px] text-slate-500">
                                                                    {isRefiningNode ? 'Refining...' : 'Ready to edit'}
                                                                </span>
                                                            </div>
                                                            <textarea
                                                                className="w-full bg-[#141417] border border-white/10 rounded p-3 text-sm text-slate-300 min-h-[150px] outline-none focus:border-indigo-500"
                                                                value={getNode(activeNodeId)?.content || ''}
                                                                onChange={(e) => updateNode(activeNodeId, { content: e.target.value })}
                                                                placeholder="Node Content..."
                                                            />
                                                            {getNode(activeNodeId)?.reasoning && (
                                                                <div className="mt-2 text-xs text-slate-500 italic bg-white/5 p-2 rounded">
                                                                    "{getNode(activeNodeId)?.reasoning}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                    <FileText size={48} className="mb-4 text-slate-700" />
                                    <p>Select a file from the Binder to view</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Resize Handle */}
                <div
                    className={`w-1 cursor-col-resize hover:bg-indigo-500/50 transition-colors z-20 ${isResizingRight ? 'bg-indigo-500' : 'bg-transparent'}`}
                    onMouseDown={startResizingRight}
                />

                {/* Right Panel: AI Context / Note (NotebookLM Audio/Chat style) */}
                <div
                    className="border-l border-white/5 flex flex-col bg-[#141417] transition-none"
                    style={{ width: rightPanelWidth }}
                >
                    {/* Collection Board (Replaces Context & Insight) */}
                    <div className="flex flex-col bg-[#1A1A1D]" style={{ height: collectionHeight }}>
                        <div className="p-3 border-b border-white/5 flex-none">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                    <Sparkles size={12} className="text-purple-500" />
                                    Collection Board
                                </span>
                                <button
                                    onClick={() => setIsNewTaskOpen(true)}
                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                    title="New Task"
                                >
                                    <Plus size={12} className="text-slate-400" />
                                </button>
                            </div>

                            {/* Task Selector */}
                            {isNewTaskOpen ? (
                                <div className="flex gap-1 mb-2">
                                    <input
                                        className="flex-1 bg-slate-800 text-xs px-2 py-1 rounded text-slate-300 outline-none border border-slate-700"
                                        placeholder="Task Name"
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                                    />
                                    <button onClick={handleCreateTask} className="px-2 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-500">Add</button>
                                    <button onClick={() => setIsNewTaskOpen(false)} className="px-1 text-slate-500 hover:text-slate-300"><X size={12} /></button>
                                </div>
                            ) : (
                                <div className="relative group mb-3">
                                    <select
                                        value={selectedTaskId}
                                        onChange={(e) => setSelectedTaskId(e.target.value)}
                                        className="w-full bg-slate-800 text-xs text-slate-300 px-2 py-1.5 rounded border border-white/5 outline-none appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                                    >
                                        {tasks.map(t => <option key={t.id} value={t.id}>{t.title} ({t.items.length})</option>)}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                </div>
                            )}

                            {/* Type Tabs */}
                            <div className="flex bg-slate-800/50 p-1 rounded-lg">
                                {[
                                    { id: 'character', label: '인물' },
                                    { id: 'event', label: '사건' },
                                    { id: 'object', label: '오브젝트' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveCollectionTab(tab.id as any)}
                                        className={`flex-1 text-[10px] py-1 rounded transition-all font-medium ${activeCollectionTab === tab.id
                                            ? 'bg-slate-700 text-slate-100 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 p-3 overflow-y-auto custom-scrollbar bg-[#141417]">
                            {tasks.find(t => t.id === selectedTaskId) ? (
                                <div className="space-y-2">
                                    {(() => {
                                        const currentTask = tasks.find(t => t.id === selectedTaskId)!
                                        const filteredItems = currentTask.items.filter(item => {
                                            const type = item.type.toLowerCase()
                                            if (activeCollectionTab === 'character') return type.includes('char')
                                            if (activeCollectionTab === 'event') return type.includes('event')
                                            // Object includes everything else (Location, Item, Faction, etc.)
                                            return !type.includes('char') && !type.includes('event')
                                        })

                                        if (filteredItems.length === 0) {
                                            return (
                                                <div className="text-center py-8 opacity-40">
                                                    <div className="mx-auto mb-2 text-slate-600 flex justify-center">
                                                        {activeCollectionTab === 'character' ? <User size={20} /> :
                                                            activeCollectionTab === 'event' ? <Scroll size={20} /> : <BookOpen size={20} />}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500">No {activeCollectionTab}s collected</p>
                                                </div>
                                            )
                                        }

                                        return filteredItems.map((item, idx) => {
                                            const isSelected = selectedActionItems.has(item.id)
                                            return (
                                                <div
                                                    key={item.id || idx}
                                                    className={`group flex items-center justify-between p-2 rounded border transition-all cursor-pointer ${isSelected
                                                        ? 'bg-indigo-900/30 border-indigo-500/50'
                                                        : 'bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-indigo-500/30'
                                                        }`}
                                                    onClick={() => toggleActionItem(item.id)}
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                                                            {isSelected && <CheckSquare size={8} className="text-white" />}
                                                        </div>
                                                        <div className="w-5 h-5 rounded flex items-center justify-center bg-slate-700/50 text-slate-400 shrink-0">
                                                            {item.type.toLowerCase().includes('char') ? <User size={10} /> :
                                                                item.type.toLowerCase().includes('loc') ? <MapPin size={10} /> :
                                                                    item.type.toLowerCase().includes('event') ? <Scroll size={10} /> : <Book size={10} />}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-indigo-200' : 'text-slate-300'}`}>{item.name}</span>
                                                            <span className="text-[9px] text-slate-500 uppercase">{item.type}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const task = tasks.find(t => t.id === selectedTaskId);
                                                            if (task) {
                                                                const newItems = task.items.filter(i => i.id !== item.id);
                                                                setTasks(prev => prev.map(t => t.id === selectedTaskId ? { ...t, items: newItems } : t));
                                                            }
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-slate-600 hover:text-red-400 rounded transition-all"
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            )
                                        })
                                    })()}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-xs text-slate-500">No Task Selected</div>
                            )}

                            <div className="mt-4 pt-4 border-t border-white/5 space-y-2 sticky bottom-0 bg-[#1A1A1D] pb-2">
                                {/* Context Actions (GenUI) */}
                                {selectedActionItems.size > 0 ? (
                                    <div className="space-y-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
                                        <div className="flex items-center justify-between text-[10px] text-indigo-300 font-bold uppercase tracking-wider mb-1">
                                            <span>{selectedActionItems.size} items selected</span>
                                            <button onClick={() => setSelectedActionItems(new Set())} className="hover:text-white">Clear</button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                onClick={() => handleContextAction('draft')}
                                                className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                                            >
                                                <Edit2 size={12} />
                                                <span className="text-[9px]">Draft Scene</span>
                                            </button>
                                            <button
                                                onClick={() => handleContextAction('analyze')}
                                                className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                                            >
                                                <Search size={12} />
                                                <span className="text-[9px]">Analyze</span>
                                            </button>
                                            <button
                                                onClick={() => handleContextAction('ask')}
                                                className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                                            >
                                                <MessageSquare size={12} />
                                                <span className="text-[9px]">Ask AI</span>
                                            </button>
                                            <button
                                                onClick={() => handleContextAction('suggest_beats')}
                                                className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-indigo-800 hover:bg-indigo-700 text-indigo-100 transition-colors col-span-3 mt-1"
                                            >
                                                <GitBranch size={12} />
                                                <span className="text-[9px]">Suggest Story Beats</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Default Task Actions */
                                    selectedTaskId && (
                                        <div className="grid grid-cols-2 gap-2 opacity-50 hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDeleteTask(selectedTaskId)}
                                                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-800/50 hover:bg-red-900/20 text-slate-500 hover:text-red-400 text-[10px] transition-colors"
                                            >
                                                <Trash2 size={10} />
                                                Delete Task
                                            </button>
                                            <button
                                                className="flex items-center justify-center gap-1.5 py-1.5 rounded bg-slate-800/50 hover:bg-emerald-900/20 text-slate-500 hover:text-emerald-400 text-[10px] transition-colors"
                                                title="Export specific items"
                                            >
                                                <Save size={10} />
                                                Export
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resize Handle for Collection/Chat */}
                    <div
                        className={`h-1 cursor-row-resize hover:bg-indigo-500/50 transition-colors z-20 shrink-0 ${isResizingCollection ? 'bg-indigo-500' : 'bg-white/5'}`}
                        onMouseDown={() => setIsResizingCollection(true)}
                    />

                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar min-h-0">
                        {chatHistory.length > 0 && (
                            <div className="space-y-4 pt-2 pb-4">
                                <div className="text-[10px] font-bold text-slate-500 uppercase px-1 pb-2 border-b border-white/5">Conversation Context</div>
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                        </div>
                                        <div className={`text-xs p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-sm ${msg.role === 'user'
                                            ? 'bg-purple-500/10 text-slate-200 rounded-tr-none border border-purple-500/20'
                                            : 'bg-slate-800/80 text-slate-300 rounded-tl-none border border-slate-700/50'
                                            }`}>
                                            {msg.content ? (
                                                <div className="whitespace-pre-wrap">
                                                    {(() => {
                                                        // Helper to render collected entities
                                                        // Robust regex to handle [[ Type :: Name ]] with whitespace
                                                        const parts = msg.content.split(/(\[\[\s*.*?\s*:{2}\s*.*?\s*\]\])/g)
                                                        return parts.map((part, partIdx) => {
                                                            const match = part.match(/^\[\[\s*(.*?)\s*::\s*(.*?)\s*\]\]$/)
                                                            if (match) {
                                                                const [_, typeRaw, name] = match
                                                                const type = typeRaw.toLowerCase()

                                                                // Check if collected
                                                                const isCollected = tasks.find(t => t.id === selectedTaskId)?.items.some(i => i.name === name && i.type === typeRaw)

                                                                return (
                                                                    <span
                                                                        key={partIdx}
                                                                        className={`inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium cursor-pointer transition-all select-none group relative ${isCollected
                                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                                                                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
                                                                            }`}
                                                                        onClick={() => {
                                                                            handleAddEntityToTask(typeRaw, name)
                                                                        }}
                                                                    >
                                                                        <span className="opacity-70 group-hover:opacity-100 transition-opacity">
                                                                            {getIconForType(type)}
                                                                        </span>
                                                                        <span className={`border-b border-transparent ${isCollected ? 'group-hover:border-emerald-300/50' : 'group-hover:border-indigo-300/50'}`}>{name}</span>
                                                                        {/* Tooltip-ish indicator */}
                                                                        <span className={`text-[9px] opacity-0 group-hover:opacity-100 ml-1 uppercase tracking-tighter ${isCollected ? 'text-emerald-200' : 'text-indigo-200'}`}>
                                                                            {isCollected ? '✓ Done' : '+Add'}
                                                                        </span>
                                                                    </span>
                                                                )
                                                            }
                                                            return <span key={partIdx}>{part}</span>
                                                        })
                                                    })()}
                                                </div>
                                            ) : (
                                                msg.toolCall && (
                                                    <ReadingCard
                                                        args={msg.toolCall.args}
                                                        name={msg.toolCall.name}
                                                        status={msg.toolCall.status}
                                                        result={msg.toolCall.result}
                                                    />
                                                )
                                            )}
                                            {/* Detect JSON or Markdown Beats */}
                                            {(() => {
                                                if (msg.role === 'assistant' && msg.content) {
                                                    const extractBeatsFromContent = (text: string) => {
                                                        const beats: any[] = [];

                                                        // 1. Try JSON
                                                        try {
                                                            const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                                                            const arrayMatch = cleanJson.match(/\[.*\]/s);
                                                            if (arrayMatch) {
                                                                const parsed = JSON.parse(arrayMatch[0]);
                                                                if (Array.isArray(parsed)) return parsed;
                                                            }
                                                        } catch (e) { /* continued */ }

                                                        // 2. Try Markdown List (1. **Title**: Content OR * **Title**: Content)
                                                        const lines = text.split('\n');
                                                        let currentBeat: any = null;

                                                        lines.forEach(line => {
                                                            const trimmed = line.trim();
                                                            // Regex: (Number. OR * OR -) (**Title** OR Title) (: OR -) Content
                                                            // Matches: "1. **Title**: Content", "* **Title** - Content", "1. Title: Content"
                                                            const beatMatch = trimmed.match(/^(\d+\.|[*\\-])\s*(?:\*\*)?(.*?)(?:\*\*)?\s*(?::|-)\s*(.*)$/);

                                                            // Or just bold title at start of line: "**Title**: Content"
                                                            const simpleBoldMatch = !beatMatch ? trimmed.match(/^\*\*(.*?)\*\*\s*(?::|-)\s*(.*)$/) : null;

                                                            const match = beatMatch || simpleBoldMatch;

                                                            if (match) {
                                                                const title = beatMatch ? beatMatch[2] : match![1];
                                                                const content = beatMatch ? beatMatch[3] : match![2];

                                                                if (currentBeat) beats.push(currentBeat);
                                                                currentBeat = {
                                                                    title: title.trim(),
                                                                    summary: content.trim().slice(0, 100) + '...',
                                                                    content: content.trim(),
                                                                    reasoning: 'Extracted from list'
                                                                };
                                                            } else if (currentBeat && trimmed && !trimmed.match(/^(\d+\.|[*\\-])/)) {
                                                                // Append content to current beat
                                                                currentBeat.content += '\n' + trimmed;
                                                            }
                                                        });
                                                        if (currentBeat) beats.push(currentBeat);

                                                        return beats.length > 0 ? beats : null;
                                                    };

                                                    const beats = extractBeatsFromContent(msg.content);

                                                    if (beats && beats.length > 0) {
                                                        return (
                                                            <div className="mt-2 pt-2 border-t border-white/5">
                                                                <div className="text-[10px] font-bold text-indigo-400 mb-2 flex items-center gap-1">
                                                                    <GitBranch size={12} /> Suggested Beats
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {beats.map((beat: any, bIdx: number) => (
                                                                        <div key={bIdx} className="bg-slate-900/50 p-2 rounded border border-white/5 text-xs">
                                                                            <div className="font-bold text-slate-200">{beat.title}</div>
                                                                            <div className="text-slate-400 text-[10px] line-clamp-2">{beat.content}</div>
                                                                        </div>
                                                                    ))}
                                                                    <button
                                                                        onClick={() => addBeatsFromChat(beats, activeNodeId)}
                                                                        className="w-full py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded text-[10px] font-bold transition-colors"
                                                                    >
                                                                        Add to Story Tree
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                }
                                                return null
                                            })()}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-white/5 bg-slate-900/50">
                        {/* Mention Chips (Selected Files) */}
                        {mentionedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2 animate-in slide-in-from-bottom-2">
                                {mentionedFiles.map((file, i) => (
                                    <div
                                        key={`${file.name}-${i}`}
                                        className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2 py-1 rounded-md text-[10px] text-slate-300 group hover:border-indigo-500/50 transition-colors"
                                        title={file.id}
                                    >
                                        <span className={file.type === 'other' && file.id === 'Not found in wiki' ? 'text-slate-500' : 'text-indigo-400'}>
                                            {getIconForType(file.type)}
                                        </span>
                                        <span className="font-medium max-w-[120px] truncate">{file.name}</span>
                                        <button
                                            onClick={() => removeMention(file.name)}
                                            className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="relative">
                            {/* Mention Suggestions Popup */}
                            {mentionState.active && mentionItems.length > 0 && (
                                <div className="absolute bottom-full left-0 mb-2 w-full max-h-60 overflow-y-auto bg-[#1A1A1D] border border-slate-700 rounded-lg shadow-xl z-50 flex flex-col gap-0.5 p-1 animate-in fade-in zoom-in-95 duration-100">
                                    <div className="px-2 py-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-black/20 rounded flex items-center justify-between">
                                        <span>SUGGESTIONS</span>
                                        <span className="text-[9px]">ENTER to select</span>
                                    </div>
                                    {mentionItems.map((item, idx) => (
                                        <button
                                            key={item.id}
                                            onClick={() => confirmMention(item)}
                                            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-3 rounded-md transition-colors ${idx === mentionState.index
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-slate-300 hover:bg-slate-800'
                                                }`}
                                        >
                                            {getIconForType(item.type)}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold truncate">{item.name}</div>
                                                <div className={`text-[9px] truncate ${idx === mentionState.index ? 'text-indigo-200' : 'text-slate-500'}`}>{item.id}</div>
                                            </div>
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${idx === mentionState.index ? 'border-indigo-400 bg-indigo-500/30' : 'border-slate-700 bg-slate-800'
                                                }`}>
                                                {item.type.toUpperCase()}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <input
                                ref={chatInputRef}
                                type="text"
                                value={chatInput}
                                onChange={handleChatInputChange}
                                onKeyDown={handleChatInputKeyDown}
                                placeholder={isSending ? "AI is thinking..." : "Ask about your story... (Type @ to mention)"}
                                disabled={isSending}
                                className="w-full bg-black/20 border border-white/10 rounded-lg pl-3 pr-8 py-2.5 text-xs text-slate-300 focus:border-purple-500 outline-none transition-colors disabled:opacity-50"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isSending || !chatInput.trim()}
                                className="absolute right-2 top-2.5 text-slate-500 hover:text-purple-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {isSending ? <Sparkles size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            {/* Add Source Modal */}
            {
                isSourceModalOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in duration-200">
                        <div className="w-[500px] bg-[#1A1A1D] border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[600px]">
                            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                    <Plus size={16} className="text-indigo-400" /> Add Source
                                </h3>
                                <button onClick={() => setIsSourceModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex border-b border-slate-700/50">
                                <button
                                    onClick={() => setSourceTab('wiki')}
                                    className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${sourceTab === 'wiki' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    Wiki Context
                                </button>
                                <button
                                    onClick={() => setSourceTab('plot')}
                                    className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${sourceTab === 'plot' ? 'border-pink-500 text-pink-400 bg-pink-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    Plot Context
                                </button>
                                <button
                                    onClick={() => setSourceTab('upload')}
                                    className={`flex-1 py-3 text-xs font-bold transition-colors border-b-2 ${sourceTab === 'upload' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                                >
                                    Upload File
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {sourceTab === 'wiki' || sourceTab === 'plot' ? (
                                    <div className="space-y-2 pb-16">
                                        <div className="relative mb-2">
                                            <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder={`Search ${sourceTab === 'wiki' ? 'wiki' : 'scenes'}...`}
                                                className="w-full bg-black/20 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-300 focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            {activeTreeData.map(node => (
                                                <FileTreeItem
                                                    key={node.id}
                                                    node={node}
                                                    expanded={expandedFolders}
                                                    selected={selectedNodes}
                                                    onToggleExpand={toggleExpand}
                                                    onToggleSelect={toggleSelect}
                                                />
                                            ))}
                                        </div>

                                        {/* Action Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#1A1A1D] border-t border-slate-700/50 flex justify-end gap-2">
                                            <button
                                                onClick={() => { setSelectedNodes(new Set()); setIsSourceModalOpen(false); }}
                                                className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAddSelected}
                                                disabled={selectedNodes.size === 0}
                                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                            >
                                                <Plus size={14} /> Add Selected ({selectedNodes.size})
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/20 p-8 text-center hover:bg-slate-800/40 hover:border-slate-600 transition-colors cursor-pointer group">
                                        <div className="p-4 bg-slate-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                            <Upload size={24} className="text-slate-400" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-300 mb-1">Click to upload</h4>
                                        <p className="text-xs text-slate-500">PDF, TXT, MD supported</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}


export default StorySandbox
