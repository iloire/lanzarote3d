import * as THREE from 'three';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { Jet, Airliner, Cessna } from '../../foundation/components/vehicles';

/**
 * Utility function to count polygons in a 3D object
 */
const countPolygons = (object: THREE.Object3D): number => {
  let totalTriangles = 0;

  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry;

      if (geometry.index !== null) {
        totalTriangles += geometry.index.count / 3;
      } else {
        const positionAttribute = geometry.getAttribute('position');
        if (positionAttribute) {
          totalTriangles += positionAttribute.count / 3;
        }
      }
    }
  });

  return Math.floor(totalTriangles);
};

/**
 * Format polygon count for display
 */
const formatPolygonCount = (count: number): string => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

/**
 * Create label for aircraft
 */
const createLabel = (text: string, position: THREE.Vector3, polygonCount?: number) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 400;
  canvas.height = 100;

  if (context) {
    // Background with rounded corners
    context.fillStyle = 'rgba(0, 0, 0, 0.85)';
    context.roundRect(5, 5, canvas.width - 10, canvas.height - 10, 8);
    context.fill();

    // Border
    context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    context.lineWidth = 1;
    context.stroke();

    // Main title
    context.fillStyle = '#ffffff';
    context.font = 'bold 20px Arial';
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, 35);

    // Polygon count
    if (polygonCount !== undefined) {
      context.fillStyle = '#00ff88';
      context.font = 'bold 14px Arial';
      context.fillText(`${formatPolygonCount(polygonCount)} triangles`, canvas.width / 2, 65);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1
  });
  const sprite = new THREE.Sprite(spriteMaterial);

  sprite.position.copy(position);
  sprite.scale.set(12, 3, 1);

  return sprite;
};

/**
 * Planes Application - Showcase of all three aircraft types
 */
class PlanesApp extends WorkshopDemoBase {
  private aircraftMeshes: THREE.Object3D[] = [];
  private labelMeshes: THREE.Sprite[] = [];

  constructor() {
    super({
      name: 'Planes',
      description: 'Aircraft showcase - Jet, Airliner, and Cessna',
      ground: {
        create: true,
        size: { width: 400, height: 200 },
        color: 0x4a6741, // Dark green
        opacity: 0.8
      },
      lighting: {
        sunPosition: 0.3,
      },
      helpers: false
    });
  }

  override async load(options: StoryOptions): Promise<void> {
    try {
      // Initialize core systems
      this.initializeCore(options);

      // Set up clean workshop environment
      this.setupCleanEnvironment(options);

      const { camera, scene, renderer, gui, controls } = options;

      // Create all aircraft
      await this.createAircraft(scene);

      // Setup camera
      this.setupCamera(camera, controls);

      // Setup GUI controls
      if (gui) {
        this.setupGUI(gui);
      }

      // Start animation loop
      this.startAnimationLoop(renderer, scene, camera, controls, () => {
        // Keep labels facing the camera
        this.labelMeshes.forEach(label => {
          label.quaternion.copy(camera.quaternion);
        });
      });

      this.isLoaded = true;
      console.log(`✅ Planes application loaded with ${this.aircraftMeshes.length} aircraft`);

    } catch (error) {
      this.handleError(error as Error, 'load');
      throw error;
    }
  }

  private async createAircraft(scene: THREE.Scene): Promise<void> {
    console.log('✈️ Creating aircraft showcase...');

    const spacing = 80;
    let xPosition = -spacing;

    // Create Jet
    try {
      const jet = new Jet({
        bodyColor: '#4A5568',
        wingColor: '#2D3748',
        cockpitColor: '#3B82F6',
        scale: 2,
        castShadow: true,
        receiveShadow: true
      });

      const jetMesh = await jet.load();
      jetMesh.position.set(xPosition, 5, 0);
      jetMesh.rotation.y = Math.PI / 4;
      scene.add(jetMesh);
      this.aircraftMeshes.push(jetMesh);

      const jetPolygons = countPolygons(jetMesh);
      const jetLabel = createLabel('Jet - Military Aircraft', new THREE.Vector3(xPosition, 25, 0), jetPolygons);
      scene.add(jetLabel);
      this.labelMeshes.push(jetLabel);

      console.log(`✅ Jet loaded: ${jetPolygons} triangles`);
    } catch (error) {
      console.error('❌ Error loading Jet:', error);
    }

    xPosition += spacing;

    // Create Airliner
    try {
      const airliner = new Airliner({
        bodyColor: '#FFFFFF',
        wingColor: '#E5E5E5',
        windowColor: '#4169E1',
        stripeColor: '#DC143C',
        scale: 1.5,
        castShadow: true,
        receiveShadow: true
      });

      const airlinerMesh = await airliner.load();
      airlinerMesh.position.set(xPosition, 5, 0);
      airlinerMesh.rotation.y = Math.PI / 4;
      scene.add(airlinerMesh);
      this.aircraftMeshes.push(airlinerMesh);

      const airlinerPolygons = countPolygons(airlinerMesh);
      const airlinerLabel = createLabel('Airliner - Commercial Passenger', new THREE.Vector3(xPosition, 25, 0), airlinerPolygons);
      scene.add(airlinerLabel);
      this.labelMeshes.push(airlinerLabel);

      console.log(`✅ Airliner loaded: ${airlinerPolygons} triangles`);
    } catch (error) {
      console.error('❌ Error loading Airliner:', error);
    }

    xPosition += spacing;

    // Create Cessna
    try {
      const cessna = new Cessna({
        bodyColor: '#F4F4F4',
        wingColor: '#E8E8E8',
        propellerColor: '#2C3E50',
        stripeColor: '#FF4500',
        scale: 2,
        castShadow: true,
        receiveShadow: true
      });

      const cessnaMesh = await cessna.load();
      cessnaMesh.position.set(xPosition, 5, 0);
      cessnaMesh.rotation.y = Math.PI / 4;
      scene.add(cessnaMesh);
      this.aircraftMeshes.push(cessnaMesh);

      const cessnaPolygons = countPolygons(cessnaMesh);
      const cessnaLabel = createLabel('Cessna - General Aviation', new THREE.Vector3(xPosition, 25, 0), cessnaPolygons);
      scene.add(cessnaLabel);
      this.labelMeshes.push(cessnaLabel);

      console.log(`✅ Cessna loaded: ${cessnaPolygons} triangles`);
    } catch (error) {
      console.error('❌ Error loading Cessna:', error);
    }

    console.log('✈️ Aircraft showcase complete');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setupCamera(camera: THREE.PerspectiveCamera, controls: any): void {
    camera.position.set(0, 50, 120);
    camera.lookAt(0, 10, 0);
    console.log('📷 Camera positioned for aircraft showcase');

    if (controls) {
      controls.target.set(0, 10, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.update();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setupGUI(gui: any): void {
    const aircraftFolder = gui.addFolder('Aircraft Controls');

    if (this.aircraftMeshes.length > 0) {
      const params = {
        rotateAll: () => {
          this.aircraftMeshes.forEach(mesh => {
            mesh.rotation.y += Math.PI / 4;
          });
        },
        resetRotation: () => {
          this.aircraftMeshes.forEach(mesh => {
            mesh.rotation.y = Math.PI / 4;
          });
        }
      };

      aircraftFolder.add(params, 'rotateAll').name('Rotate All 45°');
      aircraftFolder.add(params, 'resetRotation').name('Reset Rotation');
    }

    aircraftFolder.add({ info: 'Three types of aircraft' }, 'info').name('Description');
    aircraftFolder.open();
  }

  override dispose(): void {
    console.log('🧹 Disposing Planes application');

    this.aircraftMeshes.forEach(mesh => {
      if (mesh instanceof THREE.Mesh) {
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material?.dispose();
        }
      }
    });
    this.aircraftMeshes.length = 0;

    this.labelMeshes.forEach(label => {
      label.geometry?.dispose();
      if (label.material instanceof THREE.Material) {
        label.material.dispose();
      }
    });
    this.labelMeshes.length = 0;

    super.dispose();
  }
}

// Create singleton instance
const planesApp = new PlanesApp();

// Export in the expected format for the app system
const Planes = {
  load: async (options: StoryOptions) => {
    return planesApp.load(options);
  },
  dispose: () => {
    return planesApp.dispose();
  },
  getAppInfo: () => {
    return planesApp.getAppInfo();
  },
};

export default Planes;
