import { StoryOptions } from './types';
import { APP_REGISTRY, getRouteToStoryMap, AppMetadata } from '../config/app-registry';

// Export specialized base classes
export { AppBase } from './AppBase';
export { WorkshopDemoBase } from './WorkshopDemoBase';
export { TerrainBase } from './TerrainBase';

/**
 * Dynamic import wrapper that webpack can analyze
 * Uses a more explicit approach to avoid webpack trying to import non-JS files
 */
async function dynamicImportApp(path: string): Promise<any> {
  // Remove the ../ prefix and any file extension
  let importPath = path.startsWith('../') ? path.slice(3) : path;
  importPath = importPath.replace(/\.(tsx?|jsx?)$/, '');

  // Extract the app name from the path
  // Format: "applications/game/index" -> "game" (after refactor)
  // Format: "tools/workshop/demos/tile-debug/app" -> "tile-debug"
  const pathSegments = importPath.split('/');
  let appName: string;

  if (pathSegments[0] === 'applications') {
    // New flat structure: applications/game/index -> game
    appName = pathSegments[1];
  } else if (
    pathSegments[0] === 'tools' &&
    pathSegments[1] === 'workshop' &&
    pathSegments[2] === 'demos'
  ) {
    // Special case for workshop demos: tools/workshop/demos/tile-debug/app -> tile-debug
    appName = pathSegments[3];
  } else {
    // Fallback for old structure: experiences/game/index -> game, demos/animation/index -> animation
    appName = pathSegments[1];
  }

  // All apps are now in the flat applications folder
  return import(`../applications/${appName}`);
}

/**
 * Load an app by key using the app registry
 */
export async function loadApp(appKey: string, options: StoryOptions): Promise<void> {
  // Handle route aliases (e.g., 'flier' -> 'flier-pg')
  const routeMap = getRouteToStoryMap();
  const resolvedKey = routeMap[appKey] || appKey;

  // Find the app in the registry
  const app = APP_REGISTRY[resolvedKey];

  if (!app) {
    throw new Error(`App '${resolvedKey}' not found in registry`);
  }

  // Extract the relative path from the entry field
  // Entry format: "./experiences/game/index.tsx" or "./tools/workshop/demos/tile-debug/app"
  const entryPath = app.entry
    .replace(/^\.\//, '../') // Replace ./ with ../
    .replace(/\.(tsx?|jsx?)$/, ''); // Remove file extension

  // Special case handling for known mismatches
  let importPath = entryPath;

  // Handle specific cases where the actual file differs from entry
  if (entryPath === '../tools/workshop/index') {
    importPath = '../tools/workshop/demos/workshop/index';
  }

  let appModule;
  try {
    console.log(`Attempting to dynamically import: ${importPath}`);
    appModule = await dynamicImportApp(importPath);
    console.log('Imported module:', appModule);
    console.log('Module default export:', appModule.default);
  } catch (error) {
    throw new Error(`Failed to load app '${resolvedKey}': ${error}`);
  }

  const appInstance = appModule.default;
  if (!appInstance || typeof appInstance.load !== 'function') {
    console.error('Invalid app instance:', appInstance);
    throw new Error(`App '${resolvedKey}' does not export a valid app instance with load method`);
  }
  return appInstance.load(options);
}

/**
 * Check if an app exists in the registry
 */
export function hasApp(appKey: string): boolean {
  // Handle route aliases (e.g., 'flier' -> 'flier-pg')
  const routeMap = getRouteToStoryMap();
  const resolvedKey = routeMap[appKey] || appKey;

  return APP_REGISTRY[resolvedKey] !== undefined;
}

// Export the main functions
export { loadApp as default };
