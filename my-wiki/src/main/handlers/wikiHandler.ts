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
  // [CRUD] 1. 새 위키 문서 생성 (Create) -> 무조건 _Drafts 폴더로 격리
  // --------------------------------------------------------------------------
  ipcMain.handle('create-wiki-entry', async (_, { type, title, content }) => {
    const vaultPath = store.get('vaultPath') as string
    if (!vaultPath) return { success: false, message: 'Vault 경로 미설정' }

    // 1. Inbox 폴더 경로 설정
    const targetDir = join(vaultPath, '20_Wiki/00_Draft')

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

      // 4. 기본 템플릿 생성
      const frontmatter = {
        title: title, // 옵시디언 호환용
        type: type.toLowerCase(),
        tags: ['draft'], // 태그에 자동으로 draft 추가 (선택사항)
        created: new Date().toISOString().split('T')[0]
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
  ipcMain.handle('save-wiki-entry', async (_, { id, newContent, newFrontmatter }) => {
    // id는 절대 경로
    try {
      if (!(await fs.pathExists(id))) return { success: false, message: 'File not found' }

      // 기존 데이터 읽기 (Merge를 위해)
      const fileRaw = await fs.readFile(id, 'utf-8')
      const { data: currentData } = matter(fileRaw)

      // 기존 데이터 + 새 데이터 병합
      // (주의: 빈 값이 오더라도 기존 값을 날리지 않도록 로직 주의 필요. 여기선 덮어쓰기 허용)
      const mergedData = { ...currentData, ...newFrontmatter }

      const newFileData = matter.stringify(newContent, mergedData)
      await fs.writeFile(id, newFileData, 'utf-8')

      return { success: true }
    } catch (error) {
      console.error('Save Entry Failed:', error)
      return { success: false, message: (error as any).message }
    }
  })
}
