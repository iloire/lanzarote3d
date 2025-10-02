import * as THREE from 'three';
import {
  House,
  HouseType,
  Barn,
  Hospital,
  Dome,
  Villa,
  Townhouse,
  DesertHouse
} from '../../foundation/components/scenery/buildings';
import { TownSquare } from '../../foundation/components/scenery';
import { StoryOptions } from '../../shared/types';
import { WorkshopDemoBase } from '../../shared/WorkshopDemoBase';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GUI } from 'lil-gui';
import { logger } from '../../foundation/utils/logger';
import { LevelOfDetail } from '../../foundation/types/lod';
import { countPolygons } from './utils/polygonCounter';
import { createLabel } from './utils/labelCreator';
import { BuildingStatsTracker } from './utils/buildingStatsTracker';
import { ShowcaseCameraController } from '../../foundation/systems/scene/ShowcaseCameraController';

class BuildingsWorkshop extends WorkshopDemoBase {
  private statsTracker: BuildingStatsTracker;
  private cameraController: ShowcaseCameraController;

  constructor() {
    super({
      name: 'Buildings Workshop - LOD System',
      description: 'Building component showcase with 4 LOD levels (ULTRA_LOW, LOW, MEDIUM, HIGH)',
      requiredComponents: ['scene', 'camera', 'renderer', 'gui'],
      ground: {
        create: true,
        size: { width: 1200, height: 200 }, // Even larger ground for 4 rows
        color: 0x90EE90,
        opacity: 0.8
      }
    });

    // Initialize utilities
    this.statsTracker = new BuildingStatsTracker();
    this.cameraController = new ShowcaseCameraController();
  }

  async load(options: StoryOptions): Promise<void> {
    this.initializeCore(options);
    this.setupCleanEnvironment(options);

    const { scene, camera, renderer, controls, gui } = options;
    await this.init(scene, camera, renderer, controls, gui);
  }

  async init(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer, controls: OrbitControls, gui: GUI): Promise<void> {
    // Initialize camera controller
    this.cameraController.setCamera(camera, controls);

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

    // House showcase positions - organized in 4 rows for LOD levels
    const ultraLowRow = -60; // z position for ultra-low LOD (furthest back)
    const lowRow = -20; // z position for low LOD
    const mediumRow = 20; // z position for medium LOD
    const highRow = 60; // z position for high LOD (furthest forward)

    // Row labels with better positioning
    scene.add(createLabel('ULTRA_LOW (10-100 polys)', new THREE.Vector3(0, 15, ultraLowRow - 20)));
    scene.add(createLabel('LOW (100-500 polys)', new THREE.Vector3(0, 15, lowRow - 20)));
    scene.add(createLabel('MEDIUM (500-2000 polys)', new THREE.Vector3(0, 15, mediumRow + 20)));
    scene.add(createLabel('HIGH (2000+ polys)', new THREE.Vector3(0, 15, highRow + 20)));

    let xPosition = -350; // Start much further left for better distribution
    const spacing = 90; // Increase spacing for better visibility

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
        // Ultra-low version
        const ultraLowHouse = new House({ type: houseConfig.type, levelOfDetail: LevelOfDetail.ULTRA_LOW });
        const ultraLowHouseMesh = await ultraLowHouse.load();
        ultraLowHouseMesh.position.set(xPosition, 0, ultraLowRow);
        scene.add(ultraLowHouseMesh);

        const ultraLowPolygons = countPolygons(ultraLowHouseMesh);
        scene.add(createLabel(houseConfig.name, new THREE.Vector3(xPosition, 35, ultraLowRow), ultraLowPolygons));
        logger.info(`✅ ${houseConfig.name} ULTRA_LOW loaded: ${ultraLowPolygons} triangles`);

        // Low version
        const lowHouse = new House({ type: houseConfig.type, levelOfDetail: LevelOfDetail.LOW });
        const lowHouseMesh = await lowHouse.load();
        lowHouseMesh.position.set(xPosition, 0, lowRow);
        scene.add(lowHouseMesh);

        const lowPolygons = countPolygons(lowHouseMesh);
        scene.add(createLabel(houseConfig.name, new THREE.Vector3(xPosition, 35, lowRow), lowPolygons));
        logger.info(`✅ ${houseConfig.name} LOW loaded: ${lowPolygons} triangles`);

        // Medium version
        const mediumHouse = new House({ type: houseConfig.type, levelOfDetail: LevelOfDetail.MEDIUM });
        const mediumHouseMesh = await mediumHouse.load();
        mediumHouseMesh.position.set(xPosition, 0, mediumRow);
        scene.add(mediumHouseMesh);

        const mediumPolygons = countPolygons(mediumHouseMesh);
        scene.add(createLabel(houseConfig.name, new THREE.Vector3(xPosition, 35, mediumRow), mediumPolygons));
        logger.info(`✅ ${houseConfig.name} MEDIUM loaded: ${mediumPolygons} triangles`);

        // High version
        const highHouse = new House({ type: houseConfig.type, levelOfDetail: LevelOfDetail.HIGH });
        const highHouseMesh = await highHouse.load();
        highHouseMesh.position.set(xPosition, 0, highRow);
        scene.add(highHouseMesh);

        const highPolygons = countPolygons(highHouseMesh);
        scene.add(createLabel(houseConfig.name, new THREE.Vector3(xPosition, 35, highRow), highPolygons));
        logger.info(`✅ ${houseConfig.name} HIGH loaded: ${highPolygons} triangles`);

        // Add to stats
        this.statsTracker.addBuilding({
          name: houseConfig.name,
          ultraLowPolygons,
          lowPolygons,
          mediumPolygons,
          highPolygons
        });
        

        // Add camera position for this building
        this.cameraController.addViewpoint(houseConfig.name, new THREE.Vector3(xPosition, 40, 80), new THREE.Vector3(xPosition, 15, 0));
      } catch (error) {
        logger.error(`❌ Error loading ${houseConfig.name}:`, error);
        scene.add(createLabel(`${houseConfig.name} (Error)`, new THREE.Vector3(xPosition, 25, ultraLowRow)));
      }

      xPosition += spacing;
    }

    // Villa
    xPosition += 40; // Extra spacing for visual separation
    try {
      // Ultra-low Villa
      const ultraLowVilla = new Villa({ levelOfDetail: LevelOfDetail.ULTRA_LOW });
      const ultraLowVillaMesh = await ultraLowVilla.load();
      ultraLowVillaMesh.position.set(xPosition, 0, ultraLowRow);
      scene.add(ultraLowVillaMesh);

      const ultraLowPolygons = countPolygons(ultraLowVillaMesh);
      scene.add(createLabel('Villa', new THREE.Vector3(xPosition, 35, ultraLowRow), ultraLowPolygons));
      logger.info(`✅ Villa ULTRA_LOW loaded: ${ultraLowPolygons} triangles`);

      // Low Villa
      const lowVilla = new Villa({ levelOfDetail: LevelOfDetail.LOW });
      const lowVillaMesh = await lowVilla.load();
      lowVillaMesh.position.set(xPosition, 0, lowRow);
      scene.add(lowVillaMesh);

      const lowPolygons = countPolygons(lowVillaMesh);
      scene.add(createLabel('Villa', new THREE.Vector3(xPosition, 35, lowRow), lowPolygons));
      logger.info(`✅ Villa LOW loaded: ${lowPolygons} triangles`);

      // Medium Villa
      const mediumVilla = new Villa({ levelOfDetail: LevelOfDetail.MEDIUM });
      const mediumVillaMesh = await mediumVilla.load();
      mediumVillaMesh.position.set(xPosition, 0, mediumRow);
      scene.add(mediumVillaMesh);

      const mediumPolygons = countPolygons(mediumVillaMesh);
      scene.add(createLabel('Villa', new THREE.Vector3(xPosition, 35, mediumRow), mediumPolygons));
      logger.info(`✅ Villa MEDIUM loaded: ${mediumPolygons} triangles`);

      // High Villa
      const highVilla = new Villa({ levelOfDetail: LevelOfDetail.HIGH });
      const highVillaMesh = await highVilla.load();
      highVillaMesh.position.set(xPosition, 0, highRow);
      scene.add(highVillaMesh);

      const highPolygons = countPolygons(highVillaMesh);
      scene.add(createLabel('Villa', new THREE.Vector3(xPosition, 35, highRow), highPolygons));
      logger.info(`✅ Villa HIGH loaded: ${highPolygons} triangles`);

      // Add to stats
      this.statsTracker.addBuilding({
        name: 'Villa',
        ultraLowPolygons,
        lowPolygons,
        mediumPolygons,
        highPolygons
      });
      

      // Add camera position for Villa
      this.cameraController.addViewpoint('Villa', new THREE.Vector3(xPosition, 40, 80), new THREE.Vector3(xPosition, 15, 0));
    } catch (error) {
      logger.error('❌ Error loading Villa:', error);
      scene.add(createLabel('Villa (Error)', new THREE.Vector3(xPosition, 35, ultraLowRow)));
    }

    xPosition += spacing;

    // Townhouse
    try {
      // Ultra-low Townhouse
      const ultraLowTownhouse = new Townhouse({ levelOfDetail: LevelOfDetail.ULTRA_LOW });
      const ultraLowTownhouseMesh = await ultraLowTownhouse.load();
      ultraLowTownhouseMesh.position.set(xPosition, 0, ultraLowRow);
      scene.add(ultraLowTownhouseMesh);

      const ultraLowPolygons = countPolygons(ultraLowTownhouseMesh);
      scene.add(createLabel('Townhouse', new THREE.Vector3(xPosition, 35, ultraLowRow), ultraLowPolygons));
      logger.info(`✅ Townhouse ULTRA_LOW loaded: ${ultraLowPolygons} triangles`);

      // Low Townhouse
      const lowTownhouse = new Townhouse({ levelOfDetail: LevelOfDetail.LOW });
      const lowTownhouseMesh = await lowTownhouse.load();
      lowTownhouseMesh.position.set(xPosition, 0, lowRow);
      scene.add(lowTownhouseMesh);

      const lowPolygons = countPolygons(lowTownhouseMesh);
      scene.add(createLabel('Townhouse', new THREE.Vector3(xPosition, 35, lowRow), lowPolygons));
      logger.info(`✅ Townhouse LOW loaded: ${lowPolygons} triangles`);

      // Medium Townhouse
      const mediumTownhouse = new Townhouse({ levelOfDetail: LevelOfDetail.MEDIUM });
      const mediumTownhouseMesh = await mediumTownhouse.load();
      mediumTownhouseMesh.position.set(xPosition, 0, mediumRow);
      scene.add(mediumTownhouseMesh);

      const mediumPolygons = countPolygons(mediumTownhouseMesh);
      scene.add(createLabel('Townhouse', new THREE.Vector3(xPosition, 35, mediumRow), mediumPolygons));
      logger.info(`✅ Townhouse MEDIUM loaded: ${mediumPolygons} triangles`);

      // High Townhouse
      const highTownhouse = new Townhouse({ levelOfDetail: LevelOfDetail.HIGH });
      const highTownhouseMesh = await highTownhouse.load();
      highTownhouseMesh.position.set(xPosition, 0, highRow);
      scene.add(highTownhouseMesh);

      const highPolygons = countPolygons(highTownhouseMesh);
      scene.add(createLabel('Townhouse', new THREE.Vector3(xPosition, 35, highRow), highPolygons));
      logger.info(`✅ Townhouse HIGH loaded: ${highPolygons} triangles`);

      // Add to stats
      this.statsTracker.addBuilding({
        name: 'Townhouse',
        ultraLowPolygons,
        lowPolygons,
        mediumPolygons,
        highPolygons
      });
      

      // Add camera position for Townhouse
      this.cameraController.addViewpoint('Townhouse', new THREE.Vector3(xPosition, 40, 80), new THREE.Vector3(xPosition, 15, 0));
    } catch (error) {
      logger.error('❌ Error loading Townhouse:', error);
      scene.add(createLabel('Townhouse (Error)', new THREE.Vector3(xPosition, 35, ultraLowRow)));
    }

    xPosition += spacing;

    // Barn
    try {
      // Ultra-low Barn
      const ultraLowBarn = new Barn({ levelOfDetail: LevelOfDetail.ULTRA_LOW });
      const ultraLowBarnMesh = await ultraLowBarn.load();
      ultraLowBarnMesh.position.set(xPosition, 0, ultraLowRow);
      scene.add(ultraLowBarnMesh);

      const ultraLowPolygons = countPolygons(ultraLowBarnMesh);
      scene.add(createLabel('Barn', new THREE.Vector3(xPosition, 35, ultraLowRow), ultraLowPolygons));
      logger.info(`✅ Barn ULTRA_LOW loaded: ${ultraLowPolygons} triangles`);

      // Low Barn
      const lowBarn = new Barn({ levelOfDetail: LevelOfDetail.LOW });
      const lowBarnMesh = await lowBarn.load();
      lowBarnMesh.position.set(xPosition, 0, lowRow);
      scene.add(lowBarnMesh);

      const lowPolygons = countPolygons(lowBarnMesh);
      scene.add(createLabel('Barn', new THREE.Vector3(xPosition, 35, lowRow), lowPolygons));
      logger.info(`✅ Barn LOW loaded: ${lowPolygons} triangles`);

      // Medium Barn
      const mediumBarn = new Barn({ levelOfDetail: LevelOfDetail.MEDIUM });
      const mediumBarnMesh = await mediumBarn.load();
      mediumBarnMesh.position.set(xPosition, 0, mediumRow);
      scene.add(mediumBarnMesh);

      const mediumPolygons = countPolygons(mediumBarnMesh);
      scene.add(createLabel('Barn', new THREE.Vector3(xPosition, 35, mediumRow), mediumPolygons));
      logger.info(`✅ Barn MEDIUM loaded: ${mediumPolygons} triangles`);

      // High Barn
      const highBarn = new Barn({ levelOfDetail: LevelOfDetail.HIGH });
      const highBarnMesh = await highBarn.load();
      highBarnMesh.position.set(xPosition, 0, highRow);
      scene.add(highBarnMesh);

      const highPolygons = countPolygons(highBarnMesh);
      scene.add(createLabel('Barn', new THREE.Vector3(xPosition, 35, highRow), highPolygons));
      logger.info(`✅ Barn HIGH loaded: ${highPolygons} triangles`);

      // Add to stats
      this.statsTracker.addBuilding({
        name: 'Barn',
        ultraLowPolygons,
        lowPolygons,
        mediumPolygons,
        highPolygons
      });
      

      // Add camera position for Barn
      this.cameraController.addViewpoint('Barn', new THREE.Vector3(xPosition, 40, 80), new THREE.Vector3(xPosition, 15, 0));
    } catch (error) {
      logger.error('❌ Error loading Barn:', error);
      scene.add(createLabel('Barn (Error)', new THREE.Vector3(xPosition, 35, ultraLowRow)));
    }

    xPosition += spacing;

    // DesertHouse
    try {
      // Ultra-low DesertHouse
      const ultraLowDesertHouse = new DesertHouse({ levelOfDetail: LevelOfDetail.ULTRA_LOW });
      const ultraLowDesertHouseMesh = await ultraLowDesertHouse.load();
      ultraLowDesertHouseMesh.position.set(xPosition, 0, ultraLowRow);
      scene.add(ultraLowDesertHouseMesh);

      const ultraLowPolygons = countPolygons(ultraLowDesertHouseMesh);
      scene.add(createLabel('Desert House', new THREE.Vector3(xPosition, 35, ultraLowRow), ultraLowPolygons));
      logger.info(`✅ DesertHouse ULTRA_LOW loaded: ${ultraLowPolygons} triangles`);

      // Low DesertHouse
      const lowDesertHouse = new DesertHouse({ levelOfDetail: LevelOfDetail.LOW });
      const lowDesertHouseMesh = await lowDesertHouse.load();
      lowDesertHouseMesh.position.set(xPosition, 0, lowRow);
      scene.add(lowDesertHouseMesh);

      const lowPolygons = countPolygons(lowDesertHouseMesh);
      scene.add(createLabel('Desert House', new THREE.Vector3(xPosition, 35, lowRow), lowPolygons));
      logger.info(`✅ DesertHouse LOW loaded: ${lowPolygons} triangles`);

      // Medium DesertHouse
      const mediumDesertHouse = new DesertHouse({ levelOfDetail: LevelOfDetail.MEDIUM });
      const mediumDesertHouseMesh = await mediumDesertHouse.load();
      mediumDesertHouseMesh.position.set(xPosition, 0, mediumRow);
      scene.add(mediumDesertHouseMesh);

      const mediumPolygons = countPolygons(mediumDesertHouseMesh);
      scene.add(createLabel('Desert House', new THREE.Vector3(xPosition, 35, mediumRow), mediumPolygons));
      logger.info(`✅ DesertHouse MEDIUM loaded: ${mediumPolygons} triangles`);

      // High DesertHouse
      const highDesertHouse = new DesertHouse({ levelOfDetail: LevelOfDetail.HIGH });
      const highDesertHouseMesh = await highDesertHouse.load();
      highDesertHouseMesh.position.set(xPosition, 0, highRow);
      scene.add(highDesertHouseMesh);

      const highPolygons = countPolygons(highDesertHouseMesh);
      scene.add(createLabel('Desert House', new THREE.Vector3(xPosition, 35, highRow), highPolygons));
      logger.info(`✅ DesertHouse HIGH loaded: ${highPolygons} triangles`);

      // Add to stats
      this.statsTracker.addBuilding({
        name: 'Desert House',
        ultraLowPolygons,
        lowPolygons,
        mediumPolygons,
        highPolygons
      });
      

      // Add camera position for Desert House
      this.cameraController.addViewpoint('Desert House', new THREE.Vector3(xPosition, 40, 80), new THREE.Vector3(xPosition, 15, 0));
    } catch (error) {
      logger.error('❌ Error loading DesertHouse:', error);
      scene.add(createLabel('Desert House (Error)', new THREE.Vector3(xPosition, 35, ultraLowRow)));
    }

    xPosition += spacing;

    // Dome
    try {
      // Ultra-low Dome
      const ultraLowDome = new Dome({ levelOfDetail: LevelOfDetail.ULTRA_LOW });
      const ultraLowDomeMesh = await ultraLowDome.load();
      ultraLowDomeMesh.position.set(xPosition, 0, ultraLowRow);
      scene.add(ultraLowDomeMesh);

      const ultraLowPolygons = countPolygons(ultraLowDomeMesh);
      scene.add(createLabel('Dome', new THREE.Vector3(xPosition, 35, ultraLowRow), ultraLowPolygons));
      logger.info(`✅ Dome ULTRA_LOW loaded: ${ultraLowPolygons} triangles`);

      // Low Dome
      const lowDome = new Dome({ levelOfDetail: LevelOfDetail.LOW });
      const lowDomeMesh = await lowDome.load();
      lowDomeMesh.position.set(xPosition, 0, lowRow);
      scene.add(lowDomeMesh);

      const lowPolygons = countPolygons(lowDomeMesh);
      scene.add(createLabel('Dome', new THREE.Vector3(xPosition, 35, lowRow), lowPolygons));
      logger.info(`✅ Dome LOW loaded: ${lowPolygons} triangles`);

      // Medium Dome
      const mediumDome = new Dome({ levelOfDetail: LevelOfDetail.MEDIUM });
      const mediumDomeMesh = await mediumDome.load();
      mediumDomeMesh.position.set(xPosition, 0, mediumRow);
      scene.add(mediumDomeMesh);

      const mediumPolygons = countPolygons(mediumDomeMesh);
      scene.add(createLabel('Dome', new THREE.Vector3(xPosition, 35, mediumRow), mediumPolygons));
      logger.info(`✅ Dome MEDIUM loaded: ${mediumPolygons} triangles`);

      // High Dome
      const highDome = new Dome({ levelOfDetail: LevelOfDetail.HIGH });
      const highDomeMesh = await highDome.load();
      highDomeMesh.position.set(xPosition, 0, highRow);
      scene.add(highDomeMesh);

      const highPolygons = countPolygons(highDomeMesh);
      scene.add(createLabel('Dome', new THREE.Vector3(xPosition, 35, highRow), highPolygons));
      logger.info(`✅ Dome HIGH loaded: ${highPolygons} triangles`);

      // Add to stats
      this.statsTracker.addBuilding({
        name: 'Dome',
        ultraLowPolygons,
        lowPolygons,
        mediumPolygons,
        highPolygons
      });
      

      // Add camera position for Dome
      this.cameraController.addViewpoint('Dome', new THREE.Vector3(xPosition, 40, 80), new THREE.Vector3(xPosition, 15, 0));
    } catch (error) {
      logger.error('❌ Error loading Dome:', error);
      scene.add(createLabel('Dome (Error)', new THREE.Vector3(xPosition, 35, ultraLowRow)));
    }

    xPosition += spacing;

    // Hospital
    try {
      // Ultra-low Hospital
      const ultraLowHospital = new Hospital({ levelOfDetail: LevelOfDetail.ULTRA_LOW });
      const ultraLowHospitalMesh = await ultraLowHospital.load();
      ultraLowHospitalMesh.position.set(xPosition, 0, ultraLowRow);
      scene.add(ultraLowHospitalMesh);

      const ultraLowPolygons = countPolygons(ultraLowHospitalMesh);
      scene.add(createLabel('Hospital', new THREE.Vector3(xPosition, 35, ultraLowRow), ultraLowPolygons));
      logger.info(`✅ Hospital ULTRA_LOW loaded: ${ultraLowPolygons} triangles`);

      // Low Hospital
      const lowHospital = new Hospital({ levelOfDetail: LevelOfDetail.LOW });
      const lowHospitalMesh = await lowHospital.load();
      lowHospitalMesh.position.set(xPosition, 0, lowRow);
      scene.add(lowHospitalMesh);

      const lowPolygons = countPolygons(lowHospitalMesh);
      scene.add(createLabel('Hospital', new THREE.Vector3(xPosition, 35, lowRow), lowPolygons));
      logger.info(`✅ Hospital LOW loaded: ${lowPolygons} triangles`);

      // Medium Hospital
      const mediumHospital = new Hospital({ levelOfDetail: LevelOfDetail.MEDIUM });
      const mediumHospitalMesh = await mediumHospital.load();
      mediumHospitalMesh.position.set(xPosition, 0, mediumRow);
      scene.add(mediumHospitalMesh);

      const mediumPolygons = countPolygons(mediumHospitalMesh);
      scene.add(createLabel('Hospital', new THREE.Vector3(xPosition, 35, mediumRow), mediumPolygons));
      logger.info(`✅ Hospital MEDIUM loaded: ${mediumPolygons} triangles`);

      // High Hospital
      const highHospital = new Hospital({ levelOfDetail: LevelOfDetail.HIGH });
      const highHospitalMesh = await highHospital.load();
      highHospitalMesh.position.set(xPosition, 0, highRow);
      scene.add(highHospitalMesh);

      const highPolygons = countPolygons(highHospitalMesh);
      scene.add(createLabel('Hospital', new THREE.Vector3(xPosition, 35, highRow), highPolygons));
      logger.info(`✅ Hospital HIGH loaded: ${highPolygons} triangles`);

      // Add to stats
      this.statsTracker.addBuilding({
        name: 'Hospital',
        ultraLowPolygons,
        lowPolygons,
        mediumPolygons,
        highPolygons
      });
      

      // Add camera position for Hospital
      this.cameraController.addViewpoint('Hospital', new THREE.Vector3(xPosition, 40, 80), new THREE.Vector3(xPosition, 15, 0));
    } catch (error) {
      logger.error('❌ Error loading Hospital:', error);
      scene.add(createLabel('Hospital (Error)', new THREE.Vector3(xPosition, 35, ultraLowRow)));
    }

    xPosition += spacing;

    // TownSquare
    try {
      // Ultra-low TownSquare
      const ultraLowTownSquare = new TownSquare({
        size: { width: 25, depth: 25 },
        monumentType: 'fountain',
        levelOfDetail: LevelOfDetail.ULTRA_LOW
      });
      const ultraLowTownSquareMesh = await ultraLowTownSquare.load();
      ultraLowTownSquareMesh.position.set(xPosition, 0, ultraLowRow);
      scene.add(ultraLowTownSquareMesh);

      const ultraLowPolygons = countPolygons(ultraLowTownSquareMesh);
      scene.add(createLabel('Town Square', new THREE.Vector3(xPosition, 35, ultraLowRow), ultraLowPolygons));
      logger.info(`✅ TownSquare ULTRA_LOW loaded: ${ultraLowPolygons} triangles`);

      // Low TownSquare
      const lowTownSquare = new TownSquare({
        size: { width: 25, depth: 25 },
        monumentType: 'fountain',
        levelOfDetail: LevelOfDetail.LOW
      });
      const lowTownSquareMesh = await lowTownSquare.load();
      lowTownSquareMesh.position.set(xPosition, 0, lowRow);
      scene.add(lowTownSquareMesh);

      const lowPolygons = countPolygons(lowTownSquareMesh);
      scene.add(createLabel('Town Square', new THREE.Vector3(xPosition, 35, lowRow), lowPolygons));
      logger.info(`✅ TownSquare LOW loaded: ${lowPolygons} triangles`);

      // Medium TownSquare
      const mediumTownSquare = new TownSquare({
        size: { width: 25, depth: 25 },
        monumentType: 'fountain',
        levelOfDetail: LevelOfDetail.MEDIUM
      });
      const mediumTownSquareMesh = await mediumTownSquare.load();
      mediumTownSquareMesh.position.set(xPosition, 0, mediumRow);
      scene.add(mediumTownSquareMesh);

      const mediumPolygons = countPolygons(mediumTownSquareMesh);
      scene.add(createLabel('Town Square', new THREE.Vector3(xPosition, 35, mediumRow), mediumPolygons));
      logger.info(`✅ TownSquare MEDIUM loaded: ${mediumPolygons} triangles`);

      // High TownSquare
      const highTownSquare = new TownSquare({
        size: { width: 25, depth: 25 },
        monumentType: 'fountain',
        levelOfDetail: LevelOfDetail.HIGH
      });
      const highTownSquareMesh = await highTownSquare.load();
      highTownSquareMesh.position.set(xPosition, 0, highRow);
      scene.add(highTownSquareMesh);

      const highPolygons = countPolygons(highTownSquareMesh);
      scene.add(createLabel('Town Square', new THREE.Vector3(xPosition, 35, highRow), highPolygons));
      logger.info(`✅ TownSquare HIGH loaded: ${highPolygons} triangles`);

      // Add to stats
      this.statsTracker.addBuilding({
        name: 'Town Square',
        ultraLowPolygons,
        lowPolygons,
        mediumPolygons,
        highPolygons
      });
      

      // Add camera position for Town Square
      this.cameraController.addViewpoint('Town Square', new THREE.Vector3(xPosition, 40, 80), new THREE.Vector3(xPosition, 15, 0));
    } catch (error) {
      logger.error('❌ Error loading TownSquare:', error);
      scene.add(createLabel('Town Square (Error)', new THREE.Vector3(xPosition, 35, ultraLowRow)));
    }

    logger.info('🏢 Buildings demo setup complete - all types loaded!');

    // Set overview position and move camera there
    this.cameraController.setOverview(new THREE.Vector3(0, 80, 100), new THREE.Vector3(0, 15, 0));
    this.cameraController.moveToOverview();

    // Add GUI controls for camera
    if (gui) {
      const cameraFolder = gui.addFolder('Camera');
      cameraFolder.add(camera.position, 'x', -100, 100).name('Camera X');
      cameraFolder.add(camera.position, 'y', 5, 80).name('Camera Y');
      cameraFolder.add(camera.position, 'z', -100, 100).name('Camera Z');
      cameraFolder.open();

      // Camera navigation controls
      this.cameraController.createGUI(gui);
    }

    // Start animation loop
    this.startAnimationLoop(renderer, scene, camera, controls);
  }

  public override dispose(): void {
    // Dispose stats tracker
    this.statsTracker.dispose();

    // Call parent dispose
    super.dispose();
  }
}

export default new BuildingsWorkshop();