// Configuration type definitions
import { SceneConfig, ControlsConfig, AudioConfig, AnalyticsConfig } from './systems';

// Main foundation configuration
export interface FoundationConfig {
  scene?: SceneConfig;
  controls?: ControlsConfig;
  audio?: AudioConfig;
  analytics?: AnalyticsConfig;
}

// Asset loading configuration
export interface AssetConfig {
  basePath?: string;
  compression?: boolean;
  caching?: boolean;
  preload?: string[];
}
