import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'

// [NEW] 분리된 핸들러들 임포트
import { setupPlotHandlers } from './handlers/plotHandler'
import { setupWikiHandlers } from './handlers/wikiHandler'
import { setupProjectHandlers } from './handlers/projectHandler'

const store = new Store()

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200, // 너비를 좀 더 넓게 잡았습니다 (칸반 보드 고려)
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    backgroundColor: '#020617', // 다크모드 배경색 미리 지정 (깜빡임 방지)
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // [핵심] 핸들러 등록
  setupWikiHandlers(store) // 위키 기능 (불러오기, 이미지 등)
  setupPlotHandlers(store) // 플롯 기능 (칸반, 파일 정리 등)
  setupProjectHandlers(store)

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
