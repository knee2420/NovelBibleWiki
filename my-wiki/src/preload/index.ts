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
  renameItem: (path: string, newName: string) =>
    ipcRenderer.invoke('rename-item', { path, newName }),
  deleteItem: (path: string) => ipcRenderer.invoke('delete-item', path)
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
