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

  // Dynamic import mapping - cleaner than switch but webpack-friendly
  const importMap: Record<string, () => Promise<any>> = {
    // Experiences
    'game': () => import('../experiences/game/game'),
    'flyzones': () => import('../experiences/flyzones/index'),

    // Demos
    'animation': () => import('../demos/animation/index'),
    'boats': () => import('../demos/boats/index'),
    'famara2': () => import('../demos/famara2'),
    'famara': () => import('../demos/famara'),
    'satellite-terrain': () => import('../demos/satellite-terrain'),
    'autonomous-driving': () => import('../demos/autonomous-driving/index'),

    // Tools
    'location-editor': () => import('../tools/location-editor/index'),
    'tile-mapper': () => import('../tools/tile-mapper/index'),

    // Workshop Demos
    'workshop': () => import('../tools/workshop/demos/workshop/index'),
    'boat': () => import('../tools/workshop/demos/boat/index'),
    'clouds': () => import('../tools/workshop/demos/clouds/index'),
    'flier-pg': () => import('../tools/workshop/demos/flier-pg/index'),
    'legacy-glider': () => import('../tools/workshop/demos/glider/index'),
    'hangglider': () => import('../tools/workshop/demos/hangglider/index'),
    'head': () => import('../tools/workshop/demos/head/index'),
    'helmet': () => import('../tools/workshop/demos/helmet/index'),
    'car': () => import('../tools/workshop/demos/car/index'),
    'truck': () => import('../tools/workshop/demos/truck/index'),
    'island': () => import('../tools/workshop/demos/island/index'),
    'paraglider-voxel': () => import('../tools/workshop/demos/paraglider-voxel/index'),
    'paraglider': () => import('../tools/workshop/demos/paraglider/index'),
    'pilot': () => import('../tools/workshop/demos/pilot/index'),
    'terrain': () => import('../tools/workshop/demos/terrain/index'),
    'town': () => import('../tools/workshop/demos/town/index'),
    'houses': () => import('../tools/workshop/demos/houses/index'),
    'voxel': () => import('../tools/workshop/demos/voxel/index'),
    'terrain-gps': () => import('../tools/workshop/demos/terrain-gps/index'),
    'tile-debug': () => import('../tools/workshop/demos/tile-debug/app'),

    // Flyzone Manager
    'flyzone-editor': () => import('../flyzone-manager/editor/flyzone-editor'),
    'flyzone-visualizer': () => import('../flyzone-manager/visualizer/flyzone-visualizer'),
  };

  const importFn = importMap[resolvedKey];
  if (!importFn) {
    throw new Error(`No import mapping found for app '${resolvedKey}' (original: '${appKey}')`);
  }

  let appModule;
  try {
    appModule = await importFn();
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

// Legacy Stories export for backward compatibility - to be removed
const Stories = new Proxy({} as Record<string, any>, {
  get(_, prop: string) {
    if (typeof prop === 'string') {
      return {
        load: async (options: StoryOptions) => {
          return loadApp(prop, options);
        },
      };
    }
    return undefined;
  },
});

export default Stories;
