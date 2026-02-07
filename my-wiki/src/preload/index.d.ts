declare global {
  interface WikiApi {
    getWikiData: () => Promise<any>
    selectFolder: () => Promise<string | null>
    importVault: (path: string) => Promise<any>
    selectImage: () => Promise<string | null>
    getPlotData: () => Promise<any>
    getSceneDetail: (path: string) => Promise<any>
    createWikiEntry: (payload: any) => Promise<any>
    saveWikiEntry: (payload: any) => Promise<any>
    deleteWikiEntry: (id: string) => Promise<any>
    selectWorkspace: () => Promise<any>
    getProjects: () => Promise<any>
    selectProject: (path: string) => Promise<any>
    getCurrentProject: () => Promise<any>
    createAct: (title: string) => Promise<any>
    createChapter: (actPath: string, title: string) => Promise<any>
    createScene: (chapterPath: string, title: string) => Promise<any>
    getTimelineFlat: () => Promise<any>
    renameItem: (path: string, newName: string) => Promise<any>
    updateScene: (payload: any) => Promise<any>
    deleteItem: (path: string) => Promise<any>
    // [NEW] AI
    saveAIKey: (key: string) => Promise<{ success: boolean }>
    getAIKey: () => Promise<string | null>
    analyzeScene: (text: string) => Promise<{ success: boolean; data?: any; message?: string }>
    selectMultipleFiles: () => Promise<string[]>
    updateCharacter: (payload: any) => Promise<any>
    
    // AI Settings
    saveAISchema: (schema: string) => Promise<any>
    getAISchema: () => Promise<any>
    saveAIInstructions: (instructions: string) => Promise<any>
    getAIInstructions: () => Promise<string>
    resetAISettings: () => Promise<any>

    // Dynamic Fields
    saveFieldConfig: (fields: any[]) => Promise<any>
    saveSceneFieldConfig: (fields: any[]) => Promise<any>
    saveCharacterFieldConfig: (fields: any[]) => Promise<any>
    getFieldConfig: () => Promise<{ scene: any[]; character: any[] }>
  }

  interface Window {
    electron: ElectronAPI
    api: WikiApi
  }
}
