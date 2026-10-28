import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import WebGL from './WebGL';
import App from './app';
import { initDevMode, isDevModeEnabled } from './devMode';
import { SITE, SITE_HOME } from './config/site';
import { logger } from './foundation/utils/logger';

import './index.css';

THREE.Cache.enabled = true;

/**
 * Extract story name from URL
 * - From query parameter: ?story=boats-animation
 * - From HTML path: /boats-animation.html -> boats-animation
 * - Anything else (/, /index.html): the site's home (home, or relax on the relax site)
 */
function getStoryName(): string {
  const queryStory = new URLSearchParams(window.location.search).get('story');
  if (queryStory) return queryStory;

  const filename = window.location.pathname.match(/\/([^/]+)\.html$/)?.[1];
  return filename && filename !== 'index' ? filename : SITE_HOME[SITE];
}

// Initialize the app
const storyName = getStoryName();
initDevMode();

const rootElement = document.getElementById('root');
if (rootElement && WebGL.isWebGLAvailable()) {
  const root = createRoot(rootElement);
  root.render(
    <App
      showAppSelection={SITE === 'lanzarote'}
      showPrivate={isDevModeEnabled()}
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
