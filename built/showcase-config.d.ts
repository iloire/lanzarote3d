/**
 * Centralized configuration for showcase apps.
 * Add new apps here and they will automatically be included in the build.
 */
export interface ShowcaseApp {
    name: string;
    title: string;
    filename: string;
    category?: 'main' | 'demo' | 'tool';
}
export declare const showcaseApps: ShowcaseApp[];
export declare const bundleToStoryMap: Record<string, string>;
