import * as THREE from 'three';
import { Sky } from '../../components/environment';

export interface SceneConfig {
  environment?: 'lanzarote' | 'custom';
  lighting?: 'dynamic' | 'static';
}

export interface SceneComponents {
  scene: THREE.Scene;
  sky?: Sky;
  lighting: {
    ambientLight: THREE.AmbientLight;
    directionalLight: THREE.DirectionalLight;
  };
}

export class SceneManager {
  private scene: THREE.Scene;
  private config: SceneConfig;
  private components!: SceneComponents;

  constructor(config: SceneConfig = {}) {
    this.config = {
      environment: 'lanzarote',
      lighting: 'dynamic',
      ...config,
    };

    this.scene = new THREE.Scene();
    this.setupScene();
  }

  private setupScene(): void {
    // Setup lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 0.5);
    directionalLight.castShadow = true;

    this.scene.add(ambientLight);
    this.scene.add(directionalLight);

    this.components = {
      scene: this.scene,
      lighting: {
        ambientLight,
        directionalLight,
      },
    };

    // Setup environment-specific components
    if (this.config.environment === 'lanzarote') {
      this.setupLanzaroteEnvironment();
    }
  }

  private setupLanzaroteEnvironment(): void {
    // Sky setup will be handled by Sky component
    // This is a placeholder for environment-specific setup
  }

  // Public API methods
  getScene(): THREE.Scene {
    return this.scene;
  }

  getComponents(): SceneComponents {
    return this.components;
  }

  add(...objects: THREE.Object3D[]): void {
    objects.forEach(obj => this.scene.add(obj));
  }

  remove(...objects: THREE.Object3D[]): void {
    objects.forEach(obj => this.scene.remove(obj));
  }

  updateLighting(timeOfDay: number): void {
    if (this.components.sky) {
      this.components.sky.updateSunPosition(timeOfDay);
    }

    // Update directional light based on time of day
    const intensity = Math.max(0.2, Math.sin((timeOfDay / 24) * Math.PI * 2));
    this.components.lighting.directionalLight.intensity = intensity;
  }

  dispose(): void {
    // Clean up resources
    this.scene.clear();
  }
}

export default SceneManager;
