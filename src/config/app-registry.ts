/**
 * Central registry for all applications in the system
 * Provides metadata, routing, and configuration for each app
 *
 * NOTE: This is now generated from src/config/apps.json
 * The JSON file is the source of truth to avoid duplication
 */

import appsConfig from './apps.json';

export interface AppMetadata {
  name: string;
  description: string;
  route: string;
  category: 'experience' | 'tool' | 'demo';
  htmlTemplate?: string;
  requiresWebGL?: boolean;
  visibility: 'public' | 'private' | 'hidden';
  priority?: number; // For ordering in menus
  theme?: string; // Optional theme ID that overrides global theme selection
  entry?: string; // Optional: Override app location (default: derived from route)
  webpackEntry?: string; // Optional: Custom webpack entry point (default: ./src/index.tsx)
}

// Generate APP_REGISTRY from JSON (now flat structure under 'apps')
export const APP_REGISTRY: Record<string, AppMetadata> = appsConfig.apps as Record<string, AppMetadata>;

/**
 * Get all apps in a specific category
 */
export function getAppsByCategory(
  category: 'experience' | 'tool' | 'demo'
): Record<string, AppMetadata> {
  return Object.fromEntries(
    Object.entries(APP_REGISTRY).filter(([_, app]) => app.category === category)
  );
}

/**
 * Get a specific app by key
 */
export function getApp(key: string): AppMetadata | null {
  return APP_REGISTRY[key] || null;
}

/**
 * Get all apps flattened
 */
export function getAllApps(): AppMetadata[] {
  return Object.values(APP_REGISTRY);
}

/**
 * Get apps by visibility with optional category filter
 * For backwards compatibility, also exports as getAppsByStatus
 */
export function getAppsByVisibility(
  visibility: 'public' | 'private' | 'hidden',
  category?: 'experience' | 'tool' | 'demo'
): AppMetadata[] {
  let apps = getAllApps()
    .filter(app => app.visibility === visibility);
  if (category) {
    apps = apps.filter(app => app.category === category);
  }
  return apps.sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

/**
 * Get apps that should be visible in the menu based on environment
 * In development: shows 'public' and 'private' apps
 * In production: shows only 'public' apps
 */
export function getVisibleApps(
  category?: 'experience' | 'tool' | 'demo'
): AppMetadata[] {
  const isDevelopment =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  let apps = getAllApps()
    .filter(app => {
      if (app.visibility === 'hidden') return false;
      if (app.visibility === 'private') return isDevelopment;
      return true; // public apps always visible
    });

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
