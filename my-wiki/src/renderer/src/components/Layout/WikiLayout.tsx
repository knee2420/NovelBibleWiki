import { ReactNode, useState, useEffect } from 'react'
import {
  Home,
  Users,
  Sword,
  Map,
  Flag,
  Settings as SettingsIcon,
  LayoutTemplate,
  PlusCircle,
  ChevronDown,
  FolderOpen,
  Check,
  Share2,
  Database,
  Clapperboard
} from 'lucide-react'
import { CreateNewModal } from '../Common/CreateNewModal'

interface WikiLayoutProps {
  children: ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

export const WikiLayout = ({ children, currentPage, onNavigate }: WikiLayoutProps) => {
  const navItems = [
    { id: 'home', label: '홈', icon: <Home size={20} /> },
    { id: 'plot', label: '플롯 보드', icon: <LayoutTemplate size={20} /> },
    { id: 'episodes', label: '에피소드', icon: <Clapperboard size={20} /> }, // [NEW]
    { id: 'board', label: '관계도', icon: <Share2 size={20} /> },
    { id: 'characters', label: '인물', icon: <Users size={20} /> },
    { id: 'items', label: '아이템', icon: <Sword size={20} /> },
    { id: 'locations', label: '지리', icon: <Map size={20} /> },
    { id: 'factions', label: '세력', icon: <Flag size={20} /> }
  ]

  const [refreshKey, setRefreshKey] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [projects, setProjects] = useState<{ name: string; path: string }[]>([])
  const [currentProject, setCurrentProject] = useState<{ name: string; path: string } | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    const fetchProjects = async () => {
      // @ts-ignore
      const { workspace, currentPath } = await window.api.getCurrentProject()
      if (workspace) {
        // @ts-ignore
        const list = await window.api.getProjects()
        setProjects(list)
        if (currentPath) {
          const active = list.find((p: any) => p.path === currentPath)
          if (active) setCurrentProject(active)
        }
      }
    }
    fetchProjects()
  }, [refreshKey])

  const handleSwitchProject = async (project: { name: string; path: string }) => {
    // @ts-ignore
    await window.api.selectProject(project.path)
    setCurrentProject(project)
    setIsDropdownOpen(false)
    window.location.reload() // 데이터 갱신을 위해 리로드
  }

  const handleSelectWorkspace = async () => {
    // @ts-ignore
    const path = await window.api.selectWorkspace()
    if (path) {
      setRefreshKey((prev) => prev + 1)
      alert('워크스페이스가 설정되었습니다. 작품을 선택해주세요.')
    }
  }

  const handleRefresh = () => window.location.reload()

  return (
    <div className="flex h-screen bg-[#0b0c15] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-[#11121c] flex flex-col">
        {/* Logo Area */}
        <div className="mb-6 relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-600 transition-all group"
          >
            <div className="flex flex-col items-start truncate">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                Workspace
              </span>
              <span className="font-bold text-slate-200 truncate w-full text-left">
                {currentProject ? currentProject.name : '작품 선택 필요'}
              </span>
            </div>
            <ChevronDown size={16} className="text-slate-500 group-hover:text-white" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
              {projects.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  {projects.map((proj) => (
                    <button
                      key={proj.path}
                      onClick={() => handleSwitchProject(proj)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-800 flex items-center justify-between group"
                    >
                      <span
                        className={`text-sm ${currentProject?.path === proj.path ? 'text-blue-400 font-bold' : 'text-slate-300'}`}
                      >
                        {proj.name}
                      </span>
                      {currentProject?.path === proj.path && (
                        <Check size={14} className="text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">연동된 작품 없음</div>
              )}
              <div className="border-t border-slate-800 p-2">
                <button
                  onClick={handleSelectWorkspace}
                  className="w-full flex items-center gap-2 px-2 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                >
                  <FolderOpen size={14} /> 워크스페이스 변경
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full mb-6 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/30 text-blue-400 hover:text-blue-300 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all font-medium text-sm"
        >
          <PlusCircle size={16} />새 문서 만들기
        </button>
        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                currentPage === item.id
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => onNavigate('ai-schema')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              currentPage === 'ai-schema'
                ? 'bg-purple-600/20 text-purple-400 font-semibold'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Database size={16} />
            <span>AI 데이터 설정</span>
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
              currentPage === 'settings'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            <SettingsIcon size={16} />
            <span>설정 및 데이터 연동</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scrollbar-hide">
        <div className="max-w-[88%] mx-auto p-8 pb-20">{children}</div>
      </main>
      <CreateNewModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
