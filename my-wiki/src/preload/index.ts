import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getWikiData: (): Promise<any> => ipcRenderer.invoke('get-wiki-data'),
  selectFolder: (): Promise<string | null> => ipcRenderer.invoke('open-folder-dialog'),
  importVault: (path: string): Promise<any> => ipcRenderer.invoke('import-vault', path),

  getPlotData: (): Promise<any> => ipcRenderer.invoke('get-plot-data'),
  getSceneDetail: (path: string): Promise<any> => ipcRenderer.invoke('get-scene-detail', path)
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
