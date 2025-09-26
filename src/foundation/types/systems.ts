// System interface definitions
import * as THREE from 'three';

// Scene system configurations
export interface SceneConfig {
  environment?: string;
  lighting?: 'static' | 'dynamic';
  physics?: boolean;
  background?: THREE.Color | string;
}

// Controls system configurations
export interface ControlsConfig {
  enabled?: boolean;
  keyboard?: boolean;
  mouse?: boolean;
  gamepad?: boolean;
}

// Audio system configurations
export interface AudioConfig {
  enabled?: boolean;
  volume?: number;
  spatial?: boolean;
  context?: AudioContext;
}

// Analytics system configurations
export interface AnalyticsConfig {
  enabled?: boolean;
  performance?: boolean;
  userTracking?: boolean;
}
