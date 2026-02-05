import { useState } from 'react'
import { FilterState } from '../../hooks/useWikiFilter'
import { ChevronDown, ChevronRight, X, Sparkles, Skull, Users, Tag, Target } from 'lucide-react'

// [NEW] Friendly Labels Mapping
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
  // Relations (Mood) - Future proofing
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

interface FilterSidebarProps {
  filters: FilterState
  options: FilterOptions
  onToggle: (category: keyof FilterState, value: string) => void
  onReset: () => void
  entryType: string
}

export const FilterSidebar = ({
  filters,
  options,
  onToggle,
  onReset,
  entryType
}: FilterSidebarProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    grades: true,
    statuses: true,
    affiliations: true,
    roles: false,
    tags: false
  })

  // [UI Config] Section Icons & Labels
  const sectionConfig = {
    grades: { icon: Sparkles, label: '비중 (Grade)', color: 'text-amber-400' },
    statuses: { icon: Skull, label: '상태 (Status)', color: 'text-red-400' },
    affiliations: { icon: Users, label: '소속 (Affiliation)', color: 'text-blue-400' },
    roles: { icon: Target, label: '역할 (Role)', color: 'text-green-400' },
    tags: { icon: Tag, label: '태그 (Tags)', color: 'text-slate-400' }
  }

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const getFriendlyLabel = (value: string) => LABEL_MAP[value] || value

  // Helper to render a section
  const renderSection = (category: keyof FilterState, items: FilterOption[]) => {
    if (items.length === 0) return null

    const isOpen = openSections[category]
    const config = sectionConfig[category]
    const Icon = config.icon

    return (
      <div className="mb-3">
        <button
          onClick={() => toggleSection(category)}
          className="flex items-center justify-between w-full text-left mb-2 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1 rounded-md bg-slate-800 group-hover:bg-slate-700 transition-colors shadow-sm ${config.color}`}
            >
              <Icon size={14} />
            </div>
            <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
              {config.label}
            </span>
          </div>
          {isOpen ? (
            <ChevronDown size={14} className="text-slate-500" />
          ) : (
            <ChevronRight size={14} className="text-slate-500" />
          )}
        </button>

        {isOpen && (
          <div className="space-y-1.5 pl-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pr-1">
            {items.map((item) => {
              const checked = filters[category].includes(item.value)
              return (
                <div
                  key={item.value}
                  onClick={(e) => {
                    e.preventDefault()
                    onToggle(category, item.value)
                  }}
                  className={`
                    relative group flex items-center justify-between cursor-pointer py-2 px-3 rounded-md border transition-all duration-200
                    ${
                      checked
                        ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                    }
                  `}
                >
                  {/* Selection Indicator (Left Bar) */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md transition-all
                    ${checked ? 'bg-blue-500' : 'bg-transparent group-hover:bg-slate-600'}
                  `}
                  />

                  <span
                    className={`text-xs ml-1 font-medium truncate transition-colors ${
                      checked ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    {getFriendlyLabel(item.value)}
                  </span>

                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors
                    ${
                      checked
                        ? 'bg-blue-500 text-white font-bold'
                        : 'bg-slate-950 text-slate-600 group-hover:text-slate-400'
                    }
                  `}
                  >
                    {item.count}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  const activeFilterCount = Object.values(filters).flat().length

  return (
    <aside className="w-72 flex-shrink-0 flex flex-col h-full border-r border-slate-800/50 bg-slate-950/30 backdrop-blur-sm mr-0 hidden md:flex">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-6 border-b border-slate-800/50">
        <h3 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
          <span className="text-blue-500">
            <Target size={20} />
          </span>
          FILTER
        </h3>
        {activeFilterCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-full hover:bg-red-500/20 transition-all border border-red-500/20"
          >
            <X size={10} strokeWidth={3} /> 초기화 ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Filter Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
        {/* Character Only Filters */}
        {entryType === 'character' && (
          <>
            {renderSection('grades', options.grades)}
            {renderSection('statuses', options.statuses)}
            <div className="my-4 border-t border-slate-800/50 mx-2" />
            {renderSection('affiliations', options.affiliations)}
            {renderSection('roles', options.roles)}
          </>
        )}

        {/* Common Filters */}
        <div className="my-4 border-t border-slate-800/50 mx-2" />
        {renderSection('tags', options.tags)}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/50">
        <div className="text-[10px] text-slate-600 text-center font-mono">
          NOVEL BIBLE WIKI v1.0
        </div>
      </div>
    </aside>
  )
}
