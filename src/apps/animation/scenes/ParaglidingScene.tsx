import * as THREE from "three";
import { update } from "@tweenjs/tween.js";
import {
  Paraglider,
  Sky,
  Weather,
  SoundManager
} from '../../../foundation';
import { StoryOptions } from "../../shared/types";

export interface ParaglidingSceneConfig {
  paragliders: Array<{
    position: THREE.Vector3;
    gliderOptions: any;
  }>;
}

export class ParaglidingScene {
  private soundManager: SoundManager;
  private weather: Weather;
  private paragliders: Paraglider[] = [];
  private scene: THREE.Scene | null = null;

  constructor(config: ParaglidingSceneConfig) {

    // Weather system
    this.weather = new Weather({
      windDirectionDegreesFromNorth: 310,
      speedMetresPerSecond: 18 / 3.6,
      lclLevel: 1800
    });

    // Sound management
    this.soundManager = new SoundManager();
    this.setupAudio();

    // Create paragliders
    this.createParagliders(config.paragliders);
  }

  private async setupAudio(): Promise<void> {
    try {
      await this.soundManager.loadSound(
        'wind',
        '/assets/foundation/audio/environment/wind-howl-01.mp3',
        { volume: 0.3, loop: true, positional: false }
      );

      await this.soundManager.loadSound(
        'ambient',
        '/assets/foundation/audio/environment/the-beat-of-nature-122841.mp3',
        { volume: 0.2, loop: true, positional: false }
      );

      this.soundManager.play('wind');
      this.soundManager.play('ambient');
    } catch (error) {
      // Audio loading failed (optional)
    }
  }

  private async createParagliders(configs: any[]): Promise<void> {
    for (const config of configs) {
      const paraglider = new Paraglider({
        glider: config.gliderOptions || {
          wingColor1: '#c30010',
          wingColor2: '#b100cd',
          numeroCajones: 35
        },
        pilot: {}
      });

      const mesh = await paraglider.load();
      mesh.position.copy(config.position);

      if (this.scene) {
        this.scene.add(mesh);
      }
      this.paragliders.push(paraglider);
    }
  }

  load(options: StoryOptions): void {
    const { camera, renderer, gui, scene } = options;
    this.scene = scene;

    // Setup fog for atmosphere
    scene.fog = new THREE.Fog(0x87CEEB, 1000, 20000);

    // Setup sky
    const sky = new Sky();
    sky.updateSunPosition(14); // Afternoon lighting
    scene.add(sky); // Sky extends THREE.Object3D, so add it directly

    // Add weather controls to GUI
    this.weather.addGui(gui);

    // Animation loop optimized for showcase
    const animate = () => {
      requestAnimationFrame(animate);

      // Update tweens for smooth animations
      update(performance.now());

      // Animate paragliders in formation
      this.animateParagliders();

      // Render the scene
      renderer.render(scene, camera);
    };

    // Set dramatic camera position
    camera.position.set(0, 800, 2000);
    camera.lookAt(0, 400, 0);

    animate();
  }

  private animateParagliders(): void {
    const time = Date.now() * 0.001;

    this.paragliders.forEach((paraglider, index) => {
      const mesh = paraglider.getMesh();
      if (mesh) {
        // Smooth circular flight pattern
        const radius = 1000 + index * 200;
        const speed = 0.5 + index * 0.1;

        mesh.position.x = Math.cos(time * speed + index) * radius;
        mesh.position.z = Math.sin(time * speed + index) * radius;
        mesh.position.y = 600 + Math.sin(time + index) * 100;

        // Banking turns
        mesh.rotation.z = Math.sin(time * speed + index) * 0.3;
        mesh.rotation.y = time * speed + index + Math.PI / 2;
      }
    });
  }

  dispose(): void {
    this.soundManager.dispose();
    this.sceneManager.dispose();
  }
}

// Factory function for clean instantiation
export const createParaglidingScene = (config: ParaglidingSceneConfig) => {
  return new ParaglidingScene(config);
};

export default ParaglidingScene;