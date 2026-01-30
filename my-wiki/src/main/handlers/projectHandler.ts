// src/main/handlers/projectHandler.ts

import { ipcMain, dialog } from 'electron'
import fs from 'fs-extra'
import { join } from 'path'

export function setupProjectHandlers(store: any): void {
  // 1. 워크스페이스(최상위 폴더) 선택
  ipcMain.handle('select-workspace', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (canceled || filePaths.length === 0) return null

    const workspacePath = filePaths[0]
    store.set('workspacePath', workspacePath) // 워크스페이스 경로 저장
    return workspacePath
  })

  // 2. 프로젝트 목록 스캔 (워크스페이스 하위 폴더들)
  ipcMain.handle('get-projects', async () => {
    const workspacePath = store.get('workspacePath') as string
    if (!workspacePath || !fs.existsSync(workspacePath)) return []

    try {
      const entries = await fs.readdir(workspacePath, { withFileTypes: true })

      // 폴더인 것만 필터링 (숨김 폴더 제외)
      const projects = entries
        .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
        .map((dirent) => ({
          name: dirent.name,
          path: join(workspacePath, dirent.name)
        }))

      return projects
    } catch (error) {
      console.error('Failed to scan projects:', error)
      return []
    }
  })

  // 3. 활성 프로젝트 선택 (Context Switching)
  ipcMain.handle('select-project', async (_, projectPath: string) => {
    // [핵심] 기존 핸들러들이 참조하는 'vaultPath'를 현재 선택한 프로젝트로 업데이트
    store.set('vaultPath', projectPath)
    return true
  })

  // 4. 현재 설정된 정보 가져오기
  ipcMain.handle('get-current-project', () => {
    return {
      workspace: store.get('workspacePath'),
      currentPath: store.get('vaultPath')
    }
  })
}
