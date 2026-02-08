const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// ==========================================
// CONFIGURATION
// ==========================================
// Adjust this to match your folder structure
const PUBLIC_ROOT = path.join(__dirname, '../public');
const PROJECT_ROOT = path.join(PUBLIC_ROOT, 'NovelBibleWiki/EX급 귀환자'); // Main Project Folder
const DIST_DIR = path.join(PUBLIC_ROOT, 'data');   // Output JSON location

// Wiki Type Mapping
const WIKI_TYPE_MAP = {
  '1.Characters': 'character',
  '2. 세력 및 단체': 'faction',
  '기술 및 아이템': 'item',
  '장소': 'location',
  '몬스터': 'monster',
  '세계 시스템': 'system',
  '상징': 'symbol'
};

// Ensure output directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// ==========================================
// 1. GENERATE WIKI DATA (wiki.json)
// ==========================================
function generateWikiData() {
  console.log('Generating Wiki Data...');
  const wikiDir = path.join(PROJECT_ROOT, '20_Wiki');
  const results = [];

  if (!fs.existsSync(wikiDir)) {
    console.warn(`Wiki directory not found: ${wikiDir}`);
    return [];
  }

  // Helper to scan directory safely
  function scanDir(dir, type) {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
         // Recursive scan if needed, or map folder name to type
         // If "1.Characters" is passed as type, we use mapped type.
         // If inside "1.Characters", we keep type as 'character'
         const nextType = WIKI_TYPE_MAP[item.name] || type || 'other';
         scanDir(fullPath, nextType);
      } else if (item.name.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const { data, content: body } = matter(content);

          // Construct Entry
          // ID must be relative path from 'public/' for fetching, or just the ID used in app.
          // App uses absolute path usually, but on web we need something unique.
          // Let's use the file path relative to 'public'.
          const relativePath = path.relative(PUBLIC_ROOT, fullPath).replace(/\\/g, '/');

          const entry = {
            id: relativePath, // Used as ID on web
            name: data.name || item.name.replace('.md', ''),
            type: data.type || type || 'other',
            image: data.image || null, // Ensure this is relative path
            tags: data.tags || [],
            content: body,
            // Wiki specific fields (Character, etc.)
            info: {
               // Character
               role: data.role,
               grade: data.grade,
               status: data.status,
               alias: data.alias,
               relations: data.relations,
               // Item
               category: data.category,
               rank: data.rank,
               // Location
               region: data.region,
               // Faction
               leader: data.leader,
               ...data // Spread rest
            }
          };

          results.push(entry);
        } catch (e) {
          console.error(`Error parsing ${item.name}:`, e.message);
        }
      }
    }
  }

  // Start Scan
  // We scan subdirectories of 20_Wiki
  const roots = fs.readdirSync(wikiDir, { withFileTypes: true });
  for (const root of roots) {
    if (root.isDirectory()) {
      const type = WIKI_TYPE_MAP[root.name] || 'other';
      scanDir(path.join(wikiDir, root.name), type);
    }
  }

  console.log(`Wiki Entries Found: ${results.length}`);
  fs.writeFileSync(path.join(DIST_DIR, 'wiki.json'), JSON.stringify(results, null, 2));
}

// ==========================================
// 2. GENERATE PLOT DATA (plot.json)
// ==========================================
function generatePlotData() {
  console.log('Generating Plot Data...');
  const plotDir = path.join(PROJECT_ROOT, '10_Plot');
  
  if (!fs.existsSync(plotDir)) {
      console.warn(`Plot directory not found: ${plotDir}`);
      return [];
  }

  let allChapters = [];

  // Recursive Scan Function (matches plotHandler.ts logic)
  function recursiveScan(dirPath, depth = 0) {
    if (depth > 7) return [];
    
    const dirName = path.basename(dirPath);
    if (dirName.startsWith('.') || dirName === 'node_modules') return [];
    
    let chapters = [];
    
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      const mdFiles = items.filter(f => !f.isDirectory() && f.name.endsWith('.md'));
      
      // Check if current folder is a Chapter
      const isChapterFolder = dirName.match(/^(\d+)화_/) || dirName.toLowerCase().includes('chapter');
      // Or matches pattern: contains scene files
      
      const scenes = [];
      
      // Parse Scenes if md files exist
      if (mdFiles.length > 0) {
          for (const file of mdFiles) {
              const filePath = path.join(dirPath, file.name);
              const content = fs.readFileSync(filePath, 'utf-8');
              const { data, content: body } = matter(content);
              
              const nameMatch = file.name.match(/SCENE\s*[-_]?\s*(\d+)/i);
              const isSceneType = data.type === 'scene';
              
              if (nameMatch || isSceneType) {
                  const sceneNum = nameMatch ? parseInt(nameMatch[1]) : (data.scene || 999);
                  const relativePath = path.relative(PUBLIC_ROOT, filePath).replace(/\\/g, '/');

                  scenes.push({
                      id: relativePath,
                      fileName: file.name,
                      sceneNumber: sceneNum,
                      // We will fill chapterTitle/Number later in flatMap
                      title: data.title || file.name.replace('.md', ''),
                      summary: data.summary || body.slice(0, 100).trim(),
                      characters: data.characters || [],
                      delta: data['wiki-data'] || null,
                      isScripted: body.trim().length > 50,
                  });
              }
          }
      }
      
      if (scenes.length > 0 || isChapterFolder) {
          const numMatch = dirName.match(/(\d+)/);
          chapters.push({
              path: dirPath,
              chapterNumber: numMatch ? parseInt(numMatch[0]) : 999,
              title: dirName,
              scenes: scenes.sort((a, b) => a.sceneNumber - b.sceneNumber)
          });
      }
      
      // Recurse
      const subDirs = items.filter(d => d.isDirectory());
      for (const sub of subDirs) {
          chapters = chapters.concat(recursiveScan(path.join(dirPath, sub.name), depth + 1));
      }
      
    } catch (e) {
        console.error(`Error scanning ${dirPath}:`, e.message);
    }
    
    return chapters;
  }

  // 1. Scan
  allChapters = recursiveScan(plotDir);
  
  // 2. Flatten (simulating getTimelineFlat)
  const allScenes = allChapters.flatMap(chapter => {
      return chapter.scenes.map(scene => ({
          ...scene,
          chapterTitle: chapter.title,
          chapterNumber: scene.chapterNumber ?? chapter.chapterNumber ?? 1
      }));
  });
  
  // 3. Filter valid scenes (with delta/wiki-data? The original code filtered delta!==null, 
  // but for browsing access we might want all scenes. 
  // The PlotDashboard needs all scenes. The original 'getTimelineFlat' filtered?
  // Let's re-read plotHandler.ts:
  // "const timelineScenes = allScenes.filter((scene) => scene.delta !== null)" 
  // Wait, if it strictly filters for delta !== null, scenes without analysis won't show.
  // But maybe that's intended for the "Timeline" view. 
  // However, PlotDashboard usually shows cards. 
  // Let's assume we want ALL scenes for the web "Reader" view.
  // I will INCLUDE all scenes for now.
  
  const finalScenes = allScenes.sort((a, b) => {
      if (a.chapterNumber !== b.chapterNumber) return a.chapterNumber - b.chapterNumber;
      return a.sceneNumber - b.sceneNumber;
  });

  console.log(`Scenes Found: ${finalScenes.length}`);
  fs.writeFileSync(path.join(DIST_DIR, 'plot.json'), JSON.stringify(finalScenes, null, 2));
}

// RUN
try {
  generateWikiData();
  generatePlotData();
  console.log('✅ Data generation complete!');
} catch (e) {
  console.error('❌ Data generation failed:', e);
  process.exit(1);
}
