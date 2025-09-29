/**
 * Central registry for all applications in the system
 * Provides metadata, routing, and configuration for each app
 *
 * NOTE: This is now generated from src/apps/config/apps.json
 * The JSON file is the source of truth to avoid duplication
 */

import appsConfig from './apps.json';

export interface AppMetadata {
  name: string;
  description: string;
  entry: string;
  route: string;
  category: 'experience' | 'tool' | 'demo';
  htmlTemplate?: string;
  requiresWebGL?: boolean;
  status?: 'public' | 'experimental' | 'dev';
  priority?: number; // For ordering in menus
  hidden?: boolean; // Hide from menu when true
  theme?: string; // Optional theme ID that overrides global theme selection
}

// Generate APP_REGISTRY from JSON (excluding the 'showcase' section)
export const APP_REGISTRY: Record<string, Record<string, AppMetadata>> = Object.fromEntries(
  Object.entries(appsConfig).filter(([key]) => key !== 'showcase')
) as Record<string, Record<string, AppMetadata>>;

/**
 * Get all apps in a specific category
 */
export function getAppsByCategory(
  category: 'experience' | 'tool' | 'demo'
): Record<string, AppMetadata> {
  const categoryKey =
    category === 'experience' ? 'experiences' : category === 'tool' ? 'tools' : 'demos';
  return APP_REGISTRY[categoryKey] || {};
}

/**
 * Get a specific app by category and key
 */
export function getApp(category: string, key: string): AppMetadata | null {
  return APP_REGISTRY[category]?.[key] || null;
}

/**
 * Get all apps flattened
 */
export function getAllApps(): AppMetadata[] {
  return Object.values(APP_REGISTRY).flatMap(category => Object.values(category));
}


/**
 * Get apps by status with optional category filter
 */
export function getAppsByStatus(
  status: 'public' | 'experimental' | 'dev',
  category?: 'experience' | 'tool' | 'demo'
): AppMetadata[] {
  let apps = getAllApps()
    .filter(app => app.status === status)
    .filter(app => !app.hidden); // Filter out hidden apps
  if (category) {
    apps = apps.filter(app => app.category === category);
  }
  return apps.sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

/**
 * Get app config by route or key for use in AppBase constructors
 */
export function getAppConfig(routeOrKey: string): AppMetadata | null {
  // First try to find by route
  const allApps = getAllApps();
  let app = allApps.find(app => app.route === `/${routeOrKey}` || app.route === routeOrKey);

  // If not found by route, try by key
  if (!app) {
    const categories = Object.values(APP_REGISTRY);
    for (const category of categories) {
      if (category[routeOrKey]) {
        app = category[routeOrKey];
        break;
      }
    }
  }

  return app || null;
}

/**
 * Get route-to-story mapping for the legacy Stories system
 */
export function getRouteToStoryMap(): Record<string, string> {
  const mapping: Record<string, string> = {};

  Object.values(APP_REGISTRY).forEach(category => {
    Object.entries(category).forEach(([key, app]) => {
      // Map route to key for story lookup
      const route = app.route.replace('/', '');
      mapping[route] = key;

      // Add common aliases
      if (key === 'location-editor') {
        mapping['locationEditor'] = key;
      }
      if (key === 'paraglider-voxel') {
        mapping['paragliderVoxel'] = key;
      }
      if (key === 'flier-pg') {
        mapping['flier'] = key;
        mapping['flierPg'] = key;
      }
    });
  });

  return mapping;
}