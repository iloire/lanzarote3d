import { StoryOptions } from './types';
import { getRouteToStoryMap } from '../config/app-registry';

// Export specialized base classes
export { AppBase } from './AppBase';
export { WorkshopDemoBase } from './WorkshopDemoBase';
export { TerrainBase } from './TerrainBase';

export type StoryFunction = (options: StoryOptions) => Promise<any>;

/**
 * Lazy import registry for all stories
 * This approach eliminates tight coupling while working with webpack
 */
const STORY_IMPORTS: Record<string, () => Promise<any>> = {
  // Experiences
  animation: () => import('../demos/animation/index'),
  game: () => import('../experiences/game/game'),
  flyzones: () => import('../experiences/flyzones/index'),
  photobooth: () => import('../demos/photobooth'),
  famara: () => import('../demos/famara'),

  // Tools
  'location-editor': () => import('../tools/location-editor/index'),
  workshop: () => import('../tools/workshop/demos/workshop/index'),

  // Workshop demos
  clouds: () => import('../tools/workshop/demos/clouds/index'),
  'flier-pg': () => import('../tools/workshop/demos/flier-pg/index'),
  glider: () => import('../tools/workshop/demos/glider/index'),
  hangglider: () => import('../tools/workshop/demos/hangglider/index'),
  head: () => import('../tools/workshop/demos/head/index'),
  helmet: () => import('../tools/workshop/demos/helmet/index'),
  igloo: () => import('../tools/workshop/demos/igloo/index'),
  island: () => import('../tools/workshop/demos/island/index'),
  'paraglider-voxel': () => import('../tools/workshop/demos/paraglider-voxel/index'),
  paraglider: () => import('../tools/workshop/demos/paraglider/index'),
  pilot: () => import('../tools/workshop/demos/pilot/index'),
  terrain: () => import('../tools/workshop/demos/terrain/index'),
  voxel: () => import('../tools/workshop/demos/voxel/index'),
};

/**
 * Story loader that uses lazy imports from the registry
 * This eliminates the tight coupling while working with webpack
 */
class StoryLoader {
  private loadedStories: Map<string, any> = new Map();
  private routeToStoryMap = getRouteToStoryMap();

  /**
   * Load a story by key using lazy imports
   */
  async loadStory(key: string): Promise<any> {
    // Check if already loaded
    if (this.loadedStories.has(key)) {
      return this.loadedStories.get(key);
    }

    // Get the lazy import function
    const importFn = STORY_IMPORTS[key];
    if (!importFn) {
      throw new Error(`Story '${key}' not found in import registry`);
    }

    try {
      // Use the lazy import
      const module = await importFn();
      const story = module.default;

      // Cache the loaded story
      this.loadedStories.set(key, story);

      return story;
    } catch (error) {
      console.error(`Failed to load story '${key}':`, error);
      throw error;
    }
  }

  /**
   * Get all available story keys from the import registry
   */
  getAvailableStories(): string[] {
    return Object.keys(STORY_IMPORTS);
  }

  /**
   * Get story key by route (for backward compatibility)
   */
  getStoryKeyByRoute(route: string): string | null {
    return this.routeToStoryMap[route] || null;
  }
}

// Create singleton story loader
const storyLoader = new StoryLoader();

/**
 * Stories object that provides dynamic loading with backward compatibility
 */
const Stories = new Proxy({} as Record<string, any>, {
  get(_, prop: string) {
    // Check if it's a method call
    if (prop === 'getAvailableStories') {
      return () => storyLoader.getAvailableStories();
    }
    if (prop === 'loadStory') {
      return (key: string) => storyLoader.loadStory(key);
    }

    // Handle story loading
    if (typeof prop === 'string') {
      // Check for route-based lookup first
      let storyKey = storyLoader.getStoryKeyByRoute(prop);
      if (!storyKey) {
        storyKey = prop;
      }

      // Return a lazy-loaded story
      return {
        load: async (options: StoryOptions) => {
          const story = await storyLoader.loadStory(storyKey);
          return story.load(options);
        },
        dispose: async () => {
          const story = await storyLoader.loadStory(storyKey);
          return story.dispose();
        },
        getAppInfo: async () => {
          const story = await storyLoader.loadStory(storyKey);
          return story.getAppInfo();
        }
      };
    }

    return undefined;
  },

  has(_, prop: string) {
    // Check if story exists in registry
    const storyKey = storyLoader.getStoryKeyByRoute(prop) || prop;
    return storyLoader.getAvailableStories().includes(storyKey);
  },

  ownKeys(_) {
    return storyLoader.getAvailableStories();
  }
});

export default Stories;
