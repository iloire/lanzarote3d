import { SceneConfig, ControlsConfig, AudioConfig, AnalyticsConfig } from './systems';
export interface FoundationConfig {
    scene?: SceneConfig;
    controls?: ControlsConfig;
    audio?: AudioConfig;
    analytics?: AnalyticsConfig;
}
export interface AssetConfig {
    basePath?: string;
    compression?: boolean;
    caching?: boolean;
    preload?: string[];
}
//# sourceMappingURL=config.d.ts.map