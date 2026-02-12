
import { useState, useRef, useEffect } from 'react'
import { Sparkles, ArrowRight, Save, X, Copy, Database, BookOpen, Lock, Unlock, RefreshCw, Trash2, Wrench, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SchemaWizardProps {
    isOpen: boolean
    onClose: () => void
    onSave: (draft: string) => void
}

type Message = {
    role: 'user' | 'assistant'
    content: string
    draft?: string // If assistant generated a draft
}

type SchemaSection = 'metadata' | 'definitions' | 'structure' | 'instructions'

interface SchemaBlockProps {
    id: SchemaSection
    title: string
    icon: any
    content?: string
    children?: React.ReactNode
    isLocked: boolean
    onToggleLock: (id: SchemaSection) => void
    onRegenerate: (id: SchemaSection) => void
    onDelete: (id: SchemaSection) => void
}

interface SchemaFieldBlockProps {
    fieldKey: string
    type: string
    description: string
    isLocked: boolean
    onToggleLock: (key: string) => void
    onRegenerate: (key: string) => void
    onDelete: (key: string) => void
}

// Helper to dedent text for parsing
const dedent = (str: string) => {
    const lines = str.split('\n').filter(l => l.trim())
    if (!lines.length) return str
    const minIndent = Math.min(...lines.map(l => l.search(/\S/)))
    return str.split('\n').map(l => (l.trim() ? l.slice(minIndent) : l)).join('\n')
}

const SchemaBlock = ({ id, title, icon: Icon, content, children, isLocked, onToggleLock, onRegenerate, onDelete }: SchemaBlockProps) => {
    return (
        <div className={`rounded-xl border transition-all duration-300 group/block ${isLocked ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800 bg-[#252525] hover:border-slate-700'}`}>
            <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/10">
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isLocked ? 'bg-amber-500/20 text-amber-500' : 'bg-slate-800 text-slate-400'}`}>
                        <Icon size={14} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isLocked ? 'text-amber-200' : 'text-slate-500'}`}>
                        {title}
                    </span>
                </div>
                <div className="flex items-center gap-1 opacity-100 transition-opacity">
                     {!isLocked && (
                        <>
                          <button 
                            onClick={() => onRegenerate(id)} 
                            title="Regenerate this section"
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-purple-400 transition-colors"
                          >
                            <RefreshCw size={12}/>
                          </button>
                          <button 
                            onClick={() => onDelete(id)} 
                            title="Clear this section"
                            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12}/>
                          </button>
                          <div className="w-px h-3 bg-slate-700/50 mx-1" />
                        </>
                     )}
                     <button 
                        onClick={() => onToggleLock(id)} 
                        title={isLocked ? "Unlock section" : "Fix/Lock section"}
                        className={`p-1.5 rounded-lg transition-colors ${isLocked ? 'text-amber-500 hover:bg-amber-500/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'}`}
                     >
                        {isLocked ? <Lock size={12}/> : <Unlock size={12}/>}
                     </button>
                </div>
            </div>
            {(content || children) && (
                <div className={`p-5 text-sm font-mono text-slate-300 whitespace-pre-wrap leading-relaxed`}>
                     {children || content}
                </div>
            )}
        </div>
    )
}

const SchemaFieldBlock = ({ fieldKey, type, description, isLocked, onToggleLock, onRegenerate, onDelete }: SchemaFieldBlockProps) => {
    const getTypeColor = (t: string) => {
        if (t.toLowerCase().includes('list')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        if (t.toLowerCase().includes('int') || t.toLowerCase().includes('number')) return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
        if (t.toLowerCase().includes('object')) return 'bg-green-500/20 text-green-300 border-green-500/30'
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    }

    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative rounded-2xl border p-4 transition-all group/field ${isLocked ? 'border-amber-500/50 bg-[#1e1e1e] ring-1 ring-amber-500/20' : 'border-white/5 bg-[#18181b] hover:border-slate-700 hover:bg-[#202023]'}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-sm font-bold truncate ${isLocked ? 'text-amber-200' : 'text-purple-200'}`}>
                            {fieldKey}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getTypeColor(type)}`}>
                            {type || 'STRING'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 group-hover/field:line-clamp-none transition-all">
                        {description || 'No description provided.'}
                    </p>
                </div>

                <div className="flex flex-col gap-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
                     {!isLocked && (
                        <>
                            <button 
                                onClick={() => onRegenerate(fieldKey)}
                                title="Regenerate this field"
                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-purple-400"
                            >
                                <RefreshCw size={12} />
                            </button>
                             <button 
                                onClick={() => onDelete(fieldKey)}
                                title="Remove this field"
                                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-red-400"
                            >
                                <Trash2 size={12} />
                            </button>
                        </>
                     )}
                     <button 
                        onClick={() => onToggleLock(fieldKey)}
                        title={isLocked ? "Unlock field" : "Lock/Fix field"}
                        className={`p-1.5 rounded-lg ${isLocked ? 'text-amber-500 bg-amber-500/10' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'}`}
                     >
                        {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                     </button>
                </div>
            </div>
            
            {/* Visual indicator for locked state */}
            {isLocked && (
                <div className="absolute top-2 right-2 md:hidden">
                    <Lock size={10} className="text-amber-500" />
                </div>
            )}
        </motion.div>
    )
}

// Helper to parse sections from draft
const parseDraft = (draft: string) => {
    const sections: Record<SchemaSection, string> = {
        metadata: '',
        definitions: '',
        structure: '',
        instructions: ''
    }

    if (!draft) return sections

    const frontmatterMatch = draft.match(/---\n([\s\S]*?)\n---/)
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : ''
    sections.instructions = draft.replace(/---\n[\s\S]*?\n---/, '').trim()

    const structureMatch = frontmatter.match(/schema_structure:([\s\S]*?)(?=$|\n[a-z_]+:)/)
    if (structureMatch) {
         sections.structure = structureMatch[1]
    }

    const definitionsMatch = frontmatter.match(/definitions:([\s\S]*?)(?=$|\n[a-z_]+:)/)
    if (definitionsMatch) {
        sections.definitions = definitionsMatch[1].trim()
    }

    const metaKeys = ['analysis_module', 'target_character', 'context_scope', 'analysis_persona', 'output_requirements']
    const extractedMeta = metaKeys.map(key => {
        const match = frontmatter.match(new RegExp(`^${key}:([\\s\\S]*?)(?=\\n[a-z_]+:|$)`, 'm'))
        return match ? match[0].trim() : null
    }).filter(Boolean).join('\n')
    
    sections.metadata = extractedMeta || "Parsing metadata..."

    return sections
}

const parseFields = (text: string) => {
    const cleanText = dedent(text)
    if (!cleanText) return []
    const lines = cleanText.split('\n')
    const fields: any[] = []
    let currentField: any = null
    
    // Simple indentation parsing: Key at indent 0, content at indent >0
    lines.forEach(line => {
        if (!line.trim()) {
            if (currentField) currentField.lines.push(line)
            return
        }
        const indent = line.search(/\S/)
        if (indent === 0 && line.trim().endsWith(':')) {
             if (currentField) fields.push(currentField)
             const key = line.trim().slice(0, -1) // remove colon
             currentField = { key, lines: [line] }
        } else if (currentField) {
            currentField.lines.push(line)
        }
    })
    if (currentField) fields.push(currentField)
    
    return fields.map(f => {
        const raw = f.lines.join('\n')
        const typeMatch = raw.match(/type:\s*(.+)/)
        const descMatch = raw.match(/description:\s*"(.*)"/) || raw.match(/description:\s*(.*)/)
        return {
            key: f.key,
            type: typeMatch ? typeMatch[1].trim() : 'STRING',
            description: descMatch ? descMatch[1].replace(/^"|"$/g, '').trim() : '',
            raw
        }
    })
}

const removeFieldFromDraft = (draft: string, keyToRemove: string) => {
    // 1. Isolate Frontmatter
    const fmMatch = draft.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) return draft
    const frontmatter = fmMatch[1]
    
    // 2. Find schema_structure section
    const structureRegex = /(schema_structure:)([\s\S]*?)(?=$|\n[a-z_]+:)/
    const match = frontmatter.match(structureRegex)
    
    if (!match) return draft
    
    const [fullMatch, label, content] = match
    
    const lines = content.split('\n')
    const newLines: string[] = []
    let skipping = false
    let targetIndent = -1
    
    for (const line of lines) {
        if (!line.trim()) {
            if (!skipping) newLines.push(line)
            continue
        }
        
        const currentIndent = line.search(/\S/)
        
        if (skipping) {
            if (currentIndent <= targetIndent) {
                skipping = false
                targetIndent = -1
                newLines.push(line)
            }
            continue
        }
        
        const trimmed = line.trim()
        if (trimmed.startsWith(`${keyToRemove}:`)) {
             skipping = true
             targetIndent = currentIndent
             continue
        }
        
        newLines.push(line)
    }
    
    const newContent = newLines.join('\n')
    const newFrontmatter = frontmatter.replace(fullMatch, `${label}${newContent}`)
    
    return draft.replace(fmMatch[0], `---\n${newFrontmatter}\n---`)
}

const appendFieldToDraft = (draft: string, fieldYaml: string) => {
    // 1. Isolate Frontmatter
    const fmMatch = draft.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) return draft
    const frontmatter = fmMatch[1]

    // 2. Find schema_structure section
    const structureRegex = /(schema_structure:)([\s\S]*?)(?=$|\n[a-z_]+:)/
    const match = frontmatter.match(structureRegex)

    // Indent the new field YAML
    const indentedField = fieldYaml.split('\n').map(line => `  ${line}`).join('\n')

    if (!match) {
        // Append schema_structure if missing
        return draft.replace(fmMatch[0], `---\n${frontmatter}\nschema_structure:\n${indentedField}\n---`)
    }

    const [fullMatch, label, content] = match
    
    // Add to the end of content
    const newContent = content.trimEnd() + '\n' + indentedField + '\n'
    
    const newFrontmatter = frontmatter.replace(fullMatch, `${label}${newContent}`)
    return draft.replace(fmMatch[0], `---\n${newFrontmatter}\n---`)
}

const replaceSectionInDraft = (draft: string, section: SchemaSection, newContent: string) => {
    // 1. Split Frontmatter
    const fmMatch = draft.match(/^---\n([\s\S]*?)\n---/)
    if (!fmMatch) return draft
    const frontmatter = fmMatch[1]
    const instructions = draft.replace(fmMatch[0], '').trim()

    if (section === 'instructions') {
        const newInstructions = newContent.trim()
        return `${fmMatch[0]}\n\n${newInstructions}`
    }

    // For YAML sections
    let newFm = frontmatter

    // Helper to indent content
    const indented = (str: string) => str.split('\n').map(l => `  ${l}`).join('\n')

    if (section === 'structure') {
         // Replace schema_structure block
         // Regex to find schema_structure: ... until lookahead
         const regex = /(schema_structure:)([\s\S]*?)(?=$|\n[a-z_]+:)/
         if (newFm.match(regex)) {
             newFm = newFm.replace(regex, `$1\n${indented(newContent)}`)
         }
    } else if (section === 'definitions') {
         const regex = /(definitions:)([\s\S]*?)(?=$|\n[a-z_]+:)/
         if (newFm.match(regex)) {
             newFm = newFm.replace(regex, `$1\n${indented(newContent)}`)
         } else {
             // If not found, append
             newFm = `${newFm}\ndefinitions:\n${indented(newContent)}`
         }
    } else if (section === 'metadata') {
         // This is harder. We assume newContent is key: value
         // We should just append it to top or replace.
         // Let's rely on the AI returning key: value lines and we just replace the known keys if found, or prepend.
         // Actually, simpler: Removing known keys and prepending new block might work.
         // But regex replace is safer against destroying other fields.
         const keys = ['analysis_module', 'target_character', 'context_scope', 'analysis_persona', 'output_requirements'];
         keys.forEach(key => {
            const regex = new RegExp(`^${key}:.*$`, 'm')
            newFm = newFm.replace(regex, '')
         });
         // Remove empty lines resulting from replace
         newFm = newFm.replace(/^\s*[\r\n]/gm, '')
         newFm = `${newContent}\n${newFm}`
    }
    
    return `---\n${newFm.trim()}\n---\n\n${instructions}`
}

export const SchemaWizard = ({ isOpen, onClose, onSave }: SchemaWizardProps) => {
    const [step, setStep] = useState<'init' | 'chat'>('init')
    const [topic, setTopic] = useState('')
    const [feedback, setFeedback] = useState('')
    const [messages, setMessages] = useState<Message[]>([])
    const [currentDraft, setCurrentDraft] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [lockedSections, setLockedSections] = useState<Set<SchemaSection>>(new Set())
    const [lockedFields, setLockedFields] = useState<Set<string>>(new Set())
    const scrollRef = useRef<HTMLDivElement>(null)

    // Derived state
    const parsedSections = parseDraft(currentDraft)
    const structureFields = parseFields(parsedSections.structure || '')

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleInitialSubmit = async () => {
        if (!topic.trim()) return

        setStep('chat')
        setLoading(true)
        const initialMsg: Message = { role: 'user', content: `I want to create a character analysis schema about: ${topic}` }
        setMessages([initialMsg])

        try {
            // @ts-ignore
            const result = await window.api.generateAnalysisSchemaDraft({ topic })
            if (result.success) {
                const aiMsg: Message = { 
                    role: 'assistant', 
                    content: `Here is a draft schema for "${topic}". You can lock blocks or fields and regenerate others.`,
                    draft: result.draft 
                }
                setMessages(prev => [...prev, aiMsg])
                setCurrentDraft(result.draft)
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${result.error}` }])
            }
        } catch (e) {
            console.error(e)
            setMessages(prev => [...prev, { role: 'assistant', content: "Failed to connect to AI." }])
        } finally {
            setLoading(false)
        }
    }

    const handleRefinementSubmit = async (customFeedback?: string) => {
        const textToSend = customFeedback || feedback
        if (!textToSend.trim() && !customFeedback) return
        if (loading) return

        const userMsg: Message = { role: 'user', content: textToSend }
        setMessages(prev => [...prev, userMsg])
        if (!customFeedback) setFeedback('')
        setLoading(true)

        // Construct Instructions with Locks
        let finalFeedback = textToSend
        
        let locksContent = ''
        const sectionLocks = Array.from(lockedSections)
        if (sectionLocks.length > 0) {
            sectionLocks.forEach(section => {
                locksContent += `\n--- LOCKED SECTION: ${section.toUpperCase()} (PRESERVE EXACTLY) ---\n${parsedSections[section]}\n--- END LOCKED SECTION ---\n`
            })
        }

        // Field Locks (Only if structure is NOT locked entirely)
        if (!lockedSections.has('structure') && lockedFields.size > 0) {
            locksContent += `\n--- LOCKED SCHEMA_STRUCTURE FIELDS (PRESERVE EXACTLY) ---\n`
            lockedFields.forEach(key => {
                const field = structureFields.find(f => f.key === key)
                if (field) {
                    locksContent += `${field.raw}\n`
                }
            })
            locksContent += `--- END LOCKED FIELDS ---\n`
        }

        if (locksContent) {
            finalFeedback += `\n\n[SYSTEM] IMPORTANT - The user has LOCKED the following content. DO NOT CHANGE IT:\n${locksContent}`
        }

        try {
            // @ts-ignore
            const result = await window.api.generateAnalysisSchemaDraft({ 
                topic, 
                currentDraft, 
                feedback: finalFeedback 
            })
            
            if (result.success) {
                 const aiMsg: Message = { 
                    role: 'assistant', 
                    content: "Updated schema based on your request.",
                    draft: result.draft 
                }
                setMessages(prev => [...prev, aiMsg])
                setCurrentDraft(result.draft)
            } else {
                 setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${result.error}` }])
            }

        } catch (e) {
             setMessages(prev => [...prev, { role: 'assistant', content: "Failed to refine schema." }])
        } finally {
            setLoading(false)
        }
    }

    const toggleLockSection = (section: SchemaSection) => {
        setLockedSections(prev => {
            const next = new Set(prev)
            if (next.has(section)) next.delete(section)
            else next.add(section)
            return next
        })
    }
    
    const toggleLockField = (key: string) => {
        setLockedFields(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    const handleRegenerateBlock = async (section: SchemaSection) => {
        if (loading) return
        setLoading(true)
        
        // Optimistic UI update or just showing thinking
        setMessages(prev => [...prev, { role: 'user', content: `Please regenerate the "${section.toUpperCase()}" section.` }])

        try {
            const currentContent = parsedSections[section]
            
            // Collect locked items if structure
            const lockedItems: string[] = []
            if (section === 'structure') {
                structureFields.forEach(f => {
                    if (lockedFields.has(f.key)) {
                        // Pass the key to the backend to preserve
                        lockedItems.push(f.key)
                    }
                })
            }

            // @ts-ignore
            const result = await window.api.regenerateAnalysisSchemaSection({
                section,
                currentContent,
                lockedItems // Pass locked keys
            })

            if (result.success && result.content) {
                const newDraft = replaceSectionInDraft(currentDraft, section, result.content)
                setCurrentDraft(newDraft)
                 setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `Regenerated "${section}" section.` 
                }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${result.error || 'Failed to regenerate section'}` }])
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Failed to regenerate section." }])
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteBlock = (section: SchemaSection) => {
        handleRefinementSubmit(`Please REMOVE/CLEAR the content of the "${section.toUpperCase()}" section.`)
    }

    const handleRegenerateField = (key: string) => {
        handleRefinementSubmit(`Please regenerate ONLY the definition of the field "${key}" in 'schema_structure'. Improve its description/type. Keep all other fields exactly as they are.`)
    }

    const handleDeleteField = (key: string) => {
        // Also unlock if deleting
        if (lockedFields.has(key)) toggleLockField(key)
        
        const newDraft = removeFieldFromDraft(currentDraft, key)
        if (newDraft !== currentDraft) {
            setCurrentDraft(newDraft)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Deleted field "${key}" from schema.`
            }])
        } else {
             handleRefinementSubmit(`Please REMOVE the field "${key}" from 'schema_structure'.`)
        }
    }

    const handleAddField = async () => {
        if (loading) return
        setLoading(true)
        const userMsg: Message = { role: 'user', content: "Please ADD ONE NEW relevant field." }
        setMessages(prev => [...prev, userMsg])

        try {
            // @ts-ignore
            const result = await window.api.generateAnalysisSchemaField({ 
                currentDraft, 
                feedback: "Add one new relevant field to 'schema_structure' that is currently missing. Suggest a good key, type, and description." 
            })
            
            if (result.success && result.fieldYaml) {
                 const newDraft = appendFieldToDraft(currentDraft, result.fieldYaml)
                 setCurrentDraft(newDraft)
                 
                 setMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `Added new field:\n\`\`\`yaml\n${result.fieldYaml}\n\`\`\`` 
                }])
            } else {
                 setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${result.error || 'Failed to generate field'}` }])
            }

        } catch (e) {
             setMessages(prev => [...prev, { role: 'assistant', content: "Failed to add field." }])
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[95vw] h-[90vh] max-w-7xl bg-[#1e1e1e] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="h-14 border-b border-slate-700 flex items-center justify-between px-6 bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-purple-500/20 rounded text-purple-400">
                            <Sparkles size={18} />
                        </div>
                        <h2 className="text-white font-medium">AI Schema Wizard</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left: Chat / Input */}
                    <div className={`${step === 'init' ? 'w-full' : 'w-1/3 border-r border-slate-700'} flex flex-col bg-[#1a1a1a] transition-all duration-300`}>
                        {step === 'init' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-purple-500/20">
                                    <Sparkles size={40} className="text-white" />
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-4">PROTOCOL INITIALIZATION</h3>
                                <p className="text-slate-400 max-w-md mb-8">
                                    Define the analytical lens you want to apply to your characters. 
                                    (e.g., "Villain Motivation", "Romantic Tension", "Trauma Analysis")
                                </p>
                                
                                <div className="w-full max-w-md relative">
                                    <input 
                                        type="text" 
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleInitialSubmit()}
                                        placeholder="Enter Analysis Topic..."
                                        className="w-full bg-slate-800 border-2 border-slate-700 focus:border-purple-500 rounded-xl px-6 py-4 text-lg text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                                        autoFocus
                                    />
                                    <button 
                                        onClick={handleInitialSubmit}
                                        disabled={!topic.trim() || loading}
                                        className="absolute right-2 top-2 bottom-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white px-6 rounded-lg font-medium transition-all flex items-center gap-2"
                                    >
                                        {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : "Start"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Chat Interface
                            <div className="flex flex-col h-full">
                                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-300 rounded-bl-none border border-slate-700'}`}>
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-800 rounded-2xl rounded-bl-none px-4 py-3 border border-slate-700 flex items-center gap-2">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                                                </div>
                                                <span className="text-xs text-slate-500 ml-2">Thinking...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-700 bg-[#1e1e1e]">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleRefinementSubmit()}
                                            placeholder="Refine schema..."
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                                            disabled={loading}
                                        />
                                        <button 
                                            onClick={() => handleRefinementSubmit()}
                                            disabled={!feedback.trim() || loading}
                                            className="absolute right-2 top-2 p-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white disabled:opacity-50 transition-colors"
                                        >
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Preview (Modularized with Blocks) */}
                    <AnimatePresence>
                        {step === 'chat' && (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="w-2/3 bg-[#1e1e1e] flex flex-col"
                            >
                                <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Wrench size={12} className="text-purple-500" />
                                        Schema Architect
                                    </span>
                                    <div className="flex gap-2">
                                         <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText(currentDraft)
                                            }}
                                            className="px-2 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 rounded text-slate-400 transition-colors flex items-center gap-1"
                                        >
                                            <Copy size={10} /> Copy Raw
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-auto p-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                    {currentDraft ? (
                                        <div className="w-full bg-[#1e1e1e] p-8 space-y-8">
                                            
                                            {/* Block 1: Metadata */}
                                            <SchemaBlock 
                                                id="metadata" 
                                                title="Config & Metadata" 
                                                icon={Database} 
                                                content={parsedSections.metadata}
                                                isLocked={lockedSections.has('metadata')}
                                                onToggleLock={toggleLockSection}
                                                onRegenerate={handleRegenerateBlock}
                                                onDelete={handleDeleteBlock}
                                            />

                                            {/* Block 2: Structure (Fields) */}
                                            <SchemaBlock 
                                                id="structure" 
                                                title="Data Structure" 
                                                icon={Wrench} 
                                                isLocked={lockedSections.has('structure')}
                                                onToggleLock={toggleLockSection}
                                                onRegenerate={handleRegenerateBlock}
                                                onDelete={handleDeleteBlock}
                                            >
                                                {/* Field List */}
                                                <div className="space-y-3 mt-2">
                                                    <AnimatePresence mode='popLayout'>
                                                        {structureFields.map((field) => (
                                                            <SchemaFieldBlock
                                                                key={field.key}
                                                                fieldKey={field.key}
                                                                type={field.type}
                                                                description={field.description}
                                                                isLocked={lockedFields.has(field.key) || lockedSections.has('structure')}
                                                                onToggleLock={toggleLockField}
                                                                onRegenerate={handleRegenerateField}
                                                                onDelete={handleDeleteField}
                                                            />
                                                        ))}
                                                    </AnimatePresence>
                                                    
                                                    {/* Add Field Button */}
                                                    {!lockedSections.has('structure') && (
                                                        <motion.button 
                                                            layout
                                                            onClick={handleAddField}
                                                            disabled={loading}
                                                            className="w-full py-3 rounded-2xl border border-dashed border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/5 text-slate-500 hover:text-purple-400 transition-all flex items-center justify-center gap-2 group"
                                                        >
                                                            <div className="p-1 rounded bg-slate-800 group-hover:bg-purple-500/20 transition-colors">
                                                                <Plus size={14} />
                                                            </div>
                                                            <span className="text-xs font-bold uppercase tracking-wider">Add Field</span>
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </SchemaBlock>

                                            {/* Block 3: Definitions */}
                                            <SchemaBlock 
                                                id="definitions" 
                                                title="Key Definitions" 
                                                icon={BookOpen} 
                                                content={parsedSections.definitions}
                                                isLocked={lockedSections.has('definitions')}
                                                onToggleLock={toggleLockSection}
                                                onRegenerate={handleRegenerateBlock}
                                                onDelete={handleDeleteBlock}
                                            />

                                            {/* Block 4: Instructions */}
                                            <SchemaBlock 
                                                id="instructions" 
                                                title="System Instructions" 
                                                icon={Sparkles} 
                                                content={parsedSections.instructions}
                                                isLocked={lockedSections.has('instructions')}
                                                onToggleLock={toggleLockSection}
                                                onRegenerate={handleRegenerateBlock}
                                                onDelete={handleDeleteBlock}
                                            />

                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                                            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                                                <Sparkles size={24} className="opacity-50" />
                                            </div>
                                            <p>Waiting for generation...</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex justify-end gap-3">
                                    <button 
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 font-medium transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => onSave(currentDraft)}
                                        disabled={!currentDraft || loading}
                                        className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold transition-all shadow-lg shadow-blue-900/20 text-sm flex items-center gap-2"
                                    >
                                        <Save size={16} />
                                        Save Schema
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
