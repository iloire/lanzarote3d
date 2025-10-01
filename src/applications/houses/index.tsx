import * as THREE from 'three';
import { House, HouseType, BarnLegacy as Barn } from '../../foundation/components/scenery/buildings';
import { VillaLegacy as Villa, TownhouseLegacy as Townhouse, DesertHouseLegacy as DesertHouse } from '../../foundation/components/scenery';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';
import { logger } from '../../foundation/utils/logger';

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

interface HouseStats {
  name: string;
  normalPolygons: number;
  lowPolyPolygons: number;
  reduction: number;
}

class HousesWorkshop extends WorkshopDemoBase {
  private statsOverlay?: HTMLDivElement;
  private toggleButton?: HTMLButtonElement;
  private houseStats: HouseStats[] = [];
  private isOverlayVisible: boolean = true;

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
    this.createStatsOverlay();
    await this.init(scene, camera, renderer, controls, gui);
  }

  private createStatsOverlay(): void {
    // Create toggle button - more visible with clear instructions
    this.toggleButton = document.createElement('button');
    this.toggleButton.innerHTML = '📊 Hide Stats<br><span style="font-size: 10px; opacity: 0.8;">(Click to toggle)</span>';
    this.toggleButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      padding: 14px 24px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      z-index: 1001;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      transition: all 0.3s ease;
      line-height: 1.3;
      text-align: center;
    `;
    this.toggleButton.addEventListener('click', () => this.toggleStatsVisibility());
    this.toggleButton.addEventListener('mouseenter', () => {
      if (this.toggleButton) {
        this.toggleButton.style.transform = 'scale(1.05)';
        this.toggleButton.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.8)';
        this.toggleButton.style.borderColor = 'rgba(255, 255, 255, 0.6)';
      }
    });
    this.toggleButton.addEventListener('mouseleave', () => {
      if (this.toggleButton) {
        this.toggleButton.style.transform = 'scale(1)';
        this.toggleButton.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        this.toggleButton.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      }
    });
    document.body.appendChild(this.toggleButton);

    // Create stats overlay (lighter theme)
    this.statsOverlay = document.createElement('div');
    this.statsOverlay.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      padding: 20px;
      border-radius: 10px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      max-height: 75vh;
      overflow-y: auto;
      min-width: 500px;
      z-index: 1000;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(102, 126, 234, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      transition: all 0.3s ease;
    `;
    document.body.appendChild(this.statsOverlay);
  }

  private toggleStatsVisibility(): void {
    this.isOverlayVisible = !this.isOverlayVisible;

    if (this.statsOverlay) {
      if (this.isOverlayVisible) {
        this.statsOverlay.style.display = 'block';
        this.statsOverlay.style.opacity = '1';
        this.statsOverlay.style.transform = 'translateY(0)';
      } else {
        this.statsOverlay.style.opacity = '0';
        this.statsOverlay.style.transform = 'translateY(20px)';
        setTimeout(() => {
          if (this.statsOverlay) {
            this.statsOverlay.style.display = 'none';
          }
        }, 300);
      }
    }

    if (this.toggleButton) {
      this.toggleButton.innerHTML = this.isOverlayVisible
        ? '📊 Hide Stats<br><span style="font-size: 10px; opacity: 0.8;">(Click to toggle)</span>'
        : '📊 Show Stats<br><span style="font-size: 10px; opacity: 0.8;">(Click to toggle)</span>';
    }
  }

  private updateStatsOverlay(): void {
    if (!this.statsOverlay) return;

    const totalNormal = this.houseStats.reduce((sum, stat) => sum + stat.normalPolygons, 0);
    const totalLowPoly = this.houseStats.reduce((sum, stat) => sum + stat.lowPolyPolygons, 0);
    const overallReduction = Math.round(((totalNormal - totalLowPoly) / totalNormal) * 100);

    let html = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 3px solid #667eea; padding-bottom: 10px; color: #667eea;">
        🏠 House Polygon Comparison
      </div>
      <div style="display: grid; grid-template-columns: 200px 120px 120px 80px; gap: 10px; font-weight: bold; color: #667eea; margin-bottom: 10px; font-size: 12px;">
        <div>House Type</div>
        <div>Normal</div>
        <div>Low-Poly</div>
        <div>Reduction</div>
      </div>
    `;

    this.houseStats.forEach((stat) => {
      html += `
        <div style="display: grid; grid-template-columns: 200px 120px 120px 80px; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(0,0,0,0.08);">
          <div style="color: #333; font-weight: 500;">${stat.name}</div>
          <div style="color: #e74c3c; font-weight: 600;">${formatPolygonCount(stat.normalPolygons)}</div>
          <div style="color: #3498db; font-weight: 600;">${formatPolygonCount(stat.lowPolyPolygons)}</div>
          <div style="color: #27ae60; font-weight: bold;">-${stat.reduction}%</div>
        </div>
      `;
    });

    html += `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 3px solid #667eea; font-weight: bold;">
        <div style="display: grid; grid-template-columns: 200px 120px 120px 80px; gap: 10px;">
          <div style="color: #667eea; font-size: 15px;">TOTAL</div>
          <div style="color: #e74c3c; font-size: 15px;">${formatPolygonCount(totalNormal)}</div>
          <div style="color: #3498db; font-size: 15px;">${formatPolygonCount(totalLowPoly)}</div>
          <div style="color: #27ae60; font-size: 17px;">-${overallReduction}%</div>
        </div>
      </div>
      <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.1); font-size: 12px; color: #666; background: rgba(102, 126, 234, 0.08); padding: 10px; border-radius: 5px;">
        💡 Low-poly versions save <strong style="color: #27ae60;">${formatPolygonCount(totalNormal - totalLowPoly)}</strong> triangles overall
      </div>
    `;

    this.statsOverlay.innerHTML = html;
  }

  async init(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, controls: OrbitControls, gui: GUI): Promise<void> {
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

    logger.info('🏠 Starting comprehensive houses demo...');

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
        const normalHouseMesh = await normalHouse.load();
        normalHouseMesh.position.set(xPosition, 0, normalRow);
        scene.add(normalHouseMesh);

        const normalPolygons = countPolygons(normalHouseMesh);
        scene.add(createLabel(houseConfig.name, new THREE.Vector3(xPosition, 35, normalRow), normalPolygons));
        logger.info(`✅ ${houseConfig.name} normal loaded: ${normalPolygons} triangles`);

        // Low-poly version
        const lowPolyHouse = new House({ type: houseConfig.type, lowPoly: true });
        const lowPolyHouseMesh = await lowPolyHouse.load();
        lowPolyHouseMesh.position.set(xPosition, 0, lowPolyRow);
        scene.add(lowPolyHouseMesh);

        const lowPolyPolygons = countPolygons(lowPolyHouseMesh);
        const reduction = Math.round(((normalPolygons - lowPolyPolygons) / normalPolygons) * 100);
        scene.add(createLabel(`${houseConfig.name} (-${reduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyPolygons));
        logger.info(`✅ ${houseConfig.name} low-poly loaded: ${lowPolyPolygons} triangles (-${reduction}%)`);

        // Add to stats
        this.houseStats.push({
          name: houseConfig.name,
          normalPolygons,
          lowPolyPolygons,
          reduction
        });
        this.updateStatsOverlay();
      } catch (error) {
        logger.error(`❌ Error loading ${houseConfig.name}:`, error);
        scene.add(createLabel(`${houseConfig.name} (Error)`, new THREE.Vector3(xPosition, 25, normalRow)));
      }

      xPosition += spacing;
    }

    // Villa
    xPosition += 40; // Extra spacing for visual separation
    try {
      // Normal Villa
      const normalVilla = new Villa({ lowPoly: false });
      const normalVillaMesh = await normalVilla.load();
      normalVillaMesh.position.set(xPosition, 0, normalRow);
      scene.add(normalVillaMesh);

      const normalVillaPolygons = countPolygons(normalVillaMesh);
      scene.add(createLabel('Villa', new THREE.Vector3(xPosition, 35, normalRow), normalVillaPolygons));
      logger.info(`✅ Villa normal loaded: ${normalVillaPolygons} triangles`);

      // Low-poly Villa
      const lowPolyVilla = new Villa({ lowPoly: true });
      const lowPolyVillaMesh = await lowPolyVilla.load();
      lowPolyVillaMesh.position.set(xPosition, 0, lowPolyRow);
      scene.add(lowPolyVillaMesh);

      const lowPolyVillaPolygons = countPolygons(lowPolyVillaMesh);
      const villaReduction = Math.round(((normalVillaPolygons - lowPolyVillaPolygons) / normalVillaPolygons) * 100);
      scene.add(createLabel(`Villa (-${villaReduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyVillaPolygons));
      logger.info(`✅ Villa low-poly loaded: ${lowPolyVillaPolygons} triangles (-${villaReduction}%)`);

      // Add to stats
      this.houseStats.push({
        name: 'Villa',
        normalPolygons: normalVillaPolygons,
        lowPolyPolygons: lowPolyVillaPolygons,
        reduction: villaReduction
      });
      this.updateStatsOverlay();
    } catch (error) {
      logger.error('❌ Error loading Villa:', error);
      scene.add(createLabel('Villa (Error)', new THREE.Vector3(xPosition, 35, normalRow)));
    }

    xPosition += spacing;

    // Townhouse
    try {
      // Normal Townhouse
      const normalTownhouse = new Townhouse({ lowPoly: false });
      const normalTownhouseMesh = await normalTownhouse.load();
      normalTownhouseMesh.position.set(xPosition, 0, normalRow);
      scene.add(normalTownhouseMesh);

      const normalTownhousePolygons = countPolygons(normalTownhouseMesh);
      scene.add(createLabel('Townhouse', new THREE.Vector3(xPosition, 35, normalRow), normalTownhousePolygons));
      logger.info(`✅ Townhouse normal loaded: ${normalTownhousePolygons} triangles`);

      // Low-poly Townhouse
      const lowPolyTownhouse = new Townhouse({ lowPoly: true });
      const lowPolyTownhouseMesh = await lowPolyTownhouse.load();
      lowPolyTownhouseMesh.position.set(xPosition, 0, lowPolyRow);
      scene.add(lowPolyTownhouseMesh);

      const lowPolyTownhousePolygons = countPolygons(lowPolyTownhouseMesh);
      const townhouseReduction = Math.round(((normalTownhousePolygons - lowPolyTownhousePolygons) / normalTownhousePolygons) * 100);
      scene.add(createLabel(`Townhouse (-${townhouseReduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyTownhousePolygons));
      logger.info(`✅ Townhouse low-poly loaded: ${lowPolyTownhousePolygons} triangles (-${townhouseReduction}%)`);

      // Add to stats
      this.houseStats.push({
        name: 'Townhouse',
        normalPolygons: normalTownhousePolygons,
        lowPolyPolygons: lowPolyTownhousePolygons,
        reduction: townhouseReduction
      });
      this.updateStatsOverlay();
    } catch (error) {
      logger.error('❌ Error loading Townhouse:', error);
      scene.add(createLabel('Townhouse (Error)', new THREE.Vector3(xPosition, 35, normalRow)));
    }

    xPosition += spacing;

    // Barn
    try {
      // Normal Barn
      const normalBarn = new Barn({ lowPoly: false });
      const normalBarnMesh = await normalBarn.load();
      normalBarnMesh.position.set(xPosition, 0, normalRow);
      scene.add(normalBarnMesh);

      const normalBarnPolygons = countPolygons(normalBarnMesh);
      scene.add(createLabel('Barn', new THREE.Vector3(xPosition, 35, normalRow), normalBarnPolygons));
      logger.info(`✅ Barn normal loaded: ${normalBarnPolygons} triangles`);

      // Low-poly Barn
      const lowPolyBarn = new Barn({ lowPoly: true });
      const lowPolyBarnMesh = await lowPolyBarn.load();
      lowPolyBarnMesh.position.set(xPosition, 0, lowPolyRow);
      scene.add(lowPolyBarnMesh);

      const lowPolyBarnPolygons = countPolygons(lowPolyBarnMesh);
      const barnReduction = Math.round(((normalBarnPolygons - lowPolyBarnPolygons) / normalBarnPolygons) * 100);
      scene.add(createLabel(`Barn (-${barnReduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyBarnPolygons));
      logger.info(`✅ Barn low-poly loaded: ${lowPolyBarnPolygons} triangles (-${barnReduction}%)`);

      // Add to stats
      this.houseStats.push({
        name: 'Barn',
        normalPolygons: normalBarnPolygons,
        lowPolyPolygons: lowPolyBarnPolygons,
        reduction: barnReduction
      });
      this.updateStatsOverlay();
    } catch (error) {
      logger.error('❌ Error loading Barn:', error);
      scene.add(createLabel('Barn (Error)', new THREE.Vector3(xPosition, 35, normalRow)));
    }

    xPosition += spacing;

    // DesertHouse
    try {
      // Normal DesertHouse
      const normalDesertHouse = new DesertHouse({ lowPoly: false });
      const normalDesertHouseMesh = await normalDesertHouse.load();
      normalDesertHouseMesh.position.set(xPosition, 0, normalRow);
      scene.add(normalDesertHouseMesh);

      const normalDesertHousePolygons = countPolygons(normalDesertHouseMesh);
      scene.add(createLabel('Desert House', new THREE.Vector3(xPosition, 35, normalRow), normalDesertHousePolygons));
      logger.info(`✅ DesertHouse normal loaded: ${normalDesertHousePolygons} triangles`);

      // Low-poly DesertHouse
      const lowPolyDesertHouse = new DesertHouse({ lowPoly: true });
      const lowPolyDesertHouseMesh = await lowPolyDesertHouse.load();
      lowPolyDesertHouseMesh.position.set(xPosition, 0, lowPolyRow);
      scene.add(lowPolyDesertHouseMesh);

      const lowPolyDesertHousePolygons = countPolygons(lowPolyDesertHouseMesh);
      const desertHouseReduction = Math.round(((normalDesertHousePolygons - lowPolyDesertHousePolygons) / normalDesertHousePolygons) * 100);
      scene.add(createLabel(`Desert House (-${desertHouseReduction}%)`, new THREE.Vector3(xPosition, 35, lowPolyRow), lowPolyDesertHousePolygons));
      logger.info(`✅ DesertHouse low-poly loaded: ${lowPolyDesertHousePolygons} triangles (-${desertHouseReduction}%)`);

      // Add to stats
      this.houseStats.push({
        name: 'Desert House',
        normalPolygons: normalDesertHousePolygons,
        lowPolyPolygons: lowPolyDesertHousePolygons,
        reduction: desertHouseReduction
      });
      this.updateStatsOverlay();
    } catch (error) {
      logger.error('❌ Error loading DesertHouse:', error);
      scene.add(createLabel('Desert House (Error)', new THREE.Vector3(xPosition, 35, normalRow)));
    }

    logger.info('🏠 Houses demo setup complete - all types loaded!');

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

  public override dispose(): void {
    // Remove stats overlay
    if (this.statsOverlay && this.statsOverlay.parentElement) {
      this.statsOverlay.parentElement.removeChild(this.statsOverlay);
    }

    // Remove toggle button
    if (this.toggleButton && this.toggleButton.parentElement) {
      this.toggleButton.parentElement.removeChild(this.toggleButton);
    }

    // Call parent dispose
    super.dispose();
  }
}

export default new HousesWorkshop();