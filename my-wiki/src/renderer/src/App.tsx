import { useState, useEffect, ReactElement } from 'react'
import { WikiLayout } from './components/Layout/WikiLayout'
import { HomeDashboard } from './pages/HomeDashboard'
import { PlotDashboard } from './pages/PlotDashboard'
import { SettingsPage } from './pages/SettingsPage'
import { WikiEntry } from './types/wiki'
import { WikiDetailModal } from './components/Common/WikiDetailModal' // [변경] 통합 모달 관리자
import { GenericArchive } from './pages/GenericArchive' // [변경] 통합 아카이브 페이지
import { RelationBoard } from './pages/RelationBoard'

function App(): ReactElement {
  const [currentPage, setCurrentPage] = useState('home')
  const [wikiData, setWikiData] = useState<WikiEntry[]>([])
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const selectedEntry = wikiData.find((entry) => entry.id === selectedEntryId) || null

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

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const handleImportComplete = () => {
    setRefreshKey((prev) => prev + 1) // 데이터 재로드 트리거
    setCurrentPage('home') // (선택사항) 완료 후 홈으로 이동 시켜서 갱신된 현황 보여주기
  }

  const handleEntryClick = (entry: WikiEntry) => {
    setSelectedEntryId(entry.id)
  }
  // 페이지 렌더링 로직
  const renderContent = () => {
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
      case 'board':
        return <RelationBoard wikiData={wikiData} />
      case 'characters':
        return (
          <GenericArchive
            title="Character Archive"
            description="등장인물 도감"
            data={wikiData.filter(
              (d) => d.type === 'character' || (!d.type && (d as any).info?.role)
            )}
            createType="character" // [NEW]
            onRefresh={triggerRefresh}
            onEntryClick={handleEntryClick}
          />
        )
      case 'items':
        return (
          <GenericArchive
            title="Item Storage"
            description="무구 및 아이템 데이터베이스"
            data={wikiData.filter((d) => d.type === 'item')}
            createType="item" // [NEW]
            onRefresh={triggerRefresh}
            onEntryClick={handleEntryClick}
          />
        )
      case 'locations':
        return (
          <GenericArchive
            title="Location Archive"
            description="지리 및 장소 데이터베이스"
            data={wikiData.filter((d) => d.type === 'location')}
            createType="location"
            onRefresh={triggerRefresh}
            onEntryClick={handleEntryClick}
          />
        )
      case 'factions':
        return (
          <GenericArchive
            title="Faction Archive"
            description="세력 및 단체 데이터베이스"
            data={wikiData.filter((d) => d.type === 'faction')}
            createType="faction"
            onRefresh={triggerRefresh}
            onEntryClick={handleEntryClick}
          />
        )
      case 'settings':
        return <SettingsPage onImportComplete={handleImportComplete} />
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
          onClose={() => setSelectedEntryId(null)}
          onUpdate={triggerRefresh} // [NEW] 저장 시 데이터 새로고침
        />
      )}
    </WikiLayout>
  )
}

export default App
