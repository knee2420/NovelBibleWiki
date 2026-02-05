import { CharacterHistoryViewer } from '../components/Analysis/CharacterHistoryViewer'

// Mock Data (extracted from Kang Jinwoo.md)
// Character Log Prototype - Visualization of analysis data over time


export const CharacterLogPrototype = () => {
  return (
    <div className="w-full h-screen flex flex-col">
       <div className="p-4 bg-slate-950 border-b border-slate-800">
           <h1 className="text-xl font-bold text-white mb-1">Character History Prototype</h1>
           <p className="text-sm text-slate-500">Visualizing Markdown History Logs for 'Kang Jinwoo'</p>
       </div>
       <div className="flex-1 overflow-hidden">
        <CharacterHistoryViewer characterName="강진우" />
      </div>
    </div>
  )
}
