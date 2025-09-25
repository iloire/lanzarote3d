// Component interface definitions
import * as THREE from 'three';

// Base component interface
export interface ComponentConfig {
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
}

// Vehicle component configurations
export interface VehicleConfig extends ComponentConfig {
  pilot?: string;
  model?: string;
  physics?: boolean;
}

// Environment component configurations
export interface EnvironmentConfig extends ComponentConfig {
  lighting?: 'static' | 'dynamic';
  weather?: 'clear' | 'cloudy' | 'stormy';
  timeOfDay?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
}

// Physics component configurations
export interface PhysicsConfig extends ComponentConfig {
  enabled?: boolean;
  gravity?: number;
  wind?: THREE.Vector3;
}

// UI component configurations
export interface UIConfig extends ComponentConfig {
  visible?: boolean;
  interactive?: boolean;
}