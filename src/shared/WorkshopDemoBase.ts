import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Helpers from '../foundation/utils/helpers';
import { AppBase, AppConfig } from './AppBase';
import { StoryOptions } from './types';
import Sky from '../foundation/components/environment/Sky';

export interface WorkshopDemoConfig extends Omit<AppConfig, 'scene' | 'requiredComponents'> {
  requiredComponents?: string[]; // Allow custom required components
  ground?: {
    create?: boolean;
    size?: { width: number; height: number };
    color?: number;
    opacity?: number;
  };
  lighting?: {
    sunPosition?: number;
  };
  helpers?:
  | {
    axes?: boolean; // Show axis helper with directional labels
    grid?: boolean; // Show grid helper
    lighting?: boolean; // Show lighting helpers (sun position, etc)
    scale?: number; // Scale factor for helpers (default: 100)
  }
  | boolean; // Can be boolean for simple enable/disable or object for granular control
}

/**
 * WorkshopDemoBase - Specialized base for workshop component demos
 *
 * Automatically provides:
 * - Clean environment (hides terrain and water)
 * - Optional ground plane
 * - Proper lighting setup
 * - Helper creation
 * - Standard animation loop utilities
 */
export abstract class WorkshopDemoBase extends AppBase {
  protected groundMesh?: THREE.Mesh;
  protected animationId?: number;

  constructor(config: WorkshopDemoConfig) {
    // Provide workshop-specific defaults
    super({
      ...config,
      requiredComponents: [
        'scene',
        'camera',
        'renderer',
        'terrain',
        'water',
        'sky',
        'controls',
        ...(config.requiredComponents || []),
      ],
      scene: {
        environment: 'custom',
        lighting: 'static',
        physics: false,
      },
      performance: {
        monitoring: true,
        logIntervalMs: 20000,
        ...config.performance,
      },
    });
  }

  /**
   * Set up clean workshop environment automatically
   * Called from initializeCore - no need to call manually
   */
  protected setupCleanEnvironment(options: StoryOptions, config?: WorkshopDemoConfig): void {
    const { scene, controls } = options;

    // Enable controls
    controls.enabled = true;

    // Create sky for lighting
    const sunPosition = config?.lighting?.sunPosition ?? 12;
    if (!options.sky) {
      const sky = new Sky(19, 3);
      sky.addToScene(scene);
      sky.updateSunPosition(sunPosition);
      options.sky = sky;
    } else {
      options.sky.updateSunPosition(sunPosition);
    }

    // Create helpers if requested (independent of lighting)
    const helpersConfig = config?.helpers;
    if (helpersConfig !== false) {
      if (typeof helpersConfig === 'boolean' || helpersConfig === undefined) {
        // Default behavior: show all helpers with default scale
        Helpers.createHelpers(scene, 100);
      } else {
        // Granular control: create specific helpers with custom scale
        const scale = helpersConfig.scale || 100; // Default scale factor
        Helpers.createSelectiveHelpers(scene, helpersConfig, scale);
      }
    }

    // Create ground plane if requested
    const groundConfig = config?.ground;
    if (groundConfig?.create !== false) {
      this.createGroundPlane(scene, groundConfig);
    }

    console.log('✅ Workshop demo environment loaded: clean setup (sky + ground)');
  }

  private createGroundPlane(scene: THREE.Scene, config?: WorkshopDemoConfig['ground']): void {
    const size = config?.size ?? { width: 1000, height: 1000 };
    const color = config?.color ?? 0x8fbc8f;
    const opacity = config?.opacity ?? 0.3;

    const groundGeometry = new THREE.PlaneGeometry(size.width, size.height);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
    });

    this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = -15;
    scene.add(this.groundMesh);
  }

  /**
   * Override initializeCore to automatically set up clean environment
   */
  protected override initializeCore(options: StoryOptions): void {
    super.initializeCore(options);

    // Automatically set up clean environment for workshop demos
    this.setupCleanEnvironment(options, this.config as WorkshopDemoConfig);
  }

  /**
   * Utility to create standard HTML label container
   */
  protected createLabelContainer(): HTMLDivElement {
    const labelContainer = document.createElement('div');
    labelContainer.style.position = 'absolute';
    labelContainer.style.top = '0';
    labelContainer.style.left = '0';
    labelContainer.style.width = '100%';
    labelContainer.style.height = '100%';
    labelContainer.style.pointerEvents = 'none';
    document.body.appendChild(labelContainer);
    return labelContainer;
  }

  /**
   * Utility to create standard styled labels
   */
  protected createStandardLabel(text: string, subtitle?: string): HTMLDivElement {
    const label = document.createElement('div');
    label.style.position = 'absolute';
    label.style.color = 'white';
    label.style.padding = '10px';
    label.style.background = 'rgba(0, 0, 0, 0.5)';
    label.style.borderRadius = '5px';
    label.style.textAlign = 'center';
    label.style.fontSize = '14px';
    label.style.fontFamily = 'Arial, sans-serif';

    let html = `<strong>${text}</strong>`;
    if (subtitle) {
      html += `<br><span style="font-size: 12px">${subtitle}</span>`;
    }
    label.innerHTML = html;

    return label;
  }

  /**
   * Utility to start standard animation loop
   */
  protected startAnimationLoop(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    controls: OrbitControls,
    onUpdate?: () => void
  ): void {
    const animate = () => {
      try {
        // Update performance monitoring
        this.updatePerformance();

        // Call custom update function
        if (onUpdate) {
          onUpdate();
        }

        // Update controls
        controls.update();

        renderer.render(scene, camera);
        this.animationId = requestAnimationFrame(animate);
      } catch (error) {
        this.handleError(error as Error, 'animation loop');
      }
    };
    animate();
  }

  /**
   * Clean up workshop demo resources
   */
  public override dispose(): void {
    console.log(`🧹 Disposing workshop demo: ${this.config.name}`);

    // Cancel animation loop
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }

    // Clean up ground mesh
    if (this.groundMesh) {
      if (this.groundMesh.parent) {
        this.groundMesh.parent.remove(this.groundMesh);
      }
      if (this.groundMesh.geometry) {
        this.groundMesh.geometry.dispose();
      }
      if (this.groundMesh.material) {
        if (Array.isArray(this.groundMesh.material)) {
          this.groundMesh.material.forEach(mat => mat.dispose());
        } else {
          this.groundMesh.material.dispose();
        }
      }
      this.groundMesh = undefined;
    }

    // Call parent dispose
    super.dispose();
  }
}
