import * as THREE from 'three';
import { ParagliderVoxel } from '../../foundation/components/vehicles';
import { Hangglider } from '../../foundation/components/vehicles';
import { Cessna } from '../../foundation/components/vehicles';
import { Hercules } from '../../foundation/components/vehicles';
import { FlyingBehavior } from '../../foundation/systems/behaviors/FlyingBehavior';
import { SmokeTrail } from '../../foundation/components/effects/SmokeTrail';
import { logger } from '../../foundation/utils/logger';
import type {
  ParagliderVoxelConfig,
  HanggliderConfig,
  CessnaConfig,
  HerculesConfig,
} from './config';

export interface VehicleLoadResult {
  mesh: THREE.Object3D;
  flyingBehavior?: FlyingBehavior;
  smokeTrail?: SmokeTrail;
}

const DEBUG_VECTORS = true;
/**
 * Loads paraglider vehicles into the scene
 */
export async function loadParagliders(
  scene: THREE.Scene,
  configs: ParagliderVoxelConfig[],
  errorHandler: (error: Error, context: string) => void,
  animationDurationMs: number = 0
): Promise<VehicleLoadResult[]> {
  const results: VehicleLoadResult[] = [];

  const voxelPromises = configs.map(async (p) => {
    try {
      logger.info('🪂 Creating paraglider with config:', JSON.stringify(p.pg, null, 2));
      const paraglider = new ParagliderVoxel(p.pg);
      logger.info('🪂 Paraglider created, loading...');
      const mesh = await paraglider.load();
      mesh.position.copy(p.position);
      const scale = 1.0; // Increased from 0.01 to make visible
      mesh.scale.set(scale, scale, scale);
      scene.add(mesh);

      let flyingBehavior: FlyingBehavior | undefined;

      // Add flying behavior if pattern is defined
      if (p.flightPattern && p.waypoints) {
        flyingBehavior = new FlyingBehavior({
          pattern: p.flightPattern,
          speed: p.speed || 15,
          turnSpeed: 5.0,
          flightRadius: 100,
          returnDistance: 150,
          minHeight: 600,
          maxHeight: 800,
          obstacleAvoidanceDistance: 100,
          centerPoint: p.position,
          autoStart: true,
          faceDirection: true,
          forwardAxis: 'z',
          debugVectors: DEBUG_VECTORS,
          waypoints: p.waypoints,
          waypointTension: p.waypointTension,
          waypointLoop: p.waypointLoop,
        });

        flyingBehavior.attachTo(mesh);

        // Start flying behavior after animation completes
        setTimeout(() => {
          flyingBehavior?.start();
          logger.info('🪂 Flying behavior started for paraglider');
        }, animationDurationMs + 1000);
      }

      results.push({ mesh, flyingBehavior });
      logger.info(`✅ Paraglider voxel loaded at position (${p.position.x}, ${p.position.y}, ${p.position.z})`);
      return mesh;
    } catch (error) {
      errorHandler(error as Error, 'loading voxel paraglider');
      logger.error('❌ Failed to load paraglider voxel:', error);
      return null;
    }
  });

  await Promise.all(voxelPromises);
  logger.info(`🪂 Loaded ${results.length} paraglider(s)`);
  return results;
}

/**
 * Loads a hangglider vehicle with flying behavior
 */
export async function loadHangglider(
  scene: THREE.Scene,
  config: HanggliderConfig,
  animationDurationMs: number,
  errorHandler: (error: Error, context: string) => void
): Promise<VehicleLoadResult | null> {
  try {
    const hangglider = new Hangglider({ scale: config.scale });
    const mesh = await hangglider.load();
    mesh.position.copy(config.position);
    scene.add(mesh);

    const flyingBehavior = new FlyingBehavior({
      pattern: config.flightPattern,
      speed: config.speed,
      turnSpeed: config.turnSpeed,
      flightRadius: config.flightRadius,
      returnDistance: config.returnDistance,
      minHeight: config.minHeight,
      maxHeight: config.maxHeight,
      obstacleAvoidanceDistance: config.obstacleAvoidanceDistance,
      centerPoint: config.position,
      autoStart: true,
      faceDirection: true,
      forwardAxis: config.forwardAxis,
      debugVectors: DEBUG_VECTORS,
      waypoints: config.waypoints,
      waypointTension: config.waypointTension,
      waypointLoop: config.waypointLoop,
    });

    flyingBehavior.attachTo(mesh);

    // Start flying behavior after animation completes
    setTimeout(() => {
      flyingBehavior.start();
      logger.info('🪂 Flying behavior started for hangglider');
    }, animationDurationMs + 2000);

    logger.info('✅ Hangglider loaded successfully with flying behavior');

    return { mesh, flyingBehavior };
  } catch (error) {
    errorHandler(error as Error, 'loading hangglider');
    return null;
  }
}

/**
 * Loads a Cessna aircraft with flying behavior
 */
export async function loadCessna(
  scene: THREE.Scene,
  config: CessnaConfig,
  animationDurationMs: number,
  errorHandler: (error: Error, context: string) => void
): Promise<VehicleLoadResult | null> {
  try {
    const cessna = new Cessna({
      scale: config.scale,
      bodyColor: config.bodyColor,
      wingColor: config.wingColor,
      propellerColor: config.propellerColor,
      windowColor: config.windowColor,
      stripeColor: config.stripeColor,
    });

    const mesh = await cessna.load();
    mesh.position.copy(config.position);
    scene.add(mesh);

    const flyingBehavior = new FlyingBehavior({
      pattern: config.flightPattern,
      speed: config.speed,
      turnSpeed: config.turnSpeed,
      flightRadius: config.flightRadius,
      returnDistance: config.returnDistance,
      minHeight: config.minHeight,
      maxHeight: config.maxHeight,
      obstacleAvoidanceDistance: config.obstacleAvoidanceDistance,
      centerPoint: config.position,
      autoStart: true,
      faceDirection: true,
      forwardAxis: config.forwardAxis,
      debugVectors: DEBUG_VECTORS,
      waypoints: config.waypoints,
      waypointTension: config.waypointTension,
      waypointLoop: config.waypointLoop,
    });

    flyingBehavior.attachTo(mesh);

    // Create smoke trail
    const smokeTrail = new SmokeTrail({
      emissionRate: 4,
      particleLifetime: 5,
      initialSize: 1,
      finalSize: 5,
      color: new THREE.Color(0xdddddd),
      maxParticles: 100,
      turbulence: 0.6,
      enabled: false, // Will be enabled when flying starts
    });
    scene.add(smokeTrail.getGroup());

    // Start flying behavior after animation completes
    setTimeout(() => {
      flyingBehavior.start();
      smokeTrail.setEnabled(true);
      logger.info('✈️ Flying behavior and smoke trail started for Cessna');
    }, animationDurationMs + 3000); // Start 3 seconds after animation ends

    logger.info('✅ Cessna loaded successfully with flying behavior and smoke trail');

    return { mesh, flyingBehavior, smokeTrail };
  } catch (error) {
    errorHandler(error as Error, 'loading Cessna');
    return null;
  }
}

/**
 * Loads a Hercules aircraft with flying behavior
 */
export async function loadHercules(
  scene: THREE.Scene,
  config: HerculesConfig,
  animationDurationMs: number,
  errorHandler: (error: Error, context: string) => void
): Promise<VehicleLoadResult | null> {
  try {
    const hercules = new Hercules({
      scale: config.scale,
      bodyColor: config.bodyColor,
      wingColor: config.wingColor,
      propellerColor: config.propellerColor,
      windowColor: config.windowColor,
    });

    const mesh = await hercules.load();
    mesh.position.copy(config.position);
    scene.add(mesh);

    const flyingBehavior = new FlyingBehavior({
      pattern: config.flightPattern,
      speed: config.speed,
      turnSpeed: config.turnSpeed,
      flightRadius: config.flightRadius,
      returnDistance: config.returnDistance,
      minHeight: config.minHeight,
      maxHeight: config.maxHeight,
      obstacleAvoidanceDistance: config.obstacleAvoidanceDistance,
      centerPoint: config.position,
      autoStart: true,
      faceDirection: true,
      forwardAxis: config.forwardAxis,
      debugVectors: DEBUG_VECTORS,
      waypoints: config.waypoints,
      waypointTension: config.waypointTension,
      waypointLoop: config.waypointLoop,
    });

    flyingBehavior.attachTo(mesh);

    // Create smoke trail for Hercules (larger aircraft, more smoke)
    const smokeTrail = new SmokeTrail({
      emissionRate: 6,
      particleLifetime: 6,
      initialSize: 1.5,
      finalSize: 7,
      color: new THREE.Color(0xcccccc),
      maxParticles: 120,
      turbulence: 0.8,
      enabled: false, // Will be enabled when flying starts
    });
    scene.add(smokeTrail.getGroup());

    // Start flying behavior after animation completes
    setTimeout(() => {
      flyingBehavior.start();
      smokeTrail.setEnabled(true);
      logger.info('✈️ Flying behavior and smoke trail started for Hercules');
    }, animationDurationMs + 4000); // Start 4 seconds after animation ends

    logger.info('✅ Hercules loaded successfully with flying behavior and smoke trail');

    return { mesh, flyingBehavior, smokeTrail };
  } catch (error) {
    errorHandler(error as Error, 'loading Hercules');
    return null;
  }
}
