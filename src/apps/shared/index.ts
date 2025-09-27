import { StoryOptions } from './types';
import { APP_REGISTRY, getRouteToStoryMap } from '../config/app-registry';

// Export specialized base classes
export { AppBase } from './AppBase';
export { WorkshopDemoBase } from './WorkshopDemoBase';
export { TerrainBase } from './TerrainBase';

/**
 * Load an app by key using the app registry
 * This replaces the old "Stories" concept with a cleaner approach
 */
export async function loadApp(appKey: string, options: StoryOptions): Promise<void> {
  // Handle route aliases (e.g., 'flier' -> 'flier-pg')
  const routeMap = getRouteToStoryMap();
  const resolvedKey = routeMap[appKey] || appKey;

  // Find the app in the registry
  let app = null;
  for (const category of Object.values(APP_REGISTRY)) {
    if (category[resolvedKey]) {
      app = category[resolvedKey];
      break;
    }
  }

  if (!app) {
    throw new Error(`App '${resolvedKey}' not found in registry`);
  }

  // Dynamic import based on resolved app key - minimal coupling needed for webpack
  let appModule;
  switch (resolvedKey) {
    case 'animation':
      appModule = await import('../demos/animation/index');
      break;
    case 'game':
      appModule = await import('../experiences/game/game');
      break;
    case 'flyzones':
      appModule = await import('../experiences/flyzones/index');
      break;
    case 'photobooth':
      appModule = await import('../demos/photobooth');
      break;
    case 'famara':
      appModule = await import('../demos/famara');
      break;
    case 'location-editor':
      appModule = await import('../tools/location-editor/index');
      break;
    case 'workshop':
      appModule = await import('../tools/workshop/demos/workshop/index');
      break;
    case 'clouds':
      appModule = await import('../tools/workshop/demos/clouds/index');
      break;
    case 'flier-pg':
      appModule = await import('../tools/workshop/demos/flier-pg/index');
      break;
    case 'glider':
      appModule = await import('../tools/workshop/demos/glider/index');
      break;
    case 'hangglider':
      appModule = await import('../tools/workshop/demos/hangglider/index');
      break;
    case 'head':
      appModule = await import('../tools/workshop/demos/head/index');
      break;
    case 'helmet':
      appModule = await import('../tools/workshop/demos/helmet/index');
      break;
    case 'igloo':
      appModule = await import('../tools/workshop/demos/igloo/index');
      break;
    case 'island':
      appModule = await import('../tools/workshop/demos/island/index');
      break;
    case 'paraglider-voxel':
      appModule = await import('../tools/workshop/demos/paraglider-voxel/index');
      break;
    case 'paraglider':
      appModule = await import('../tools/workshop/demos/paraglider/index');
      break;
    case 'pilot':
      appModule = await import('../tools/workshop/demos/pilot/index');
      break;
    case 'terrain':
      appModule = await import('../tools/workshop/demos/terrain/index');
      break;
    case 'voxel':
      appModule = await import('../tools/workshop/demos/voxel/index');
      break;
    default:
      throw new Error(`No import mapping found for app '${resolvedKey}' (original: '${appKey}')`);
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

// Legacy Stories export for backward compatibility - to be removed
const Stories = new Proxy({} as Record<string, any>, {
  get(_, prop: string) {
    if (typeof prop === 'string') {
      return {
        load: async (options: StoryOptions) => {
          return loadApp(prop, options);
        }
      };
    }
    return undefined;
  }
});

export default Stories;
