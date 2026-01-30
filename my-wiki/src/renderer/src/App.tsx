import { useState, useEffect, ReactElement } from 'react'
import { WikiLayout } from './components/Layout/WikiLayout'
import { HomeDashboard } from './pages/HomeDashboard'
import { PlotDashboard } from './pages/PlotDashboard'
import { SettingsPage } from './pages/SettingsPage'
import { WikiEntry } from './types/wiki'
import { WikiDetailModal } from './components/Common/WikiDetailModal' // [변경] 통합 모달 관리자
import { GenericArchive } from './pages/GenericArchive' // [변경] 통합 아카이브 페이지

function App(): ReactElement {
  const [currentPage, setCurrentPage] = useState('home')
  const [wikiData, setWikiData] = useState<WikiEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        // @ts-ignore
        const data = await window.api.getWikiData() // 기존 API 이름 유지 (내부는 수정됨)
        setWikiData(data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchData()
  }, [refreshKey])

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1) // 데이터 재로드 트리거
    setCurrentPage('home') // (선택사항) 완료 후 홈으로 이동 시켜서 갱신된 현황 보여주기
  }

  const handleEntryClick = (entry: WikiEntry) => {
    setSelectedEntry(entry)
  }
  // 페이지 렌더링 로직
  const renderContent = () => {
    // 타입별 필터링
    const filterData = (type: string) => wikiData.filter(d => d.type === type)

    switch (currentPage) {
      case 'home':
        return (
          <HomeDashboard
            data={wikiData}
            onNavigate={setCurrentPage}
            onEntryClick={handleEntryClick} // 핸들러 전달
          />
        )

      case 'plot':
        return <PlotDashboard />

      case 'characters':
        return <GenericArchive
          title="Character Archive"
          description="등장인물 도감"
          data={wikiData.filter(d => d.type === 'character' || (!d.type && (d as any).info?.role))}
          onEntryClick={handleEntryClick}
        />
      case 'items':
        return <GenericArchive
          title="Item Storage"
          description="무구 및 아이템 데이터베이스"
          data={wikiData.filter(d => d.type === 'item')}
          onEntryClick={handleEntryClick}
        />
      case 'locations':
        return (
         <GenericArchive
            title="Location Archive"
            description="지리 및 장소 데이터베이스"
            data={wikiData.filter(d => d.type === 'location')}
            onEntryClick={handleEntryClick}
          />
          )
      case 'factions':
        return (
          <GenericArchive
            title="Faction Archive"
            description="세력 및 단체 데이터베이스"
            data={wikiData.filter(d => d.type === 'faction')}
            onEntryClick={handleEntryClick}
          />
          )
      case 'settings':
        return (
          <SettingsPage onImportComplete={handleImportComplete} />
        )
      default:
        return <div>Page Not Found</div>
    }
  }

  return (
    <WikiLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderContent()}
      {selectedEntry && (
        // 현재는 CharacterDetail을 공용으로 사용 (추후 ItemDetail 등으로 분기 가능)
        <WikiDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </WikiLayout>
  )
}

// 간단한 그리드 뷰 (Generic Component) - 실제 파일로 분리 권장
const GenericGrid = ({ title, desc, data }: { title: string, desc: string, data: WikiEntry[] }) => (
  <div>
    <header className="mb-8">
      <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400">{desc}</p>
    </header>

    {data.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
            데이터가 없습니다. Obsidian 문서에 <code className="bg-slate-800 px-1 rounded text-blue-400">type: item</code> 등의 태그를 추가하세요.
        </div>
    ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {data.map((entry) => (
            <div key={entry.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 transition-all cursor-pointer group">
                <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                    {entry.image ? (
                        <img src={entry.image} alt={entry.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 font-mono text-sm">NO IMAGE</div>
                    )}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white uppercase border border-white/10">
                        {entry.type}
                    </div>
                </div>
                <div className="p-4">
                    <h3 className="font-bold text-slate-100 truncate">{entry.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 truncate">
                        {/* 타입별로 다른 정보 표시 */}
                        {(entry as any).info?.category || (entry as any).info?.region || (entry as any).info?.leader || '-'}
                    </p>
                </div>
            </div>
        ))}
        </div>
    )}
  </div>
)

export default App
