import { StoryOptions } from './types';
import { APP_REGISTRY, getRouteToStoryMap, AppMetadata } from '../config/app-registry';
import { logger } from '../foundation/utils/logger';

// Export specialized base classes
export { AppBase } from './AppBase';
export { WorkshopDemoBase } from './WorkshopDemoBase';
export { TerrainBase } from './TerrainBase';

/**
 * App module structure returned by dynamic imports
 */
interface AppModule {
  default: {
    load: (options: StoryOptions) => Promise<void> | void;
  };
}

/**
 * Dynamic import wrapper that webpack can analyze
 * Uses a more explicit approach to avoid webpack trying to import non-JS files
 */
async function dynamicImportApp(path: string): Promise<AppModule> {
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
 *
 * Convention: Apps are located at ./applications/{folder-name}/index.tsx
 * The folder name is derived from the route (e.g., /famara-animation -> famara-animation)
 *
 * Special cases can override with the 'entry' field in apps.json
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

  // Determine import path: use custom entry or derive from route
  let importPath: string;

  if (app.entry) {
    // Custom entry specified (e.g., tile-debug with special structure)
    importPath = app.entry
      .replace(/^\.\//, '../') // Convert ./applications/... to ../applications/...
      .replace(/\.(tsx?|jsx?)$/, ''); // Remove extension
  } else {
    // Standard convention: route name = folder name
    // E.g., /famara-animation -> ../applications/famara-animation
    const folderName = app.route.replace(/^\//, '');
    importPath = `../applications/${folderName}`;
  }

  let appModule;
  try {
    logger.debug(`Attempting to dynamically import: ${importPath}`);
    appModule = await dynamicImportApp(importPath);
    logger.debug('Imported module:', appModule);
    logger.debug('Module default export:', appModule.default);
  } catch (error) {
    throw new Error(`Failed to load app '${resolvedKey}': ${error}`);
  }

  const appInstance = appModule.default;
  if (!appInstance || typeof appInstance.load !== 'function') {
    logger.error('Invalid app instance:', appInstance);
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
