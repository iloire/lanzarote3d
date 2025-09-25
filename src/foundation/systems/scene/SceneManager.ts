import * as THREE from "three";
import { Sky } from "../../components/environment";
import { Weather } from "../../components/physics";

export interface SceneConfig {
  environment?: 'lanzarote' | 'custom';
  lighting?: 'dynamic' | 'static';
  physics?: boolean;
  fog?: {
    enabled: boolean;
    color?: number;
    near?: number;
    far?: number;
  };
}

export interface SceneComponents {
  scene: THREE.Scene;
  sky?: Sky;
  weather?: Weather;
  lighting: {
    ambientLight: THREE.AmbientLight;
    directionalLight: THREE.DirectionalLight;
  };
}

export class SceneManager {
  private scene: THREE.Scene;
  private config: SceneConfig;
  private components: SceneComponents;

  constructor(config: SceneConfig = {}) {
    this.config = {
      environment: 'lanzarote',
      lighting: 'dynamic',
      physics: false,
      fog: { enabled: false },
      ...config
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

    // Setup fog if enabled
    if (this.config.fog?.enabled) {
      const fogColor = this.config.fog.color || 0x000000;
      const fogNear = this.config.fog.near || 1;
      const fogFar = this.config.fog.far || 22500;
      this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    }

    this.components = {
      scene: this.scene,
      lighting: {
        ambientLight,
        directionalLight
      }
    };

    // Setup environment-specific components
    if (this.config.environment === 'lanzarote') {
      this.setupLanzaroteEnvironment();
    }

    // Setup physics if enabled
    if (this.config.physics) {
      this.setupPhysics();
    }
  }

  private setupLanzaroteEnvironment(): void {
    // Sky setup will be handled by Sky component
    // This is a placeholder for environment-specific setup
  }

  private setupPhysics(): void {
    // Weather system setup
    if (!this.components.weather) {
      this.components.weather = new Weather({
        windDirectionDegreesFromNorth: 310,
        speedMetresPerSecond: 5,
        lclLevel: 1800
      });
    }
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

  setFog(enabled: boolean, color?: number, near?: number, far?: number): void {
    if (enabled) {
      const fogColor = color || 0x000000;
      const fogNear = near || 1;
      const fogFar = far || 22500;
      this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    } else {
      this.scene.fog = null;
    }
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
    if (this.components.weather) {
      // Weather cleanup if needed
    }
  }
}

export default SceneManager;