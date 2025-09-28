import * as THREE from 'three';
// TODO: Migrate to modern Pilot from '../characters/Pilot' when updating Hangglider architecture
import LegacyPilot from './Pilot';
import HangGliderWing from './HangGliderWing';
import GuiHelper from '../../utils/gui';
import AutoFlier from '../../types/auto-flier';
import { PilotHeadType } from '../characters/PilotHead';

const DEFAULT_OPTIONS = {
  head: {
    headType: PilotHeadType.Default,
    helmetOptions: {
      color: '#ffffff',
      color2: '#cccccc',
      color3: '#999999',
    },
  },
  // ... rest of options
};

class HangGliderModel extends AutoFlier {
  wing!: HangGliderWing;
  pilot!: LegacyPilot;

  async load(path: THREE.Vector3[], gui?: any): Promise<THREE.Mesh> {
    this.path = path;
    this.mesh = new THREE.Mesh();

    // wing
    const wing = new HangGliderWing();
    const wingMesh = await wing.load();
    wingMesh.position.y = 10;
    wingMesh.position.x = -40;

    // pilot
    this.pilot = new LegacyPilot(DEFAULT_OPTIONS);
    const pilotMesh = await this.pilot.load();
    const pilotScale = 0.03;
    pilotMesh.scale.set(pilotScale, pilotScale, pilotScale);
    pilotMesh.position.x = -5;
    pilotMesh.position.z = -0.4;
    pilotMesh.rotateY(Math.PI / 2);

    this.mesh.add(pilotMesh);
    this.mesh.add(wingMesh);

    if (path.length > 0 && path[0]) {
      this.mesh.position.copy(path[0]);
    }

    if (gui) {
      GuiHelper.addLocationGui(gui, 'Hanglider pilot', pilotMesh);
      GuiHelper.addLocationGui(gui, 'Hanglider', this.mesh);
    }

    this.animate();
    return this.mesh;
  }

  private animationId: number | null = null;
  private isAnimating: boolean = false;

  animate() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.startAnimation();
    }
  }

  private startAnimation() {
    const animateLoop = () => {
      if (!this.isAnimating) return;

      if (this.path.length) {
        this.move();
      }

      this.animationId = requestAnimationFrame(animateLoop);
    };
    animateLoop();
  }

  stop() {
    this.isAnimating = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  dispose() {
    this.stop();
    // Clean up mesh and materials if needed
    if (this.mesh) {
      this.mesh.geometry?.dispose();
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(material => material.dispose());
      } else {
        this.mesh.material?.dispose();
      }
    }
  }
}

export default HangGliderModel;
