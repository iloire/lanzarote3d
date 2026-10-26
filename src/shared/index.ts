import { StoryOptions } from './types';
import { APP_REGISTRY, getRouteToStoryMap } from '../config/app-registry';
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
 * Load an app by key using the app registry
 *
 * Convention: Apps are located at ./applications/{folder-name}/index.tsx
 * The folder name is derived from the route (e.g., /famara-animation -> famara-animation)
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

  const folderName = app.route.replace(/^\//, '');

  let appModule: AppModule;
  try {
    logger.debug(`Attempting to dynamically import: applications/${folderName}`);
    appModule = await import(`../applications/${folderName}`);
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
