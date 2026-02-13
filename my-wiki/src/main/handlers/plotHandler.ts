import { ipcMain, shell } from 'electron'
import fs from 'fs-extra'
import { join, basename, dirname } from 'path'
import matter from 'gray-matter'

export function setupPlotHandlers(store: any): void {
  ipcMain.handle('get-plot-data', async () => {
    const vaultPath = store.get('vaultPath') as string
    if (!vaultPath) return []

    const plotBasePath = join(vaultPath, '10_Plot')

    try {
      await fs.ensureDir(plotBasePath)
      const rootItems = fs.readdirSync(plotBasePath, { withFileTypes: true })
      const actsMap = new Map<string, any>()

      rootItems.forEach((dir) => {
        if (!dir.isDirectory()) return

        const fullPath = join(plotBasePath, dir.name)
        const nameMatch = dir.name.match(/^(\d+)막_(.+)/) // "1막_제목" 패턴 파싱

        actsMap.set(fullPath, {
          id: fullPath,
          path: fullPath,
          actNumber: nameMatch ? parseInt(nameMatch[1]) : 999,
          title: dir.name,
          chapters: []
        })
      })

      const allChapters = recursiveScan(plotBasePath)

      // 3. 챕터를 해당하는 막(Act)에 분배
      allChapters.forEach((chapter) => {
        // 챕터의 부모 폴더 경로 (= 막 경로)
        const parentPath = join(chapter.id, '..') // path.dirname(chapter.id)와 동일

        // 해당 막이 맵에 존재하면 챕터 추가
        if (actsMap.has(parentPath)) {
          actsMap.get(parentPath).chapters.push(chapter)
        }
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
    if (!vaultPath) return null
    try {
      const plotDir = join(vaultPath, '10_Plot')
      await fs.ensureDir(plotDir) // 폴더가 없으면 생성

      const dirs = fs
        .readdirSync(plotDir)
        .filter((n) => fs.statSync(join(plotDir, n)).isDirectory())

      let max = 0
      dirs.forEach((d) => {
        const m = d.match(/^(\d+)막_/)
        if (m) max = Math.max(max, parseInt(m[1]))
      })
      const newPath = join(plotDir, `${max + 1}막_${title}`)
      await fs.ensureDir(newPath)
      return newPath
    } catch (e) {
      console.error(e)
      return null
    }
  })

  // 2. 챕터(Chapter) 생성
  ipcMain.handle('create-chapter', async (_, { actPath, title }) => {
    if (!fs.existsSync(actPath)) return null
    try {
      const dirs = fs
        .readdirSync(actPath)
        .filter((n) => fs.statSync(join(actPath, n)).isDirectory())
      let max = 0
      dirs.forEach((d) => {
        const m = d.match(/^(\d+)화_/)
        if (m) max = Math.max(max, parseInt(m[1]))
      })
      const newPath = join(actPath, `${max + 1}화_${title}`)
      await fs.ensureDir(newPath)
      return newPath
    } catch (e) {
      console.error(e)
      return null
    }
  })

  // 3. 씬(Scene) 생성
  ipcMain.handle('create-scene', async (_, { chapterPath, title }) => {
    if (!fs.existsSync(chapterPath)) return null
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
      const newPath = join(chapterPath, `SCENE-${next}.md`)
      await fs.writeFile(newPath, matter.stringify('', fm))
      return newPath
    } catch (e) {
      console.error(e)
      return null
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
      const newPath = join(dir, finalName)

      await fs.rename(path, newPath)
      
      // Sidecar rename
      const oldSidecar = path.replace(/\.md$/i, '.script.json')
      const newSidecar = newPath.replace(/\.md$/i, '.script.json')
      if (fs.existsSync(oldSidecar)) {
          await fs.rename(oldSidecar, newSidecar)
      }

      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })

  ipcMain.handle('update-scene', async (_, { path, content, data }) => {
    try {
      if (!fs.existsSync(path)) return { success: false, message: 'File not found' }

      // gray-matter로 stringify
      const fileContent = matter.stringify(content, data)
      await fs.writeFile(path, fileContent, 'utf-8')

      return { success: true }
    } catch (err: any) {
      console.error('Update Scene failed:', err)
      return { success: false, message: err.message }
    }
  })

  // 5. 삭제 (휴지통 이동) - Sidecar 파일도 함께 삭제
  ipcMain.handle('delete-item', async (_, path) => {
    try {
      await shell.trashItem(path)
      
      // Sidecar 삭제 (script.json)
      const sidecarPath = path.replace(/\.md$/i, '.script.json')
      if (fs.existsSync(sidecarPath)) {
          await shell.trashItem(sidecarPath)
      }
      
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  })
  
  // [NEW] Script Analysis Sidecar Handling
  ipcMain.handle('save-script-analysis', async (_, { path, data }) => {
      try {
          if (!path) return { success: false, message: 'Invalid path' }
          const sidecarPath = path.replace(/\.md$/i, '.script.json')
          await fs.writeJSON(sidecarPath, data, { spaces: 2 })
          return { success: true }
      } catch (err: any) {
          console.error('Save Script Analysis failed:', err)
          return { success: false, message: err.message }
      }
  })

  ipcMain.handle('load-script-analysis', async (_, path) => {
      try {
          if (!path) return null
          const sidecarPath = path.replace(/\.md$/i, '.script.json')
          if (!fs.existsSync(sidecarPath)) return null
          const data = await fs.readJSON(sidecarPath)
          return data
      } catch (err) {
          return null
      }
  })

  // 7. Get Recursive File Tree (for Work Directory)
  ipcMain.handle('get-directory-tree', async (_, dirPath) => {
      try {
          if (!fs.existsSync(dirPath)) return null
          
          const buildTree = (currentPath: string): any => {
              const name = basename(currentPath)
              const stat = fs.statSync(currentPath)
              
              if (!stat.isDirectory()) {
                  return {
                      id: currentPath,
                      title: name,
                      type: 'file',
                      isFolder: false
                  }
              }

              const children = fs.readdirSync(currentPath)
                  .map(child => buildTree(join(currentPath, child)))
                  .sort((a, b) => {
                      // Sort folders first, then files
                      if (a.isFolder === b.isFolder) return a.title.localeCompare(b.title)
                      return a.isFolder ? -1 : 1
                  })

              return {
                  id: currentPath,
                  title: name,
                  type: 'plot', // generic type
                  isFolder: true,
                  children
              }
          }

          return buildTree(dirPath)
      } catch (e) {
          console.error(e)
          return null
      }
  })

  // 6. Generic File System Operations for Sandbox
  ipcMain.handle('create-directory', async (_, path) => {
      try {
          await fs.ensureDir(path)
          return true
      } catch (e) {
          console.error(e)
          return false
      }
  })

  ipcMain.handle('create-file', async (_, { path, content }) => {
    try {
        if (fs.existsSync(path)) return false
        await fs.writeFile(path, content || '')
        return true
    } catch (e) {
        console.error(e)
        return false
    }
  })

  ipcMain.handle('rename-file', async (_, { path, newName }) => {
      try {
          if (!fs.existsSync(path)) return false
          const dir = dirname(path)
          const newPath = join(dir, newName)
          await fs.rename(path, newPath)
          return true
      } catch (e) {
          console.error(e)
          return false
      }
  })

  ipcMain.handle('read-file', async (_, path) => {
      try {
          if (!fs.existsSync(path)) return null
          return fs.readFileSync(path, 'utf-8')
      } catch (e) {
          console.error(e)
          return null
      }
  })

  ipcMain.handle('save-file', async (_, { path, content }) => {
      try {
          await fs.writeFile(path, content, 'utf-8')
          return true
      } catch (e) {
          console.error(e)
          return false
      }
  })

  ipcMain.handle('get-timeline-flat', async () => {
    const vaultPath = store.get('vaultPath') as string
    if (!vaultPath) return []
    const plotBasePath = join(vaultPath, '10_Plot')

    // 기존 스캔 로직 재사용
    const allChapters = recursiveScan(plotBasePath)

    // 모든 챕터 내의 씬들을 꺼내서 하나의 배열로 합침
    const allScenes = allChapters.flatMap((chapter) =>
      chapter.scenes.map((scene: any) => ({
        ...scene,
        chapterTitle: chapter.title, // 소속 챕터 정보 주입
        chapterNumber: scene.chapterNumber ?? chapter.chapterNumber ?? 1
      }))
    )

    const timelineScenes = allScenes.filter((scene) => scene.delta !== null)

    return timelineScenes.sort((a, b) => {
      if (a.chapterNumber !== b.chapterNumber) {
        return a.chapterNumber - b.chapterNumber
      }
      return a.sceneNumber - b.sceneNumber
    })
  })
  // [NEW] Mention Tracking
  ipcMain.handle('search-wiki-mentions', async (_, keywords: string[]) => {
      const vaultPath = store.get('vaultPath') as string
      if (!vaultPath || !keywords || keywords.length === 0) return []

      const plotBasePath = join(vaultPath, '10_Plot')
      
      // 1. Get all scenes
      // We can reuse the existing recursiveScan logic to get file paths
      // This might need optimization later (indexing), but for now standard scan is fine
      // Note: recursiveScan returns Acts/Chapter/Scene structure or just chapters?
      // recursiveScan returns Chapters arrays (possibly nested in subdirs but flattened structure in scanning)
      // Actually recursiveScan returns array of "Chapters".
      const allChapters = recursiveScan(plotBasePath)
      
      const results: any[] = []

      // Escape regex special characters
      const escapedKeywords = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi')

      // 2. Iterate and Scan
      // Flatten scenes first
      for (const chapter of allChapters) {
           // Skip if no scenes
           if (!chapter.scenes || !Array.isArray(chapter.scenes)) continue;
           
           for (const scene of chapter.scenes) {
               try {
                   // Reset Regex for new file!
                   regex.lastIndex = 0;
                   
                   const content = await fs.readFile(scene.id, 'utf-8')
                   const { content: body } = matter(content)
                   
                   const matches: any[] = []
                   let match;
                   
                   // Find all matches
                   while ((match = regex.exec(body)) !== null) {
                       const index = match.index
                       const keyword = match[0]
                       
                       // Extract Context (KWIC)
                       const padding = 40
                       /* 
                          Use slice to avoid index out of bounds issues gracefully 
                          (substring handles swap but slice is more predictable for negative start)
                          Actually substring is fine: substring(indexA, indexB). 
                          If indexA < 0, it treats as 0. 
                       */
                       const start = Math.max(0, index - padding)
                       // Limit max length to prevent huge strings if padding goes over
                       const end = Math.min(body.length, index + keyword.length + padding)
                       
                       let context = body.substring(start, end)
                       
                       // Mark the keyword position relative to context? 
                       // Frontend can highlight based on keyword text match.
                       
                       // Clean up newlines for "one-liner" look
                       context = context.replace(/[\r\n]+/g, ' ')
                       
                       if (start > 0) context = '...' + context
                       if (end < body.length) context = context + '...'

                       matches.push({
                           keyword,
                           context,
                           index
                       })
                   }

                   if (matches.length > 0) {
                       results.push({
                           sceneId: scene.id,
                           sceneTitle: scene.title,
                           chapterNumber: chapter.chapterNumber, // Extracted from recursiveScan
                           sceneNumber: scene.sceneNumber,
                           chapterTitle: chapter.title,
                           matches
                       })
                   }
               } catch (e) {
                   console.error(`Error reading scene ${scene.id}`, e)
               }
           }
      }

      return results.sort((a,b) => {
          if (a.chapterNumber !== b.chapterNumber) return a.chapterNumber - b.chapterNumber
          return a.sceneNumber - b.sceneNumber
      })
  })

  // [NEW] Get Previous Scenes Context
  ipcMain.handle('get-previous-scenes', async (_, { chapter, scene, count }) => {
    const vaultPath = store.get('vaultPath') as string
    console.log('[PlotHandler] get-previous-scenes Request:', { chapter, scene, count, vaultPath })
    
    if (!vaultPath) {
        console.error('[PlotHandler] Vault Path Missing!')
        return []
    }
    const plotBasePath = join(vaultPath, '10_Plot')
    if (!fs.existsSync(plotBasePath)) {
        console.error('[PlotHandler] Plot Base Path not found:', plotBasePath)
        return []
    }

    // 1. Get all scenes flattened
    const allChapters = recursiveScan(plotBasePath)
    const allScenes = allChapters.flatMap(c => c.scenes.map(s => ({
        ...s, 
        chapterNumber: c.chapterNumber ?? 999 
    })))
    
    // 2. Sort global timeline
    allScenes.sort((a, b) => {
        if (a.chapterNumber !== b.chapterNumber) return a.chapterNumber - b.chapterNumber
        return a.sceneNumber - b.sceneNumber
    })

    console.log('[PlotHandler] Total Scenes Found:', allScenes.length)
    if (allScenes.length > 0) {
        console.log('[PlotHandler] Sample:', allScenes[0].chapterNumber, allScenes[0].sceneNumber)
        console.log('[PlotHandler] Last:', allScenes[allScenes.length - 1].chapterNumber, allScenes[allScenes.length - 1].sceneNumber)
    }

    const targetChapter = typeof chapter === 'string' ? parseInt(chapter) : chapter
    const targetScene = typeof scene === 'string' ? parseInt(scene) : scene

    // 3. Filter scenes BEFORE the current target
    const previousScenes = allScenes.filter(s => {
        if (s.chapterNumber < targetChapter) return true
        if (s.chapterNumber === targetChapter && s.sceneNumber < targetScene) return true
        return false
    })

    console.log('[PlotHandler] Previous Scenes Filtered:', previousScenes.length) // How many are strictly previous?

    // 4. Take last N scenes
    const selected = previousScenes.slice(-Math.min(count, 10)) // Max 10 safety
    console.log('[PlotHandler] Selected:', selected.length)
    
    // 5. Read full content
    const results = selected.map(s => {
        try {
             // Re-read file to be sure we have latest content (although recursiveScan parses some)
             // recursiveScan 'summary' logic truncates. We need FULL content.
             const content = fs.readFileSync(s.id, 'utf-8')
             const { content: body } = matter(content)
             return {
                 path: s.id,
                 fileName: basename(s.id),
                 title: s.title,
                 content: body,
                 chapter: s.chapterNumber,
                 scene: s.sceneNumber
             }
        } catch(e) { 
             console.error('[PlotHandler] Read Failed:', e)
             return null 
        }
    }).filter(Boolean)

    console.log('[PlotHandler] Final Results:', results.length)
    return results
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
          chapterNumber: data.chapter,
          title: data.title || file.name.replace('.md', ''),
          summary: data.summary || body.slice(0, 100).replace(/[#*]/g, '').trim() + '...',
          characters: data.characters || [],
          delta: data['wiki-data'] || null,
          isScripted: body.trim().length > 50
        }
      } catch (e) {
        return null
      }
    })
    .filter(Boolean) // null 제거
    .sort((a: any, b: any) => a.sceneNumber - b.sceneNumber)
}
