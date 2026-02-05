import { useState, useRef, useEffect } from 'react'
import { FilterState } from '../../hooks/useWikiFilter'
import { Sparkles, Skull, Users, Tag, Target, ChevronDown, Check, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

// [NEW] Friendly Labels Mapping (reused from FilterSidebar)
const LABEL_MAP: Record<string, string> = {
  // Grades
  MAIN: '주연 🌟',
  SUB: '조연 🎭',
  MINOR: '단역 👤',
  EXTRA: '엑스트라 👥',
  // Statuses
  ALIVE: '생존 🟢',
  DECEASED: '사망 💀',
  UNKNOWN: '행방불명 ❓',
  INJURED: '부상 🩸',
  STUNNED: '기절 🌀',
  ILLUSION: '환영 🔮',
  // Relations (Mood)
  FRIENDLY: '우호 💙',
  HOSTILE: '적대 ⚔️',
  NEUTRAL: '중립 ⚪'
}

interface FilterOption {
  value: string
  count: number
}

interface FilterOptions {
  grades: FilterOption[]
  statuses: FilterOption[]
  affiliations: FilterOption[]
  roles: FilterOption[]
  tags: FilterOption[]
}

interface FilterBarProps {
  filters: FilterState
  options: FilterOptions
  onToggle: (category: keyof FilterState, value: string) => void
  onReset: () => void
  entryType: string
}

export const FilterBar = ({
  filters,
  options,
  onToggle,
  onReset,
  entryType
}: FilterBarProps) => {
  const [activeDropdown, setActiveDropdown] = useState<keyof FilterState | null>(null)
  
  // Close dropdown when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // [UI Config] Section Icons & Labels
  const sectionConfig = {
    grades: { icon: Sparkles, label: '비중', color: 'text-amber-400' },
    statuses: { icon: Skull, label: '상태', color: 'text-red-400' },
    affiliations: { icon: Users, label: '소속', color: 'text-blue-400' },
    roles: { icon: Target, label: '역할', color: 'text-green-400' },
    tags: { icon: Tag, label: '태그', color: 'text-slate-400' }
  }

  const getFriendlyLabel = (value: string) => LABEL_MAP[value] || value

  const activeFilterCount = Object.values(filters).flat().length

  const renderDropdown = (category: keyof FilterState, items: FilterOption[]) => {
    if (items.length === 0) return null

    const isOpen = activeDropdown === category
    const config = sectionConfig[category]
    const Icon = config.icon
    const selectedCount = filters[category].length
    const isActive = selectedCount > 0

    return (
      <div className="relative">
        <button
          onClick={() => setActiveDropdown(isOpen ? null : category)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-sm font-medium
            ${isActive 
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-100 hover:bg-blue-500/20' 
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
            }
          `}
        >
          <div className={`${isActive ? 'text-blue-400' : config.color}`}>
            <Icon size={14} />
          </div>
          <span>{config.label}</span>
          {selectedCount > 0 && (
            <span className="flex items-center justify-center bg-blue-500 text-white text-[10px] w-5 h-5 rounded-full">
              {selectedCount}
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} opacity-50`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                {items.map((item) => {
                  const checked = filters[category].includes(item.value)
                  return (
                    <button
                      key={item.value}
                      onClick={() => onToggle(category, item.value)}
                      className={`
                        w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors mb-1
                        ${checked 
                          ? 'bg-blue-500/10 text-blue-100' 
                          : 'text-slate-300 hover:bg-slate-800'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`
                          w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                          ${checked 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-slate-600'
                          }
                        `}>
                          {checked && <Check size={10} className="text-white" />}
                        </div>
                        <span className="truncate">{getFriendlyLabel(item.value)}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono ml-2">{item.count}</span>
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap pb-4 mb-4 border-b border-slate-800/50" ref={dropdownRef}>
      <div className="mr-2 flex items-center gap-2 text-slate-400 font-bold text-sm">
        <Target size={16} />
        <span>FILTER</span>
      </div>

      {entryType === 'character' && (
        <>
          {renderDropdown('grades', options.grades)}
          {renderDropdown('statuses', options.statuses)}
          {renderDropdown('affiliations', options.affiliations)}
          {renderDropdown('roles', options.roles)}
        </>
      )}
      
      {renderDropdown('tags', options.tags)}

      {activeFilterCount > 0 && (
        <button
          onClick={onReset}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-full transition-all"
        >
          <X size={12} />
          초기화 ({activeFilterCount})
        </button>
      )}
    </div>
  )
}
