import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getWikiData: (): Promise<any> => ipcRenderer.invoke('get-wiki-data'),
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('open-folder-dialog'),
  importVault: (path: string): Promise<any> => ipcRenderer.invoke('import-vault', path),
  selectImage: (): Promise<string | null> => ipcRenderer.invoke('select-image-dialog'),

  getPlotData: (): Promise<any> => ipcRenderer.invoke('get-plot-data'),
  getSceneDetail: (path: string): Promise<any> => ipcRenderer.invoke('get-scene-detail', path),
  createWikiEntry: (payload: { type: string; title: string; content?: string }): Promise<any> =>
    ipcRenderer.invoke('create-wiki-entry', payload),
  saveWikiEntry: (payload: any): Promise<any> => ipcRenderer.invoke('save-wiki-entry', payload),
  deleteWikiEntry: (id: string): Promise<any> => ipcRenderer.invoke('delete-wiki-entry', id),
  selectWorkspace: () => ipcRenderer.invoke('select-workspace'),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  selectProject: (path: string) => ipcRenderer.invoke('select-project', path),
  getCurrentProject: () => ipcRenderer.invoke('get-current-project'),

  // [NEW] Plot CRUD
  createAct: (title: string) => ipcRenderer.invoke('create-act', title),
  createChapter: (actPath: string, title: string) =>
    ipcRenderer.invoke('create-chapter', { actPath, title }),
  createScene: (chapterPath: string, title: string) =>
    ipcRenderer.invoke('create-scene', { chapterPath, title }),
  getTimelineFlat: () => ipcRenderer.invoke('get-timeline-flat'),
  renameItem: (path: string, newName: string) =>
    ipcRenderer.invoke('rename-item', { path, newName }),
  updateScene: (payload: any) => ipcRenderer.invoke('update-scene', payload),
  deleteItem: (path: string) => ipcRenderer.invoke('delete-item', path),

  // [NEW] AI
  saveAIKey: (key: string) => ipcRenderer.invoke('ai:saveKey', key),
  getAIKey: () => ipcRenderer.invoke('ai:getKey'),
  analyzeScene: (text: string) => ipcRenderer.invoke('ai:analyzeScene', text),
  selectMultipleFiles: () => ipcRenderer.invoke('select-multiple-files'),
  // [NEW] Character Sync
  updateCharacter: (payload: any) => ipcRenderer.invoke('ai:updateCharacter', payload),
  processEntityDecisions: (payload: any) => ipcRenderer.invoke('ai:processEntityDecisions', payload),

  // [NEW] AI Settings (Schema/Prompt)
  // [NEW] AI Settings (Schema/Prompt)
  saveAISchema: (schema: string) => ipcRenderer.invoke('ai:saveSchema', schema),
  getAISchema: () => ipcRenderer.invoke('ai:getSchema'),
  saveAIInstructions: (instructions: string) => ipcRenderer.invoke('ai:saveInstructions', instructions),
  getAIInstructions: () => ipcRenderer.invoke('ai:getInstructions'),
  resetAISettings: () => ipcRenderer.invoke('ai:resetSettings'),
  
  // [NEW] Dynamic Fields
  // [NEW] Dynamic Fields (Legacy Support + New Schema)
  saveFieldConfig: (fields: any[]) => ipcRenderer.invoke('ai:saveFieldConfig', fields), // Legacy?
  saveSceneFieldConfig: (fields: any[]) => ipcRenderer.invoke('ai:saveSceneFieldConfig', fields),
  saveCharacterFieldConfig: (fields: any[]) => ipcRenderer.invoke('ai:saveCharacterFieldConfig', fields),
  getFieldConfig: () => ipcRenderer.invoke('ai:getFieldConfig'),

  // [NEW] Recursive Schema Builder
  saveSchemaConfig: (config: any) => ipcRenderer.invoke('ai:saveSchemaConfig', config),
  getSchemaConfig: (target?: string) => ipcRenderer.invoke('ai:getSchemaConfig', target),

  // [NEW] AI Model & Usage
  saveAIModel: (model: string) => ipcRenderer.invoke('ai:setModel', model),
  getAIModel: () => ipcRenderer.invoke('ai:getModel'),
  getAIUsage: () => ipcRenderer.invoke('ai:getUsageStats'),
  analyzeScript: (text: string, characters?: string[]) => ipcRenderer.invoke('ai:analyzeScript', text, characters),
  saveScriptAnalysis: (path: string, data: any) => ipcRenderer.invoke('save-script-analysis', { path, data }),
  loadScriptAnalysis: (path: string) => ipcRenderer.invoke('load-script-analysis', path),
  searchWikiMentions: (keywords: string[]) => ipcRenderer.invoke('search-wiki-mentions', keywords),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
