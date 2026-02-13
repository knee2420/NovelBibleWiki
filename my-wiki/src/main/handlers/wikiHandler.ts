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
        else if (rawType === 'episode') entryType = 'episode' // [NEW] Episode Type
        else if (rawType === 'scene') entryType = 'scene' 

        // 요약문 생성 (description이 없으면 본문 앞부분 자르기)
        const summary =
          data.description ||
          body
            .slice(0, 100)
            .replace(/[#*`\n]/g, ' ')
            .trim() + '...'

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
      return results.filter((item) => item.type !== 'scene')
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

  // --------------------------------------------------------------------------
  // [CRUD] 1. 새 위키 문서 생성 (Create)
  // --------------------------------------------------------------------------
  ipcMain.handle('create-wiki-entry', async (_, { type, title, content, image, tags }) => {
    const vaultPath = store.get('vaultPath') as string
    if (!vaultPath) return { success: false, message: 'Vault 경로 미설정' }

    // 1. 타겟 폴더 설정 (Episode는 별도 폴더)
    let targetDir = join(vaultPath, '20_Wiki/00_Draft')
    if (type === 'episode') {
        targetDir = join(vaultPath, '20_Wiki/에피소드')
    }

    try {
      await fs.ensureDir(targetDir) // 폴더 없으면 생성

      // 2. 파일명 안전하게 변환
      const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_')
      let fileName = `${safeTitle}.md`
      let filePath = join(targetDir, fileName)

      // 3. 중복 방지
      let counter = 1
      while (await fs.pathExists(filePath)) {
        fileName = `${safeTitle} (${counter}).md`
        filePath = join(targetDir, fileName)
        counter++
      }

      // 4. Content Prep
      const frontmatter: any = {
        title: title, 
        type: type.toLowerCase(),
        tags: tags || [],
        created: new Date().toISOString().split('T')[0]
      }
      
      // Image Handling (if provided path)
      if (image) {
          frontmatter.image = image
      }

      const fileData = matter.stringify(content || '', frontmatter)
      await fs.writeFile(filePath, fileData, 'utf-8')

      return { success: true, path: filePath }
    } catch (error) {
      console.error('Create Entry Failed:', error)
      return { success: false, message: (error as any).message }
    }
  })

  // --------------------------------------------------------------------------
  // [CRUD] 2. 저장 (Update) -> 경로는 변경하지 않음 (편집만 수행)
  // --------------------------------------------------------------------------
  ipcMain.handle('save-wiki-entry', async (_, { id, title, type, tags, content, info }) => {
    // id: 파일의 절대 경로
    try {
      if (!(await fs.pathExists(id))) {
        return { success: false, message: '파일을 찾을 수 없습니다.' }
      }

      // 1. 기존 파일 읽기
      const fileRaw = await fs.readFile(id, 'utf-8')
      const { data: existingData } = matter(fileRaw)

      // 2. 데이터 병합 (기존 Frontmatter + 수정된 데이터)
      // * 주의: 파일명(경로)은 변경하지 않고 내부 title만 변경합니다. (링크 깨짐 방지)
      const newFrontmatter = {
        ...existingData,
        ...info,
        title: title,
        type: type,
        tags: tags
        // updated: new Date().toISOString() // 필요시 수정일 업데이트
      }

      // 3. 파일 다시 쓰기
      const newFileData = matter.stringify(content, newFrontmatter)
      await fs.writeFile(id, newFileData, 'utf-8')

      return { success: true }
    } catch (error) {
      console.error('Save Entry Failed:', error)
      return { success: false, message: (error as any).message }
    }
  })

  ipcMain.handle('delete-wiki-entry', async (_, id: string) => {
    // id는 파일의 절대 경로
    try {
      if (!(await fs.pathExists(id))) {
        return { success: false, message: '파일이 이미 존재하지 않습니다.' }
      }

      // 파일 삭제 (휴지통이 아니라 영구 삭제되므로 주의)
      await fs.remove(id)

      return { success: true }
    } catch (error) {
      console.error('Delete Entry Failed:', error)
      return { success: false, message: (error as any).message }
    }
  })

  ipcMain.handle('select-image-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'jpeg'] }]
    })
    const filePath = result.filePaths[0]
    if (!filePath) return null

    // 파일을 읽어서 Base64 문자열로 변환 (미리보기용)
    const fileData = await fs.readFile(filePath)
    const ext = extname(filePath).slice(1) // 확장자 추출
    const preview = `data:image/${ext};base64,${fileData.toString('base64')}`

    return { path: filePath, preview: preview }
  })
}
