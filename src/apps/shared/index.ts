import { StoryOptions } from './types';
import { APP_REGISTRY, getRouteToStoryMap, AppMetadata } from '../config/app-registry';

// Export specialized base classes
export { AppBase } from './AppBase';
export { WorkshopDemoBase } from './WorkshopDemoBase';
export { TerrainBase } from './TerrainBase';

/**
 * Dynamic import wrapper that webpack can analyze
 * Uses a single dynamic import with computed path
 */
async function dynamicImportApp(path: string): Promise<any> {
  // Webpack needs at least a partial static string to determine the chunk boundaries
  // We use conditional imports based on the path prefix to help webpack optimize

  if (path.startsWith('../experiences/')) {
    return import(/* webpackChunkName: "experiences" */ `../experiences/${path.slice(15)}`);
  } else if (path.startsWith('../demos/')) {
    return import(/* webpackChunkName: "demos" */ `../demos/${path.slice(9)}`);
  } else if (path.startsWith('../tools/workshop/demos/')) {
    return import(/* webpackChunkName: "workshop" */ `../tools/workshop/demos/${path.slice(24)}`);
  } else if (path.startsWith('../tools/')) {
    return import(/* webpackChunkName: "tools" */ `../tools/${path.slice(9)}`);
  } else if (path.startsWith('../flyzone-manager/')) {
    return import(/* webpackChunkName: "flyzone" */ `../flyzone-manager/${path.slice(19)}`);
  } else {
    throw new Error(`Unknown import path pattern: ${path}`);
  }
}

/**
 * Load an app by key using the app registry
 */
export async function loadApp(appKey: string, options: StoryOptions): Promise<void> {
  // Handle route aliases (e.g., 'flier' -> 'flier-pg')
  const routeMap = getRouteToStoryMap();
  const resolvedKey = routeMap[appKey] || appKey;

  // Find the app in the registry
  let app: AppMetadata | null = null;
  for (const category of Object.values(APP_REGISTRY)) {
    if (category[resolvedKey]) {
      app = category[resolvedKey];
      break;
    }
  }

  if (!app) {
    throw new Error(`App '${resolvedKey}' not found in registry`);
  }

  // Extract the relative path from the entry field
  // Entry format: "./experiences/game/index.tsx" or "./tools/workshop/demos/tile-debug/app"
  const entryPath = app.entry
    .replace(/^\.\//, '../')  // Replace ./ with ../
    .replace(/\.(tsx?|jsx?)$/, ''); // Remove file extension

  // Special case handling for known mismatches
  let importPath = entryPath;

  // Handle specific cases where the actual file differs from entry
  if (entryPath === '../experiences/game/index') {
    importPath = '../experiences/game/game';
  } else if (entryPath === '../tools/workshop/index') {
    importPath = '../tools/workshop/demos/workshop/index';
  }

  let appModule;
  try {
    appModule = await dynamicImportApp(importPath);
  } catch (error) {
    throw new Error(`Failed to load app '${resolvedKey}': ${error}`);
  }

  const appInstance = appModule.default;
  return appInstance.load(options);
}

/**
 * Check if an app exists in the registry
 */
export function hasApp(appKey: string): boolean {
  // Handle route aliases (e.g., 'flier' -> 'flier-pg')
  const routeMap = getRouteToStoryMap();
  const resolvedKey = routeMap[appKey] || appKey;

  for (const category of Object.values(APP_REGISTRY)) {
    if (category[resolvedKey]) {
      return true;
    }
  }
  return false;
}

// Export the main functions
export { loadApp as default };
