
// Mock implementation for Web (Vercel) environment
// This polyfills the Electron IPC API for the static web build.

export const webWikiService = {
  // 1. Get Wiki Data (from generated JSON)
  getWikiData: async () => {
    try {
      console.log('[Web API] Fetching Wiki Data...');
      const response = await fetch(`/data/wiki.json?t=${Date.now()}`);
      if (!response.ok) {
        const msg = `Wiki Data Fetch Failed: ${response.status} ${response.statusText}`;
        console.error(msg);
        alert(msg + "\nMake sure 'npm run generate-data' was run and 'public/data/wiki.json' exists.");
        throw new Error(msg);
      }
      const data = await response.json();
      console.log(`[Web API] Loaded ${data.length} wiki entries.`);
      return data;
    } catch (e: any) {
      console.error('[Web API] Error loading wiki data:', e);
      // alert(`[Web Error] ${e.message}`); // Optional: Uncomment if console is not available
      return [];
    }
  },

  // 2. Get Plot Data (from generated JSON)
  getTimelineFlat: async () => {
    try {
      console.log('[Web API] Fetching Plot Data...');
      const response = await fetch('/data/plot.json');
      if (!response.ok) throw new Error(`Plot Data Fetch Failed: ${response.status}`);
      const data = await response.json();
      console.log(`[Web API] Loaded ${data.length} scenes.`);
      return data;
    } catch (e) {
      console.error('[Web API] Error loading plot data:', e);
      return [];
    }
  },

  // 3. Get Scene Detail (Fetch actual MD file)
  getSceneDetail: async (scenePath: string) => {
    // scenePath coming from plot.json is relative to public root, e.g. "NovelBibleWiki/..."
    // We need to fetch it.
    try {
      // Ensure path starts with / if not already
      const url = scenePath.startsWith('/') ? scenePath : `/${scenePath}`;
      console.log(`[Web API] Fetching Scene Detail: ${url}`);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Scene Fetch Failed');
      
      const text = await response.text();
      
      // Basic Frontmatter Parser (Reader-only)
      const fmRegex = /^---\n([\s\S]*?)\n---/;
      const match = text.match(fmRegex);
      
      let frontmatter: any = {};
      let content = text;
      
      if (match) {
        content = text.replace(match[0], '').trim();
        const yamlBlock = match[1];
        
        // Very basic YAML parser for key-value pairs
        yamlBlock.split('\n').forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            let val = parts.slice(1).join(':').trim();
            
            // Handle basic arrays [a, b]
            if (val.startsWith('[') && val.endsWith(']')) {
               val = val.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^['"]|['"]$/g, '')) as any;
            }
            // Handle booleans/numbers
            if (val === 'true') val = true as any;
            if (val === 'false') val = false as any;
            if (!isNaN(Number(val))) val = Number(val) as any;
            
            frontmatter[key] = val;
          }
        });
      }
      
      return {
        frontmatter,
        content,
        stats: { mtime: new Date().toISOString() }
      };

    } catch (e) {
      console.error('[Web API] Error reading scene:', e);
      return null;
    }
  },

  // --- Stubs for Unsupported Write/AI Operations ---
  
  saveWikiEntry: async () => { console.warn('Write not supported in Web'); return { success: false }; },
  createWikiEntry: async () => { console.warn('Write not supported in Web'); return { success: false }; },
  deleteWikiEntry: async () => { console.warn('Write not supported in Web'); return { success: false }; },
  updateScene: async () => { console.warn('Write not supported in Web'); return { success: false }; },
  
  saveAIKey: async () => ({ success: false }),
  getAIKey: async () => null,
  analyzeScene: async () => ({ success: false, message: 'AI Analysis requires backend API' }),
  analyzeScript: async () => ({ success: false, message: 'AI Analysis requires backend API' }),
  
  saveScriptAnalysis: async () => ({ success: false }),
  loadScriptAnalysis: async () => null,
  
  searchWikiMentions: async () => [],
  selectMultipleFiles: async () => [],
  updateCharacter: async () => ({ success: false }),
  
  saveAISchema: async () => ({ success: false }),
  getAISchema: async () => ({}), // Return empty schema
  saveAIInstructions: async () => ({ success: false }),
  getAIInstructions: async () => '',
  resetAISettings: async () => ({ success: false }),
  
  saveFieldConfig: async () => ({ success: false }),
  saveSceneFieldConfig: async () => ({ success: false }),
  saveCharacterFieldConfig: async () => ({ success: false }),
  getFieldConfig: async () => ({ scene: [], character: [] }),
  
  getProjects: async () => [],
  selectProject: async () => ({ success: false }),
  getCurrentProject: async () => ({ path: 'Web Demo' }),
  createAct: async () => null,
  createChapter: async () => null,
  createScene: async () => null,
  renameItem: async () => ({ success: false }),
  deleteItem: async () => ({ success: false }),
  selectFolder: async () => null,
  importVault: async () => null,
  selectImage: async () => null,
  selectWorkspace: async () => null,
  getPlotData: async () => [] // Legacy?
};
