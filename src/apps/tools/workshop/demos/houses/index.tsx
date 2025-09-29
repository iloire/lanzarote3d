import * as THREE from 'three';
import { House, HouseType, BarnLegacy as Barn } from '../../../../../foundation/components/scenery/buildings';
import { VillaLegacy as Villa, TownhouseLegacy as Townhouse, DesertHouseLegacy as DesertHouse } from '../../../../../foundation/components/scenery';
import { StoryOptions } from '../../../../shared/types';
import { WorkshopDemoBase } from '../../../../shared/WorkshopDemoBase';

/**
 * Count the total number of triangles/polygons in a 3D object
 */
const countPolygons = (object: THREE.Object3D): number => {
  let totalTriangles = 0;

  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geometry = child.geometry;

      if (geometry.index !== null) {
        // Indexed geometry
        totalTriangles += geometry.index.count / 3;
      } else {
        // Non-indexed geometry
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

    // Polygon count with better styling
    if (polygonCount !== undefined) {
      context.fillStyle = '#00ff88'; // Bright green
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
  sprite.scale.set(12, 3, 1); // Larger labels

  return sprite;
};

class HousesWorkshop extends WorkshopDemoBase {
  constructor() {
    super({
      name: 'Houses Workshop',
      description: 'House component showcase comparing normal vs low-poly versions',
      requiredComponents: ['scene', 'camera', 'renderer', 'gui'],
      ground: {
        create: true,
        size: { width: 600, height: 150 }, // Larger ground to accommodate wider layout
        color: 0x90EE90,
        opacity: 0.8
      }
    });
  }

  async load(options: StoryOptions): Promise<void> {
    this.initializeCore(options);
    this.setupCleanEnvironment(options);

    const { scene, camera, renderer, controls, gui } = options;
    await this.init(scene, camera, renderer, controls, gui);
  }

  async init(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, controls: any, gui: any): Promise<void> {
    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Ground is created automatically by WorkshopDemoBase

    // House showcase positions - organized in a more spacious grid
    const normalRow = -30; // z position for normal houses (moved further back)
    const lowPolyRow = 30; // z position for low-poly houses (moved further forward)

    // Row labels with better positioning
    scene.add(createLabel('🏠 Normal Detail Houses', new THREE.Vector3(0, 15, normalRow - 20)));
    scene.add(createLabel('⚡ Low-Poly Optimized', new THREE.Vector3(0, 15, lowPolyRow + 20)));

    let xPosition = -200; // Start further left
    const spacing = 80; // Increase spacing between houses

    console.log('🏠 Starting comprehensive houses demo...');

    // All House Types
    const houseTypes = [
      { type: HouseType.Small, name: 'House Small' },
      { type: HouseType.Medium, name: 'House Medium' },
      { type: HouseType.Large, name: 'House Large' },
      { type: HouseType.Modern, name: 'House Modern' }
    ];

    for (const houseConfig of houseTypes) {
      try {
        // Normal version
        const normalHouse = new House({ type: houseConfig.type, lowPoly: false });
        const normalHouseMesh = normalHouse.load();
        if (normalHouseMesh) {
          normalHouseMesh.position.set(xPosition, 0, normalRow);
          scene.add(normalHouseMesh);

          const normalPolygons = countPolygons(normalHouseMesh);
          scene.add(createLabel(houseConfig.name, new THREE.Vector3(xPosition, 35, normalRow), normalPolygons)); // Higher labels
          console.log(`✅ ${houseConfig.name} normal loaded: ${normalPolygons} triangles`);

          // Low-poly version
          const lowPolyHouse = new House({ type: houseConfig.type, lowPoly: true });
          const lowPolyHouseMesh = lowPolyHouse.load();
          if (lowPolyHouseMesh) {
            lowPolyHouseMesh.position.set(xPosition, 0, lowPolyRow);
            scene.add(lowPolyHouseMesh);

            const lowPolyPolygons = countPolygons(lowPolyHouseMesh);
            const reduction = Math.round(((normalPolygons - lowPolyPolygons) / normalPolygons) * 100);
            scene.add(createLabel(`${houseConfig.name} (-${reduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyPolygons)); // Higher labels
            console.log(`✅ ${houseConfig.name} low-poly loaded: ${lowPolyPolygons} triangles (-${reduction}%)`);
          } else {
            scene.add(createLabel(`${houseConfig.name} (Low-poly Failed)`, new THREE.Vector3(xPosition, 35, lowPolyRow)));
          }
        } else {
          scene.add(createLabel(`${houseConfig.name} (Failed)`, new THREE.Vector3(xPosition, 35, normalRow)));
        }
      } catch (error) {
        console.error(`❌ Error loading ${houseConfig.name}:`, error);
        scene.add(createLabel(`${houseConfig.name} (Error)`, new THREE.Vector3(xPosition, 25, normalRow)));
      }

      xPosition += spacing;
    }

    // Villa
    xPosition += 40; // Extra spacing for visual separation
    try {
      // Normal Villa
      const normalVilla = new Villa({ lowPoly: false });
      const normalVillaMesh = normalVilla.load();
      if (normalVillaMesh) {
        normalVillaMesh.position.set(xPosition, 0, normalRow);
        scene.add(normalVillaMesh);

        const normalVillaPolygons = countPolygons(normalVillaMesh);
        scene.add(createLabel('Villa', new THREE.Vector3(xPosition, 35, normalRow), normalVillaPolygons));
        console.log(`✅ Villa normal loaded: ${normalVillaPolygons} triangles`);

        // Low-poly Villa
        const lowPolyVilla = new Villa({ lowPoly: true });
        const lowPolyVillaMesh = lowPolyVilla.load();
        if (lowPolyVillaMesh) {
          lowPolyVillaMesh.position.set(xPosition, 0, lowPolyRow);
          scene.add(lowPolyVillaMesh);

          const lowPolyVillaPolygons = countPolygons(lowPolyVillaMesh);
          const villaReduction = Math.round(((normalVillaPolygons - lowPolyVillaPolygons) / normalVillaPolygons) * 100);
          scene.add(createLabel(`Villa (-${villaReduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyVillaPolygons));
          console.log(`✅ Villa low-poly loaded: ${lowPolyVillaPolygons} triangles (-${villaReduction}%)`);
        } else {
          scene.add(createLabel('Villa (Low-poly Failed)', new THREE.Vector3(xPosition, 35, lowPolyRow)));
        }
      } else {
        scene.add(createLabel('Villa (Failed)', new THREE.Vector3(xPosition, 35, normalRow)));
      }
    } catch (error) {
      console.error('❌ Error loading Villa:', error);
      scene.add(createLabel('Villa (Error)', new THREE.Vector3(xPosition, 35, normalRow)));
    }

    xPosition += spacing;

    // Townhouse
    try {
      // Normal Townhouse
      const normalTownhouse = new Townhouse({ lowPoly: false });
      const normalTownhouseMesh = normalTownhouse.load();
      if (normalTownhouseMesh) {
        normalTownhouseMesh.position.set(xPosition, 0, normalRow);
        scene.add(normalTownhouseMesh);

        const normalTownhousePolygons = countPolygons(normalTownhouseMesh);
        scene.add(createLabel('Townhouse', new THREE.Vector3(xPosition, 35, normalRow), normalTownhousePolygons));
        console.log(`✅ Townhouse normal loaded: ${normalTownhousePolygons} triangles`);

        // Low-poly Townhouse
        const lowPolyTownhouse = new Townhouse({ lowPoly: true });
        const lowPolyTownhouseMesh = lowPolyTownhouse.load();
        if (lowPolyTownhouseMesh) {
          lowPolyTownhouseMesh.position.set(xPosition, 0, lowPolyRow);
          scene.add(lowPolyTownhouseMesh);

          const lowPolyTownhousePolygons = countPolygons(lowPolyTownhouseMesh);
          const townhouseReduction = Math.round(((normalTownhousePolygons - lowPolyTownhousePolygons) / normalTownhousePolygons) * 100);
          scene.add(createLabel(`Townhouse (-${townhouseReduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyTownhousePolygons));
          console.log(`✅ Townhouse low-poly loaded: ${lowPolyTownhousePolygons} triangles (-${townhouseReduction}%)`);
        } else {
          scene.add(createLabel('Townhouse (Low-poly Failed)', new THREE.Vector3(xPosition, 35, lowPolyRow)));
        }
      } else {
        scene.add(createLabel('Townhouse (Failed)', new THREE.Vector3(xPosition, 35, normalRow)));
      }
    } catch (error) {
      console.error('❌ Error loading Townhouse:', error);
      scene.add(createLabel('Townhouse (Error)', new THREE.Vector3(xPosition, 35, normalRow)));
    }

    xPosition += spacing;

    // Barn
    try {
      // Normal Barn
      const normalBarn = new Barn({ lowPoly: false });
      const normalBarnMesh = normalBarn.load();
      if (normalBarnMesh) {
        normalBarnMesh.position.set(xPosition, 0, normalRow);
        scene.add(normalBarnMesh);

        const normalBarnPolygons = countPolygons(normalBarnMesh);
        scene.add(createLabel('Barn', new THREE.Vector3(xPosition, 35, normalRow), normalBarnPolygons));
        console.log(`✅ Barn normal loaded: ${normalBarnPolygons} triangles`);

        // Low-poly Barn
        const lowPolyBarn = new Barn({ lowPoly: true });
        const lowPolyBarnMesh = lowPolyBarn.load();
        if (lowPolyBarnMesh) {
          lowPolyBarnMesh.position.set(xPosition, 0, lowPolyRow);
          scene.add(lowPolyBarnMesh);

          const lowPolyBarnPolygons = countPolygons(lowPolyBarnMesh);
          const barnReduction = Math.round(((normalBarnPolygons - lowPolyBarnPolygons) / normalBarnPolygons) * 100);
          scene.add(createLabel(`Barn (-${barnReduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyBarnPolygons));
          console.log(`✅ Barn low-poly loaded: ${lowPolyBarnPolygons} triangles (-${barnReduction}%)`);
        } else {
          scene.add(createLabel('Barn (Low-poly Failed)', new THREE.Vector3(xPosition, 35, lowPolyRow)));
        }
      } else {
        scene.add(createLabel('Barn (Failed)', new THREE.Vector3(xPosition, 35, normalRow)));
      }
    } catch (error) {
      console.error('❌ Error loading Barn:', error);
      scene.add(createLabel('Barn (Error)', new THREE.Vector3(xPosition, 35, normalRow)));
    }

    xPosition += spacing;

    // DesertHouse
    try {
      // Normal DesertHouse
      const normalDesertHouse = new DesertHouse({ lowPoly: false });
      const normalDesertHouseMesh = normalDesertHouse.load();
      if (normalDesertHouseMesh) {
        normalDesertHouseMesh.position.set(xPosition, 0, normalRow);
        scene.add(normalDesertHouseMesh);

        const normalDesertHousePolygons = countPolygons(normalDesertHouseMesh);
        scene.add(createLabel('Desert House', new THREE.Vector3(xPosition, 35, normalRow), normalDesertHousePolygons));
        console.log(`✅ DesertHouse normal loaded: ${normalDesertHousePolygons} triangles`);

        // Low-poly DesertHouse
        const lowPolyDesertHouse = new DesertHouse({ lowPoly: true });
        const lowPolyDesertHouseMesh = lowPolyDesertHouse.load();
        if (lowPolyDesertHouseMesh) {
          lowPolyDesertHouseMesh.position.set(xPosition, 0, lowPolyRow);
          scene.add(lowPolyDesertHouseMesh);

          const lowPolyDesertHousePolygons = countPolygons(lowPolyDesertHouseMesh);
          const desertHouseReduction = Math.round(((normalDesertHousePolygons - lowPolyDesertHousePolygons) / normalDesertHousePolygons) * 100);
          scene.add(createLabel(`Desert House (-${desertHouseReduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyDesertHousePolygons));
          console.log(`✅ DesertHouse low-poly loaded: ${lowPolyDesertHousePolygons} triangles (-${desertHouseReduction}%)`);
        } else {
          scene.add(createLabel('Desert House (Low-poly Failed)', new THREE.Vector3(xPosition, 35, lowPolyRow)));
        }
      } else {
        scene.add(createLabel('Desert House (Failed)', new THREE.Vector3(xPosition, 35, normalRow)));
      }
    } catch (error) {
      console.error('❌ Error loading DesertHouse:', error);
      scene.add(createLabel('Desert House (Error)', new THREE.Vector3(xPosition, 35, normalRow)));
    }

    console.log('🏠 Houses demo setup complete - all types loaded!');

    // Position camera to view the reorganized scene
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.position.set(0, 50, 80); // Higher and further back for better overview
      camera.lookAt(0, 15, 0); // Look at the middle height of labels
    }

    // Add GUI controls for camera
    if (gui) {
      const cameraFolder = gui.addFolder('Camera');
      cameraFolder.add(camera.position, 'x', -100, 100).name('Camera X');
      cameraFolder.add(camera.position, 'y', 5, 80).name('Camera Y');
      cameraFolder.add(camera.position, 'z', -100, 100).name('Camera Z');
      cameraFolder.open();
    }

    // Start animation loop
    this.startAnimationLoop(renderer, scene, camera, controls);
  }
}

export default new HousesWorkshop();