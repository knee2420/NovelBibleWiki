import { useState, useEffect, ReactElement } from 'react'
import { WikiLayout } from './components/Layout/WikiLayout'
import { HomeDashboard } from './pages/HomeDashboard'
import { PlotDashboard } from './pages/PlotDashboard'
import { SettingsPage } from './pages/SettingsPage'
import { WikiEntry } from './types/wiki'
import { WikiDetailModal } from './components/Common/WikiDetailModal' 
import { GenericArchive } from './pages/GenericArchive'
import { RelationBoard } from './pages/RelationBoard'
import { SceneCard } from './types/plot'

function App(): ReactElement {
  const [currentPage, setCurrentPage] = useState('home') // Default: Home
  const [wikiData, setWikiData] = useState<WikiEntry[]>([])
  const [sceneData, setSceneData] = useState<SceneCard[]>([])
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const selectedEntry = wikiData.find((entry) => entry.id === selectedEntryId) || null

  useEffect(() => {
    const fetchData = async () => {
      try {
        // @ts-ignore
        const data = await window.api.getWikiData()
        setWikiData(data)
        // @ts-ignore
        const scenes = await window.api.getTimelineFlat()
        setSceneData(scenes)
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
    setRefreshKey((prev) => prev + 1)
    setCurrentPage('home')
  }

  const handleEntryClick = (entry: WikiEntry) => {
    setSelectedEntryId(entry.id)
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomeDashboard
            data={wikiData}
            onNavigate={setCurrentPage}
            onEntryClick={handleEntryClick}
          />
        )

      case 'plot':
        return <PlotDashboard wikiData={wikiData} />
      case 'board':
        return <RelationBoard wikiData={wikiData} sceneData={sceneData} />
      case 'characters':
        return (
          <GenericArchive
            title="Character Archive"
            description="등장인물 도감"
            data={wikiData.filter(
              (d) => d.type === 'character' || (!d.type && (d as any).info?.role)
            )}
            createType="character"
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
            createType="item"
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
        <WikiDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntryId(null)}
          onUpdate={triggerRefresh}
        />
      )}
    </WikiLayout>
  )
}

export default App
