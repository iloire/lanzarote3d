import React from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import WebGL from "./WebGL";
import App from "./app";
import { logger } from "./utils/logger";

import "./index.css";

THREE.Cache.enabled = true;

// Get the story name from the filename
const scriptTag = document.currentScript as HTMLScriptElement;
const bundleName = scriptTag?.src.match(/([^\/]+)\.bundle\.js$/)?.[1] || 'animation';

// Map bundle names to story names
const bundleToStoryMap: Record<string, string> = {
  'main': 'animation',
  'flyzones': 'flyzones',
  'game': 'game'
};

const storyName = bundleToStoryMap[bundleName] || 'animation';

const rootElement = document.getElementById("root");
if (rootElement && WebGL.isWebGLAvailable()) {
  const root = createRoot(rootElement);
  root.render(<App showAppSelection={true} showPublic={true} showDev={false} showExperiments={false} initialStory={storyName} />);
  logger.info(`${storyName} story started from ${bundleName} bundle`);
} else if (rootElement) {
  const warning = WebGL.getWebGLErrorMessage();
  rootElement.appendChild(warning);
  logger.error('WebGL not available, falling back to error message');
} else {
  logger.error('Root element not found');
}