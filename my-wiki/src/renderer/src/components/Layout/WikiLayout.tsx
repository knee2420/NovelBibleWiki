import React, { ReactNode } from 'react'
import { Home, Users, Sword, Map, Flag, Settings as SettingsIcon, LayoutTemplate } from 'lucide-react'

interface WikiLayoutProps {
  children: ReactNode
  currentPage: string
  onNavigate: (page: string) => void
}

export const WikiLayout = ({ children, currentPage, onNavigate }: WikiLayoutProps) => {
  const navItems = [
    { id: 'home', label: '홈', icon: <Home size={20} /> },
    { id: 'plot', label: '플롯 보드', icon: <LayoutTemplate size={20} /> },
    { id: 'characters', label: '인물', icon: <Users size={20} /> },
    { id: 'items', label: '아이템', icon: <Sword size={20} /> },
    { id: 'locations', label: '지리', icon: <Map size={20} /> },
    { id: 'factions', label: '세력', icon: <Flag size={20} /> },
  ]

  return (
    <div className="flex h-screen bg-[#0b0c15] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-[#11121c] flex flex-col">
        {/* Logo Area */}
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Novel Bible Wiki
          </h1>
          <p className="text-xs text-slate-500 mt-1">World Setting Archive</p>
        </div>

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
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <SettingsIcon size={16} />
            <span>설정 및 데이터 연동</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative scrollbar-hide">
        <div className="max-w-[88%] mx-auto p-8 pb-20">
          {children}
        </div>
      </main>
    </div>
  )
}
