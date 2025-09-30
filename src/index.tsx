import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import WebGL from './WebGL';
import App from './app';
import { logger } from './foundation/utils/logger';

import './index.css';

// Extend Window interface for dev mode functions
declare global {
  interface Window {
    enableDevMode?: () => void;
    disableDevMode?: () => void;
  }
}

THREE.Cache.enabled = true;

/**
 * Extract story name from URL
 * - From query parameter: ?story=boats-animation
 * - From HTML path: /boats-animation.html -> boats-animation
 * - From root path or index: famara-animation
 * - Default: famara-animation
 */
function getStoryName(): string {
  const params = new URLSearchParams(window.location.search);
  const queryStory = params.get('story');

  if (queryStory) return queryStory;

  const currentPath = window.location.pathname;

  // Extract from HTML filename
  const pathMatch = currentPath.match(/\/([^/]+)\.html$/);
  if (pathMatch) return pathMatch[1];

  // Root path or index.html -> default
  if (currentPath === '/' || currentPath === '/index.html') {
    return 'famara-animation';
  }

  // Fallback
  return 'famara-animation';
}

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
function isDevModeEnabled(): boolean {
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const hasSecretDevMode = localStorage.getItem('lanzarote_dev_mode') === 'true';

  if (hasSecretDevMode && !isLocalhost) {
    console.log('🔓 Secret dev mode enabled');
  }

  // Expose global helper functions for dev mode control (only in production)
  if (!isLocalhost) {
    window.enableDevMode = () => {
      localStorage.setItem('lanzarote_dev_mode', 'true');
      console.log('🔓 Dev mode enabled. Reload the page to activate.');
    };
    window.disableDevMode = () => {
      localStorage.removeItem('lanzarote_dev_mode');
      console.log('🔒 Dev mode disabled. Reload the page to deactivate.');
    };
  }

  return isLocalhost || hasSecretDevMode;
}

// Initialize the app
const storyName = getStoryName();
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
