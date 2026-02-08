// @ts-nocheck
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { webWikiService } from './services/webWikiService'

// [WEB-COMPATIBILITY] Polyfill window.api for Vercel/Web deployment
if (!window.api && !window.electron) {
  console.log('Running in Web Mode - Injecting Mock API');
  
  // Create a Proxy to handle unimplemented methods gracefully
  window.api = new Proxy(webWikiService, {
    get: (target, prop) => {
      if (prop in target) {
        return target[prop];
      }
      // Return a dummy async function for missing methods
      return async () => {
        console.warn(`[Web API] Method '${String(prop)}' called but not implemented.`);
        return null;
      };
    }
  }) as any;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
