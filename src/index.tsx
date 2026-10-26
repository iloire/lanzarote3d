import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import WebGL from './WebGL';
import App from './app';
import { initDevMode, isDevModeEnabled } from './devMode';
import { logger } from './foundation/utils/logger';

import './index.css';

THREE.Cache.enabled = true;

/**
 * Extract story name from URL
 * - From query parameter: ?story=boats-animation
 * - From HTML path: /boats-animation.html -> boats-animation
 * - From root path or index: home
 * - Default: home
 */
function getStoryName(): string {
  const params = new URLSearchParams(window.location.search);
  const queryStory = params.get('story');

  if (queryStory) return queryStory;

  const currentPath = window.location.pathname;

  // Extract from HTML filename
  const pathMatch = currentPath.match(/\/([^/]+)\.html$/);
  if (pathMatch) {
    const filename = pathMatch[1];
    // index.html should map to home app
    if (filename === 'index') return 'home';
    return filename;
  }

  // Root path or index.html -> default
  if (currentPath === '/' || currentPath === '/index.html') {
    return 'home';
  }

  // Fallback
  return 'home';
}

// Initialize the app
const storyName = getStoryName();
initDevMode();
const isDevMode = isDevModeEnabled();

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
  logger.info(`${storyName} story started`);
} else if (rootElement) {
  const warning = WebGL.getWebGLErrorMessage();
  rootElement.appendChild(warning);
  logger.error('WebGL not available, falling back to error message');
} else {
  logger.error('Root element not found');
}

// Export empty object to satisfy webpack
export default {};
