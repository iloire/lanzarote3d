/**
 * Central registry for all applications in the system
 * Provides metadata, routing, and configuration for each app
 *
 * NOTE: This is now generated from src/config/apps.json
 * The JSON file is the source of truth to avoid duplication
 */

import appsConfig from './apps.json';
import { SITE, Site } from './site';

export interface AppMetadata {
  name: string;
  description: string;
  route: string;
  category: 'experience' | 'demo';
  htmlTemplate?: string;
  requiresWebGL?: boolean;
  visibility: 'public' | 'private' | 'hidden';
  priority?: number; // For ordering in menus
  site?: Site; // Which site builds it; Lanzarote unless set
}

// Generate APP_REGISTRY from JSON (now flat structure under 'apps'): this site's apps only
export const APP_REGISTRY: Record<string, AppMetadata> = Object.fromEntries(
  Object.entries(appsConfig.apps as Record<string, AppMetadata>).filter(
    ([, app]) => (app.site ?? 'lanzarote') === SITE
  )
);

/**
 * Get all apps flattened
 */
export function getAllApps(): AppMetadata[] {
  return Object.values(APP_REGISTRY);
}

/**
 * Get apps by visibility, ordered by priority
 */
export function getAppsByVisibility(visibility: 'public' | 'private' | 'hidden'): AppMetadata[] {
  return getAllApps()
    .filter(app => app.visibility === visibility)
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
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
    app = APP_REGISTRY[routeOrKey];
  }

  return app || null;
}

/**
 * Get route-to-story mapping for the legacy Stories system
 */
export function getRouteToStoryMap(): Record<string, string> {
  const mapping: Record<string, string> = {};

  Object.entries(APP_REGISTRY).forEach(([key, app]) => {
    // Map route to key for story lookup
    const route = app.route.replace('/', '');
    mapping[route] = key;
  });

  return mapping;
}
