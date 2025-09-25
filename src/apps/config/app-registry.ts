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
      tags: ["interactive", "simulation", "flight", "game"]
    },
    flyzones: {
      name: "Location Explorer",
      description: "Explore real paragliding locations in 3D with weather data and site information",
      entry: "./experiences/flyzones/index.tsx",
      route: "/flyzones",
      category: "experience",
      htmlTemplate: "./experiences/flyzones/index.html",
      requiresWebGL: true,
      tags: ["exploration", "locations", "educational", "3D"]
    },
    photobooth: {
      name: "3D Showcase",
      description: "Beautiful static 3D scene showcasing paragliders and environment",
      entry: "./experiences/photobooth/index.tsx",
      route: "/photobooth",
      category: "experience",
      requiresWebGL: true,
      tags: ["showcase", "static", "visual", "presentation"]
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
      tags: ["authoring", "editor", "locations", "development"]
    },
    workshop: {
      name: "Component Workshop",
      description: "Development environment for testing and showcasing individual 3D components",
      entry: "./tools/workshop/index.tsx",
      route: "/workshop",
      category: "tool",
      requiresWebGL: true,
      tags: ["development", "components", "testing", "demo"]
    }
  },

  demos: {
    animation: {
      name: "Flight Animation",
      description: "Automated cinematic flight demonstration showcasing 3D capabilities",
      entry: "./demos/animation/index.tsx",
      route: "/animation",
      category: "demo",
      requiresWebGL: true,
      tags: ["cinematic", "automated", "demonstration", "showcase"]
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