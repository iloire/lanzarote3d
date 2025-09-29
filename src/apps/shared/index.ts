import { StoryOptions } from './types';
import { APP_REGISTRY, getRouteToStoryMap, AppMetadata } from '../config/app-registry';

// Export specialized base classes
export { AppBase } from './AppBase';
export { WorkshopDemoBase } from './WorkshopDemoBase';
export { TerrainBase } from './TerrainBase';

/**
 * Build a dynamic import function from app metadata
 * This ensures webpack can statically analyze the imports
 */
function createImportFunction(app: AppMetadata): () => Promise<any> {
  // Extract the relative path from the entry field
  // Entry format: "./experiences/game/index.tsx" or "./tools/workshop/demos/tile-debug/app"
  const entryPath = app.entry
    .replace(/^\.\//, '../')  // Replace ./ with ../
    .replace(/\.(tsx?|jsx?)$/, ''); // Remove file extension

  // Use a switch statement for webpack static analysis
  // This is required for webpack to bundle the chunks correctly
  switch (entryPath) {
    // Experiences
    case '../experiences/game/index':
    case '../experiences/game/game':
      return () => import('../experiences/game/game');
    case '../experiences/flyzones/index':
      return () => import('../experiences/flyzones/index');

    // Demos
    case '../demos/animation/index':
      return () => import('../demos/animation/index');
    case '../demos/boats/index':
      return () => import('../demos/boats/index');
    case '../demos/famara2/index':
    case '../demos/famara2':
      return () => import('../demos/famara2');
    case '../demos/famara/index':
    case '../demos/famara':
      return () => import('../demos/famara');
    case '../demos/satellite-terrain/index':
    case '../demos/satellite-terrain':
      return () => import('../demos/satellite-terrain');
    case '../demos/autonomous-driving/index':
      return () => import('../demos/autonomous-driving/index');

    // Tools
    case '../tools/location-editor/index':
      return () => import('../tools/location-editor/index');
    case '../tools/tile-mapper/index':
      return () => import('../tools/tile-mapper/index');
    case '../tools/workshop/index':
      return () => import('../tools/workshop/demos/workshop/index');

    // Workshop Demos (from tools category in apps.json)
    case '../tools/workshop/demos/tile-debug/app':
      return () => import('../tools/workshop/demos/tile-debug/app');
    case '../tools/workshop/demos/boat/index':
      return () => import('../tools/workshop/demos/boat/index');
    case '../tools/workshop/demos/clouds/index':
      return () => import('../tools/workshop/demos/clouds/index');
    case '../tools/workshop/demos/flier-pg/index':
      return () => import('../tools/workshop/demos/flier-pg/index');
    case '../tools/workshop/demos/glider/index':
      return () => import('../tools/workshop/demos/glider/index');
    case '../tools/workshop/demos/hangglider/index':
      return () => import('../tools/workshop/demos/hangglider/index');
    case '../tools/workshop/demos/head/index':
      return () => import('../tools/workshop/demos/head/index');
    case '../tools/workshop/demos/helmet/index':
      return () => import('../tools/workshop/demos/helmet/index');
    case '../tools/workshop/demos/car/index':
      return () => import('../tools/workshop/demos/car/index');
    case '../tools/workshop/demos/truck/index':
      return () => import('../tools/workshop/demos/truck/index');
    case '../tools/workshop/demos/island/index':
      return () => import('../tools/workshop/demos/island/index');
    case '../tools/workshop/demos/paraglider-voxel/index':
      return () => import('../tools/workshop/demos/paraglider-voxel/index');
    case '../tools/workshop/demos/paraglider/index':
      return () => import('../tools/workshop/demos/paraglider/index');
    case '../tools/workshop/demos/pilot/index':
      return () => import('../tools/workshop/demos/pilot/index');
    case '../tools/workshop/demos/terrain/index':
      return () => import('../tools/workshop/demos/terrain/index');
    case '../tools/workshop/demos/town/index':
      return () => import('../tools/workshop/demos/town/index');
    case '../tools/workshop/demos/houses/index':
      return () => import('../tools/workshop/demos/houses/index');
    case '../tools/workshop/demos/voxel/index':
      return () => import('../tools/workshop/demos/voxel/index');
    case '../tools/workshop/demos/terrain-gps/index':
      return () => import('../tools/workshop/demos/terrain-gps/index');

    // Flyzone Manager
    case '../flyzone-manager/editor/flyzone-editor':
      return () => import('../flyzone-manager/editor/flyzone-editor');
    case '../flyzone-manager/visualizer/flyzone-visualizer':
      return () => import('../flyzone-manager/visualizer/flyzone-visualizer');

    default:
      throw new Error(`No import mapping for entry path: ${entryPath} (from app: ${app.name})`);
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

  // Get the import function for this app
  const importFn = createImportFunction(app);

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

// Export the main functions
export { loadApp as default };
