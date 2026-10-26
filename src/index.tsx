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
 * - Anything else (/, /index.html): home
 */
function getStoryName(): string {
  const queryStory = new URLSearchParams(window.location.search).get('story');
  if (queryStory) return queryStory;

  const filename = window.location.pathname.match(/\/([^/]+)\.html$/)?.[1];
  return filename && filename !== 'index' ? filename : 'home';
}

// Initialize the app
const storyName = getStoryName();
initDevMode();

const rootElement = document.getElementById('root');
if (rootElement && WebGL.isWebGLAvailable()) {
  const root = createRoot(rootElement);
  root.render(
    <App showAppSelection={true} showPrivate={isDevModeEnabled()} initialStory={storyName} />
  );
  logger.info(`${storyName} story started`);
} else if (rootElement) {
  const warning = WebGL.getWebGLErrorMessage();
  rootElement.appendChild(warning);
  logger.error('WebGL not available, falling back to error message');
} else {
  logger.error('Root element not found');
}
