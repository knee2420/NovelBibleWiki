
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
    Trash2
} from 'lucide-react'
import { useState, useMemo, useCallback, useEffect } from 'react'
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

    // Handle Resize
    const startResizingLeft = useCallback(() => setIsResizingLeft(true), [])
    const startResizingRight = useCallback(() => setIsResizingRight(true), [])
    const startResizingPreview = useCallback(() => setIsResizingPreview(true), []) // Top resize of preview pane

    const stopResizing = useCallback(() => {
        setIsResizingLeft(false)
        setIsResizingRight(false)
        setIsResizingPreview(false)
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
            // Calculate height based on bottom position of sidebar (which is full height usually) or relative movement
            // Preview is at the bottom. Increasing height means moving mouse up.
            // Using e.movementY is simpler but can accumulate error.
            // Better: e.clientY relative to window height?
            // Let's rely on movementY for simplicity or rect? 
            // "y" coordinate of the handle is (windowHeight - previewHeight).
            // Mouse Y should track that.
            // Let's use simple logic: newHeight = prevHeight - e.movementY
            setPreviewHeight(prev => {
                const newH = prev - e.movementY
                return Math.max(100, Math.min(newH, 600))
            })
        }
    }, [isResizingLeft, isResizingRight, isResizingPreview])

    useEffect(() => {
        if (isResizingLeft || isResizingRight || isResizingPreview) {
            window.addEventListener('mousemove', handleResize)
            window.addEventListener('mouseup', stopResizing)
            return () => {
                window.removeEventListener('mousemove', handleResize)
                window.removeEventListener('mouseup', stopResizing)
            }
        }
    }, [isResizingLeft, isResizingRight, isResizingPreview, handleResize, stopResizing])

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

    const handlePreviewSource = async (item: SourceItem) => {
        console.log('Previewing:', item)
        
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

        // Handle Folder: Aggregate content
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

    // Auto-expand root
    useMemo(() => {
        if (treeData.length > 0) {
             // Effect-like logic in memo to set initial state only when treeData changes? 
             // Better to just start with empty or handle in component. 
             // Let's just expand the top level by default in the state init if possible, but hard to do here.
        }
    }, [treeData])

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
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                        previewSource.type === 'wiki' ? 'bg-indigo-500/20 text-indigo-400' : 
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
                    <div className="p-3 border-b border-white/5 flex items-center justify-between">
                         <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                             <Sparkles size={12} className="text-purple-500" />
                             Context & Insight
                         </span>
                    </div>
                    
                    <div className="flex-1 p-3 overflow-y-auto space-y-4 custom-scrollbar">
                         {/* Audio Overview Placeholder (NotebookLM style) */}
                         <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl border border-white/5 relative overflow-hidden group cursor-pointer">
                             <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="flex items-center justify-between mb-3 relative z-10">
                                 <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
                                         <div className="w-2 h-2 rounded-full bg-white" />
                                     </div>
                                     <span className="text-xs font-bold text-white">Audio Overview</span>
                                 </div>
                                 <span className="text-[10px] text-slate-400">12:30</span>
                             </div>
                             <div className="flex items-center gap-1 h-8 items-end relative z-10">
                                 {[40, 60, 30, 80, 50, 90, 40, 60, 30, 70, 40, 50].map((h, i) => (
                                     <div key={i} className="w-1 bg-slate-500 rounded-full transition-all group-hover:bg-purple-400" style={{ height: `${h}%` }} />
                                 ))}
                             </div>
                         </div>

                         <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                             <div className="flex items-center gap-2 mb-2">
                                 <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                                     <Search size={8} className="text-blue-400" />
                                 </div>
                                 <span className="text-[10px] font-bold text-blue-300">Suggested Connections</span>
                             </div>
                             <div className="space-y-2">
                                 <div className="flex flex-col gap-1 p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700">
                                     <span className="text-[10px] text-slate-300 font-bold">The Artifact's Origin</span>
                                     <span className="text-[9px] text-slate-500">Found in "World Settings_v2" (Page 4)</span>
                                 </div>
                                 <div className="flex flex-col gap-1 p-2 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700">
                                     <span className="text-[10px] text-slate-300 font-bold">Character Motivation</span>
                                     <span className="text-[9px] text-slate-500">Consistent with "Character Notes"</span>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* Chat History */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                         {initialHistory.length > 0 && (
                            <div className="space-y-4 pt-2 pb-4">
                                <div className="text-[10px] font-bold text-slate-500 uppercase px-1 pb-2 border-b border-white/5">Conversation Context</div>
                                {initialHistory.map((msg, i) => (
                                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                        </div>
                                        <div className={`text-xs p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-sm ${
                                            msg.role === 'user' 
                                                ? 'bg-purple-500/10 text-slate-200 rounded-tr-none border border-purple-500/20' 
                                                : 'bg-slate-800/80 text-slate-300 rounded-tl-none border border-slate-700/50'
                                        }`}>
                                            {msg.content ? (
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-500 italic">
                                                    <Sparkles size={10} />
                                                    <span>Used tool: {msg.toolCall?.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>

                    <div className="p-3 border-t border-white/5 bg-slate-900/50">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Ask about your story..." 
                                className="w-full bg-black/20 border border-white/10 rounded-lg pl-3 pr-8 py-2.5 text-xs text-slate-300 focus:border-purple-500 outline-none transition-colors"
                            />
                            <button className="absolute right-2 top-2.5 text-slate-500 hover:text-purple-400 transition-colors">
                                <MessageSquare size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            {/* Add Source Modal */}
            {isSourceModalOpen && (
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
            )}
        </div>
    )
}


export default StorySandbox
