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

            // Fix Image Path for Web
            // Transform "./99_Assets/..." to "/NovelBibleWiki/EX급 귀환자/99_Assets/..."
            let imagePath = data.image;
            if (imagePath && typeof imagePath === 'string') {
                 if (imagePath.startsWith('./99_Assets')) {
                     imagePath = imagePath.replace('./99_Assets', '/NovelBibleWiki/EX급 귀환자/99_Assets');
                 } else if (imagePath.startsWith('99_Assets')) {
                     imagePath = '/NovelBibleWiki/EX급 귀환자/' + imagePath;
                 }
            }

            const entry = {
            id: relativePath, // Used as ID on web
            name: data.name || item.name.replace('.md', ''),
            type: data.type || type || 'other',
            image: imagePath || null, // Ensure this is relative path
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
// ==========================================
// 2. GENERATE PLOT DATA (plot.json & scenes.json)
// ==========================================
function generatePlotData() {
  console.log('Generating Plot Data (Hierarchical & Flat)...');
  const plotDir = path.join(PROJECT_ROOT, '10_Plot');
  
  if (!fs.existsSync(plotDir)) {
      console.warn(`Plot directory not found: ${plotDir}`);
      return;
  }

  // Helper to parse a Scene file
  function parseScene(filePath) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: body } = matter(content);
      const nameMatch = path.basename(filePath).match(/SCENE\s*[-_]?\s*(\d+)/i);
      
      const relativePath = path.relative(PUBLIC_ROOT, filePath).replace(/\\/g, '/');

      return {
          id: relativePath, // logical ID
          path: relativePath, // file path for opening
          title: data.title || path.basename(filePath).replace('.md', ''),
          sceneNumber: nameMatch ? parseInt(nameMatch[1]) : (data.scene || 999),
          summary: data.summary || body.slice(0, 100).trim(),
          characters: data.characters || [],
          // Web-specific: include raw stats/tags if needed
          isScripted: body.trim().length > 50,
          chapterPath: path.dirname(relativePath)
      };
  }

  // 1. Scan for Acts (Top-level directories)
  const rootItems = fs.readdirSync(plotDir, { withFileTypes: true });
  const acts = [];
  const uncategorizedChapters = [];

  // Sort items to ensure order
  rootItems.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  for (const item of rootItems) {
      if (item.isDirectory()) {
          // Check if it's an Act (e.g., "1막_...")
          const actMatch = item.name.match(/^(\d+)막_/);
          if (actMatch) {
              const actPath = path.join(plotDir, item.name);
              const actNumber = parseInt(actMatch[1]);
              
              // Scan Chapters within Act
              const chapterItems = fs.readdirSync(actPath, { withFileTypes: true });
              const chapters = [];
              
              chapterItems.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

              for (const cItem of chapterItems) {
                  if (cItem.isDirectory()) {
                      const chapterPath = path.join(actPath, cItem.name);
                      // Check if it's a Chapter (e.g., "1화_...")
                      const chapMatch = cItem.name.match(/^(\d+)화_/);
                      
                      // Scan Scenes within Chapter
                      const sceneItems = fs.readdirSync(chapterPath, { withFileTypes: true })
                          .filter(f => f.name.endsWith('.md'));
                      
                      sceneItems.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
                      
                      const scenes = sceneItems.map(s => parseScene(path.join(chapterPath, s.name)));

                      chapters.push({
                          id: path.relative(PUBLIC_ROOT, chapterPath).replace(/\\/g, '/'),
                          title: cItem.name,
                          chapterNumber: chapMatch ? parseInt(chapMatch[1]) : 999,
                          path: path.relative(PUBLIC_ROOT, chapterPath).replace(/\\/g, '/'),
                          scenes: scenes
                      });
                  }
              }

              acts.push({
                  id: path.relative(PUBLIC_ROOT, actPath).replace(/\\/g, '/'),
                  actNumber: actNumber,
                  title: item.name,
                  path: path.relative(PUBLIC_ROOT, actPath).replace(/\\/g, '/'),
                  chapters: chapters
              });

          } else {
              // It's a directory but likely a Chapter at root level (Uncategorized)
              // Logic similar to Chapter scanning above...
              // user might organize flatly. 
              // For now, let's treat root folders as loose columns if they have scenes.
              const chapterPath = path.join(plotDir, item.name);
               const sceneItems = fs.readdirSync(chapterPath, { withFileTypes: true })
                  .filter(f => f.name.endsWith('.md'));
              
              if (sceneItems.length > 0) {
                   const scenes = sceneItems.map(s => parseScene(path.join(chapterPath, s.name)));
                   uncategorizedChapters.push({
                      id: path.relative(PUBLIC_ROOT, chapterPath).replace(/\\/g, '/'),
                      title: item.name,
                      chapterNumber: 999,
                      path: path.relative(PUBLIC_ROOT, chapterPath).replace(/\\/g, '/'),
                      scenes: scenes
                   });
              }
          }
      }
  }

  // If there are uncategorized chapters, create a dummy Act
  if (uncategorizedChapters.length > 0) {
      acts.push({
          id: 'uncategorized',
          actNumber: 999,
          title: '미분류',
          path: '',
          chapters: uncategorizedChapters
      });
  }
  
  // Sort Acts
  acts.sort((a, b) => a.actNumber - b.actNumber);

  // 2. Generate Flat Scenes List (for Timeline/Board) from the hierarchical data
  const flatScenes = [];
  acts.forEach(act => {
      act.chapters.forEach(chapter => {
          chapter.scenes.forEach(scene => {
              flatScenes.push({
                  ...scene,
                  actTitle: act.title,
                  chapterTitle: chapter.title,
                  chapterNumber: chapter.chapterNumber
              });
          });
      });
  });

  console.log(`Acts Found: ${acts.length}`);
  console.log(`Total Scenes: ${flatScenes.length}`);

  // Write plot.json (Hierarchical for PlotDashboard)
  fs.writeFileSync(path.join(DIST_DIR, 'plot.json'), JSON.stringify(acts, null, 2));
  
  // Write scenes.json (Flat for Timeline - optional, but useful if we split logic)
  // note: webWikiService.getTimelineFlat currently fetches plot.json! 
  // We need to either:
  // A) Change webWikiService to fetch separate files
  // B) Keep plot.json as flat and use acts.json for PlotDashboard?
  //
  // Recommendation:
  // Use `acts.json` for PlotDashboard (hierarchical)
  // Use `plot.json` for general flattened usage (backward compat with current getTimelineFlat)
  
  fs.writeFileSync(path.join(DIST_DIR, 'acts.json'), JSON.stringify(acts, null, 2));
  fs.writeFileSync(path.join(DIST_DIR, 'plot.json'), JSON.stringify(flatScenes, null, 2)); // Restore flat structure to plot.json
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
