import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import WebGL from './WebGL';
import App from './app';
import { logger } from './foundation/utils/logger';

import './index.css';

THREE.Cache.enabled = true;

// Get the story name from URL query params or current HTML page path
const params = new URLSearchParams(window.location.search);
const queryStory = params.get('story');

// Extract route from current page path (e.g., "/boats-animation.html" -> "boats-animation")
const currentPath = window.location.pathname;
const pathStory = currentPath.match(/\/([^/]+)\.html$/)?.[1] ||
                 (currentPath === '/' ? 'famara-animation' : null);

// Priority: query parameter > page path > default
const storyName = queryStory || pathStory || 'famara-animation';

/**
 * Dev Mode Control
 *
 * Dev mode shows private/hidden apps and dev tools in the app selection menu.
 * - Automatically enabled on localhost
 * - Can be enabled in production using localStorage
 *
 * To enable in production, open browser console and run:
 *   enableDevMode()
 *
 * To disable:
 *   disableDevMode()
 *
 * Or manually:
 *   localStorage.setItem('lanzarote_dev_mode', 'true')
 *   localStorage.removeItem('lanzarote_dev_mode')
 */
const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const hasSecretDevMode = localStorage.getItem('lanzarote_dev_mode') === 'true';
const isDevMode = isLocalhost || hasSecretDevMode;

// Log dev mode status (quietly in production)
if (hasSecretDevMode && !isLocalhost) {
  console.log('🔓 Secret dev mode enabled');
}

// Expose global helper functions for dev mode control (only in production)
if (!isLocalhost) {
  (window as any).enableDevMode = () => {
    localStorage.setItem('lanzarote_dev_mode', 'true');
    console.log('🔓 Dev mode enabled. Reload the page to activate.');
  };
  (window as any).disableDevMode = () => {
    localStorage.removeItem('lanzarote_dev_mode');
    console.log('🔒 Dev mode disabled. Reload the page to deactivate.');
  };
}

const rootElement = document.getElementById('root');
if (rootElement && WebGL.isWebGLAvailable()) {
  const root = createRoot(rootElement);
  root.render(
    <App
      showAppSelection={true}
      showPublic={true}
      showDev={isDevMode}
      showPrivate={isDevMode}
      initialStory={storyName}
    />
  );
  console.log(
    `Loading story: "${storyName}" (query: ${queryStory || 'none'}, path: ${pathStory || 'default'})`
  );
  logger.info(`${storyName} story started (query: ${queryStory || 'none'}, path: ${pathStory || 'default'})`);
} else if (rootElement) {
  const warning = WebGL.getWebGLErrorMessage();
  rootElement.appendChild(warning);
  logger.error('WebGL not available, falling back to error message');
} else {
  logger.error('Root element not found');
}

// Export empty object to satisfy webpack
export default {};
