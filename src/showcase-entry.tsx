import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import WebGL from './WebGL';
import App from './app';
import { logger } from './foundation/utils/logger';

import './index.css';

THREE.Cache.enabled = true;

// Get the story name from URL query params or bundle filename
const params = new URLSearchParams(window.location.search);
const queryStory = params.get('story');

const scriptTag = document.currentScript as HTMLScriptElement;
const bundleName = scriptTag?.src.match(/([^/]+)\.bundle\.js$/)?.[1] || 'animation';

// Priority: query parameter > bundle name > default
const storyName = queryStory || bundleName || 'animation';

// Enable dev menus on localhost
const isLocalhost =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const rootElement = document.getElementById('root');
if (rootElement && WebGL.isWebGLAvailable()) {
  const root = createRoot(rootElement);
  root.render(
    <App
      showAppSelection={true}
      showPublic={true}
      showDev={isLocalhost}
      showPrivate={isLocalhost}
      initialStory={storyName}
    />
  );
  console.log(
    `Loading story: "${storyName}" (query: ${queryStory || 'none'}, bundle: ${bundleName}, script src: ${scriptTag?.src})`
  );
  logger.info(`${storyName} story started (query: ${queryStory || 'none'}, bundle: ${bundleName})`);
} else if (rootElement) {
  const warning = WebGL.getWebGLErrorMessage();
  rootElement.appendChild(warning);
  logger.error('WebGL not available, falling back to error message');
} else {
  logger.error('Root element not found');
}

// Export empty object to satisfy webpack
export default {};
