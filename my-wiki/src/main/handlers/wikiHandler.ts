import { ipcMain, dialog } from 'electron'
import fs from 'fs-extra'
import { join, extname, isAbsolute } from 'path'
import matter from 'gray-matter'

// 재귀적으로 파일 탐색하는 헬퍼 함수
function getFilesRecursively(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    const filePath = join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      // .git이나 숨김 폴더, 시스템 폴더는 제외
      if (!file.startsWith('.') && file !== 'node_modules') {
        getFilesRecursively(filePath, fileList)
      }
    } else {
      if (file.endsWith('.md')) {
        fileList.push(filePath)
      }
    }
  })
  return fileList
}

export function setupWikiHandlers(store: any): void {
  // 1. 위키 데이터 전체 로드 (Get Wiki Data)
  ipcMain.handle('get-wiki-data', async () => {
    const vaultPath = store.get('vaultPath') as string
    if (!vaultPath) return []

    // 20_Wiki 폴더가 있으면 거기서, 없으면 루트에서 전체 검색
    // (구조 마이그레이션 전후 호환성을 위해 유연하게 처리)
    let searchRoot = join(vaultPath, '20_Wiki')
    if (!fs.existsSync(searchRoot)) {
      searchRoot = vaultPath
    }

    try {
      const files = getFilesRecursively(searchRoot)

      const results = files.map((filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8')
        const { data, content: body } = matter(content)

        // 이미지 처리 로직 (기존 유지)
        let imageSrc = ''
        if (data.image) {
          try {
            const rawPath = data.image.trim().replace(/^['"]|['"]$/g, '')
            let imagePath = ''

            if (isAbsolute(rawPath)) {
              imagePath = rawPath
            } else {
              // 옵시디언은 보통 볼트 루트 기준이거나 현재 파일 기준일 수 있음
              // 여기서는 볼트 루트 기준으로 가정하고 처리
              imagePath = join(vaultPath, rawPath.replace(/^\//, ''))
            }

            if (fs.existsSync(imagePath)) {
              const fileData = fs.readFileSync(imagePath)
              const ext = extname(imagePath).slice(1)
              imageSrc = `data:image/${ext};base64,${fileData.toString('base64')}`
            }
          } catch (err) {
            console.error(`Failed to load image for ${filePath}:`, err)
          }
        }

        // 타입 추론
        let entryType = 'other'
        const rawType = data.type ? data.type.toLowerCase() : ''

        if (rawType === 'character' || data.role) entryType = 'character'
        else if (rawType === 'item' || data.category) entryType = 'item'
        else if (rawType === 'location' || data.region) entryType = 'location'
        else if (rawType === 'faction' || data.leader) entryType = 'faction'
        else if (rawType === 'scene') entryType = 'scene' // 플롯 데이터는 제외하거나 포함할지 결정

        // 요약문 생성 (description이 없으면 본문 앞부분 자르기)
        const summary = data.description || body.slice(0, 100).replace(/[#*`\n]/g, ' ').trim() + '...'

        return {
          id: filePath,
          name: data.name || data.title || filePath.split(/[\\/]/).pop()?.replace('.md', ''),
          type: entryType,
          content: body,
          image: imageSrc,
          description: summary,
          tags: data.tags || [],
          info: { ...data } // front-matter 전체 보존
        }
      })

      // 플롯 파일(scene)은 위키 리스트에서 제외하고 싶다면 필터링
      return results.filter(item => item.type !== 'scene')

    } catch (error) {
      console.error('Wiki data load failed:', error)
      return []
    }
  })

  // 2. 폴더 선택 다이얼로그 (Select Folder)
  ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.filePaths[0]
  })

  // 3. 볼트 경로 저장 (Import Vault)
  ipcMain.handle('import-vault', async (_, path: string) => {
    store.set('vaultPath', path)
    return true
  })
}
