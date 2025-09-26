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
    priority?: number;
    hidden?: boolean;
    theme?: string;
}
export declare const APP_REGISTRY: Record<string, Record<string, AppMetadata>>;
/**
 * Get all apps in a specific category
 */
export declare function getAppsByCategory(category: 'experience' | 'tool' | 'demo'): Record<string, AppMetadata>;
/**
 * Get a specific app by category and key
 */
export declare function getApp(category: string, key: string): AppMetadata | null;
/**
 * Get all apps flattened
 */
export declare function getAllApps(): AppMetadata[];
/**
 * Get apps by tag
 */
export declare function getAppsByTag(tag: string): AppMetadata[];
/**
 * Get apps by status with optional category filter
 */
export declare function getAppsByStatus(status: 'public' | 'experimental' | 'dev', category?: 'experience' | 'tool' | 'demo'): AppMetadata[];
/**
 * Get route-to-story mapping for the legacy Stories system
 */
export declare function getRouteToStoryMap(): Record<string, string>;
//# sourceMappingURL=app-registry.d.ts.map