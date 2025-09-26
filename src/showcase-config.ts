/**
 * Runtime bundle mapping for showcase apps.
 * This dynamically generates the mapping based on known patterns.
 *
 * To add a new app:
 * 1. Add it to webpack.showcase.js showcaseApps array
 * 2. That's it! The mapping will be auto-generated
 */

export function generateBundleToStoryMap(): Record<string, string> {
  // List of all known showcase apps (must match webpack.showcase.js)
  const knownApps = [
    'animation',
    'photobooth',
    'famara',
    'game',
    'flyzones',
    'workshop',
    'location-editor',
    'clouds',
    'night',
    'paragliderVoxel',
    'terrain',
    'glider',
    'pilot',
    'voxel',
    'helmet',
    'head',
    'hangglider',
    'paraglider',
    'flier-pg',
  ];

  const map: Record<string, string> = {};

  // Auto-generate mappings
  knownApps.forEach(app => {
    map[app] = app;

    // Handle camelCase to kebab-case conversions
    const camelCase = app.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    if (camelCase !== app) {
      map[camelCase] = app;
    }
  });

  // Special aliases
  map['main'] = 'animation';
  map['locationEditor'] = 'location-editor';
  map['flierPg'] = 'flier-pg';

  return map;
}

export const bundleToStoryMap = generateBundleToStoryMap();