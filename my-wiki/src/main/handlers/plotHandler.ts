import { ipcMain, shell } from 'electron'
import fs from 'fs-extra'
import { join, basename, dirname } from 'path'
import matter from 'gray-matter'

export function setupPlotHandlers(store: any): void {
  ipcMain.handle('get-plot-data', async () => {
    const vaultPath = store.get('vaultPath') as string
    if (!vaultPath) return []

    try {
      // 1. Vault 전체를 재귀적으로 탐색하여 모든 '챕터 후보 폴더'를 찾습니다.
      const allChapters = recursiveScan(vaultPath)

      if (allChapters.length === 0) {
        console.log('[PlotHandler] 탐색 실패. 유효한 씬 파일을 찾지 못했습니다.')
        return []
      }

      // 2. 발견된 챕터들을 '막(Act)' 단위로 그룹핑 (폴더 구조 기반)
      // 막 폴더(예: "1막_...")가 있으면 그걸 기준으로, 없으면 "메인 스토리"로 통합
      const actsMap = new Map<string, any>()

      allChapters.forEach((chapter) => {
        // 부모 폴더명을 확인하여 막(Act) 결정
        const parentPath = join(chapter.id, '..')
        const parentName = basename(parentPath)

        let actKey = 'Default'
        let actTitle = '메인 스토리'
        let actNum = 1

        if (parentName.includes('막') || parentName.toLowerCase().includes('act')) {
          actKey = parentPath
          actTitle = parentName
          const numMatch = parentName.match(/(\d+)/)
          actNum = numMatch ? parseInt(numMatch[0]) : 999
        }

        if (!actsMap.has(actKey)) {
          actsMap.set(actKey, {
            id: actKey, // 식별자 추가
            path: actKey,
            actNumber: actNum,
            title: actTitle,
            chapters: []
          })
        }
        actsMap.get(actKey).chapters.push(chapter)
      })

      // 3. 결과 배열로 변환 및 정렬
      const result = Array.from(actsMap.values())
        .map((act) => ({
          ...act,
          chapters: act.chapters.sort((a, b) => a.chapterNumber - b.chapterNumber)
        }))
        .sort((a, b) => a.actNumber - b.actNumber)

      return result
    } catch (error) {
      console.error('[PlotHandler] 스캔 중 치명적 오류:', error)
      return []
    }
  })

  ipcMain.handle('get-scene-detail', async (_, filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) return null

      const content = fs.readFileSync(filePath, 'utf-8')
      const { data, content: body } = matter(content)

      return {
        frontmatter: data,
        content: body,
        stats: fs.statSync(filePath)
      }
    } catch (error) {
      console.error('[PlotHandler] 상세 로딩 실패:', error)
      return null
    }
  })

  // 1. 막(Act) 생성
  ipcMain.handle('create-act', async (_, title: string) => {
    const vaultPath = store.get('vaultPath') as string
    if (!vaultPath) return false
    try {
      const dirs = fs
        .readdirSync(vaultPath)
        .filter((n) => fs.statSync(join(vaultPath, n)).isDirectory())
      let max = 0
      dirs.forEach((d) => {
        const m = d.match(/^(\d+)막_/)
        if (m) max = Math.max(max, parseInt(m[1]))
      })
      await fs.ensureDir(join(vaultPath, `${max + 1}막_${title}`))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })

  // 2. 챕터(Chapter) 생성
  ipcMain.handle('create-chapter', async (_, { actPath, title }) => {
    if (!fs.existsSync(actPath)) return false
    try {
      const dirs = fs
        .readdirSync(actPath)
        .filter((n) => fs.statSync(join(actPath, n)).isDirectory())
      let max = 0
      dirs.forEach((d) => {
        const m = d.match(/^(\d+)화_/)
        if (m) max = Math.max(max, parseInt(m[1]))
      })
      await fs.ensureDir(join(actPath, `${max + 1}화_${title}`))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })

  // 3. 씬(Scene) 생성
  ipcMain.handle('create-scene', async (_, { chapterPath, title }) => {
    if (!fs.existsSync(chapterPath)) return false
    try {
      const files = fs.readdirSync(chapterPath).filter((n) => n.endsWith('.md'))
      let max = 0
      files.forEach((f) => {
        const m = f.match(/SCENE-(\d+)\.md/i)
        if (m) max = Math.max(max, parseInt(m[1]))
      })
      const next = max + 1
      const fm = {
        type: 'scene',
        scene: next,
        title: title || `Scene ${next}`,
        summary: '',
        characters: []
      }
      await fs.writeFile(join(chapterPath, `SCENE-${next}.md`), matter.stringify('', fm))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })

  // 4. 이름 변경 (Act, Chapter 공용)
  ipcMain.handle('rename-item', async (_, { path, newName }) => {
    if (!fs.existsSync(path)) return false
    try {
      const dir = dirname(path)
      const oldName = basename(path)
      const prefixMatch = oldName.match(/^(\d+[막화]_)/)
      const prefix = prefixMatch ? prefixMatch[1] : ''
      // 새 이름에 접두사가 없으면 기존 접두사 유지
      const finalName = newName.startsWith(prefix) ? newName : `${prefix}${newName}`
      await fs.rename(path, join(dir, finalName))
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })

  // 5. 삭제 (휴지통 이동)
  ipcMain.handle('delete-item', async (_, path) => {
    try {
      await shell.trashItem(path)
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })
}

// --------------------------------------------------------------------------
// 🔍 재귀 탐색 함수 (지구 끝까지 쫓아가서 찾아냄)
// --------------------------------------------------------------------------
function recursiveScan(dirPath: string, depth = 0): any[] {
  // 1. 탐색 제외 조건 (시스템 폴더 등)
  if (depth > 7) return [] // 너무 깊으면 중단
  const dirName = basename(dirPath)
  if (dirName.startsWith('.') || dirName === 'node_modules' || dirName === 'dist') return []

  let chapters: any[] = []

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true })

    // 2. 현재 폴더가 '챕터'인지 검사
    // 조건: 폴더 이름에 숫자가 있거나 '화'가 포함됨 + 내부에 .md 파일이 존재함
    const mdFiles = items.filter((f) => !f.isDirectory() && f.name.endsWith('.md'))
    const isChapterFolder = dirName.match(/^(\d+)화_/) || dirName.toLowerCase().includes('chapter')

    if (mdFiles.length > 0 || isChapterFolder) {
      // 씬 파일 파싱 시도
      const scenes = parseScenes(dirPath, mdFiles)

      // 유효한 씬이 하나라도 있으면 이 폴더를 '챕터'로 인정
      if (scenes.length > 0 || isChapterFolder) {
        const numMatch = dirName.match(/(\d+)/)
        chapters.push({
          id: dirPath,
          chapterNumber: numMatch ? parseInt(numMatch[0]) : 999, // 숫자 없으면 기타 취급
          title: dirName,
          scenes: scenes
        })
      }
    }

    // 3. 하위 폴더로 재귀 진입
    const subDirs = items.filter((d) => d.isDirectory())
    for (const subDir of subDirs) {
      const subResults = recursiveScan(join(dirPath, subDir.name), depth + 1)
      chapters = chapters.concat(subResults)
    }
  } catch (err) {
    // 권한 문제 등으로 못 읽는 폴더는 조용히 패스
  }

  return chapters
}

// --------------------------------------------------------------------------
// 📄 씬 파싱 로직 (파일명/내용 분석)
// --------------------------------------------------------------------------
function parseScenes(dirPath: string, files: fs.Dirent[]) {
  return files
    .map((file) => {
      try {
        const filePath = join(dirPath, file.name)
        const content = fs.readFileSync(filePath, 'utf-8')
        const { data, content: body } = matter(content)

        // [판별 1] 파일명에 'SCENE'이 있는가? (가장 강력한 힌트)
        const nameMatch = file.name.match(/SCENE\s*[-_]?\s*(\d+)/i)

        // [판별 2] Front-matter에 type: scene이 있는가?
        const isSceneType = data.type === 'scene'

        // 둘 다 아니면 씬 아님 -> 무시 (위키 문서 등이 섞여 들어가는 것 방지)
        if (!nameMatch && !isSceneType) return null

        const sceneNum = nameMatch ? parseInt(nameMatch[1]) : data.scene || 999

        return {
          id: filePath,
          fileName: file.name,
          sceneNumber: sceneNum,
          title: data.title || file.name.replace('.md', ''),
          summary: data.summary || body.slice(0, 100).replace(/[#*]/g, '').trim() + '...',
          characters: data.characters || [],
          isScripted: body.trim().length > 50
        }
      } catch (e) {
        return null
      }
    })
    .filter(Boolean) // null 제거
    .sort((a: any, b: any) => a.sceneNumber - b.sceneNumber)
}
