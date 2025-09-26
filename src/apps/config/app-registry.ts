/**
 * Central registry for all applications in the system
 * Provides metadata, routing, and configuration for each app
 */

export interface AppMetadata {
  name: string;
  description: string;
  entry: string;
  route: string;
  category: 'experience' | 'tool' | 'demo';
  htmlTemplate?: string;
  requiresWebGL?: boolean;
  tags?: string[];
  status?: 'public' | 'experimental' | 'dev';
  priority?: number; // For ordering in menus
  hidden?: boolean; // Hide from menu when true
}

export const APP_REGISTRY: Record<string, Record<string, AppMetadata>> = {
  experiences: {
    game: {
      name: "Flight Simulator",
      description: "Interactive paragliding flight simulation with physics, weather, and scoring",
      entry: "./experiences/game/index.tsx",
      route: "/game",
      category: "experience",
      htmlTemplate: "./experiences/game/index.html",
      requiresWebGL: true,
      tags: ["interactive", "simulation", "flight", "game"],
      status: "",
      priority: 2
    },
    flyzones: {
      name: "Location Explorer",
      description: "Explore real paragliding locations in 3D with weather data and site information",
      entry: "./experiences/flyzones/index.tsx",
      route: "/flyzones",
      category: "experience",
      htmlTemplate: "./experiences/flyzones/index.html",
      requiresWebGL: true,
      tags: ["exploration", "locations", "educational", "3D"],
      status: "dev",
      priority: 3
    },
    photobooth: {
      name: "3D Showcase",
      description: "Beautiful static 3D scene showcasing paragliders and environment",
      entry: "./experiences/photobooth/index.tsx",
      route: "/photobooth",
      category: "experience",
      requiresWebGL: true,
      tags: ["showcase", "static", "visual", "presentation"],
      status: "public",
      priority: 2
    }
  },

  tools: {
    'location-editor': {
      name: "Location Editor",
      description: "Tool for creating and editing paragliding flight locations, takeoffs, and landing zones",
      entry: "./tools/location-editor/index.tsx",
      route: "/location-editor",
      category: "tool",
      requiresWebGL: true,
      tags: ["authoring", "editor", "locations", "development"],
      status: "dev",
      priority: 2
    },
    workshop: {
      name: "Component Workshop",
      description: "Development environment for testing and showcasing individual 3D components",
      entry: "./tools/workshop/index.tsx",
      route: "/workshop",
      category: "tool",
      requiresWebGL: true,
      tags: ["development", "components", "testing", "demo"],
      status: "public",
      priority: 9
    }
  },

  demos: {
    animation: {
      name: "Famara",
      description: "Automated cinematic flight demonstration showcasing 3D capabilities",
      entry: "./demos/animation/index.tsx",
      route: "/animation",
      category: "demo",
      requiresWebGL: true,
      tags: ["cinematic", "automated", "demonstration", "showcase"],
      status: "public",
      priority: 1
    },

    // Workshop Component Demos
    clouds: {
      name: "Clouds Demo",
      description: "Interactive cloud system demonstration",
      entry: "./tools/workshop/demos/clouds",
      route: "/clouds",
      category: "demo",
      requiresWebGL: true,
      tags: ["weather", "environment", "effects"],
      status: "public",
      priority: 2
    },
    night: {
      name: "Night Mode",
      description: "Night time lighting and atmosphere demo",
      entry: "./tools/workshop/demos/night",
      route: "/night",
      category: "demo",
      requiresWebGL: true,
      tags: ["lighting", "atmosphere", "visual"],
      status: "public",
      priority: 3
    },
    'paraglider-voxel': {
      name: "Paraglider Voxel",
      description: "Voxel-based paraglider component showcase",
      entry: "./tools/workshop/demos/paraglider-voxel",
      route: "/paraglider-voxel",
      category: "demo",
      requiresWebGL: true,
      tags: ["voxel", "paraglider", "component"],
      status: "public",
      priority: 3
    },

    // Development Demos
    'flier-pg': {
      name: "Flier Physics",
      description: "Paraglider flight physics demonstration",
      entry: "./tools/workshop/demos/flier-pg",
      route: "/flier",
      category: "demo",
      requiresWebGL: true,
      tags: ["physics", "flight", "simulation"],
      status: "dev",
      priority: 10
    },
    glider: {
      name: "Glider",
      description: "Glider component demo",
      entry: "./tools/workshop/demos/glider",
      route: "/glider",
      category: "demo",
      requiresWebGL: true,
      tags: ["glider", "component"],
      status: "dev",
      priority: 11
    },
    hangglider: {
      name: "Hang Glider",
      description: "Hang glider component demo",
      entry: "./tools/workshop/demos/hangglider",
      route: "/hangglider",
      category: "demo",
      requiresWebGL: true,
      tags: ["hangglider", "component"],
      status: "dev",
      priority: 12
    },
    head: {
      name: "Pilot Head",
      description: "Pilot head component variations",
      entry: "./tools/workshop/demos/head",
      route: "/head",
      category: "demo",
      requiresWebGL: true,
      tags: ["character", "head", "customization"],
      status: "dev",
      priority: 13
    },
    helmet: {
      name: "Helmet",
      description: "Helmet component variations",
      entry: "./tools/workshop/demos/helmet",
      route: "/helmet",
      category: "demo",
      requiresWebGL: true,
      tags: ["character", "helmet", "customization"],
      status: "dev",
      priority: 14
    },
    paraglider: {
      name: "Paraglider",
      description: "Paraglider component demo",
      entry: "./tools/workshop/demos/paraglider",
      route: "/paraglider",
      category: "demo",
      requiresWebGL: true,
      tags: ["paraglider", "component"],
      status: "dev",
      priority: 15
    },
    pilot: {
      name: "Pilot",
      description: "Pilot component demo",
      entry: "./tools/workshop/demos/pilot",
      route: "/pilot",
      category: "demo",
      requiresWebGL: true,
      tags: ["character", "pilot"],
      status: "dev",
      priority: 16
    },
    terrain: {
      name: "Terrain",
      description: "Terrain generation demo",
      entry: "./tools/workshop/demos/terrain",
      route: "/terrain",
      category: "demo",
      requiresWebGL: true,
      tags: ["terrain", "generation", "environment"],
      status: "dev",
      priority: 17
    },
    voxel: {
      name: "Voxel Example",
      description: "Basic voxel rendering example",
      entry: "./tools/workshop/demos/voxel",
      route: "/voxel",
      category: "demo",
      requiresWebGL: true,
      tags: ["voxel", "rendering", "example"],
      status: "dev",
      priority: 18
    }
  }
};

/**
 * Get all apps in a specific category
 */
export function getAppsByCategory(category: 'experience' | 'tool' | 'demo'): Record<string, AppMetadata> {
  const categoryKey = category === 'experience' ? 'experiences' :
    category === 'tool' ? 'tools' : 'demos';
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
 * Get apps by tag
 */
export function getAppsByTag(tag: string): AppMetadata[] {
  return getAllApps().filter(app => app.tags?.includes(tag));
}

/**
 * Get apps by status with optional category filter
 */
export function getAppsByStatus(status: 'public' | 'experimental' | 'dev', category?: 'experience' | 'tool' | 'demo'): AppMetadata[] {
  let apps = getAllApps()
    .filter(app => app.status === status)
    .filter(app => !app.hidden); // Filter out hidden apps
  if (category) {
    apps = apps.filter(app => app.category === category);
  }
  return apps.sort((a, b) => (a.priority || 999) - (b.priority || 999));
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