import { useState, useEffect, ReactElement } from 'react'
import { WikiLayout } from './components/Layout/WikiLayout'
import { HomeDashboard } from './pages/HomeDashboard'
import { PlotDashboard } from './pages/PlotDashboard'
import { SettingsPage } from './pages/SettingsPage'
import { AISchemaPage } from './pages/AISchemaPage'
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
  const [activeScenePath, setActiveScenePath] = useState<string | null>(null) // [NEW] Scene Link
  const [refreshKey, setRefreshKey] = useState(0)
  const selectedEntry = wikiData.find((entry) => entry.id === selectedEntryId) || null

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[App] Starting fetch...');
        // @ts-ignore
        if (!window.api) {
           console.error('[App] window.api is missing!');
           return;
        }
        
        // @ts-ignore
        const data = await window.api.getWikiData();
        console.log('[App] Wiki Data received:', data);
        
        if (Array.isArray(data)) {
           setWikiData(data);
        } else {
           console.error('[App] Wiki Data is not an array:', data);
        }

        // @ts-ignore
        const scenes = await window.api.getTimelineFlat();
        console.log('[App] Scenes received:', scenes);
        setSceneData(scenes || []);
      } catch (error) {
        console.error('[App] Fetch error:', error);
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

  // [NEW] Handle Open Scene from Wiki
  const handleOpenScene = (scenePath: string) => {
    setSelectedEntryId(null) // Close Wiki Modal
    setActiveScenePath(scenePath) // Set Active Scene
    setCurrentPage('plot') // Switch to Plot Tab
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
        return <PlotDashboard wikiData={wikiData} selectedScenePath={activeScenePath} onSelectScene={setActiveScenePath} />
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
      case 'ai-schema':
        return <AISchemaPage />
      case 'settings':
        return <SettingsPage onImportComplete={handleImportComplete} />
      default:
        return <div>Page Not Found</div>
    }
  }

  // [DEBUG] Web Mode Indicator
  // @ts-ignore
  const isWebMode = !window.electron;

  return (
    <WikiLayout currentPage={currentPage} onNavigate={setCurrentPage}>
       {isWebMode && wikiData.length === 0 && (
         <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-500/90 text-white px-6 py-3 rounded-lg shadow-xl z-50 text-center animate-pulse">
            <h3 className="font-bold text-lg mb-1">⚠️ Web Mode: No Data Found</h3>
            <p className="text-sm">Run <code>npm run generate-data</code> and ensure public/data exists.</p>
            <button 
               onClick={() => window.location.reload()}
               className="mt-2 bg-white text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-gray-100"
            >
               Reload Page
            </button>
         </div>
       )}

      {renderContent()}
      {selectedEntry && (
        <WikiDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntryId(null)}
          onUpdate={triggerRefresh}
          onOpenScene={handleOpenScene}
        />
      )}
    </WikiLayout>
  )
}

export default App
